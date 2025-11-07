/**
 * Needle API Client Library
 * 
 * This library provides functions to interact with the Needle API for RAG document processing.
 * Documentation: https://docs.needle.app/docs/api-reference/needle-api/
 */

const NEEDLE_API_BASE = 'https://needle.app/api/v1';
const NEEDLE_SEARCH_API_BASE = 'https://search.needle.app/api/v1';

/**
 * Get the Needle API key from environment variables
 */
function getApiKey(): string {
  const apiKey = process.env.NEEDLE_API_KEY;
  if (!apiKey) {
    throw new Error('NEEDLE_API_KEY environment variable is not set');
  }
  return apiKey;
}

/**
 * Make a request to the Needle API
 */
async function needleRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  useSearchApi = false
): Promise<T> {
  const baseUrl = useSearchApi ? NEEDLE_SEARCH_API_BASE : NEEDLE_API_BASE;
  const url = `${baseUrl}${endpoint}`;
  const apiKey = getApiKey();

  const response = await fetch(url, {
    ...options,
    headers: {
      'x-api-key': apiKey,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `Needle API error: ${response.status} ${response.statusText}`;
    let errorData: any = null;
    
    try {
      // Try to get response as text first to see what we're dealing with
      const responseText = await response.text();
      console.log(`[Needle] Error response text:`, responseText);
      
      try {
        errorData = JSON.parse(responseText);
      } catch {
        // If not JSON, use the text directly
        errorMessage = responseText || errorMessage;
      }
      
      // Handle different error response formats
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.error) {
          // Handle nested error object with message
          if (errorData.error.message) {
            errorMessage = errorData.error.message;
          } else if (typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          } else {
            errorMessage = JSON.stringify(errorData.error);
          }
        } else if (errorData.message) {
          errorMessage = typeof errorData.message === 'string'
            ? errorData.message
            : JSON.stringify(errorData.message);
        } else if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail);
        } else {
          // If it's an object, stringify it for better debugging
          errorMessage = JSON.stringify(errorData, null, 2);
        }
      }
    } catch (parseError) {
      console.error(`[Needle] Error parsing error response:`, parseError);
      // Keep the default error message
    }
    
    console.error(`[Needle] Final error message:`, errorMessage);
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    (error as any).statusText = response.statusText;
    (error as any).errorData = errorData;
    throw error;
  }

  return response.json();
}

/**
 * Create a new collection in Needle
 * @param collectionName - Name of the collection (e.g., "Project-{projectId}")
 * @param model - Optional indexing model (default: "basilikum-minima")
 * @returns Collection object with ID
 */
export async function createCollection(
  collectionName: string,
  model: string = 'basilikum-minima'
): Promise<{ result: { id: string; name: string; [key: string]: any } }> {
  return needleRequest('/collections', {
    method: 'POST',
    body: JSON.stringify({
      name: collectionName,
      model: model,
    }),
  });
}

/**
 * Get collection details by ID
 * @param collectionId - Needle collection ID
 * @returns Collection details
 */
export async function getCollection(
  collectionId: string
): Promise<{ result: { id: string; name: string; [key: string]: any } }> {
  return needleRequest(`/collections/${collectionId}`);
}

/**
 * List all collections (to check if a collection exists)
 * @returns Array of collections
 */
export async function listCollections(): Promise<{
  result: Array<{ id: string; name: string; [key: string]: any }>;
}> {
  return needleRequest('/collections');
}

/**
 * Get or create a collection for a project
 * If collection doesn't exist, creates a new one with name "Project-{projectId}"
 * @param projectId - Project ID
 * @param existingCollectionId - Optional existing collection ID to verify
 * @returns Collection ID
 */
export async function getOrCreateCollection(
  projectId: string,
  existingCollectionId?: string | null
): Promise<string> {
  // If we have an existing collection ID, verify it exists
  if (existingCollectionId) {
    try {
      await getCollection(existingCollectionId);
      console.log('existingCollectionId111', existingCollectionId);
      return existingCollectionId;
    } catch (error) {
      console.warn(`Collection ${existingCollectionId} not found, creating new one`);
      // Fall through to create new collection
    }
  }

  // Create new collection
  const collectionName = `Project-${projectId}`;
  console.log('collectionName111', collectionName);
  const response = await createCollection(collectionName);
  console.log('response-createCollection111', response);
  return response.result.id;
}

/**
 * Get a signed upload URL for uploading files to Needle
 * @param contentType - MIME type of the file (e.g., "application/pdf")
 * @returns Upload URL and file ID
 */
export async function getFileUploadUrl(
  contentType: string
): Promise<{
  result: Array<{
    upload_url: string;
    file_id: string;
    [key: string]: any;
  }>;
}> {
  // Needle API expects content_type as a query parameter
  // The API returns an array of upload URLs (one per content_type)
  const endpoint = `/files/upload_url?content_type=${encodeURIComponent(contentType)}`;
  
  console.log(`[Needle] Requesting upload URL from: ${NEEDLE_API_BASE}${endpoint}`)
  
  const response = await needleRequest<{
    result: Array<{
      upload_url: string;
      file_id: string;
      [key: string]: any;
    }>;
  }>(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }, false);
  
  console.log(`[Needle] Upload URL response:`, JSON.stringify(response, null, 2))
  
  return response;
}

/**
 * Upload a file to Needle using the signed upload URL
 * @param uploadUrl - Signed upload URL from getFileUploadUrl
 * @param fileBuffer - File content as Buffer
 * @param contentType - MIME type of the file
 */
export async function uploadFileToNeedle(
  uploadUrl: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<void> {
  console.log(`[Needle] Uploading file to: ${uploadUrl.substring(0, 100)}...`)
  console.log(`[Needle] File size: ${fileBuffer.length} bytes, Content-Type: ${contentType}`)
  
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: fileBuffer, // Send Buffer directly, fetch will handle it correctly
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    console.error(`[Needle] Upload failed: ${response.status} ${response.statusText}`)
    console.error(`[Needle] Error response: ${errorText}`)
    throw new Error(`Failed to upload file to Needle: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  console.log(`[Needle] File uploaded successfully`)
}

/**
 * Add a file to a Needle collection
 * @param collectionId - Needle collection ID
 * @param fileUrl - URL of the file (from Needle upload or public URL)
 * @param fileName - Name of the file
 * @param updatedAt - Optional updated_at timestamp
 * @returns Array of added files with their IDs
 */
export async function addFileToCollection(
  collectionId: string,
  fileUrl: string,
  fileName: string,
  updatedAt?: string
): Promise<{
  result: Array<{
    id: string;
    name: string;
    url: string;
    [key: string]: any;
  }>;
}> {
  const files = [
    {
      name: fileName,
      url: fileUrl,
      // Only include updated_at if provided and not null/undefined
      ...(updatedAt && updatedAt.trim() !== '' && { updated_at: updatedAt }),
    },
  ];

  const requestBody = { files };
  console.log(`[Needle] Adding file to collection:`, JSON.stringify({
    collectionId,
    requestBody
  }, null, 2));

  try {
    const response = await needleRequest(`/collections/${collectionId}/files`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
    console.log(`[Needle] Add file response:`, JSON.stringify(response, null, 2));
    return response;
  } catch (error: any) {
    console.error(`[Needle] Error adding file to collection:`, error);
    console.error(`[Needle] Request body was:`, JSON.stringify(requestBody, null, 2));
    throw error;
  }
}

/**
 * Search a collection in Needle
 * @param collectionId - Needle collection ID
 * @param query - Search query text
 * @param options - Search options (topK, offset, fileIds)
 * @returns Search results
 */
export async function searchCollection(
  collectionId: string,
  query: string,
  options: {
    topK?: number;
    offset?: number;
    fileIds?: string[];
  } = {}
): Promise<{
  result: Array<{
    text: string;
    score?: number;
    metadata?: Record<string, any>;
    file_id?: string;
    [key: string]: any;
  }>;
}> {
  const { topK = 5, offset = 0, fileIds } = options;

  return needleRequest(
    `/collections/${collectionId}/search`,
    {
      method: 'POST',
      body: JSON.stringify({
        text: query,
        top_k: topK,
        offset: offset,
        ...(fileIds && fileIds.length > 0 && { file_ids: fileIds }),
      }),
    },
    true // Use search API base URL
  );
}

/**
 * Get file download URL (for private files)
 * @param fileId - Needle file ID
 * @returns Download URL (result is a URI string, not an object)
 */
export async function getFileDownloadUrl(
  fileId: string
): Promise<{
  result: string; // The API returns result as a URI string directly
}> {
  console.log(`[Needle] Requesting download URL for file: ${fileId}`)
  const response = await needleRequest<{ result: string }>(`/files/${fileId}/download_url`, {
    method: 'GET',
  }, false);
  console.log(`[Needle] Download URL response:`, JSON.stringify(response, null, 2))
  return response;
}

