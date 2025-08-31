/**
 * Integration with Python chunking service
 */

const CHUNKING_SERVICE_URL = process.env.CHUNKING_SERVICE_URL || 'http://localhost:8002';

export interface ChunkMetadata {
  chunk_index: number;
  document_id: string;
  file_name: string;
  file_type: string;
  start_token: number;
  end_token: number;
  total_chunks: number;
}

export interface Chunk {
  text: string;
  metadata: ChunkMetadata;
}

export interface ChunkingResult {
  success: boolean;
  chunks?: Chunk[];
  error?: string;
}

/**
 * Check if chunking service is available
 */
export async function checkChunkingServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${CHUNKING_SERVICE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.status === 'healthy';
    }
    
    return false;
  } catch (error) {
    console.error('Chunking service health check failed:', error);
    return false;
  }
}

/**
 * Split text into chunks using the chunking service
 */
export async function chunkText(
  text: string,
  metadata: {
    document_id: string;
    file_name: string;
    file_type: string;
  }
): Promise<ChunkingResult> {
  try {
    const response = await fetch(`${CHUNKING_SERVICE_URL}/chunk-document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        document_id: metadata.document_id,
        text,
        metadata
      }),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });
    
    const data = await response.json();
    
    if (response.ok && !data.error) {
      return {
        success: true,
        chunks: data.chunks
      };
    } else {
      return {
        success: false,
        error: data.error || 'Unknown error from chunking service'
      };
    }
    
  } catch (error) {
    console.error('Chunking service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to communicate with chunking service'
    };
  }
}
