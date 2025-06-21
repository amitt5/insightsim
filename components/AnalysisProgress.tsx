// components/AnalysisProgress.tsx
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useWebSocket } from '@/hooks/useWebSocket';

interface AnalysisProgressProps {
  taskId: string;
  onComplete: (result: any) => void;
  onError: (error: string) => void;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  taskId,
  onComplete,
  onError,
}) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Starting...');
  const [currentStep, setCurrentStep] = useState('');
  
  const { messages } = useWebSocket(`ws://localhost:8000/ws/analysis/${taskId}`);
  
  useEffect(() => {
    // Handle WebSocket messages
    const latestMessage = messages[messages.length - 1];
    if (latestMessage) {
      switch (latestMessage.type) {
        case 'progress':
          setProgress(latestMessage.data.progress);
          setCurrentStep(latestMessage.data.step);
          break;
        case 'status':
          setStatus(latestMessage.data.status);
          break;
        case 'complete':
          onComplete(latestMessage.data.result);
          break;
        case 'error':
          onError(latestMessage.data.error);
          break;
      }
    }
  }, [messages, onComplete, onError]);
  
  // Fallback polling if WebSocket fails
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const response = await apiClient.getAnalysisStatus(taskId);
        const { status: taskStatus, progress: taskProgress } = response.data;
        
        setStatus(taskStatus);
        if (taskProgress !== undefined) {
          setProgress(taskProgress);
        }
        
        if (taskStatus === 'completed') {
          onComplete(response.data.result);
        } else if (taskStatus === 'failed') {
          onError(response.data.error || 'Analysis failed');
        }
      } catch (error) {
        console.error('Failed to poll status:', error);
      }
    };
    
    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [taskId, onComplete, onError]);
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Analysis in Progress</h3>
        <p className="text-sm text-gray-600">{status}</p>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      {currentStep && (
        <div className="text-sm text-gray-600">
          <strong>Current step:</strong> {currentStep}
        </div>
      )}
    </div>
  );
};
