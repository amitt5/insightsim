// AI-powered analysis functions for persona generation

import { runSimulationAPI } from "@/utils/api";
import { createRequirementsAnalysisPrompt, createSourceIdentificationPrompt } from "@/utils/buildMessagesForOpenAI";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

export interface AnalysisResult {
  psychographics: string[];
  discussionPlatforms: string[];
  searchTerms: string[];
}

export interface SourceSelection {
  segment: string;
  redditCommunities: Array<{
    name: string;
    relevance: string;
    discussionTypes: string;
  }>;
  appReviews: Array<{
    appName: string;
    platform: string;
    relevance: string;
  }>;
  forums: Array<{
    name: string;
    relevance: string;
    contentTypes: string;
  }>;
  searchQueries: Array<{
    query: string;
    platform: string;
    context: string;
  }>;
}

export interface AnalysisProgress {
  step: 'analyzing_requirements' | 'source_selection' | 'generating_personas' | 'completed';
  message: string;
  data?: any;
  analysisResult?: AnalysisResult;
  sourceResults?: SourceSelection[];
}

// AI-powered function to analyze requirements
export async function analyzeRequirements(
  brief: string, 
  selectedSegments: string[]
): Promise<AnalysisResult> {
  try {
    const prompt = createRequirementsAnalysisPrompt(brief, selectedSegments);
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: prompt }
    ];
    
    const result = await runSimulationAPI(messages, 'gpt-4o-mini', 'requirements-analysis');
    
    let responseText = result.reply || "";
    responseText = responseText
      .replace(/^```[\s\S]*?\n/, '')
      .replace(/```$/, '')
      .trim();

    const parsedResponse = JSON.parse(responseText);
    
    return {
      psychographics: parsedResponse.psychographics || [],
      discussionPlatforms: parsedResponse.discussionPlatforms || [],
      searchTerms: parsedResponse.searchTerms || []
    };
  } catch (error) {
    console.error('Error in requirements analysis:', error);
    // Fallback to basic analysis if AI fails
    return {
      psychographics: ['General consumer behavior patterns', 'Category-specific motivations'],
      discussionPlatforms: ['Online communities', 'Social media platforms'],
      searchTerms: ['Category-related searches', 'Product comparison queries']
    };
  }
}

// AI-powered function to identify sources
export async function identifySources(
  brief: string,
  selectedSegments: string[],
  analysis: AnalysisResult
): Promise<SourceSelection[]> {
  try {
    const prompt = createSourceIdentificationPrompt(brief, selectedSegments, analysis);
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: prompt }
    ];
    
    const result = await runSimulationAPI(messages, 'gpt-4o-mini', 'source-identification');
    
    let responseText = result.reply || "";
    responseText = responseText
      .replace(/^```[\s\S]*?\n/, '')
      .replace(/```$/, '')
      .trim();

    const parsedResponse = JSON.parse(responseText);
    
    // Ensure the response is an array and has the correct structure
    if (Array.isArray(parsedResponse)) {
      return parsedResponse.map((item: any) => ({
        segment: item.segment || 'Unknown Segment',
        redditCommunities: item.redditCommunities || [],
        appReviews: item.appReviews || [],
        forums: item.forums || [],
        searchQueries: item.searchQueries || []
      }));
    }
    
    // If response is not an array, create a single entry
    return [{
      segment: selectedSegments[0] || 'Target Segment',
      redditCommunities: parsedResponse.redditCommunities || [],
      appReviews: parsedResponse.appReviews || [],
      forums: parsedResponse.forums || [],
      searchQueries: parsedResponse.searchQueries || []
    }];
  } catch (error) {
    console.error('Error in source identification:', error);
    // Fallback to basic sources if AI fails
    return selectedSegments.map(segment => ({
      segment,
      redditCommunities: [
        { name: 'r/general', relevance: 'General discussions', discussionTypes: 'Category-related topics' }
      ],
      appReviews: [
        { appName: 'Category Apps', platform: 'App Store', relevance: 'User experiences' }
      ],
      forums: [
        { name: 'General Forums', relevance: 'Community discussions', contentTypes: 'User opinions' }
      ],
      searchQueries: [
        { query: 'category search', platform: 'Google', context: 'General research' }
      ]
    }));
  }
}

// Main analysis function that orchestrates the process
export async function runPersonaAnalysis(
  brief: string,
  selectedSegments: string[],
  onProgress: (progress: AnalysisProgress) => void
): Promise<{ analysis: AnalysisResult; sources: SourceSelection[] }> {
  
  try {
    // Step 1: Analyze requirements
    onProgress({
      step: 'analyzing_requirements',
      message: 'System Analyzing Requirements...'
    });
    
    const analysis = await analyzeRequirements(brief, selectedSegments);
    
    // Send analysis results to UI
    onProgress({
      step: 'analyzing_requirements',
      message: 'System Analyzing Requirements...',
      analysisResult: analysis
    });
    
    // Step 2: Identify sources
    onProgress({
      step: 'source_selection',
      message: 'Intelligent Source Selection...'
    });
    
    const sources = await identifySources(brief, selectedSegments, analysis);
    
    // Send source results to UI
    onProgress({
      step: 'source_selection',
      message: 'Intelligent Source Selection...',
      sourceResults: sources
    });
    
    return { analysis, sources };
  } catch (error) {
    console.error('Error in runPersonaAnalysis:', error);
    // Return fallback data if the entire process fails
    return {
      analysis: {
        psychographics: ['General consumer insights'],
        discussionPlatforms: ['Online communities'],
        searchTerms: ['Category-related searches']
      },
      sources: selectedSegments.map(segment => ({
        segment,
        redditCommunities: [{ name: 'r/general', relevance: 'General discussions', discussionTypes: 'Category topics' }],
        appReviews: [{ appName: 'Category Apps', platform: 'App Store', relevance: 'User experiences' }],
        forums: [{ name: 'General Forums', relevance: 'Community discussions', contentTypes: 'User opinions' }],
        searchQueries: [{ query: 'category search', platform: 'Google', context: 'General research' }]
      }))
    };
  }
}
