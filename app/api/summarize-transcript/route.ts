import { NextRequest, NextResponse } from 'next/server';
import perplexity from '@/lib/perplexity';
import { TranscriptSummaryRequest, TranscriptSummaryResponse, PerplexityError } from '@/app/types/perplexity';

export async function POST(req: NextRequest): Promise<NextResponse<TranscriptSummaryResponse | PerplexityError>> {
  try {
    const { transcript }: TranscriptSummaryRequest = await req.json();
    
    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' }, 
        { status: 400 }
      );
    }
    
    const response = await perplexity.chat.completions.create({
      model: 'sonar-small-online',
      messages: [
        {
          role: 'system',
          content: 'You are an expert market research analyst. Summarize focus group transcripts clearly and concisely, highlighting key themes and participant insights. Structure your response with clear headings and bullet points.'
        },
        {
          role: 'user',
          content: `Summarize this focus group transcript:\n\n${transcript}`
        }
      ],
      max_tokens: 500,
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
