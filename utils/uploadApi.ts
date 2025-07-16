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