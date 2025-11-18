import { GoogleGenAI } from '@google/genai';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

// Lazy getter for API key - only throws when actually needed
function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set. Please set it in your .env.local file or environment variables.');
  }
  return apiKey;
}

/**
 * Get or create a File Search Store for a project
 * @param projectId - The project ID
 * @param existingStoreId - Optional existing store ID
 * @returns The store name (format: fileSearchStores/{store_id})
 */
export async function getOrCreateFileSearchStore(
  projectId: string,
  existingStoreId?: string | null
): Promise<string> {
  if (existingStoreId) {
    return existingStoreId;
  }

  try {
    const client = new GoogleGenAI({ apiKey: getApiKey() });

    // Create a new file search store
    // The store name will be based on the project ID
    const storeName = `projects/${projectId}/fileSearchStores/${projectId}`;
    
    // Try to create the store
    // Note: The exact API may vary based on the @google/genai package version
    // This is a placeholder implementation - you may need to adjust based on actual API
    const store = await client.fileSearchStores.create({});

    // Return the store name in the format: fileSearchStores/{store_id}
    return store.name || storeName;
  } catch (error: any) {
    // If store already exists, try to get it
    if (error.message?.includes('already exists') || error.code === 409) {
      // Try to list stores and find the one for this project
      const client = new GoogleGenAI({ apiKey: getApiKey() });
      const storesPager = await client.fileSearchStores.list();
      
      // Iterate through the pager to find the store
      let projectStore: any = null;
      for await (const store of storesPager) {
        if (store.displayName?.includes(projectId) || store.name?.includes(projectId)) {
          projectStore = store;
          break;
        }
      }
      
      if (projectStore) {
        return projectStore.name;
      }
    }
    
    // If we can't find or create, throw the error
    throw new Error(`Failed to get or create file search store: ${error.message}`);
  }
}

/**
 * Upload a file to Google File Search Store using the Node.js SDK
 * @param storeName - The store name (format: fileSearchStores/{store_id})
 * @param fileOrUrl - The file to upload (File object) or blob URL (string) to fetch
 * @param displayName - The display name for the file in the store
 * @returns The upload result with the file name.
 */
export async function uploadFileToFileSearchStore(
  storeName: string,
  fileOrUrl: File | string,
  displayName: string
): Promise<{ fileName: string; success: boolean }> {
  // Create a temporary file path
  const tempDir = tmpdir();
  const fileName = typeof fileOrUrl === 'string' ? displayName : fileOrUrl.name;
  const tempFilePath = join(tempDir, `upload-${Date.now()}-${fileName}`);
  
  try {
    let buffer: Buffer;
    
    if (typeof fileOrUrl === 'string') {
      // It's a URL - fetch it
      console.log(`Fetching file from URL: ${fileOrUrl}`);
      const response = await fetch(fileOrUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file from URL: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      // It's a File object - convert to Buffer
      const arrayBuffer = await fileOrUrl.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }
    
    // Write buffer to temp file
    await writeFile(tempFilePath, buffer);

    // Initialize Google GenAI client
    const client = new GoogleGenAI({ apiKey: getApiKey() });

    // Upload and import file into the file search store
    const operation = await client.fileSearchStores.uploadToFileSearchStore({
      file: tempFilePath,
      fileSearchStoreName: storeName,
      config: {
        displayName: displayName,
      },
    });

    // Wait until import is complete (matching Python script behavior)
    const maxWaitTime = 300000; // 5 minutes in milliseconds
    const pollInterval = 2000; // 2 seconds in milliseconds
    const startTime = Date.now();

    let currentOperation = operation;
    
    while (!currentOperation.done) {
      if (Date.now() - startTime > maxWaitTime) {
        throw new Error(
          `Operation timed out after ${maxWaitTime / 1000} seconds. Operation name: ${currentOperation.name || 'unknown'}`
        );
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
      // Get updated operation status
      if (!currentOperation.name) {
        throw new Error('Operation name is missing');
      }
      currentOperation = await client.operations.get({ operation: currentOperation });
    }

    // Check for errors
    if (currentOperation.error) {
      throw new Error(
        `Operation failed: ${JSON.stringify(currentOperation.error)}. Operation name: ${currentOperation.name || 'unknown'}`
      );
    }

    // Extract document resource name from operation response
    // The document resource name format is: fileSearchStores/{store_id}/documents/{document_id}
    let documentResourceName: string | null = null;
    
    if (currentOperation.response) {
      const response = currentOperation.response as any;
      
      // Check for document resource name (fileSearchStores/.../documents/...)
      if (response.document?.name) {
        documentResourceName = response.document.name;
      } else if (response.name) {
        const name = response.name;
        // Check if it's the document resource name format
        if (typeof name === 'string' && name.startsWith('fileSearchStores/')) {
          documentResourceName = name;
        }
      }
    }

    // Return success result
    // If we have document_resource_name, use it; otherwise use display_name
    return {
      fileName: documentResourceName || displayName,
      success: true,
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to upload file to Google File Search Store');
  } finally {
    // Clean up temporary file
    try {
      await unlink(tempFilePath);
    } catch (cleanupError) {
      console.error('Failed to cleanup temp file:', cleanupError);
    }
  }
}

/**
 * List all files in a File Search Store
 * @param storeName - The store name (format: fileSearchStores/{store_id})
 * @returns Array of file/document information
 */
export async function listFilesInStore(
  storeName: string
): Promise<any[]> {
  try {
    const client = new GoogleGenAI({ apiKey: getApiKey() });

    // List documents in the store
    const documentsPager = await client.fileSearchStores.documents.list({
      parent: storeName,
    });

    // Convert pager to array
    const documents: any[] = [];
    for await (const doc of documentsPager) {
      documents.push(doc);
    }

    return documents;
  } catch (error: any) {
    throw new Error(`Failed to list files in store: ${error.message}`);
  }
}

/**
 * Search a File Search Store using Google Gemini API
 * @param storeName - The store name (format: fileSearchStores/{store_id})
 * @param query - The search query string
 * @param options - Optional search parameters (maxResults, etc.)
 * @returns Search results with candidates containing content and grounding metadata
 */
export async function searchFileStore(
  storeName: string,
  query: string,
  options?: { maxResults?: number }
): Promise<any> {
  try {
    // Ensure storeName is in the correct format (fileSearchStores/{store_id})
    let normalizedStoreName = storeName;
    if (!storeName.startsWith('fileSearchStores/')) {
      // If it's just the store ID, prepend the prefix
      normalizedStoreName = `fileSearchStores/${storeName}`;
    }

    // Initialize Google GenAI client
    const client = new GoogleGenAI({ apiKey: getApiKey() });

    // Try gemini-2.5-flash first, fallback to gemini-2.5-pro
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-pro'];
    
    let response: any = null;
    let lastError: string | null = null;
    
    for (const model of modelsToTry) {
      try {
        response = await client.models.generateContent({
          model: model,
          contents: query,
          config: {
            tools: [
              {
                fileSearch: {
                  fileSearchStoreNames: [normalizedStoreName],
                },
              },
            ],
          },
        });
        break; // Success, exit loop
      } catch (error: any) {
        lastError = error.message || String(error);
        // If it's a model not found error, try next model
        if (lastError && (lastError.toLowerCase().includes('not found') || lastError.includes('404'))) {
          continue;
        } else {
          // For other errors, throw immediately
          throw error;
        }
      }
    }
    
    if (!response) {
      throw new Error(`All models failed. Last error: ${lastError || 'unknown'}`);
    }

    // Extract the response
    const result: any = {
      success: true,
      candidates: [],
    };

    // Process candidates from SDK response
    if (response.candidates && Array.isArray(response.candidates)) {
      for (const candidate of response.candidates) {
        const candidateData: any = {
          content: {
            parts: [],
          },
          groundingMetadata: {
            groundingChunks: [],
          },
        };

        // Extract content parts
        if (candidate.content?.parts) {
          for (const part of candidate.content.parts) {
            if (part.text) {
              candidateData.content.parts.push({ text: part.text });
            }
          }
        }

        // Extract grounding metadata
        if (candidate.groundingMetadata?.groundingChunks) {
          for (const chunk of candidate.groundingMetadata.groundingChunks) {
            const chunkData: any = {
              documentChunkInfo: {},
              chunk: {},
            };
            
            if (chunk.documentChunkInfo) {
              const docInfo = chunk.documentChunkInfo;
              if (docInfo.documentName) {
                chunkData.documentChunkInfo.documentName = docInfo.documentName;
              }
              if (docInfo.chunkIndex !== undefined) {
                chunkData.documentChunkInfo.chunkIndex = docInfo.chunkIndex;
              }
            }
            
            if (chunk.chunk) {
              const chunkObj = chunk.chunk;
              if (chunkObj.chunkId) {
                chunkData.chunk.chunkId = chunkObj.chunkId;
              }
              if (chunkObj.chunkRelevanceScore !== undefined) {
                chunkData.chunk.chunkRelevanceScore = chunkObj.chunkRelevanceScore;
              }
            }
            
            candidateData.groundingMetadata.groundingChunks.push(chunkData);
          }
        }

        result.candidates.push(candidateData);
      }
    }

    return result;
  } catch (error: any) {
    console.error('❌ [GOOGLE SEARCH] Error:', error);
    throw new Error(`Failed to search file store: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Delete a file from Google File Search Store
 * @param fileName - The file name or document resource name to delete
 * @param storeName - Optional store name for lookup
 */
export async function deleteFileFromStore(
  fileName: string,
  storeName?: string
): Promise<void> {
  try {
    const client = new GoogleGenAI({ apiKey: getApiKey() });

    // The fileName might be in different formats:
    // - fileSearchStores/{store_id}/documents/{document_id}
    // - files/{file_id}
    // - Just a display name

    if (fileName.startsWith('fileSearchStores/')) {
      // This is a document resource name, delete it directly
      await client.fileSearchStores.documents.delete({ name: fileName });
    } else if (fileName.startsWith('files/')) {
      // This is a file resource name, we need to find the document first
      // or delete the file directly
      await client.files.delete({ name: fileName });
    } else {
      // If it's just a display name, we need to find it first
      // This is more complex and may require listing documents
      if (storeName) {
        // List documents in the store and find the one with matching display name
        const documentsPager = await client.fileSearchStores.documents.list({
          parent: storeName,
        });
        
        let document: any = null;
        for await (const doc of documentsPager) {
          if (doc.displayName === fileName || doc.name?.includes(fileName)) {
            document = doc;
            break;
          }
        }
        
        if (document) {
          await client.fileSearchStores.documents.delete({ name: document.name });
        } else {
          throw new Error(`Document not found: ${fileName}`);
        }
      } else {
        throw new Error(`Cannot delete file without store name: ${fileName}`);
      }
    }
  } catch (error: any) {
    throw new Error(`Failed to delete file from store: ${error.message}`);
  }
}

