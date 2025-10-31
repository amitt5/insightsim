// AI-powered analysis functions for persona generation

import { runSimulationAPI } from "@/utils/api";
import { createRequirementsAnalysisPrompt, createSourceIdentificationPrompt, createPersonaFromThreeFieldsPrompt } from "@/utils/buildMessagesForOpenAI";
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

export interface GeneratedPersonaInput {
  basicDemographics: string;
  behaviorsAttitudes: string;
  researchContext: string;
}

export async function generatePersonaFromThreeFields(inputs: GeneratedPersonaInput) {
  const prompt = createPersonaFromThreeFieldsPrompt(inputs);
  const messages: ChatCompletionMessageParam[] = [{ role: "system", content: prompt }];

  const result = await runSimulationAPI(messages, 'gpt-4o-mini', 'enhanced-persona-from-text');
  let reply = result.reply || '';
  reply = reply.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();

  let parsed: any;
  try {
    parsed = JSON.parse(reply);
  } catch {
    // Attempt minimal cleanup
    const cleaned = reply.replace(/^\uFEFF/, '').trim();
    parsed = JSON.parse(cleaned);
  }

  // Coerce fields to expected shapes
  const coerceArray = (v: any) => Array.isArray(v) ? v.filter((x) => typeof x === 'string') : (typeof v === 'string' && v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);
  const coerceNumber = (v: any) => typeof v === 'number' ? v : (typeof v === 'string' && v.trim() ? Number(v) : undefined);

  const persona = {
    name: typeof parsed?.name === 'string' ? parsed.name : 'Generated Persona',
    age: coerceNumber(parsed?.age),
    gender: typeof parsed?.gender === 'string' ? parsed.gender : undefined,
    occupation: typeof parsed?.occupation === 'string' ? parsed.occupation : undefined,
    location: typeof parsed?.location === 'string' ? parsed.location : undefined,
    archetype: typeof parsed?.archetype === 'string' ? parsed.archetype : undefined,
    bio: typeof parsed?.bio === 'string' ? parsed.bio : undefined,
    traits: coerceArray(parsed?.traits),
    goal: typeof parsed?.goal === 'string' ? parsed.goal : undefined,
    attitude: typeof parsed?.attitude === 'string' ? parsed.attitude : undefined,
    family_status: typeof parsed?.family_status === 'string' ? parsed.family_status : undefined,
    education_level: typeof parsed?.education_level === 'string' ? parsed.education_level : undefined,
    income_level: typeof parsed?.income_level === 'string' ? parsed.income_level : undefined,
    lifestyle: typeof parsed?.lifestyle === 'string' ? parsed.lifestyle : undefined,
    category_products: coerceArray(parsed?.category_products),
    product_relationship: typeof parsed?.product_relationship === 'string' ? parsed.product_relationship : undefined,
    category_habits: typeof parsed?.category_habits === 'string' ? parsed.category_habits : undefined,
  };

  return persona;
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
