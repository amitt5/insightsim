// components/Dashboard.tsx
import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useApiError } from '@/hooks/useApiError';
import { AnalysisProgress } from './AnalysisProgress';

export const Dashboard: React.FC = () => {
  const [activeAnalysis, setActiveAnalysis] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const { handleApiCall, isLoading, error } = useApiError();

  // ADD THIS: Load transcripts function
  const loadTranscripts = useCallback(async () => {
    const result = await handleApiCall(
      () => apiClient.getTranscripts(), // You'll need this endpoint
      { customErrorMessage: 'Failed to load transcripts' }
    );
    
    if (result) {
      setTranscripts(result.data.transcripts || []);
    }
  }, [handleApiCall]);
  
  // Load transcripts on component mount
  useEffect(() => {
    loadTranscripts();
  }, [loadTranscripts]);
  
  const handleFileUpload = useCallback(async (file: File, metadata: any) => {
    const result = await handleApiCall(
      () => apiClient.uploadTranscript(file, metadata, (progress) => {
        console.log(`Upload progress: ${progress}%`);
      }),
      { customErrorMessage: 'Failed to upload transcript' }
    );
    
    if (result) {
      // Refresh transcripts list
      loadTranscripts();
    }
  }, [handleApiCall]);
  
  const startAnalysis = useCallback(async (transcriptId: string) => {
    const result = await handleApiCall(
      () => apiClient.startAnalysis(transcriptId, 'comprehensive'),
      { customErrorMessage: 'Failed to start analysis' }
    );
    
    if (result) {
      setActiveAnalysis(result.data.task_id);
    }
  }, [handleApiCall]);
  
  const handleAnalysisComplete = useCallback((result: any) => {
    setActiveAnalysis(null);
    // Update UI with analysis results
    console.log('Analysis complete:', result);
  }, []);
  
  const handleSearchInsights = useCallback(async (query: string) => {
    const result = await handleApiCall(
      () => apiClient.searchInsights(query),
      { customErrorMessage: 'Search failed' }
    );
    
    if (result) {
      setSearchResults(result.data.insights);
    }
  }, [handleApiCall]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Your existing UI components */}
      
      {activeAnalysis && (
        <AnalysisProgress
          taskId={activeAnalysis}
          onComplete={handleAnalysisComplete}
          onError={(error) => console.error('Analysis error:', error)}
        />
      )}
      
      <div className="p-6">
  <h2 className="text-2xl font-bold mb-4">Transcripts ({transcripts.length})</h2>
  
  {transcripts.length === 0 ? (
    <p>Loading transcripts...</p>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {transcripts.map((transcript: any) => (
        <div key={transcript.id} className="bg-white p-4 rounded-lg shadow border">
          <h3 className="font-semibold text-lg">{transcript.name}</h3>
          <p className="text-sm text-gray-600 mb-2">Status: {transcript.status}</p>
          <p className="text-xs text-gray-500 mb-3">{transcript.created_at}</p>
          <button 
            onClick={() => startAnalysis(transcript.id)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Start Analysis
          </button>
        </div>
      ))}
    </div>
  )}
</div>
      {/* Rest of your dashboard */}
    </div>
  );
};
