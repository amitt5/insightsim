export interface TranscriptSummaryRequest {
    transcript: string;
  }
  
  export interface TranscriptSummaryResponse {
    summary: string;
  }
  
  export interface InsightExtractionRequest {
    transcript: string;
  }
  
  export interface InsightExtractionResponse {
    insights: string;
  }
  
  export interface InsightValidationRequest {
    insight: string;
  }
  
  export interface InsightValidationResponse {
    validation: string;
    citations?: string[];
  }
  
  export interface ValidationResult {
    insight: string;
    validation: string;
    citations?: string[];
  }
  
  export interface PerplexityError {
    error: string;
  }
  