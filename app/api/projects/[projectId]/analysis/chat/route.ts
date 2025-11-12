import { NextResponse } from "next/server"
import { checkProjectAccess } from "@/utils/projectAccess"
import { OpenAI } from "openai"

// Helper function to format analysis data into context string
function formatAnalysisContext(syntheticAnalysis: any, humanAnalysis: any): string {
  let context = "You are a research analysis assistant. Answer questions based on the following analysis data from market research interviews.\n\n";
  
  if (syntheticAnalysis && Array.isArray(syntheticAnalysis) && syntheticAnalysis.length > 0) {
    context += "=== SYNTHETIC ANALYSIS (AI-Generated Interviews) ===\n\n";
    syntheticAnalysis.forEach((item: any, idx: number) => {
      context += `Question ${idx + 1}: ${item.question || 'N/A'}\n`;
      context += `Summary: ${item.summary || 'N/A'}\n`;
      
      if (item.categories && Array.isArray(item.categories)) {
        context += "Categories:\n";
        item.categories.forEach((cat: any) => {
          context += `  - ${cat.name}: ${cat.percentage}%\n`;
        });
      }
      
      if (item.verbatims && Array.isArray(item.verbatims)) {
        context += "Key Quotes:\n";
        item.verbatims.slice(0, 3).forEach((v: any) => {
          context += `  - "${v.quote}" [${(v.tags || []).join(', ')}]\n`;
        });
      }
      context += "\n";
    });
  }
  
  if (humanAnalysis && Array.isArray(humanAnalysis) && humanAnalysis.length > 0) {
    context += "=== HUMAN ANALYSIS (Real Interviews) ===\n\n";
    humanAnalysis.forEach((item: any, idx: number) => {
      context += `Question ${idx + 1}: ${item.question || 'N/A'}\n`;
      context += `Summary: ${item.summary || 'N/A'}\n`;
      
      if (item.categories && Array.isArray(item.categories)) {
        context += "Categories:\n";
        item.categories.forEach((cat: any) => {
          context += `  - ${cat.name}: ${cat.percentage}%\n`;
        });
      }
      
      if (item.verbatims && Array.isArray(item.verbatims)) {
        context += "Key Quotes:\n";
        item.verbatims.slice(0, 3).forEach((v: any) => {
          context += `  - "${v.quote}" [${(v.tags || []).join(', ')}]\n`;
        });
      }
      context += "\n";
    });
  }
  
  context += "\nINSTRUCTIONS:\n";
  context += "- Answer questions based ONLY on the analysis data provided above\n";
  context += "- Be specific and cite relevant categories, percentages, or quotes when possible\n";
  context += "- If the question cannot be answered from the provided data, say so clearly\n";
  context += "- Provide clear, concise, and actionable insights\n";
  
  return context;
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
    const supabase = access.supabase

    // Get the user's question from request body
    const { question } = await request.json()
    if (!question || typeof question !== 'string' || !question.trim()) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 })
    }

    // Fetch both synthetic and human analysis
    let syntheticAnalysis = null
    let humanAnalysis = null

    // Fetch synthetic analysis
    const { data: syntheticData, error: syntheticError } = await supabase
      .from('project_analysis')
      .select('analysis_json')
      .eq('project_id', projectId)
      .eq('source', 'synthetic')
      .single()

    if (!syntheticError && syntheticData?.analysis_json) {
      // Normalize: if analysis_json has an 'analysis' property (array), use that; otherwise use analysis_json itself
      const data = syntheticData.analysis_json;
      syntheticAnalysis = Array.isArray(data) ? data : (data.analysis || data);
    }

    // Fetch human analysis
    const { data: humanData, error: humanError } = await supabase
      .from('project_analysis')
      .select('analysis_json')
      .eq('project_id', projectId)
      .eq('source', 'human')
      .single()

    if (!humanError && humanData?.analysis_json) {
      // Normalize: if analysis_json has an 'analysis' property (array), use that; otherwise use analysis_json itself
      const data = humanData.analysis_json;
      humanAnalysis = Array.isArray(data) ? data : (data.analysis || data);
    }

    // Check if we have at least one analysis
    if (!syntheticAnalysis && !humanAnalysis) {
      return NextResponse.json({ 
        error: "No analysis data available. Please generate analysis first." 
      }, { status: 404 })
    }

    // Format analysis into context
    const context = formatAnalysisContext(syntheticAnalysis, humanAnalysis)

    // Build messages for LLM
    const systemPrompt = context
    const userMessage = question.trim()

    // Call OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    const reply = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response."

    return NextResponse.json({ 
      success: true,
      reply: reply.trim()
    })
  } catch (error: any) {
    console.error('Error in analysis chat:', error)
    return NextResponse.json({ 
      error: error.message || 'Unexpected error occurred' 
    }, { status: 500 })
  }
}

