// app/api/run-simulation/route.ts

import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions.mjs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    // Build the system message
//     const systemPrompt = `You are simulating a focus group on the topic: ${topic}.
// There are ${personas.length} participants, each with their own background.
// The goal is to discuss: ${discussion_questions.join(", ")}.
// Generate the first few messages as if the participants are discussing this topic.`;

    // Build initial messages

    console.log('prompt123', prompt);
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: prompt
      }
    ];

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
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
