// app/api/run-simulation/route.ts

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
  
  try {
    // Get user ID for error logging
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    userId = session?.user?.id;
    
    const { messages, model } = await req.json();
    // replaceme: console.log('prompt123', messages, model);
    let completion;
    // Call OpenAI or groq
    if (model === 'groq') {
      completion = await openRouterai.chat.completions.create({
        model: 'anthropic/claude-3-haiku',
        messages,
        temperature: 0.9,
        max_tokens: 3000,
        response_format: { "type": "json_object" }
      });
    } else {
    completion = await openai.chat.completions.create({
      model: model,
      messages,
      temperature: 0.9,
      max_tokens: 3000,
      response_format: { "type": "json_object" }
    });
    }
    // Extract usage info
    const usage = completion.usage;
    // replaceme: console.log('amit-runSimulationAPI-completion', completion);
    // replaceme: console.log('amit-runSimulationAPI-completion', completion.choices[0].message);
    const finishReason = completion.choices[0].finish_reason;
    // replaceme: console.log('amit-runSimulationAPI-finishReason', finishReason);
    // replaceme: console.log("Input tokens:", usage?.prompt_tokens);
    // replaceme: console.log("Output tokens:", usage?.completion_tokens);
    // replaceme: console.log("Total tokens:", usage?.total_tokens);
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
