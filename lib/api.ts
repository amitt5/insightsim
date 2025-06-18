// API utility functions for communicating with FastAPI backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface AnalysisUploadResponse {
  analysis_id: string
  status: string
  files_received: number
  metadata: any
  message: string
}

export interface AnalysisStatusResponse {
  analysis_id: string
  status: 'uploaded' | 'processing' | 'completed' | 'failed'
  progress: number
  message: string
}

export interface AnalysisResultsResponse {
  analysis_id: string
  status: string
  results: {
    individual_summaries: any[]
    combined_analysis: any
    themes: any[]
    patterns: {
      demographic_patterns: any[]
      cooccurrence_patterns: any[]
      intensity_patterns: any[]
      temporal_patterns: any[]
    }
  }
  generated_at: string
}

class AnalysisAPI {
  private baseURL: string

  constructor() {
    this.baseURL = API_BASE_URL
  }

  async uploadTranscripts(files: File[], metadata: any): Promise<AnalysisUploadResponse> {
    const formData = new FormData()
    
    // Add files to form data
    files.forEach((file) => {
      formData.append('files', file)
    })
    
    // Add metadata as JSON string
    formData.append('metadata', JSON.stringify(metadata))

    const response = await fetch(`${this.baseURL}/analysis/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    return response.json()
  }

  async processAnalysis(analysisId: string): Promise<AnalysisStatusResponse> {
    const response = await fetch(`${this.baseURL}/analysis/${analysisId}/process`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(`Processing failed: ${response.statusText}`)
    }

    return response.json()
  }

  async getAnalysisStatus(analysisId: string): Promise<AnalysisStatusResponse> {
    const response = await fetch(`${this.baseURL}/analysis/${analysisId}/status`)

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`)
    }

    return response.json()
  }

  async getAnalysisResults(analysisId: string): Promise<AnalysisResultsResponse> {
    const response = await fetch(`${this.baseURL}/analysis/${analysisId}/results`)

    if (!response.ok) {
      throw new Error(`Results retrieval failed: ${response.statusText}`)
    }

    return response.json()
  }

  async healthCheck(): Promise<{ status: string; service: string; timestamp: string }> {
    const response = await fetch(`${this.baseURL}/health`)

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`)
    }

    return response.json()
  }
}

// Export singleton instance
export const analysisAPI = new AnalysisAPI()

// Helper function to check if API is available
export async function checkAPIHealth(): Promise<boolean> {
  try {
    await analysisAPI.healthCheck()
    return true
  } catch (error) {
    console.error('API health check failed:', error)
    return false
  }
}

// Helper function for polling analysis status
export async function pollAnalysisStatus(
  analysisId: string,
  onStatusUpdate?: (status: AnalysisStatusResponse) => void,
  maxAttempts: number = 60,
  intervalMs: number = 2000
): Promise<AnalysisStatusResponse> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const status = await analysisAPI.getAnalysisStatus(analysisId)
      
      if (onStatusUpdate) {
        onStatusUpdate(status)
      }

      // If completed or failed, return the status
      if (status.status === 'completed' || status.status === 'failed') {
        return status
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, intervalMs))
    } catch (error) {
      console.error(`Status poll attempt ${attempt + 1} failed:`, error)
      
      // If this is the last attempt, throw the error
      if (attempt === maxAttempts - 1) {
        throw error
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, intervalMs))
    }
  }

  throw new Error('Analysis status polling timed out')
} 