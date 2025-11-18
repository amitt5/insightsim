import { NextResponse } from "next/server"
import { checkProjectAccess } from "@/utils/projectAccess"
import { OpenAI } from "openai"
import { searchFileStore } from "@/lib/googleFileSearch"

// Helper function to format analysis data into context string
function formatAnalysisContext(syntheticAnalysis: any, humanAnalysis: any, transcriptResults?: any): string {
  let context = "You are a research analysis assistant. Answer questions based on the following data from market research interviews.\n\n";
  
  // Add transcript search results if available
  if (transcriptResults && transcriptResults.candidates && transcriptResults.candidates.length > 0) {
    context += "=== TRANSCRIPT SEARCH RESULTS (Direct Quotes from Interviews) ===\n\n";
    transcriptResults.candidates.forEach((candidate: any, idx: number) => {
      if (candidate.content?.parts && candidate.content.parts.length > 0) {
        candidate.content.parts.forEach((part: any) => {
          if (part.text) {
            context += `Result ${idx + 1}:\n${part.text}\n\n`;
          }
        });
      }
      
      // Add grounding metadata (source information)
      if (candidate.groundingMetadata?.groundingChunks && candidate.groundingMetadata.groundingChunks.length > 0) {
        context += "Sources:\n";
        candidate.groundingMetadata.groundingChunks.forEach((chunk: any) => {
          if (chunk.documentChunkInfo?.documentName) {
            const docName = chunk.documentChunkInfo.documentName;
            // Extract simulation/interview ID from document name
            const match = docName.match(/(?:synthetic|human)-transcript-([^/]+)/);
            if (match) {
              context += `  - From ${docName.includes('synthetic') ? 'Simulation' : 'Interview'} ${match[1]}\n`;
            }
          }
        });
        context += "\n";
      }
    });
    context += "\n";
  }
  
  if (syntheticAnalysis && Array.isArray(syntheticAnalysis) && syntheticAnalysis.length > 0) {
    context += "=== SYNTHETIC ANALYSIS (AI-Generated Interviews Summary) ===\n\n";
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
    context += "=== HUMAN ANALYSIS (Real Interviews Summary) ===\n\n";
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
  if (transcriptResults && transcriptResults.candidates && transcriptResults.candidates.length > 0) {
    context += "- Prioritize information from TRANSCRIPT SEARCH RESULTS when answering questions about specific details, quotes, or mentions\n";
    context += "- Use analysis summaries for high-level insights and patterns\n";
    context += "- When citing transcript results, mention which simulation or interview it came from\n";
  } else {
    context += "- Answer questions based ONLY on the analysis data provided above\n";
  }
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

    // Get the user's question and searchTranscripts flag from request body
    const { question, searchTranscripts } = await request.json()
    if (!question || typeof question !== 'string' || !question.trim()) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 })
    }

    // Fetch both synthetic and human analysis
    let syntheticAnalysis = null
    let humanAnalysis = null
    let transcriptSearchResults = null

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

    // Check if we have at least one analysis or transcript search enabled
    if (!syntheticAnalysis && !humanAnalysis && !searchTranscripts) {
      return NextResponse.json({ 
        error: "No analysis data available. Please generate analysis first." 
      }, { status: 404 })
    }

    // Search transcripts if enabled
    if (searchTranscripts) {
      try {
        // Get project's Google File Search Store ID
        const { data: project } = await supabase
          .from("projects")
          .select("google_file_search_store_id")
          .eq("id", projectId)
          .single()

        if (project?.google_file_search_store_id) {
          try {
            transcriptSearchResults = await searchFileStore(
              project.google_file_search_store_id,
              question,
              { maxResults: 5 }
            )
            console.log('Transcript search completed:', transcriptSearchResults?.candidates?.length || 0, 'results')
          } catch (searchError: any) {
            console.error('Error searching transcripts:', searchError)
            // Don't fail the request, just log the error and continue without transcript results
            // The user will still get analysis-based answers
          }
        } else {
          console.log('No Google File Search Store found for project, skipping transcript search')
        }
      } catch (error: any) {
        console.error('Error in transcript search setup:', error)
        // Continue without transcript search
      }
    }

    // Format analysis into context (including transcript results if available)
    const context = formatAnalysisContext(syntheticAnalysis, humanAnalysis, transcriptSearchResults)

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

