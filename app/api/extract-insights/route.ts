import { NextRequest, NextResponse } from 'next/server';
import perplexity from '@/lib/perplexity';
import { InsightExtractionRequest, InsightExtractionResponse, PerplexityError } from '@/app/types/perplexity';

export async function POST(req: NextRequest): Promise<NextResponse<InsightExtractionResponse | PerplexityError>> {
  try {
    const { transcript }: InsightExtractionRequest = await req.json();
    
    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' }, 
        { status: 400 }
      );
    }
    
    const response = await perplexity.chat.completions.create({
      model: 'sonar-pro',
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
      max_tokens: 800,
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
