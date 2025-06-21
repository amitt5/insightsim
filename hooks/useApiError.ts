// hooks/useApiError.ts
import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast"; // Shadcn hook

interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export const useApiError = () => {
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast(); // Use Shadcn toast hook
  
  const handleApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    options?: {
      showToast?: boolean;
      customErrorMessage?: string;
    }
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      return result;
    } catch (err: any) {
      const apiError: ApiError = {
        message: err.response?.data?.detail || err.message || 'An unexpected error occurred',
        code: err.response?.data?.error_code,
        details: err.response?.data,
      };
      
      setError(apiError);
      
      if (options?.showToast !== false) {
        toast({
          variant: "destructive",
          title: "Error",
          description: options?.customErrorMessage || apiError.message,
        });
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  const clearError = useCallback(() => setError(null), []);
  
  return { error, isLoading, handleApiCall, clearError };
};
