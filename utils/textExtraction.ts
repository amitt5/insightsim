import { extractTextWithPython, checkPythonServiceHealth } from './pythonService';

export interface ExtractionResult {
  success: boolean;
  text?: string;
  error?: string;
  fileName: string;
}

/**
 * Extract text from PDF buffer using Python service with fallback
 */
export async function extractTextFromPDF(buffer: Buffer, fileName: string): Promise<ExtractionResult> {
  // Try Python service first (PyMuPDF4LLM)
  try {
    const isServiceAvailable = await checkPythonServiceHealth();
    
    if (isServiceAvailable) {
      console.log(`Using Python service for ${fileName}`);
      const result = await extractTextWithPython(buffer, fileName);
      
      if (result.success && result.text) {
        return {
          success: true,
          text: result.text, // PyMuPDF4LLM already provides clean text
          fileName
        };
      } else {
        console.warn(`Python service failed for ${fileName}, falling back to pdf-parse:`, result.error);
      }
    } else {
      console.warn(`Python service unavailable for ${fileName}, using fallback`);
    }
  } catch (error) {
    console.warn(`Python service error for ${fileName}, falling back:`, error);
  }
  
  // Fallback to pdf-parse
  try {
    console.log(`Using pdf-parse fallback for ${fileName}`);
    // Use eval to prevent webpack from bundling test files
    const pdfParse = eval('require')('pdf-parse');
    
    const data = await pdfParse(buffer);
    return {
      success: true,
      text: data.text,
      fileName
    };
  } catch (error) {
    console.error(`PDF extraction error for ${fileName}:`, error);
    return {
      success: false,
      error: `Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
      fileName
    };
  }
}

/**
 * Extract text from plain text file buffer
 */
export async function extractTextFromPlainText(buffer: Buffer, fileName: string): Promise<ExtractionResult> {
  try {
    const text = buffer.toString('utf-8');
    return {
      success: true,
      text,
      fileName
    };
  } catch (error) {
    console.error(`Text extraction error for ${fileName}:`, error);
    return {
      success: false,
      error: `Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`,
      fileName
    };
  }
}

/**
 * Clean and format extracted text
 */
export function cleanText(text: string): string {
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove page numbers (common patterns)
    .replace(/^\s*\d+\s*$/gm, '')
    // Remove common header/footer patterns
    .replace(/^[-=]{3,}.*$/gm, '')
    // Clean up line breaks
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    // Trim whitespace
    .trim();
}

/**
 * Generate context string from multiple documents
 */
export function generateContextString(extractions: ExtractionResult[]): {
  contextString: string;
  warnings: string[];
} {
  const warnings: string[] = [];
  const contextParts: string[] = [];
  
  extractions.forEach((extraction, index) => {
    if (extraction.success && extraction.text) {
      const cleanedText = cleanText(extraction.text);
      
      // Add document header
      const documentHeader = `\n=== Document ${index + 1}: ${extraction.fileName} ===\n`;
      contextParts.push(documentHeader + cleanedText);
    } else {
      warnings.push(`Failed to process "${extraction.fileName}": ${extraction.error}`);
    }
  });
  
  const contextString = contextParts.join('\n\n');
  
  // Check context size (150,000 character limit)
  const maxContextLength = 150000;
  if (contextString.length > maxContextLength) {
    warnings.push(`Context is too large (${contextString.length} characters). Consider removing some documents or using shorter documents.`);
    // Truncate context but keep document headers intact
    const truncatedContext = contextString.substring(0, maxContextLength);
    return {
      contextString: truncatedContext + '\n\n[CONTEXT TRUNCATED DUE TO SIZE LIMIT]',
      warnings
    };
  }
  
  return {
    contextString,
    warnings
  };
}

/**
 * Extract text from file buffer based on file type
 */
export async function extractTextFromFile(
  buffer: Buffer, 
  fileName: string, 
  fileType: string
): Promise<ExtractionResult> {
  
  if (fileType === 'application/pdf') {
    return extractTextFromPDF(buffer, fileName);
  }
  
  if (fileType === 'text/plain' || fileType === 'text/markdown') {
    return extractTextFromPlainText(buffer, fileName);
  }
  
  return {
    success: false,
    error: `Unsupported file type: ${fileType}`,
    fileName
  };
}
