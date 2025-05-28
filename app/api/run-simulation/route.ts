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

    const reply = completion.choices[0].message.content;

    return NextResponse.json({ reply });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error running simulation' }, { status: 500 });
  }
}
