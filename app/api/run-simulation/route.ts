// app/api/run-simulation/route.ts

import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { logError } from '@/utils/errorLogger';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// RAG service configuration
const PYTHON_RAG_SERVICE_URL = process.env.PYTHON_RAG_SERVICE_URL || 'http://localhost:8000';

interface RAGContext {
  context: string;
  chunks: Array<{
    text: string;
    metadata: {
      source_file: string;
    };
  }>;
  total_chunks: number;
}

async function retrieveRAGContext(simulationId: string, query: string): Promise<RAGContext | null> {
  try {
    const response = await fetch(`${PYTHON_RAG_SERVICE_URL}/api/retrieve-context`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        simulation_id: simulationId,
        query: query,
        max_chunks: 3
      }),
    });

    if (!response.ok) {
      console.log(`RAG retrieval failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.log('RAG retrieval error:', error);
    return null;
  }
}

function extractSimulationId(messages: any[]): string | null {
  // Try to extract simulation_id from the conversation context
  // Look for it in system messages or conversation metadata
  for (const message of messages) {
    if (message.content && typeof message.content === 'string') {
      const simulationIdMatch = message.content.match(/simulation[_\s]?id[:\s]+([a-f0-9-]+)/i);
      if (simulationIdMatch) {
        return simulationIdMatch[1];
      }
    }
  }
  return null;
}

function extractUserQuery(messages: any[]): string {
  // Get the last user message as the query for RAG
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      return messages[i].content || '';
    }
  }
  return '';
}

function enhancePromptWithRAGContext(messages: any[], ragContext: RAGContext): any[] {
  const enhancedMessages = [...messages];
  
  if (ragContext.context && ragContext.chunks.length > 0) {
    // Find the system message (usually first) to enhance
    const systemMessageIndex = enhancedMessages.findIndex(msg => msg.role === 'system');
    
    if (systemMessageIndex !== -1) {
      const originalSystemContent = enhancedMessages[systemMessageIndex].content;
      
      // Create RAG context section
      const contextSection = `

RELEVANT CONTEXT FROM UPLOADED DOCUMENTS:
${ragContext.context}

Sources: ${ragContext.chunks.map(chunk => chunk.metadata.source_file).join(', ')}

IMPORTANT: When answering questions, if the answer is available in the context above, you MUST use that information to provide accurate responses. Even if the question is outside your normal expertise, reference the provided context when it contains the answer.

---

ORIGINAL INSTRUCTIONS:
${originalSystemContent}`;
      
      enhancedMessages[systemMessageIndex].content = contextSection;
    } else {
      // If no system message, add RAG context as a new system message at the beginning
      enhancedMessages.unshift({
        role: 'system',
        content: `RELEVANT CONTEXT FROM UPLOADED DOCUMENTS:
${ragContext.context}

Sources: ${ragContext.chunks.map(chunk => chunk.metadata.source_file).join(', ')}

Please use this context to provide more accurate and informed responses.`
      });
    }
  }
  
  return enhancedMessages;
}

export async function POST(req: Request) {
  let userId: string | undefined;
  
  try {
    // Get user ID for error logging
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    userId = session?.user?.id;
    
    const { messages, model, simulation_id } = await req.json();
    console.log('prompt123', messages);
    
    // Step 1: Try RAG context retrieval
    let enhancedMessages = messages;
    const actualSimulationId = simulation_id || extractSimulationId(messages);
    
    if (actualSimulationId) {
      console.log(`🔍 Attempting RAG retrieval for simulation: ${actualSimulationId}`);
      
      const userQuery = extractUserQuery(messages);
      if (userQuery) {
        const ragContext = await retrieveRAGContext(actualSimulationId, userQuery);
        
        if (ragContext && ragContext.chunks.length > 0) {
          console.log(`✅ RAG context retrieved: ${ragContext.chunks.length} chunks from ${ragContext.total_chunks} total`);
          enhancedMessages = enhancePromptWithRAGContext(messages, ragContext);
          console.log('enhancedMessages', enhancedMessages);
        } else {
          console.log('ℹ️  No RAG context available for this query');
        }
      }
    } else {
      console.log('ℹ️  No simulation_id found, proceeding without RAG');
    }

    // Step 2: Call OpenAI with potentially enhanced messages
    const completion = await openai.chat.completions.create({
      model: model,
      messages: enhancedMessages,
      temperature: 0.9,
      max_tokens: 3000,
      response_format: { "type": "json_object" }
    });

    // Extract usage info
    const usage = completion.usage;

    console.log("Input tokens:", usage?.prompt_tokens);
    console.log("Output tokens:", usage?.completion_tokens);
    console.log("Total tokens:", usage?.total_tokens);
    const reply = completion.choices[0].message.content;

    return NextResponse.json({ 
      reply,
      usage: {
        prompt_tokens: usage?.prompt_tokens || 0,
        completion_tokens: usage?.completion_tokens || 0,
        total_tokens: usage?.total_tokens || 0
      }
    });
  } catch (error) {
    console.error(error);
    
    // Log the error with context
    await logError(
      'openai_simulation_api',
      error instanceof Error ? error : String(error),
      undefined,
      {
        model: req.body ? JSON.parse(await req.text()).model : 'unknown',
        error_type: error instanceof Error ? error.name : 'unknown_error',
        timestamp: new Date().toISOString()
      },
      userId
    );
    
    return NextResponse.json({ error: 'Error running simulation' }, { status: 500 });
  }
}
