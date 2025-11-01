import { NextResponse } from "next/server"
import { checkProjectAccess } from "@/utils/projectAccess"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { POST as prepare } from "../prepare/route"
import { OpenAI } from "openai"

function buildPrompt(topic: string | undefined, transcriptJson: any) {
  const header = `You are a qualitative research analysis assistant. Analyze the following interview transcript and extract insights.

CONTEXT:
- This is a market research interview about ${topic || "the study topic"}
- The interview followed a structured format with specific questions
- We need analysis for each question with categories and verbatim quotes

INSTRUCTIONS:
1. Identify each question in the transcript
2. For each question:
   - Write a concise summary of responses (3-5 sentences)
   - Identify 5-8 main categories mentioned in responses
   - Calculate approximate percentage of responses that mention each category
   - Select 3-5 representative verbatim quotes
   - Tag each quote with relevant categories

FORMAT YOUR RESPONSE AS JSON WITH THIS STRUCTURE:
{
  "analysis": [
    {
      "question": "The exact question text",
      "summary": "AI-generated summary of responses",
      "categories": [
        {"name": "Category Name 1", "percentage": 75},
        {"name": "Category Name 2", "percentage": 60}
      ],
      "verbatims": [
        {"quote": "The exact quote from transcript", "tags": ["Category Name 1", "Category Name 3"]}
      ]
    }
  ]
}

ENSURE THE JSON IS VALID AND PROPERLY FORMATTED.

TRANSCRIPT:`
  return `${header}

${JSON.stringify(transcriptJson)}`
}

function cleanJsonFence(text: string): string {
  return (text || "")
    .replace(/^```[\s\S]*?\n/, "")
    .replace(/```$/, "")
    .trim()
}

function validateAnalysisJson(obj: any) {
  if (!obj || typeof obj !== "object") throw new Error("Output is not an object")
  if (!Array.isArray(obj.analysis)) throw new Error("Missing analysis array")
  obj.analysis.forEach((item: any, idx: number) => {
    if (!item || typeof item !== "object") throw new Error(`analysis[${idx}] is not an object`)
    if (typeof item.question !== "string" || !item.question.trim()) throw new Error(`analysis[${idx}].question invalid`)
    if (typeof item.summary !== "string" || !item.summary.trim()) throw new Error(`analysis[${idx}].summary invalid`)
    if (!Array.isArray(item.categories)) throw new Error(`analysis[${idx}].categories missing`)
    if (item.categories.length < 5 || item.categories.length > 8) throw new Error(`analysis[${idx}].categories must be 5-8`)
    item.categories.forEach((c: any, cIdx: number) => {
      if (!c || typeof c !== "object") throw new Error(`categories[${cIdx}] invalid`)
      if (typeof c.name !== "string" || !c.name.trim()) throw new Error(`categories[${cIdx}].name invalid`)
      if (typeof c.percentage !== "number" || c.percentage < 0 || c.percentage > 100) throw new Error(`categories[${cIdx}].percentage invalid`)
    })
    if (!Array.isArray(item.verbatims)) throw new Error(`analysis[${idx}].verbatims missing`)
    if (item.verbatims.length < 3 || item.verbatims.length > 5) throw new Error(`analysis[${idx}].verbatims must be 3-5`)
    item.verbatims.forEach((v: any, vIdx: number) => {
      if (!v || typeof v !== "object") throw new Error(`verbatims[${vIdx}] invalid`)
      if (typeof v.quote !== "string" || !v.quote.trim()) throw new Error(`verbatims[${vIdx}].quote invalid`)
      if (!Array.isArray(v.tags)) throw new Error(`verbatims[${vIdx}].tags missing`)
      v.tags.forEach((t: any, tIdx: number) => {
        if (typeof t !== "string" || !t.trim()) throw new Error(`verbatims[${vIdx}].tags[${tIdx}] invalid`)
      })
    })
  })
}

export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const projectId = params.projectId
  try {
    const access = await checkProjectAccess(projectId, false)
    if (!access.success || !access.supabase || !access.session) {
      return access.response || NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Reuse prepare to get normalized transcripts
    const prepResponse = await prepare(request, { params })
    if (!prepResponse.ok) {
      const err = await prepResponse.json().catch(() => ({} as any))
      return NextResponse.json({ error: err.error || "Failed to prepare transcripts" }, { status: 500 })
    }
    const prepData = await prepResponse.json() as any
    const transcriptPayload = prepData?.data

    // Build prompt
    const topic = undefined // optional; can be wired to project.brief_text later
    const systemPrompt = buildPrompt(topic, transcriptPayload)

    // Call LLM via existing API util
    const messages = [{ role: "system", content: systemPrompt } as any]
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.2,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    })
    const raw = completion.choices?.[0]?.message?.content || ""

    // Clean and parse JSON
    let text = cleanJsonFence(raw)
    let parsed: any
    try {
      parsed = JSON.parse(text)
      validateAnalysisJson(parsed)
    } catch (err: any) {
      // Repair pass: feed back schema error and ask to re-emit valid JSON only
      const repairPrompt = `Your previous output was invalid JSON for the required schema. Error: ${err?.message}. Re-emit ONLY the corrected JSON.`
      const repairMessages = [
        { role: 'system', content: repairPrompt },
        { role: 'user', content: text }
      ] as any
      const repairCompletion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: repairMessages,
        temperature: 0.2,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      })
      const repaired = cleanJsonFence(repairCompletion.choices?.[0]?.message?.content || "")
      parsed = JSON.parse(repaired)
      validateAnalysisJson(parsed)
    }

    // Save to database (upsert - overwrites if exists)
    const supabase = access.supabase
    const { error: dbError } = await supabase
      .from('project_analysis')
      .upsert({
        project_id: projectId,
        source: 'synthetic',
        analysis_json: parsed,
        model: 'gpt-4o-mini',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'project_id,source'
      })

    if (dbError) {
      console.error('Error saving analysis to database:', dbError)
      // Still return the analysis even if DB save fails
      return NextResponse.json({ 
        success: true, 
        analysis: parsed,
        warning: 'Analysis generated but failed to save to database'
      })
    }

    return NextResponse.json({ success: true, analysis: parsed })
  } catch (error: any) {
    console.error('Error running synthetic analysis:', error)
    return NextResponse.json({ error: error.message || 'Unexpected error' }, { status: 500 })
  }
}


