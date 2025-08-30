// app/api/extract-insights/route.ts
import {openai} from '@/lib/openai';  // Changed from perplexity
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Extract key insights from qualitative research transcripts. Format as numbered list with clear, actionable insights. Focus on:
          - Common misconceptions or beliefs
          - Behavioral patterns
          - Attitudes and sentiments
          - Pain points and frustrations
          - Unexpected findings
          
          Each insight should be specific and research-actionable.`
        },
        {
          role: 'user',
          content: `Extract key insights from this transcript:\n\n${transcript}`
        }
      ],
      max_tokens: 600,
      temperature: 0.2
    });

    return NextResponse.json({ 
      insights: response.choices[0].message.content || 'No insights extracted'
    });
  } catch (error) {
    console.error('Insight extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract insights' }, 
      { status: 500 }
    );
  }
}
