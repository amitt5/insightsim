/**
 * Client-side API helper functions for file uploads
 */

export interface UploadResponse {
  success: boolean;
  url?: string;
  path?: string;
  fileName?: string;
  error?: string;
}

/**
 * Uploads a single file to the server
 */
export async function uploadFileToServer(
  file: File,
  simulationId: string,
  bucket: string = 'simulation-media'
): Promise<UploadResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('simulationId', simulationId);
    formData.append('bucket', bucket);

    const response = await fetch('/api/storage', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Upload failed'
      };
    }

    return data;
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Uploads multiple files concurrently
 */
export async function uploadMultipleFilesToServer(
  files: File[],
  simulationId: string,
  bucket: string = 'simulation-media',
  onProgress?: (fileIndex: number, result: UploadResponse) => void
): Promise<UploadResponse[]> {
  const uploadPromises = files.map((file, index) => 
    uploadFileToServer(file, simulationId, bucket).then(result => {
      onProgress?.(index, result);
      return result;
    })
  );

  return Promise.all(uploadPromises);
}

/**
 * Uploads documents specifically for RAG
 */
export async function uploadDocumentsForRAG(
  files: File[],
  simulationId: string,
  onProgress?: (fileIndex: number, result: UploadResponse) => void
): Promise<UploadResponse[]> {
  return uploadMultipleFilesToServer(files, simulationId, 'rag-documents', onProgress);
}

/**
 * Saves document metadata to database after successful upload
 */
export async function saveDocumentMetadata(
  simulationId: string,
  documents: Array<{
    file_name: string;
    file_path: string;
    file_type: string;
    file_size: number;
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/rag/documents/${simulationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ documents }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to save document metadata'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Save document metadata error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Fetches all documents for a simulation
 */
export async function getSimulationDocuments(
  simulationId: string
): Promise<{ success: boolean; documents?: any[]; error?: string }> {
  try {
    const response = await fetch(`/api/rag/documents/${simulationId}`);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to fetch documents'
      };
    }

    return {
      success: true,
      documents: data.documents
    };
  } catch (error) {
    console.error('Get documents error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Gets a signed URL for a file
 */
export async function getSignedUrl(
  filePath: string,
  bucket: string = 'simulation-media'
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const response = await fetch(`/api/storage?path=${encodeURIComponent(filePath)}&bucket=${bucket}`);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to get signed URL'
      };
    }

    return {
      success: true,
      url: data.url
    };
  } catch (error) {
    console.error('Get signed URL error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Process documents for CAG (Context Augmented Generation)
 */
export async function processDocumentsForCAG(
  simulationId: string
): Promise<{ 
  success: boolean; 
  contextString?: string;
  warnings?: string[];
  processedCount?: number;
  totalDocuments?: number;
  contextLength?: number;
  error?: string;
}> {
  try {
    const response = await fetch(`/api/process-documents/${simulationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to process documents'
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error processing documents:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get simulation context information
 */
export async function getSimulationContext(
  simulationId: string
): Promise<{ 
  success: boolean; 
  contextString?: string;
  contextProcessedAt?: string;
  contextLength?: number;
  error?: string;
}> {
  try {
    const response = await fetch(`/api/process-documents/${simulationId}`);
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to fetch context'
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching simulation context:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Delete a simulation document
 */
export async function deleteSimulationDocument(
  simulationId: string,
  documentId: string,
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/rag/documents/${simulationId}?documentId=${encodeURIComponent(documentId)}&filePath=${encodeURIComponent(filePath)}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to delete document'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete document error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
} 