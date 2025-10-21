// app/api/run-simulation/route.ts
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { logError } from '@/utils/errorLogger';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const openRouterai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});



export async function POST(req: Request) {
  let userId: string | undefined;
  let completion;
  let model: string = 'gpt-4o-mini';
  
  try {
    // Get user ID for error logging
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    userId = session?.user?.id;
    
    const { messages, model: reqModel } = await req.json();
    model = reqModel;
    // console.log('prompt123', messages, model);
    // Call OpenAI or groq
    if (model === 'groq') {
      completion = await openRouterai.chat.completions.create({
        model: 'anthropic/claude-3-haiku',
        messages,
        temperature: 0.9,
        max_tokens: 10000,
        response_format: { "type": "json_object" }
      });
    } else {
    completion = await openai.chat.completions.create({
      model: model,
      messages,
      temperature: 0.9,
      max_tokens: 10000,
      response_format: { "type": "json_object" }
    });
    }
    // Extract usage info
    const usage = completion.usage;
    const rawResponse = completion.choices[0].message.content;
    console.log('Raw LLM response:', rawResponse);
    
    // Try parsing the response as JSON to catch any JSON formatting issues early
    let reply;
    try {
      // If it's not valid JSON, this will throw
      JSON.parse(rawResponse  || '');
      reply = rawResponse;
    } catch (jsonError) {
      console.error('LLM returned invalid JSON:', rawResponse);
      throw new Error('LLM returned invalid JSON response');
    }

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
    
    // Get the raw response if available
    const rawResponse = error instanceof Error && error.message === 'LLM returned invalid JSON response'
      ? completion?.choices?.[0]?.message?.content
      : undefined;
    
    // Log the error with context
    await logError(
      'openai_simulation_api',
      error instanceof Error ? error : String(error),
      rawResponse || '', // Include the raw response in the error log
      {
        model: model || 'unknown',
        error_type: error instanceof Error ? error.name : 'unknown_error',
        timestamp: new Date().toISOString()
      },
      userId
    );
    
    return NextResponse.json({ error: 'Error running simulation' }, { status: 500 });
  }
}
