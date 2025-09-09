'use client';

import React, { useState } from 'react';
import { ValidationResult } from '@/app/types/perplexity';
import { extractAndParseJSON } from '@/utils/helper';
import { FocusGroupAnalysis } from '@/utils/types';

interface InsightValidatorProps {
  transcript: string;
}

const InsightValidator: React.FC<InsightValidatorProps> = ({ transcript }) => {
  const [summary, setSummary] = useState<string>('');
  const [insights, setInsights] = useState<string>('');
  const [validations, setValidations] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const extractInsightLines = (insightText: string): string[] => {
    return insightText
      .split('\n')
      .filter(line => line.trim() && (line.match(/^\d+\./) || line.match(/^-/)))
      .map(line => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim())
      .filter(line => line.length > 10); // Filter out very short lines
  };

  const handleAnalyzeTranscript = async (): Promise<void> => {
    setLoading(true);
    setError('');
    console.log('transcript', transcript);
    
    try {
    //   Step 1: Summarize transcript


      const summaryRes = await fetch('/api/summarize-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      });
      
      if (!summaryRes.ok) {
        throw new Error('Failed to summarize transcript');
      }

      console.log('summaryRes', summaryRes);
      
      const summaryData = await summaryRes.json();
      // setSummary(summaryData.summary);
      console.log('summaryData', summaryData);
      const cleanSummaryData: FocusGroupAnalysis = extractAndParseJSON(summaryData.summary);
      console.log('cleanSummaryData', cleanSummaryData);
      setAnalysisData(cleanSummaryData);
      // // Step 2: Extract insights
      // const insightsRes = await fetch('/api/extract-insights', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ transcript })
      // });
      
      // if (!insightsRes.ok) {
      //   throw new Error('Failed to extract insights');
      // }
      
      // const insightsData = await insightsRes.json();
      // setInsights(insightsData.insights);
      // console.log('insights', insightsData.insights);
      // // Step 3: Validate each insight
      // const insightList = extractInsightLines(insightsData.insights);
      // console.log('insightList', insightList);
      //   if (insightList.length === 0) {
      //       setValidations([]);
      //       return;
      //   }
      const insightList1 = [
        '**Mobile app usability is a primary driver of satisfaction and loyalty.**', 
        '**Cashback and rewards for online shopping are highly valued, but not universally understood.**', 
        '**Family-oriented rewards and transparency are key for certain segments.**', 
        '**Travel perks and low international fees attract …-driven consumers, but expectations are rising.**', 
        '**Customer service reputation influences trust and card selection.**', 
        '**Pain points include a desire for more specialized features and clearer value communication.**', 
        '**Behavioral patterns show digital-first, value-seeking, and lifestyle-aligned usage.**', '**Unexpected finding: App engagement directly builds brand loyalty.**'
    ] 
    // const insightList2 = [
    //     insightList[0]
    //     // 'multiple credit cards automatically harm credit scores'
    //     // 'common misconceptions about multiple credit cards is that multiple credit cards automatically harm credit scores'
    // ]

      // const validationPromises = insightList2.map(async (insight: string): Promise<ValidationResult> => {
      //   try {
      //     const validationRes = await fetch('/api/validate-insights', {
      //       method: 'POST',
      //       headers: { 'Content-Type': 'application/json' },
      //       body: JSON.stringify({ insight })
      //     });
          
      //     if (!validationRes.ok) {
      //       throw new Error(`Failed to validate insight: ${insight.substring(0, 50)}...`);
      //     }
          
      //     const validationData = await validationRes.json();
          
      //     await new Promise(resolve => setTimeout(resolve, 500));
          
      //     return { 
      //       insight, 
      //       validation: validationData.validation,
      //       citations: validationData.citations || []
      //     };
      //   } catch (error) {
      //     console.error('Validation failed for insight:', insight, error);
      //     return {
      //       insight,
      //       validation: 'Failed to validate this insight',
      //       citations: []
      //     };
      //   }
      // });
      

      // const validationResults = await Promise.all(validationPromises);
      // setValidations(validationResults);
      // console.log('validationResults', validationResults);
    } catch (error) {
      console.error('Analysis failed:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const [analysisData, setAnalysisData] = useState<FocusGroupAnalysis | null>(null);
  const [validatingInsights, setValidatingInsights] = useState<Record<number, boolean>>({});
  const [validationResults, setValidationResults] = useState<Record<number, ValidationResult>>({});

  const handleValidateInsight = async (insight: string, index: number) => {
    setValidatingInsights(prev => ({ ...prev, [index]: true }));
    try {
      const validationRes = await fetch('/api/validate-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insight })
      });
      
      if (!validationRes.ok) {
        throw new Error(`Failed to validate insight: ${insight.substring(0, 50)}...`);
      }
      
      const validationData = await validationRes.json();
      setValidationResults(prev => ({
        ...prev,
        [index]: {
          insight,
          validation: validationData.validation,
          citations: validationData.citations || []
        }
      }));
    } catch (error) {
      console.error('Validation failed for insight:', insight, error);
      setValidationResults(prev => ({
        ...prev,
        [index]: {
          insight,
          validation: 'Failed to validate this insight',
          citations: []
        }
      }));
    } finally {
      setValidatingInsights(prev => ({ ...prev, [index]: false }));
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      case 'mixed': return 'text-yellow-600';
      case 'neutral': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <button 
          onClick={handleAnalyzeTranscript}
          disabled={loading || !transcript.trim()}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Analyzing...' : 'Analyze Transcript'}
        </button>
        
        {error && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {analysisData && (
        <div className="space-y-8">
          {/* Analysis Overview */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-2xl font-bold mb-4">Analysis Overview</h2>
            <div className="space-y-4">
              <p className="text-gray-700">{analysisData.analysis_overview.summary}</p>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Participants</p>
                  <p className="text-xl font-semibold">{analysisData.analysis_overview.participant_count}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Topic</p>
                  <p className="text-xl font-semibold">{analysisData.analysis_overview.session_topic}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="text-xl font-semibold">{analysisData.analysis_overview.analysis_date}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Themes */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-2xl font-bold mb-4">Summary Themes</h2>
            <div className="space-y-6">
              {analysisData.summary_themes.map((theme, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold">{theme.theme_title}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm ${getSentimentColor(theme.sentiment)}`}>
                      {theme.sentiment}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-4">{theme.theme_description}</p>
                  <div className="space-y-3">
                    {theme.participant_perspectives.map((perspective, pIndex) => (
                      <div key={pIndex} className="bg-gray-50 p-3 rounded">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{perspective.participant}</span>
                          <span className="text-sm text-gray-500">{perspective.emotion}</span>
                        </div>
                        <p className="text-gray-600">{perspective.perspective}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Insights */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-2xl font-bold mb-4">Key Insights</h2>
            <div className="space-y-6">
              {analysisData.key_insights.map((insight, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${getPriorityBadge(insight.priority)}`}>
                      {insight.priority} priority
                    </span>
                    <span className="text-sm text-gray-500">{insight.category}</span>
                  </div>
                  <p className="text-lg font-medium mb-3">{insight.insight}</p>
                  <div className="bg-gray-50 p-3 rounded mb-3">
                    <h4 className="font-medium mb-2">Supporting Evidence:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {insight.supporting_evidence.map((evidence, eIndex) => (
                        <li key={eIndex} className="text-gray-600">{evidence}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-blue-50 p-3 rounded mb-3">
                    <h4 className="font-medium mb-1">Recommended Action:</h4>
                    <p className="text-gray-700">{insight.recommended_action}</p>
                  </div>

                  <div className="mt-4 border-t pt-4">
                    <button
                      onClick={() => handleValidateInsight(insight.insight, index)}
                      disabled={validatingInsights[index]}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {validatingInsights[index] ? (
                        <>
                          <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                          Validating...
                        </>
                      ) : (
                        'Validate from Web'
                      )}
                    </button>

                    {validationResults[index] && (
                      <div className="mt-4 space-y-4">
                        <div className="bg-secondary border border-border p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Web Evidence:</h4>
                          <div className="prose prose-sm max-w-none">
                            <pre className="whitespace-pre-wrap font-sans text-foreground">
                              {validationResults[index].validation}
                            </pre>
                          </div>
                        </div>

                        {validationResults[index].citations && validationResults[index].citations.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Sources & Citations:</h4>
                            <div className="bg-muted border border-border p-4 rounded-lg">
                              <ul className="space-y-2">
                                {validationResults[index].citations.map((citationUrl: string, citIndex: number) => (
                                  <li key={citIndex} className="text-sm">
                                    <a
                                      href={citationUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:text-primary/80 underline break-all"
                                    >
                                      [{citIndex + 1}] {citationUrl}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Research Recommendations */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-2xl font-bold mb-4">Research Recommendations</h2>
            <ul className="list-disc list-inside space-y-2">
              {analysisData.research_recommendations.map((recommendation, index) => (
                <li key={index} className="text-gray-700">{recommendation}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Processing...</p>
        </div>
      )}
    </div>
  );
};

export default InsightValidator;
