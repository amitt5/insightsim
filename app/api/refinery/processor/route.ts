// app/api/refinery/processor/route.ts
//
// Background job processor for Refinery campaigns.
// Accepts POST { campaignId }, fires the job, and responds immediately.
// The job loop continues running server-side after the response is sent.
//
// NOTE: On Vercel, serverless functions have execution time limits.
// For campaigns with many iterations, uncomment and raise maxDuration:
// export const maxDuration = 300; // requires Vercel Pro/Enterprise

//B2B SaaS founders and Head of Growth at Series A–B startups (20–150 employees). They're overwhelmed, data-driven, and allergic to fluff. They've been burned by agencies before and are skeptical of anything that sounds like a sales pitch. They care deeply about CAC, pipeline efficiency, and time-to-close.

import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { openai } from '@/lib/openai';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Campaign {
  id: string;
  name: string;
  content_type: string;
  initial_draft: string | null;
  icp: string;
  rag_text: string | null;
  metrics: string[];
  extra_context: string | null;
  iterations: number;
  users_per_iter: number;
}

interface Job {
  id: string;
  campaign_id: string;
  total_iterations: number;
}

interface SyntheticUser {
  id: string;
  name: string;
  age: number | null;
  gender: string | null;
  profession: string | null;
  bio: string | null;
  persona_data: Record<string, string>;
}

interface ScoringResponse {
  synthetic_user_id: string;
  score: number;
  feedback: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service role client — bypasses RLS for background job processing.
// Requires SUPABASE_SERVICE_ROLE_KEY in environment variables.
// ─────────────────────────────────────────────────────────────────────────────

function getAdminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Score compression — aggregate_score is capped at 8.5 per design spec.
// Raw individual scores (1–10) are stored as-is in refinery_responses.
// ─────────────────────────────────────────────────────────────────────────────

function compressScore(raw: number): number {
  const capped = Math.min(raw, 8.5);
  return Math.round(capped * 100) / 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/refinery/processor
// Loads the campaign and pending job, marks the job as running, then fires
// the background loop. Returns immediately so the browser tab can close.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const body = await req.json() as { campaignId?: string };
  const { campaignId } = body;

  if (!campaignId) {
    return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
  }

  const db = getAdminClient();

  // ── Load campaign ──────────────────────────────────────────────────────────

  const { data: campaign, error: campaignError } = await db
    .from('refinery_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  // ── Find the pending job for this campaign ─────────────────────────────────

  const { data: job, error: jobError } = await db
    .from('refinery_jobs')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: 'No pending job found for this campaign' }, { status: 404 });
  }

  // ── Mark job running before responding ────────────────────────────────────

  await db.from('refinery_jobs').update({
    status: 'running',
    started_at: new Date().toISOString(),
  }).eq('id', job.id);

  await db.from('refinery_campaigns').update({ status: 'running' }).eq('id', campaignId);

  // ── Fire background loop — the HTTP response goes out immediately ──────────

  void runJob(db, campaign as Campaign, job as Job);

  return NextResponse.json({ ok: true, jobId: job.id });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main job runner
// Called fire-and-forget. Manages panel generation, iteration loop, and
// final status updates. Always updates job status — never leaves it 'running'.
// ─────────────────────────────────────────────────────────────────────────────

async function runJob(db: SupabaseClient, campaign: Campaign, job: Job): Promise<void> {
  try {
    // ── GENERATE SYNTHETIC USER PANEL ─────────────────────────────────────────
    // Single OpenAI call to produce all users. Inserts panel + synthetic users.

    const syntheticUsers = await generateSyntheticUsers(db, campaign);

    // ── ITERATION LOOP ────────────────────────────────────────────────────────
    // Each iteration: generate content → score all users → aggregate → repeat.

    let previousContent: string | null = null;
    let previousFeedbackSummary: string | null = null;

    for (let iterNum = 1; iterNum <= campaign.iterations; iterNum++) {
      // Generate content for this iteration (from scratch on iter 1, improved on 2+)
      const { content, improvementNotes } = await generateIterationContent(
        campaign,
        iterNum,
        previousContent,
        previousFeedbackSummary
      );

      // Insert the iteration row as 'running' so the UI can show it in progress
      const { data: iteration, error: iterInsertError } = await db
        .from('refinery_iterations')
        .insert({
          campaign_id: campaign.id,
          iteration_number: iterNum,
          content,
          improvement_notes: improvementNotes,
          status: 'running',
        })
        .select('id')
        .single();

      if (iterInsertError || !iteration) {
        throw new Error(`Failed to insert iteration ${iterNum}: ${iterInsertError?.message}`);
      }

      // ── SCORE SYNTHETIC USERS (batches of 5) ────────────────────────────────
      // Each user independently rates the content. Batches of 5 run concurrently;
      // batches themselves are sequential to avoid hammering the OpenAI API.

      const responses = await scoreAllUsers(
        db,
        campaign,
        iteration.id,
        content,
        syntheticUsers
      );

      // Compute aggregate score capped at 8.5, store feedback for next iteration
      const rawAvg = responses.reduce((sum, r) => sum + r.score, 0) / responses.length;
      const aggregateScore = compressScore(rawAvg);

      previousFeedbackSummary = buildFeedbackSummary(responses);
      previousContent = content;

      // Mark iteration completed with its aggregate score
      await db.from('refinery_iterations').update({
        aggregate_score: aggregateScore,
        status: 'completed',
      }).eq('id', iteration.id);

      // Update job progress so the UI can show current_iteration advancing
      await db.from('refinery_jobs').update({
        current_iteration: iterNum,
      }).eq('id', job.id);
    }

    // ── Mark job and campaign completed ───────────────────────────────────────

    await db.from('refinery_jobs').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    }).eq('id', job.id);

    await db.from('refinery_campaigns').update({ status: 'completed' }).eq('id', campaign.id);

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[refinery/processor] Job failed:', message);

    // Always mark failed — never leave the job stuck in 'running'
    await db.from('refinery_jobs').update({
      status: 'failed',
      error: message,
      completed_at: new Date().toISOString(),
    }).eq('id', job.id);

    await db.from('refinery_campaigns').update({ status: 'failed' }).eq('id', campaign.id);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE SYNTHETIC USERS
//
// Single OpenAI call producing all users_per_iter personas at once.
// Users must feel like real, distinct individuals — not marketing clichés.
// Inserts 1 row into refinery_panels, then N rows into refinery_synthetic_users.
// ─────────────────────────────────────────────────────────────────────────────

async function generateSyntheticUsers(
  db: SupabaseClient,
  campaign: Campaign
): Promise<SyntheticUser[]> {
  const ragContext = campaign.rag_text
    ? `\n\nAdditional context from research/customer data (use this to ground personas in reality):\n${campaign.rag_text.slice(0, 3000)}`
    : '';

  // PROMPT: Synthetic user generation
  const systemPrompt = `You generate realistic synthetic user personas for marketing research. Return only valid JSON — no markdown, no commentary.`;

  const userPrompt = `Generate ${campaign.users_per_iter} distinct synthetic users who represent this ideal customer profile.

ICP: ${campaign.icp}${ragContext}

Rules:
- Each user must feel like a specific real person — vary age, background, career stage, motivations, and communication style within the ICP
- Do NOT generate generic archetypes or clones with minor variations
- Spread users across different pain points, levels of skepticism, and buying readiness
- Psychographic traits (persona_data) should reflect how each person thinks and makes decisions — not just demographics

Return a JSON object with this exact shape:
{
  "users": [
    {
      "name": "Full Name",
      "age": 34,
      "gender": "female",
      "profession": "Head of Growth at 50-person SaaS startup",
      "bio": "Two sentences: their professional context and one thing that makes them distinctive as a person.",
      "persona_data": {
        "trait_1": "Highly analytical — demands proof before committing. Has been burned by overpromised tools before.",
        "trait_2": "Motivated by team wins over personal credit. Measures everything.",
        "trait_3": "Short on time. Skims first, reads only if the first line grabs her."
      }
    }
  ]
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 1.0,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0].message.content ?? '{}';
  let parsed: { users?: unknown[] };

  try {
    parsed = JSON.parse(raw) as { users?: unknown[] };
  } catch {
    throw new Error(`Failed to parse synthetic users JSON: ${raw.slice(0, 300)}`);
  }

  const usersArray = parsed.users;
  if (!Array.isArray(usersArray) || usersArray.length === 0) {
    throw new Error(`Unexpected synthetic users response shape — no users array: ${raw.slice(0, 200)}`);
  }

  // Create the panel row
  const { data: panel, error: panelError } = await db
    .from('refinery_panels')
    .insert({ campaign_id: campaign.id })
    .select('id')
    .single();

  if (panelError || !panel) {
    throw new Error(`Failed to create panel: ${panelError?.message}`);
  }

  // Map OpenAI output to DB row shape
  const rows = usersArray.map((u) => {
    const user = u as Record<string, unknown>;
    return {
      panel_id: panel.id,
      campaign_id: campaign.id,
      name: String(user.name ?? 'Unknown'),
      age: typeof user.age === 'number' ? user.age : null,
      gender: typeof user.gender === 'string' ? user.gender : null,
      profession: typeof user.profession === 'string' ? user.profession : null,
      bio: typeof user.bio === 'string' ? user.bio : null,
      persona_data: (user.persona_data && typeof user.persona_data === 'object')
        ? user.persona_data
        : {},
    };
  });

  const { data: inserted, error: insertError } = await db
    .from('refinery_synthetic_users')
    .insert(rows)
    .select('id, name, age, gender, profession, bio, persona_data');

  if (insertError || !inserted) {
    throw new Error(`Failed to insert synthetic users: ${insertError?.message}`);
  }

  return inserted as SyntheticUser[];
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE ITERATION CONTENT
//
// Iteration 1: write copy from scratch (or refine initial_draft if provided).
// Iterations 2+: rewrite using the previous version + aggregated feedback.
// Returns the new content and a brief improvement_notes summary.
// ─────────────────────────────────────────────────────────────────────────────

async function generateIterationContent(
  campaign: Campaign,
  iterNum: number,
  previousContent: string | null,
  previousFeedbackSummary: string | null
): Promise<{ content: string; improvementNotes: string | null }> {
  const metricsStr = campaign.metrics.join(', ');
  const contentTypeLabel = campaign.content_type.replace(/_/g, ' ');
  const contextSection = campaign.extra_context
    ? `\n\nAdditional product/service context:\n${campaign.extra_context}`
    : '';

  let userPrompt: string;

  if (iterNum === 1) {
    // PROMPT: First iteration — generate or refine initial draft
    const draftSection = campaign.initial_draft
      ? `\n\nStarting draft to improve upon:\n---\n${campaign.initial_draft}\n---`
      : '';

    userPrompt = `Write a high-performing ${contentTypeLabel} for the following audience and optimization goals.

Target audience (ICP): ${campaign.icp}
Metrics to optimize for: ${metricsStr}${contextSection}${draftSection}

Instructions:
- Write the complete ${contentTypeLabel} copy — no labels, headers, or commentary
- Optimize specifically for: ${metricsStr}
- Speak directly to the ICP's real pain points and motivations — be specific, not generic
- Use concrete language; avoid buzzwords and empty claims

Return JSON: { "content": "the full copy here", "improvement_notes": null }`;

  } else {
    // PROMPT: Subsequent iterations — improve based on synthetic user feedback
    userPrompt = `You are improving a ${contentTypeLabel} based on synthetic user feedback. Your goal is meaningful score improvement on: ${metricsStr}.

Target audience (ICP): ${campaign.icp}${contextSection}

Previous version (iteration ${iterNum - 1}):
---
${previousContent}
---

Aggregated feedback from synthetic users:
${previousFeedbackSummary}

Instructions:
- Write an improved version that directly addresses the specific criticisms
- Preserve and amplify what scored well
- Make concrete changes — not vague refinements
- Write the complete ${contentTypeLabel} copy only — no labels or commentary

Return JSON: { "content": "the improved full copy", "improvement_notes": "2-3 sentences on what was changed and why, based on the feedback" }`;
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You write and optimize marketing copy. Return only valid JSON — no markdown, no commentary.',
      },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0].message.content ?? '{}';
  let parsed: { content?: string; improvement_notes?: string | null };

  try {
    parsed = JSON.parse(raw) as { content?: string; improvement_notes?: string | null };
  } catch {
    throw new Error(`Failed to parse iteration ${iterNum} content JSON: ${raw.slice(0, 300)}`);
  }

  if (!parsed.content) {
    throw new Error(`No content field in iteration ${iterNum} response: ${raw.slice(0, 200)}`);
  }

  return {
    content: parsed.content,
    improvementNotes: parsed.improvement_notes ?? null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORE ALL SYNTHETIC USERS
//
// Splits users into sequential batches of 5. Within each batch, all 5 scoring
// calls run concurrently via Promise.all. Inserts responses to DB after each
// batch. Returns the full list of responses for aggregate score calculation.
// ─────────────────────────────────────────────────────────────────────────────

async function scoreAllUsers(
  db: SupabaseClient,
  campaign: Campaign,
  iterationId: string,
  content: string,
  users: SyntheticUser[]
): Promise<ScoringResponse[]> {
  const metricsStr = campaign.metrics.join(', ');
  const contentTypeLabel = campaign.content_type.replace(/_/g, ' ');
  const allResponses: ScoringResponse[] = [];

  for (let i = 0; i < users.length; i += 5) {
    const batch = users.slice(i, i + 5);

    // Run all 5 scoring calls concurrently
    const batchScores = await Promise.all(
      batch.map((user) => scoreOneUser(user, content, contentTypeLabel, metricsStr))
    );

    // Insert this batch into refinery_responses
    const rows = batchScores.map((result, idx) => ({
      iteration_id: iterationId,
      campaign_id: campaign.id,
      synthetic_user_id: batch[idx].id,
      score: result.score,
      feedback: result.feedback,
    }));

    const { error: insertError } = await db
      .from('refinery_responses')
      .insert(rows);

    if (insertError) {
      throw new Error(
        `Failed to insert responses for batch ${Math.floor(i / 5) + 1}: ${insertError.message}`
      );
    }

    allResponses.push(
      ...batchScores.map((r, idx) => ({
        synthetic_user_id: batch[idx].id,
        score: r.score,
        feedback: r.feedback,
      }))
    );
  }

  return allResponses;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORE ONE USER
//
// The user embodies the synthetic persona and reacts to the content personally.
// Returns a score (1–10, stored raw) and 2–3 sentences of specific feedback.
// Falls back gracefully on JSON parse failure to avoid aborting the whole job.
// ─────────────────────────────────────────────────────────────────────────────

async function scoreOneUser(
  user: SyntheticUser,
  content: string,
  contentTypeLabel: string,
  metricsStr: string
): Promise<{ score: number; feedback: string }> {
  const traitLines = Object.values(user.persona_data)
    .slice(0, 3)
    .join(' | ');

  // PROMPT: Synthetic user scoring
  const userPrompt = `You are ${user.name}, ${user.age ?? 'unknown age'} year old ${user.gender ?? 'person'}, ${user.profession ?? 'professional'}.
Bio: ${user.bio ?? 'No bio provided.'}
How you think: ${traitLines}

You've just seen this ${contentTypeLabel}:
---
${content}
---

React to it as yourself. Consider specifically: ${metricsStr}.

Scoring guidance: Be honest and critical. Most marketing copy is generic or forgettable.
- 1–3: Off-putting, irrelevant, or actively annoying
- 4–5: Generic. You'd ignore it.
- 6–7: Has something going for it. You might pause.
- 8+: Genuinely impressive. Rare. Only if it truly resonates.

Return JSON: { "score": <integer 1-10>, "feedback": "<2-3 sentences of specific, personal reaction — what worked, what didn't, and why>" }`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a realistic synthetic user evaluating marketing content. Return only valid JSON — no markdown, no commentary.',
      },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 350,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0].message.content ?? '{}';
  let parsed: { score?: number; feedback?: string };

  try {
    parsed = JSON.parse(raw) as { score?: number; feedback?: string };
  } catch {
    // Don't fail the whole job on a single bad parse — use a neutral fallback
    console.error(`[scorer] JSON parse failed for user ${user.id}:`, raw.slice(0, 150));
    return { score: 5, feedback: 'Unable to parse response.' };
  }

  // Clamp score to valid 1–10 range
  const score = typeof parsed.score === 'number'
    ? Math.max(1, Math.min(10, Math.round(parsed.score)))
    : 5;

  return {
    score,
    feedback: typeof parsed.feedback === 'string' ? parsed.feedback : '',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILD FEEDBACK SUMMARY
//
// Condenses all user responses for an iteration into a concise text block
// that the next content generation prompt uses to guide improvements.
// Shows the top 3 and bottom 3 responses by score for signal clarity.
// ─────────────────────────────────────────────────────────────────────────────

function buildFeedbackSummary(responses: ScoringResponse[]): string {
  const sorted = [...responses].sort((a, b) => b.score - a.score);
  const avg = (responses.reduce((sum, r) => sum + r.score, 0) / responses.length).toFixed(1);

  const top = sorted.slice(0, 3).map((r) => `[${r.score}/10] ${r.feedback}`).join('\n');
  const bottom = sorted.slice(-3).map((r) => `[${r.score}/10] ${r.feedback}`).join('\n');

  return `Average score: ${avg}/10

Most positive responses:
${top}

Most critical responses:
${bottom}`;
}
