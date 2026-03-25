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
import { generatePersonImage, callGeminiVision } from '@/lib/runware';
import { generateUGCVideo } from '@/lib/fal';

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
  messaging_guidelines: string | null;
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

// Text content types use the prompt-iteration architecture.
// Ad/media types (static_ad, ugc_ad, ugc_thumbnail) keep their existing flows.
function isTextPromptType(contentType: string): boolean {
  return !['static_ad', 'ugc_ad', 'ugc_thumbnail'].includes(contentType);
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
// THUMBNAIL PROMPT VARIATIONS
// ─────────────────────────────────────────────────────────────────────────────

const THUMBNAIL_VARIATIONS = [
  'holding a protein shake bottle, smiling directly at camera, gym background',
  'mid-workout, energetic expression, lifting weights, gym floor',
  'casual outdoor setting, post-run glow, natural morning lighting',
  'kitchen counter, just finished workout, holding shake, relaxed confidence',
  'close-up portrait, athletic wear, bright studio lighting, warm smile',
  'seated on gym bench, towel around neck, triumphant expression',
  'dynamic pose stretching, athletic wear, outdoor park setting',
  'leaning against gym wall, arms crossed, confident direct gaze',
  'walking out of gym, golden hour lighting, healthy energetic look',
  'overhead shot angle, lying on yoga mat, post-workout, peaceful expression',
  'side profile, tying hair up, athletic wear, locker room background',
  'front-facing, sipping from shaker bottle, gym mirror reflection',
];

function buildThumbnailPrompts(n: number, extraContext: string | null): string[] {
  const base = extraContext?.trim()
    ? `Photorealistic portrait photo of a 26-year-old athletic woman, ${extraContext.trim()},`
    : 'Photorealistic portrait photo of a 26-year-old athletic woman,';

  return Array.from({ length: n }, (_, i) => {
    const variation = THUMBNAIL_VARIATIONS[i % THUMBNAIL_VARIATIONS.length];
    return `${base} ${variation}, professional photo quality, no text, no watermark`;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main job runner
// Called fire-and-forget. Manages panel generation, iteration loop, and
// final status updates. Always updates job status — never leaves it 'running'.
// ─────────────────────────────────────────────────────────────────────────────

async function runJob(db: SupabaseClient, campaign: Campaign, job: Job): Promise<void> {
  if (campaign.content_type === 'ugc_thumbnail') {
    return runThumbnailJob(db, campaign, job);
  }

  try {
    // ── CHECK FOR EXISTING ITERATIONS (resume scenario) ───────────────────────
    const { data: completedIters } = await db
      .from('refinery_iterations')
      .select('id, iteration_number, content')
      .eq('campaign_id', campaign.id)
      .eq('status', 'completed')
      .order('iteration_number', { ascending: true });

    const isResume = completedIters && completedIters.length > 0;
    const startIterNum = isResume ? completedIters[completedIters.length - 1].iteration_number + 1 : 1;

    // ── GENERATE OR REUSE SYNTHETIC USER PANEL ────────────────────────────────
    let syntheticUsers: SyntheticUser[];
    if (isResume) {
      const { data: existingUsers } = await db
        .from('refinery_synthetic_users')
        .select('id, name, age, gender, profession, bio, persona_data')
        .eq('campaign_id', campaign.id);
      syntheticUsers = (existingUsers ?? []) as SyntheticUser[];
      if (syntheticUsers.length === 0) {
        syntheticUsers = await generateSyntheticUsers(db, campaign);
      }
    } else {
      syntheticUsers = await generateSyntheticUsers(db, campaign);
    }

    // ── SEED PREVIOUS CONTENT/FEEDBACK FROM LAST COMPLETED ITERATION ──────────
    let previousContent: string | null = null;
    let previousFeedbackSummary: string | null = null;

    if (isResume) {
      const lastIter = completedIters[completedIters.length - 1];
      previousContent = lastIter.content;
      const { data: lastResponses } = await db
        .from('refinery_responses')
        .select('score, feedback')
        .eq('iteration_id', lastIter.id);
      if (lastResponses?.length) {
        previousFeedbackSummary = buildFeedbackSummary(lastResponses as ScoringResponse[]);
      }
    }

    // ── GENERATE BRAND AMBASSADOR IMAGE (ugc_ad campaigns only) ──────────────
    let ambassadorImageUrl: string | undefined;

    if (campaign.content_type === 'ugc_ad') {
      console.log('[refinery/processor] Generating brand ambassador image via Runware…');
      ambassadorImageUrl = await generatePersonImage(
        'Photorealistic portrait of a 26-year-old athletic woman with a warm smile, wearing stylish gym clothes, standing in a bright modern gym, natural soft lighting, looking directly at camera, professional photo quality, no text'
      );
      console.log('[refinery/processor] Ambassador image generated:', ambassadorImageUrl);
    }

    for (let iterNum = startIterNum; iterNum <= campaign.iterations; iterNum++) {
      // Generate content for this iteration (from scratch on iter 1, improved on 2+)
      const { content, improvementNotes } = await generateIterationContent(
        campaign,
        iterNum,
        previousContent,
        previousFeedbackSummary,
        syntheticUsers,
        ambassadorImageUrl
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
      // For ugc_ad campaigns, extract the script from the JSON blob so synthetic
      // users evaluate the spoken copy — not the serialised JSON.

      let scoreContent = content;
      if (campaign.content_type === 'ugc_ad') {
        try {
          const parsed = JSON.parse(content) as { script?: string };
          if (parsed.script) scoreContent = parsed.script;
        } catch {
          // fall back to raw content
        }
      }
      // static_ad: pass raw JSON — scoreOneStaticAdUser handles parsing

      const responses = await scoreAllUsers(
        db,
        campaign,
        iteration.id,
        scoreContent,
        syntheticUsers
      );

      // Compute aggregate score capped at 8.5, store feedback for next iteration
      const rawAvg = responses.reduce((sum, r) => sum + r.score, 0) / responses.length;
      const aggregateScore = compressScore(rawAvg);

      previousFeedbackSummary = buildFeedbackSummary(responses);
      previousContent = content;

      const ragRecs = isTextPromptType(campaign.content_type)
        ? await generateRagRecommendations(previousFeedbackSummary, campaign)
        : null;

      // Mark iteration completed with its aggregate score
      await db.from('refinery_iterations').update({
        aggregate_score: aggregateScore,
        status: 'completed',
        ...(ragRecs ? { rag_recommendations: ragRecs } : {}),
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
// THUMBNAIL JOB
//
// Generates N images in parallel via Runware, then scores each image with all
// synthetic users. Images are treated as "iterations" — one image per row.
// Scoring prompt focuses on scroll-stopping power, not copy quality.
// ─────────────────────────────────────────────────────────────────────────────

async function runThumbnailJob(db: SupabaseClient, campaign: Campaign, job: Job): Promise<void> {
  try {
    // Check for already-completed iterations (resume scenario)
    const { data: existingIters } = await db
      .from('refinery_iterations')
      .select('id, iteration_number')
      .eq('campaign_id', campaign.id)
      .eq('status', 'completed');
    const completedCount = existingIters?.length ?? 0;
    const newImagesNeeded = campaign.iterations - completedCount;

    if (newImagesNeeded <= 0) {
      await db.from('refinery_jobs').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', job.id);
      await db.from('refinery_campaigns').update({ status: 'completed' }).eq('id', campaign.id);
      return;
    }

    // 1. Generate or reuse synthetic users
    let syntheticUsers: SyntheticUser[];
    if (completedCount > 0) {
      const { data: existingUsers } = await db
        .from('refinery_synthetic_users')
        .select('id, name, age, gender, profession, bio, persona_data')
        .eq('campaign_id', campaign.id);
      syntheticUsers = (existingUsers ?? []) as SyntheticUser[];
      if (syntheticUsers.length === 0) syntheticUsers = await generateSyntheticUsers(db, campaign);
    } else {
      syntheticUsers = await generateSyntheticUsers(db, campaign);
    }

    // 2. Build prompts only for the new images needed
    const allPrompts = buildThumbnailPrompts(campaign.iterations, campaign.extra_context);
    const prompts = allPrompts.slice(completedCount);
    console.log(`[refinery/processor] Generating ${prompts.length} new thumbnail images in parallel…`);
    const imageUrls = await Promise.all(prompts.map(generatePersonImage));
    console.log(`[refinery/processor] ${imageUrls.length} images generated.`);

    // 3. Score in batches of 5 (parallel within batch, sequential across batches)
    for (let i = 0; i < imageUrls.length; i += 5) {
      const batch = imageUrls.slice(i, i + 5);

      await Promise.all(batch.map(async (url, idx) => {
        const iterNum = completedCount + i + idx + 1;

        const { data: iter, error: iterErr } = await db
          .from('refinery_iterations')
          .insert({
            campaign_id: campaign.id,
            iteration_number: iterNum,
            content: url,
            status: 'running',
          })
          .select('id')
          .single();

        if (iterErr || !iter) throw new Error(`Failed to insert thumbnail iteration ${iterNum}: ${iterErr?.message}`);

        const responses = await scoreAllUsers(db, campaign, iter.id, url, syntheticUsers);
        const rawAvg = responses.reduce((s, r) => s + r.score, 0) / responses.length;

        await db.from('refinery_iterations').update({
          aggregate_score: compressScore(rawAvg),
          status: 'completed',
        }).eq('id', iter.id);
      }));

      await db.from('refinery_jobs').update({
        current_iteration: Math.min(i + 5, imageUrls.length),
      }).eq('id', job.id);
    }

    await db.from('refinery_jobs').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    }).eq('id', job.id);

    await db.from('refinery_campaigns').update({ status: 'completed' }).eq('id', campaign.id);

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[refinery/processor] Thumbnail job failed:', message);
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
- Each user must feel like a specific real person with a believable LinkedIn profile
- Vary seniority, company stage, career arc, communication style, and current pain across the panel
- Do NOT generate generic archetypes or near-clones — every person should have a distinct situation
- Ground each person in a realistic company context with specific detail (size, stage, location, industry niche)

Return a JSON object with this exact shape:
{
  "users": [
    {
      "name": "Full Name",
      "age": 41,
      "gender": "female",
      "profession": "CISO at a Series B fintech",
      "bio": "Two sentences: their professional context and what makes them distinctive as a person.",
      "persona_data": {
        "company": "Meridian Financial — Series B fintech, ~180 employees, NYC, processing $2B in annual transactions",
        "career_arc": "15 years in compliance before moving into security leadership 3 years ago — thinks like a regulator, not a technologist",
        "recent_signal": "Posted last month about tabletop exercise fatigue; has publicly criticized AI compliance tools as 'checkbox theatre'",
        "communication_style": "Direct and skeptical. Responds to peer framing and specific proof, ignores vendor pitches immediately",
        "decision_driver": "Needs examiner-ready evidence and defensible audit trails — her personal liability is on the line",
        "blocker": "Has been burned by two tools that overpromised. Will not engage without a concrete, verifiable proof point",
        "pain_right_now": "NYDFS 23 NYCRR 500 amendment deadline approaching and her current exercise process can't generate examiner-ready reports"
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
  previousFeedbackSummary: string | null,
  panelUsers: SyntheticUser[],
  ambassadorImageUrl?: string
): Promise<{ content: string; improvementNotes: string | null }> {
  // ── STATIC AD: iterative image + copy flow ──────────────────────────────────
  if (campaign.content_type === 'static_ad') {
    return generateStaticAdContent(campaign, iterNum, previousContent, previousFeedbackSummary);
  }

  // ── UGC AD: hardcoded protein shake flow ────────────────────────────────────
  if (campaign.content_type === 'ugc_ad') {
    return generateUGCIterationContent(
      iterNum,
      previousContent,
      previousFeedbackSummary,
      ambassadorImageUrl!
    );
  }

  const metricsStr = campaign.metrics.join(', ');
  const contentTypeLabel = campaign.content_type.replace(/_/g, ' ');
  const contextSection = campaign.extra_context
    ? `\n\nAdditional product/service context:\n${campaign.extra_context}`
    : '';
  const guidelinesSection = campaign.messaging_guidelines
    ? `\n\nMessaging guidelines (MUST follow throughout):\n${campaign.messaging_guidelines}`
    : '';
  const panelSection = panelUsers.length > 0
    ? `\n\nYour prompt will generate messages for these synthetic users:\n` +
      panelUsers.map(u => {
        const d = u.persona_data ?? {};
        const extras = [
          d.company,
          d.recent_signal,
          d.decision_driver,
          d.blocker,
          d.pain_right_now,
        ].filter(Boolean).join(' | ');
        return `- ${u.name}, ${u.age ?? '?'}, ${u.profession ?? 'professional'}${extras ? `: ${extras}` : ''}`;
      }).join('\n')
    : '';

  let userPrompt: string;
  const usePromptIteration = isTextPromptType(campaign.content_type);

  if (iterNum === 1) {
    const draftSection = campaign.initial_draft
      ? `\n\nStarting prompt / hypothesis to build from:\n---\n${campaign.initial_draft}\n---`
      : '';

    if (usePromptIteration) {
      // PROMPT: Generate a personalization prompt (not a message) for text content types
      userPrompt = `Write a detailed prompt that an AI can use to write a personalized ${contentTypeLabel} for each individual recipient.
The prompt you write will be used like this: an AI reads it, then generates a unique ${contentTypeLabel} tailored to a specific person's name, role, company, and pain points.

Target audience (ICP): ${campaign.icp}${panelSection}
Metrics to optimize for: ${metricsStr}${contextSection}${draftSection}${guidelinesSection}

Your prompt must:
- Tell the AI what tone, structure, and length to use
- Specify what to reference from the recipient's profile (role, pain points, company context, etc.)
- Name what to avoid (buzzwords, generic claims, vague benefits, etc.)
- Be concrete and opinionated — not a vague instruction

Return JSON: { "content": "the full personalization prompt here", "improvement_notes": null }`;
    } else {
      // PROMPT: Legacy path for ugc_thumbnail (generates a message, not a prompt)
      userPrompt = `Write a high-performing ${contentTypeLabel} for the following audience and optimization goals.

Target audience (ICP): ${campaign.icp}${panelSection}
Metrics to optimize for: ${metricsStr}${contextSection}${draftSection}${guidelinesSection}

Instructions:
- Write the complete ${contentTypeLabel} copy — no labels, headers, or commentary
- Optimize specifically for: ${metricsStr}
- Speak directly to the ICP's real pain points and motivations — be specific, not generic
- Use concrete language; avoid buzzwords and empty claims

Return JSON: { "content": "the full copy here", "improvement_notes": null }`;
    }

  } else {
    if (usePromptIteration) {
      // PROMPT: Refine the personalization prompt based on per-persona feedback
      userPrompt = `You are refining a personalization prompt for ${contentTypeLabel}. Each synthetic user received a message generated from the previous prompt — tailored to their own profile — and scored it.

Target audience (ICP): ${campaign.icp}${panelSection}${contextSection}${guidelinesSection}

Previous prompt (iteration ${iterNum - 1}):
---
${previousContent}
---

Aggregated feedback (each user evaluated their own personalized message):
${previousFeedbackSummary}

Refine the prompt to address what failed and preserve what worked:
- Where feedback said "generic" or "vague" — make the instructions more specific
- Where feedback flagged tone, length, or structure issues — add explicit guidance
- Keep instructions that led to positive reactions

Return JSON: { "content": "the improved personalization prompt", "improvement_notes": "2-3 sentences on what changed and why" }`;
    } else {
      // PROMPT: Legacy path for ugc_thumbnail
      userPrompt = `You are improving a ${contentTypeLabel} based on synthetic user feedback. Your goal is meaningful score improvement on: ${metricsStr}.

Target audience (ICP): ${campaign.icp}${panelSection}${contextSection}${guidelinesSection}

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
// GENERATE PERSONALIZED MESSAGE FOR ONE USER
//
// Takes the iteration prompt (instructions) + a synthetic user's profile and
// produces a personalized message for that specific person. Used before scoring
// so each user evaluates copy written for them, not a generic template.
// ─────────────────────────────────────────────────────────────────────────────

async function generatePersonalizedMessage(
  iterationPrompt: string,
  user: SyntheticUser,
  contentTypeLabel: string
): Promise<string> {
  const profileDetails = Object.entries(user.persona_data ?? {})
    .map(([key, value]) => `- ${key.replace(/_/g, ' ')}: ${value}`)
    .join('\n');

  const userPrompt = `Use the following instructions to write a personalized ${contentTypeLabel} for this specific person.

Recipient profile:
- Name: ${user.name}
- Age: ${user.age ?? 'unknown'}, ${user.gender ?? 'unknown gender'}
- Role: ${user.profession ?? 'professional'}
- Background: ${user.bio ?? 'No bio available'}
${profileDetails}

Instructions (follow these exactly):
${iterationPrompt}

Return JSON: { "content": "the personalized message, nothing else" }`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You write personalized marketing copy. Return only valid JSON — no markdown, no commentary.',
        },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });
    const raw = completion.choices[0].message.content ?? '{}';
    const parsed = JSON.parse(raw) as { content?: string };
    return parsed.content ?? '';
  } catch {
    return '';
  }
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
  const isThumbnail = campaign.content_type === 'ugc_thumbnail';
  const isStaticAd = campaign.content_type === 'static_ad';
  const usePersonalization = isTextPromptType(campaign.content_type);

  const metricsStr = isThumbnail
    ? 'scroll-stopping power, visual appeal, authenticity, whether you\'d click to watch'
    : isStaticAd
    ? 'purchase intent, visual appeal, copy clarity, scroll-stopping power, text placement'
    : campaign.metrics.join(', ');
  const contentTypeLabel = isThumbnail
    ? 'social media thumbnail for a UGC ad'
    : isStaticAd
    ? 'static social media ad'
    : campaign.content_type.replace(/_/g, ' ');

  const allResponses: ScoringResponse[] = [];

  for (let i = 0; i < users.length; i += 5) {
    const batch = users.slice(i, i + 5);

    if (usePersonalization) {
      // TEXT TYPES: generate a personalized message per user, then score that message
      const batchResults = await Promise.all(
        batch.map(async (user) => {
          const personalizedContent = await generatePersonalizedMessage(content, user, contentTypeLabel);
          const result = await scoreOneUser(user, personalizedContent, contentTypeLabel, metricsStr);
          return { ...result, personalizedContent };
        })
      );

      const rows = batchResults.map((result, idx) => ({
        iteration_id: iterationId,
        campaign_id: campaign.id,
        synthetic_user_id: batch[idx].id,
        score: result.score,
        feedback: result.feedback,
        personalized_content: result.personalizedContent,
      }));

      const { error: insertError } = await db.from('refinery_responses').insert(rows);
      if (insertError) {
        throw new Error(`Failed to insert responses for batch ${Math.floor(i / 5) + 1}: ${insertError.message}`);
      }

      allResponses.push(
        ...batchResults.map((r, idx) => ({
          synthetic_user_id: batch[idx].id,
          score: r.score,
          feedback: r.feedback,
        }))
      );

    } else {
      // AD/MEDIA TYPES: score the raw content directly (existing behaviour)
      const batchScores = await Promise.all(
        isStaticAd
          ? batch.map((user) => scoreOneStaticAdUser(user, content))
          : batch.map((user) => scoreOneUser(user, content, contentTypeLabel, metricsStr))
      );

      const rows = batchScores.map((result, idx) => ({
        iteration_id: iterationId,
        campaign_id: campaign.id,
        synthetic_user_id: batch[idx].id,
        score: result.score,
        feedback: result.feedback,
      }));

      const { error: insertError } = await db.from('refinery_responses').insert(rows);
      if (insertError) {
        throw new Error(`Failed to insert responses for batch ${Math.floor(i / 5) + 1}: ${insertError.message}`);
      }

      allResponses.push(
        ...batchScores.map((r, idx) => ({
          synthetic_user_id: batch[idx].id,
          score: r.score,
          feedback: r.feedback,
        }))
      );
    }
  }

  return allResponses;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORE ONE STATIC AD USER (Gemini Vision)
//
// Uses Google Gemini 3 Flash via Runware so the synthetic user actually sees
// the background image alongside the ad copy. Falls back to neutral on error.
// ─────────────────────────────────────────────────────────────────────────────

async function scoreOneStaticAdUser(
  user: SyntheticUser,
  content: string,
): Promise<{ score: number; feedback: string }> {
  let ad: { imageUrl?: string; textLayout?: string; headline?: string; body?: string; features?: string[]; cta?: string } = {};
  try { ad = JSON.parse(content); } catch { /* fall through */ }

  const profileDetails = Object.entries(user.persona_data ?? {})
    .map(([key, value]) => `- ${key.replace(/_/g, ' ')}: ${value}`)
    .join('\n');

  const systemPrompt = `You are a realistic synthetic user evaluating a static social media ad. Return only valid JSON — no markdown, no commentary.`;

  const userMessage = `You are ${user.name}, ${user.age ?? 'unknown age'} year old ${user.gender ?? 'person'}, ${user.profession ?? 'professional'}.
Bio: ${user.bio ?? 'No bio provided.'}
${profileDetails}

You're scrolling Instagram and you see this static ad. The image above is the background visual. The ad has this copy overlaid on it:
- Text position: ${ad.textLayout ?? 'bottom-center'}
- Headline: "${ad.headline ?? ''}"
- Body: "${ad.body ?? ''}"
- Features: ${(ad.features ?? []).join(', ')}
- CTA: "${ad.cta ?? ''}"

React as yourself. Consider: purchase intent, visual appeal, copy clarity, scroll-stopping power, and whether the text placement works with the image composition.

Scoring guidance:
- 1–3: Off-putting or irrelevant. You'd scroll past immediately.
- 4–5: Generic. Nothing special.
- 6–7: Has something — you might pause.
- 8+: Genuinely compelling. Rare.

Return JSON: { "score": <integer 1-10>, "feedback": "<2-3 sentences — react personally to both the image and the copy, including whether the text placement works>" }`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: ad.imageUrl ?? '' } },
            { type: 'text', text: userMessage },
          ],
        },
      ],
      temperature: 0.3,
      max_tokens: 400,
      response_format: { type: 'json_object' },
    });
    const raw = completion.choices[0].message.content ?? '{}';
    const parsed = JSON.parse(raw) as { score?: number; feedback?: string };
    const score = typeof parsed.score === 'number'
      ? Math.max(1, Math.min(10, Math.round(parsed.score)))
      : 5;
    return { score, feedback: typeof parsed.feedback === 'string' ? parsed.feedback : '' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[vision scorer] Failed for user ${user.id}:`, msg);
    return { score: 5, feedback: `Scoring error: ${msg.slice(0, 120)}` };
  }
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
  const profileDetails = Object.entries(user.persona_data ?? {})
    .map(([key, value]) => `- ${key.replace(/_/g, ' ')}: ${value}`)
    .join('\n');

  // PROMPT: Synthetic user scoring — thumbnail variant uses image-specific framing
  const isThumbnailContent = content.startsWith('https://') || content.startsWith('http://');

  const userPrompt = isThumbnailContent
    ? `You are ${user.name}, ${user.age ?? 'unknown age'} year old ${user.gender ?? 'person'}, ${user.profession ?? 'professional'}.
Bio: ${user.bio ?? 'No bio provided.'}
${profileDetails}

You're scrolling Instagram. You just saw a thumbnail image: a photo of a young athletic woman used as a UGC ad for a protein shake brand.
The image URL is: ${content}

Imagine this image as the thumbnail of a short video ad. React as yourself — would you stop scrolling?
Consider specifically: ${metricsStr}.

Scoring guidance:
- 1–3: You'd scroll right past. Generic, unappealing, or off-putting.
- 4–5: You notice it but keep scrolling. Nothing special.
- 6–7: You might pause for a second. Something caught your eye.
- 8+: You'd actually stop and watch. Rare — only if it's genuinely striking or relatable.

Return JSON: { "score": <integer 1-10>, "feedback": "<2-3 sentences — what specifically made you stop or scroll past, and why>" }`
    : `You are ${user.name}, ${user.age ?? 'unknown age'} year old ${user.gender ?? 'person'}, ${user.profession ?? 'professional'}.
Bio: ${user.bio ?? 'No bio provided.'}
${profileDetails}

You've just received this ${contentTypeLabel}, written specifically for you:
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
// GENERATE STATIC AD CONTENT
//
// Each iteration: OpenAI generates ad copy + image prompt → Runware generates
// the visual → returns JSON { imageUrl, imagePrompt, textLayout, headline,
// body, features, cta }. Iterations 2+ improve both copy and layout from feedback.
// ─────────────────────────────────────────────────────────────────────────────

interface StaticAdContent {
  imagePrompt?: string;
  textLayout?: string;
  headline?: string;
  body?: string;
  features?: string[];
  cta?: string;
  improvement_notes?: string | null;
}

const LAYOUT_OPTIONS = '"top-left", "top-right", "bottom-left", "bottom-right", "bottom-center", or "center"';

async function generateStaticAdContent(
  campaign: Campaign,
  iterNum: number,
  previousContent: string | null,
  previousFeedbackSummary: string | null,
): Promise<{ content: string; improvementNotes: string | null }> {
  const contextSection = campaign.extra_context
    ? `\n\nBrand/product context:\n${campaign.extra_context}`
    : '';
  const briefSection = campaign.initial_draft
    ? `\n\nAd concept brief:\n${campaign.initial_draft}`
    : '';

  let userPrompt: string;

  if (iterNum === 1) {
    userPrompt = `Create a static social media ad for the following audience and brand.

Target audience (ICP): ${campaign.icp}${contextSection}${briefSection}

Return JSON with this exact shape:
{
  "imagePrompt": "detailed visual description for AI image generation — photorealistic, describe scene/lighting/composition/mood, NO text or logos in the image",
  "textLayout": <one of ${LAYOUT_OPTIONS}>,
  "headline": "5–10 word punchy headline",
  "body": "1–3 sentences of supporting copy",
  "features": ["concrete benefit 1", "concrete benefit 2", "concrete benefit 3"],
  "cta": "2–5 word call to action",
  "improvement_notes": null
}

Rules:
- imagePrompt must describe a photorealistic scene that fits the brand — no text, no logos, no watermarks
- textLayout should complement the composition (e.g. top-right if the subject is on the left side)
- headline and copy must speak directly to the ICP's pain points — be specific, not generic
- features should be concrete benefits, not empty claims`;

  } else {
    let prevAdFormatted = previousContent ?? '';
    try {
      const prev = JSON.parse(previousContent ?? '{}') as StaticAdContent;
      prevAdFormatted = `Headline: "${prev.headline}"
Body: "${prev.body}"
Features: ${prev.features?.join(', ')}
CTA: "${prev.cta}"
Text position: ${prev.textLayout}
Visual: ${prev.imagePrompt}`;
    } catch { /* fall back to raw */ }

    userPrompt = `You are improving a static social media ad based on synthetic user feedback.

Target audience (ICP): ${campaign.icp}${contextSection}

Previous ad (iteration ${iterNum - 1}):
---
${prevAdFormatted}
---

Feedback from synthetic users:
${previousFeedbackSummary}

Improve the ad. You may change the headline, body, features, CTA, text layout position, and the visual description — whatever the feedback suggests.

Return JSON with this exact shape:
{
  "imagePrompt": "updated visual description — photorealistic, no text or logos in image",
  "textLayout": <one of ${LAYOUT_OPTIONS}>,
  "headline": "improved headline",
  "body": "improved body copy",
  "features": ["benefit 1", "benefit 2", "benefit 3"],
  "cta": "improved CTA",
  "improvement_notes": "2-3 sentences on what was changed and why based on the feedback"
}`;
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You create and optimize static social media ad concepts. Return only valid JSON — no markdown, no commentary.',
      },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0].message.content ?? '{}';
  let parsed: StaticAdContent;

  try {
    parsed = JSON.parse(raw) as StaticAdContent;
  } catch {
    throw new Error(`Failed to parse static ad content JSON: ${raw.slice(0, 300)}`);
  }

  if (!parsed.headline || !parsed.imagePrompt) {
    throw new Error(`Missing required fields in static ad response: ${raw.slice(0, 200)}`);
  }

  // Generate the visual via Runware
  console.log(`[refinery/processor] Generating static ad image via Runware (iter ${iterNum})…`);
  const imageUrl = await generatePersonImage(parsed.imagePrompt);
  console.log(`[refinery/processor] Static ad image generated: ${imageUrl}`);

  const contentJson = JSON.stringify({
    imageUrl,
    imagePrompt: parsed.imagePrompt,
    textLayout: parsed.textLayout ?? 'bottom-center',
    headline: parsed.headline,
    body: parsed.body ?? '',
    features: parsed.features ?? [],
    cta: parsed.cta ?? '',
  });

  return {
    content: contentJson,
    improvementNotes: parsed.improvement_notes ?? null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE UGC ITERATION CONTENT (ad_creative campaigns)
//
// Hardcoded to ProPulse Protein shake brand for hackathon demo.
// Generates a 30s UGC script via OpenAI, then passes it to VEED Fabric
// along with the ambassador image to produce a video.
// Returns content as a JSON string: { script, image_url, video_url }
// ─────────────────────────────────────────────────────────────────────────────

async function generateUGCIterationContent(
  iterNum: number,
  previousScript: string | null,
  previousFeedbackSummary: string | null,
  ambassadorImageUrl: string
): Promise<{ content: string; improvementNotes: string | null }> {
  const brandContext = `Brand: ProPulse Protein. Clean, grass-fed whey. 25g protein per serving. No artificial sweeteners. Tastes like real food.
Target: health-conscious gym-goers aged 22–35 who are tired of chalky, artificial-tasting protein powders.
UGC style: authentic, first-person, casual — like a friend recommending it, not a sales pitch.
Script length: ~30 seconds when spoken (roughly 75–90 words). No stage directions or labels — just the spoken words.`;

  let userPrompt: string;

  if (iterNum === 1 || !previousScript) {
    userPrompt = `${brandContext}

Write a 30-second UGC ad script for ProPulse Protein. Casual, first-person, authentic. No buzzwords.

Return JSON: { "script": "the full spoken script here", "improvement_notes": null }`;
  } else {
    // Extract previous script from JSON blob if needed
    let prevScript = previousScript;
    try {
      const parsed = JSON.parse(previousScript) as { script?: string };
      if (parsed.script) prevScript = parsed.script;
    } catch { /* already plain text */ }

    userPrompt = `${brandContext}

Previous script (iteration ${iterNum - 1}):
---
${prevScript}
---

Feedback from synthetic users:
${previousFeedbackSummary}

Rewrite the script to directly address the criticisms. Keep what worked, fix what didn't. Same casual UGC tone.

Return JSON: { "script": "improved spoken script", "improvement_notes": "2-3 sentences on what changed and why" }`;
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You write authentic UGC ad scripts. Return only valid JSON — no markdown, no commentary.',
      },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 600,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0].message.content ?? '{}';
  let parsed: { script?: string; improvement_notes?: string | null };

  try {
    parsed = JSON.parse(raw) as { script?: string; improvement_notes?: string | null };
  } catch {
    throw new Error(`Failed to parse UGC script JSON (iter ${iterNum}): ${raw.slice(0, 200)}`);
  }

  if (!parsed.script) {
    throw new Error(`No script in UGC response (iter ${iterNum}): ${raw.slice(0, 200)}`);
  }

  const script = parsed.script;
  console.log(`[refinery/processor] UGC script iter ${iterNum}: ${script.slice(0, 80)}…`);

  // Generate video via VEED Fabric
  console.log(`[refinery/processor] Calling VEED Fabric for iter ${iterNum}…`);
  const videoUrl = await generateUGCVideo(ambassadorImageUrl, script);
  console.log(`[refinery/processor] Video generated iter ${iterNum}:`, videoUrl);

  const content = JSON.stringify({
    script,
    image_url: ambassadorImageUrl,
    video_url: videoUrl,
  });

  return {
    content,
    improvementNotes: parsed.improvement_notes ?? null,
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

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE RAG RECOMMENDATIONS
//
// Analyzes the iteration's feedback and tells the user what real-world content
// (case studies, metrics, testimonials, etc.) they should add to their RAG
// context to break through score plateaus. Stored per iteration, shown in UI.
// ─────────────────────────────────────────────────────────────────────────────

async function generateRagRecommendations(
  feedbackSummary: string,
  campaign: Campaign
): Promise<string | null> {
  const contentTypeLabel = campaign.content_type.replace(/_/g, ' ');
  const metricsStr = campaign.metrics.join(', ');

  const userPrompt = `You are analyzing synthetic user feedback on a ${contentTypeLabel} campaign.

Target audience: ${campaign.icp}
Metrics being optimized: ${metricsStr}

Feedback from this iteration:
${feedbackSummary}

Based on this feedback, identify what specific real-world content or data — if added to the campaign's research context — would most improve future messages. Only suggest content the user could realistically find and paste in: customer stories, specific metrics, testimonials, case studies, named outcomes, pricing context, competitive comparisons, industry benchmarks, etc. Do NOT suggest generic writing improvements.

Return JSON:
{
  "recommendations": [
    {
      "type": "Customer case study",
      "description": "A story from a fintech firm that used ChaosTrack to pass an NYDFS audit — ideally with a named outcome like time saved or findings avoided",
      "why": "Personas asked repeatedly for proof from similar companies before engaging"
    }
  ]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You analyze marketing feedback and recommend research content. Return only valid JSON — no markdown, no commentary.',
        },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 600,
      response_format: { type: 'json_object' },
    });
    return completion.choices[0].message.content ?? null;
  } catch (err) {
    console.error('[refinery/processor] RAG recommendations failed (non-critical):', err);
    return null;
  }
}
