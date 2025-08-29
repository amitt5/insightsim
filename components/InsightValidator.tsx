'use client';

import React, { useState } from 'react';
import { ValidationResult } from '@/app/types/perplexity';

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
      // Step 1: Summarize transcript
      const summaryRes = await fetch('/api/summarize-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      });
      
      if (!summaryRes.ok) {
        throw new Error('Failed to summarize transcript');
      }
      
      const summaryData = await summaryRes.json();
      setSummary(summaryData.summary);
      console.log('summary', summaryData.summary);
      // Step 2: Extract insights
      const insightsRes = await fetch('/api/extract-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      });
      
      if (!insightsRes.ok) {
        throw new Error('Failed to extract insights');
      }
      
      const insightsData = await insightsRes.json();
      setInsights(insightsData.insights);
      console.log('insights', insightsData.insights);
      // Step 3: Validate each insight
      const insightList = extractInsightLines(insightsData.insights);
      console.log('insightList', insightList);
      const insightList1 = ['**Mobile app usability is a primary driver of satisfaction and loyalty.**', '**Cashback and rewards for online shopping are highly valued, but not universally understood.**', '**Family-oriented rewards and transparency are key for certain segments.**', '**Travel perks and low international fees attract …-driven consumers, but expectations are rising.**', '**Customer service reputation influences trust and card selection.**', '**Pain points include a desire for more specialized features and clearer value communication.**', '**Behavioral patterns show digital-first, value-seeking, and lifestyle-aligned usage.**', '**Unexpected finding: App engagement directly builds brand loyalty.**'] 
      if (insightList.length === 0) {
        setValidations([]);
        return;
      }

      const validationPromises = insightList1.map(async (insight: string): Promise<ValidationResult> => {
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
          
          // Add small delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
          
          return { 
            insight, 
            validation: validationData.validation 
          };
        } catch (error) {
          console.error('Validation failed for insight:', insight, error);
          return {
            insight,
            validation: 'Failed to validate this insight'
          };
        }
      });

      const validationResults = await Promise.all(validationPromises);
      setValidations(validationResults);
      console.log('validationResults', validationResults);
    } catch (error) {
      console.error('Analysis failed:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <button 
          onClick={handleAnalyzeTranscript}
          disabled={loading || !transcript.trim()}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Analyzing with Perplexity...' : 'Analyze Transcript with Perplexity'}
        </button>
        
        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {summary && (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-3 text-gray-800">📄 Summary</h3>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans">{summary}</pre>
            </div>
          </div>
        </div>
      )}

      {insights && (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-3 text-gray-800">💡 Key Insights</h3>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans">{insights}</pre>
            </div>
          </div>
        </div>
      )}

      {validations.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4 text-gray-800">🌐 Web Validations</h3>
          <div className="space-y-6">
            {validations.map((item: ValidationResult, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                <div className="mb-4">
                  <h4 className="font-semibold text-blue-600 mb-2">Insight #{index + 1}:</h4>
                  <p className="text-gray-700 bg-blue-50 p-3 rounded italic">"{item.insight}"</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-green-600 mb-2">Web Evidence:</h4>
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-gray-800">{item.validation}</pre>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Processing with Perplexity AI...</p>
        </div>
      )}
    </div>
  );
};

export default InsightValidator;
