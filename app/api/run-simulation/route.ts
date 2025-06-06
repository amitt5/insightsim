// app/api/run-simulation/route.ts

import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json();
    console.log('prompt123', messages);
    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: model,
      messages,
      temperature: 0.9,
      max_tokens: 3000,
    //   top_p: 1,
    //   frequency_penalty: 0,
    //   presence_penalty: 0,
    //   stream: true,
    //   stream_options: {
    //     type: 'json_object',
    //     stream: true,
    //     max_tokens: 1000,
    //     temperature: 0.7,
    //     top_p: 1,
    //   }
    });

  // Extract usage info
    const usage = completion.usage;

    console.log("Input tokens:", usage?.prompt_tokens);
    console.log("Output tokens:", usage?.completion_tokens);
    console.log("Total tokens:", usage?.total_tokens);
    const reply = completion.choices[0].message.content;

    // Deduct credits
    // try {
    //   await deductCredits(usage?.prompt_tokens || 0, usage?.completion_tokens || 0, model);
    // } catch (error) {
    //   console.error("Failed to deduct credits:", error);
    // }

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
    return NextResponse.json({ error: 'Error running simulation' }, { status: 500 });
  }
}
