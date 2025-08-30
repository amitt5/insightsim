/**
 * Integration with Python PDF extraction service
 */

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001';

export interface PythonExtractionResult {
  success: boolean;
  text?: string;
  filename?: string;
  character_count?: number;
  error?: string;
}

/**
 * Check if Python PDF service is available
 */
export async function checkPythonServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.status === 'healthy';
    }
    
    return false;
  } catch (error) {
    console.error('Python service health check failed:', error);
    return false;
  }
}

/**
 * Extract text from PDF using Python service
 */
export async function extractTextWithPython(
  buffer: Buffer, 
  fileName: string
): Promise<PythonExtractionResult> {
  try {
    // Create form data
    const formData = new FormData();
    const blob = new Blob([buffer], { type: 'application/pdf' });
    formData.append('file', blob, fileName);
    
    const response = await fetch(`${PYTHON_SERVICE_URL}/extract-text`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(30000) // 30 second timeout for large files
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      return {
        success: true,
        text: data.text,
        filename: data.filename,
        character_count: data.character_count
      };
    } else {
      return {
        success: false,
        error: data.error || 'Unknown error from Python service'
      };
    }
    
  } catch (error) {
    console.error('Python service extraction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to communicate with Python service'
    };
  }
}
