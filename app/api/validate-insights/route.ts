import { NextRequest, NextResponse } from 'next/server';
import perplexity from '@/lib/perplexity';
import { InsightValidationRequest, InsightValidationResponse, PerplexityError } from '@/types/perplexity';

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
      model: 'sonar',
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



        // {
        //     role: 'system',
        //     content: `Search specifically for Reddit discussions, Twitter posts, and forum conversations that validate or contradict the given insight. 
          
        //     Please provide DIRECT LINKS to:
        //     - Specific Reddit threads and comments (include full reddit.com URLs)
        //     - Twitter/X posts and conversations (include full twitter.com or x.com URLs)  
        //     - Forum discussions with actual URLs
        //     - Quora questions and answers with links
          
        //     Focus on finding actual social media mentions with clickable links, not just general references to social platforms.`
        //   },
        //   {
        //     role: 'user',
        //     content: `Find specific Reddit threads, Twitter posts, and social media discussions with direct links that validate this insight: "${insight}"`
        //   }

        // {
        //     role: 'system',
        //     content: 'Search for discussions on Reddit, Twitter, and forums about this topic. Describe what you find and provide evidence of these discussions existing.'
        //   },
        //   {
        //     role: 'user', 
        //     content: `Search for social media discussions about: "${insight}"`
        //   }

        // {
        //     role: 'system',
        //     content: 'Search for examples of people expressing incorrect beliefs, asking confused questions, or stating misconceptions. Look for social media posts, forum discussions, and Q&A sites where people demonstrate these misunderstandings.'
        //   },
        //   {
        //     role: 'user',
        //     content: `Find examples of people who believe that "${insight}". Look for posts, questions, and discussions where people express this belief or confusion.`
        //   }
      ],
      max_tokens: 500,
      temperature: 0.3
    });

    // Extract citations from the response
    const validationText = response.choices[0].message.content || 'No validation found';
    const citations = (response as any).citations || [];

    return NextResponse.json({ 
      validation: validationText,
      citations: citations
    });
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate insight' }, 
      { status: 500 }
    );
  }
}
