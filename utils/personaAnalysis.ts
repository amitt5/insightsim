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
  step: 'analyzing_requirements' | 'source_selection' | 'scraping_web' | 'generating_personas' | 'completed';
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

// Main analysis function that orchestrates the process with fixed timing for demo
export async function runPersonaAnalysis(
  brief: string,
  selectedSegments: string[],
  onProgress: (progress: AnalysisProgress) => void
): Promise<{ analysis: AnalysisResult; sources: SourceSelection[] }> {
  
  try {
    // Start AI calls in parallel for efficiency
    const analysisPromise = analyzeRequirements(brief, selectedSegments);
    const sourcePromise = analyzeRequirements(brief, selectedSegments).then(analysis => 
      identifySources(brief, selectedSegments, analysis)
    );
    
    // Step 1: Analysis (exactly 2 seconds)
    onProgress({
      step: 'analyzing_requirements',
      message: 'System Analyzing Requirements...'
    });
    
    // Wait for analysis to complete, but ensure we show this step for at least 2 seconds
    const analysisStartTime = Date.now();
    const analysis = await analysisPromise;
    const analysisElapsed = Date.now() - analysisStartTime;
    const analysisRemainingTime = Math.max(0, 2000 - analysisElapsed);
    
    // Send analysis results to UI
    onProgress({
      step: 'analyzing_requirements',
      message: 'System Analyzing Requirements...',
      analysisResult: analysis
    });
    
    // Wait for remaining time if needed
    if (analysisRemainingTime > 0) {
      await new Promise(resolve => setTimeout(resolve, analysisRemainingTime));
    }
    
    // Step 2: Source Selection (exactly 2 seconds)
    onProgress({
      step: 'source_selection',
      message: 'Intelligent Source Selection...'
    });
    
    // Wait for sources to complete, but ensure we show this step for at least 2 seconds
    const sourceStartTime = Date.now();
    const sources = await sourcePromise;
    const sourceElapsed = Date.now() - sourceStartTime;
    const sourceRemainingTime = Math.max(0, 2000 - sourceElapsed);
    
    // Send source results to UI
    onProgress({
      step: 'source_selection',
      message: 'Intelligent Source Selection...',
      sourceResults: sources
    });
    
    // Wait for remaining time if needed
    if (sourceRemainingTime > 0) {
      await new Promise(resolve => setTimeout(resolve, sourceRemainingTime));
    }
    
    // Step 3: Scraping the Web (exactly 4 seconds)
    onProgress({
      step: 'scraping_web',
      message: 'Scraping the Web...'
    });
    
    // Simulate web scraping for exactly 4 seconds
    await new Promise(resolve => setTimeout(resolve, 4000));
    
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
