// app/api/test-simulation/route.ts
import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  const chat = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }]
  });

  const result = chat.choices[0].message.content;
  console.log('amit1');
  return new Response(JSON.stringify({ reply: result }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
