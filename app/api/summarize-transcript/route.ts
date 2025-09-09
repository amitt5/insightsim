// app/api/summarize-transcript/route.ts
import { openai } from '@/lib/openai';  // Changed from perplexity
import { NextRequest, NextResponse } from 'next/server';

// export async function POST(req: NextRequest) {
//   try {
//     const { transcript } = await req.json();
    
//     const response = await openai.chat.completions.create({
//       model: 'gpt-3.5-turbo', // Much cheaper than GPT-4
//       messages: [
//         {
//           role: 'system',
//           content: 'You are an expert market research analyst. Summarize focus group transcripts clearly and concisely, highlighting key themes and participant insights.'
//         },
//         {
//           role: 'user',
//           content: `Summarize this focus group transcript:\n\n${transcript}`
//         }
//       ],
//       max_tokens: 800,
//       temperature: 0.3
//     });

//     return NextResponse.json({ 
//       summary: response.choices[0].message.content || 'No summary generated'
//     });
//   } catch (error) {
//     console.error('Summarization error:', error);
//     return NextResponse.json(
//       { error: 'Failed to summarize transcript' }, 
//       { status: 500 }
//     );
//   }
// }


export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Much cheaper than GPT-4
      messages: [
        {
          role: 'system',
          content: `You are an expert market research analyst. Analyze focus group transcripts and provide comprehensive insights in structured JSON format. Include both thematic summary and actionable insights.`
        },
        {
          role: 'user',
          content: `Analyze this focus group transcript and return a complete analysis in JSON format:
        
        {
          "analysis_overview": {
            "summary": "2-3 sentence high-level summary of the entire session",
            "participant_count": number,
            "session_topic": "string",
            "analysis_date": "current date"
          },
          "summary_themes": [
            {
              "theme_title": "Clear theme name",
              "theme_description": "Overall description of what participants said about this theme",
              "sentiment": "positive|negative|mixed|neutral",
              "participant_perspectives": [
                {
                  "participant": "Name",
                  "perspective": "What they specifically said or felt about this theme",
                  "emotion": "confident|frustrated|excited|concerned|etc"
                }
              ]
            }
          ],
          "key_insights": [
            {
              "insight": "Standalone actionable insight (not tied to themes above)",
              "category": "Behavioral Patterns|Pain Points|Unexpected Findings|Misconceptions|Attitudes", 
              "supporting_evidence": ["relevant quotes or observations"],
              "recommended_action": "What should be done with this insight",
              "priority": "high|medium|low"
            }
          ],
          "research_recommendations": [
            "Follow-up research suggestions",
            "Areas needing deeper investigation"
          ]
        }
        
        IMPORTANT: 
        - The "summary_themes" section should summarize WHAT participants discussed (descriptive)
        - The "key_insights" section should provide ACTIONABLE business insights (prescriptive)
        - These two sections should be completely independent
        
        Focus key_insights on:
        - Common misconceptions or beliefs
        - Behavioral patterns and motivations  
        - Attitudes and emotional responses
        - Pain points and frustrations
        - Unexpected or surprising findings
        - Clear, actionable business insights
        
        Transcript: ${transcript}`
        }
        
      ],
      max_tokens: 2000,
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

