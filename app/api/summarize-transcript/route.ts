// app/api/summarize-transcript/route.ts
import { openai } from '@/lib/openai';  // Changed from perplexity
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Much cheaper than GPT-4
      messages: [
        {
          role: 'system',
          content: 'You are an expert market research analyst. Summarize focus group transcripts clearly and concisely, highlighting key themes and participant insights.'
        },
        {
          role: 'user',
          content: `Summarize this focus group transcript:\n\n${transcript}`
        }
      ],
      max_tokens: 800,
      temperature: 0.3
    });

    return NextResponse.json({ 
      summary: response.choices[0].message.content || 'No summary generated'
    });
  } catch (error) {
    console.error('Summarization error:', error);
    return NextResponse.json(
      { error: 'Failed to summarize transcript' }, 
      { status: 500 }
    );
  }
}
