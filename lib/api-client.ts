// lib/api-client.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

class ApiClient {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      timeout: 300000, // 5 minutes for long-running analysis
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    this.setupInterceptors();
  }
  
  private setupInterceptors() {
    // Request interceptor for auth tokens
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    
    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle auth errors
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }
  
  // File upload with progress tracking
  async uploadTranscript(file: File, metadata: any, onProgress?: (progress: number) => void) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));
    
    return this.client.post('/api/transcripts/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  }
  
  // Analysis endpoints
  async startAnalysis(transcriptId: string, analysisType: string) {
    return this.client.post(`/api/analysis/start`, {
      transcript_id: transcriptId,
      analysis_type: analysisType,
    });
  }
  
  async getAnalysisStatus(taskId: string) {
    return this.client.get(`/api/analysis/status/${taskId}`);
  }
  
  // Semantic search
  async searchInsights(query: string, filters?: any) {
    return this.client.post('/api/search/insights', {
      query,
      filters,
    });
  }

  // Add this method
  async getTranscripts() {
    return this.client.get('/api/transcripts');
  }


  // Optional: Get single transcript
  async getTranscript(id: string) {
    return this.client.get(`/api/transcripts/${id}`);
  }
  
  // Optional: Delete transcript
  async deleteTranscript(id: string) {
    return this.client.delete(`/api/transcripts/${id}`);
  }
}

export const apiClient = new ApiClient();
