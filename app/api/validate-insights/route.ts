import { NextRequest, NextResponse } from 'next/server';
import perplexity from '@/lib/perplexity';
import { InsightValidationRequest, InsightValidationResponse, PerplexityError } from '@/app/types/perplexity';

export async function POST(req: NextRequest): Promise<NextResponse<InsightValidationResponse | PerplexityError>> {
  try {
    const { insight }: InsightValidationRequest = await req.json();
    
    if (!insight) {
      return NextResponse.json(
        { error: 'Insight is required' }, 
        { status: 400 }
      );
    }
    
    const response = await perplexity.chat.completions.create({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: `Search social media, forums, and discussion boards to find real examples that validate or contradict the given insight. 

          Focus on finding:
          - Reddit discussions and comments
          - Twitter/X posts and replies  
          - Forum threads and posts
          - Blog comments and discussions
          - Q&A platforms like Quora

          Provide specific examples with context and explain how they relate to the insight. Include direct quotes when possible and mention the platform/source.`
        },
        {
          role: 'user',
          content: `Find web evidence and social media mentions that validate this insight: "${insight}"`
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
      return_related_questions: true
    });

    return NextResponse.json({ 
      validation: response.choices[0].message.content || 'No validation found',
      citations: [] // Perplexity automatically includes citations in the response text
    });
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate insight' }, 
      { status: 500 }
    );
  }
}
