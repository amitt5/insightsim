// Mock analysis functions for persona generation
// These will be replaced with actual AI analysis later

export interface AnalysisResult {
  psychographics: string[];
  discussionPlatforms: string[];
  searchTerms: string[];
}

export interface SourceSelection {
  segment: string;
  redditCommunities: string[];
  appReviews: string[];
  forums: string[];
  searchQueries: string[];
}

export interface AnalysisProgress {
  step: 'analyzing_requirements' | 'source_selection' | 'generating_personas' | 'completed';
  message: string;
  data?: any;
}

// Mock function to analyze requirements
export async function analyzeRequirements(
  brief: string, 
  selectedSegments: string[]
): Promise<AnalysisResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock analysis based on segments
  const analysis: AnalysisResult = {
    psychographics: [],
    discussionPlatforms: [],
    searchTerms: []
  };

  selectedSegments.forEach(segment => {
    if (segment.toLowerCase().includes('health')) {
      analysis.psychographics.push('Health consciousness', 'Wellness prioritization');
      analysis.discussionPlatforms.push('Reddit fitness communities', 'Health apps');
      analysis.searchTerms.push('healthy meal planning', 'nutrition tracking');
    }
    
    if (segment.toLowerCase().includes('budget')) {
      analysis.psychographics.push('Budget sensitivity', 'Value consciousness');
      analysis.discussionPlatforms.push('Frugal living forums', 'Budget apps');
      analysis.searchTerms.push('cheap meal ideas', 'budget meal prep');
    }
    
    if (segment.toLowerCase().includes('busy')) {
      analysis.psychographics.push('Time scarcity', 'Convenience preference');
      analysis.discussionPlatforms.push('Productivity communities', 'Time-saving apps');
      analysis.searchTerms.push('quick meals', 'meal prep for busy people');
    }
    
    if (segment.toLowerCase().includes('sustainability')) {
      analysis.psychographics.push('Environmental values', 'Conscious consumption');
      analysis.discussionPlatforms.push('Sustainability forums', 'Eco-friendly apps');
      analysis.searchTerms.push('sustainable eating', 'eco-friendly meal kits');
    }
  });

  return analysis;
}

// Mock function to identify sources
export async function identifySources(
  brief: string,
  selectedSegments: string[],
  analysis: AnalysisResult
): Promise<SourceSelection[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const sourceSelections: SourceSelection[] = [];
  
  selectedSegments.forEach(segment => {
    const sources: SourceSelection = {
      segment,
      redditCommunities: [],
      appReviews: [],
      forums: [],
      searchQueries: []
    };

    if (segment.toLowerCase().includes('health')) {
      sources.redditCommunities.push('r/fitness', 'r/EatCheapAndHealthy', 'r/MealPrep');
      sources.appReviews.push('MyFitnessPal', 'Noom', 'Cronometer');
      sources.forums.push('Fitness forums', 'Nutrition communities');
      sources.searchQueries.push('healthy meal planning', 'meal prep recipes');
    }
    
    if (segment.toLowerCase().includes('budget')) {
      sources.redditCommunities.push('r/Frugal', 'r/EatCheapAndHealthy', 'r/Parenting');
      sources.appReviews.push('Budget meal planning apps', 'Grocery budget trackers');
      sources.forums.push('Frugal living forums', 'Parenting budget discussions');
      sources.searchQueries.push('cheap meal ideas', 'budget meal prep');
    }
    
    if (segment.toLowerCase().includes('busy')) {
      sources.redditCommunities.push('r/MealPrep', 'r/productivity', 'r/GetMotivated');
      sources.appReviews.push('Meal planning apps', 'Time-saving cooking apps');
      sources.forums.push('Productivity communities', 'Working parent forums');
      sources.searchQueries.push('quick meals', 'meal prep for busy people');
    }
    
    if (segment.toLowerCase().includes('sustainability')) {
      sources.redditCommunities.push('r/ZeroWaste', 'r/sustainability', 'r/PlantBasedDiet');
      sources.appReviews.push('Eco-friendly meal apps', 'Sustainable living apps');
      sources.forums.push('Sustainability forums', 'Environmental communities');
      sources.searchQueries.push('sustainable eating', 'eco-friendly meal kits');
    }

    sourceSelections.push(sources);
  });

  return sourceSelections;
}

// Main analysis function that orchestrates the process
export async function runPersonaAnalysis(
  brief: string,
  selectedSegments: string[],
  onProgress: (progress: AnalysisProgress) => void
): Promise<{ analysis: AnalysisResult; sources: SourceSelection[] }> {
  
  // Step 1: Analyze requirements
  onProgress({
    step: 'analyzing_requirements',
    message: 'System Analyzing Requirements...'
  });
  
  const analysis = await analyzeRequirements(brief, selectedSegments);
  
  // Step 2: Identify sources
  onProgress({
    step: 'source_selection',
    message: 'Intelligent Source Selection...'
  });
  
  const sources = await identifySources(brief, selectedSegments, analysis);
  
  return { analysis, sources };
}
