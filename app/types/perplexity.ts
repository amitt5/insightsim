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
    citations?: Citation[];
  }
  
  export interface Citation {
    url: string;
    title: string;
    snippet: string;
  }
  
  export interface ValidationResult {
    insight: string;
    validation: string;
  }
  
  export interface PerplexityError {
    error: string;
  }
  