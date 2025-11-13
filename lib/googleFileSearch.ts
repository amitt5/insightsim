import { GoogleGenAI } from '@google/genai';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

const execAsync = promisify(exec);

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
    const store = await client.fileSearchStores.create({
      displayName: `Project ${projectId} File Search Store`,
    });

    // Return the store name in the format: fileSearchStores/{store_id}
    return store.name || storeName;
  } catch (error: any) {
    // If store already exists, try to get it
    if (error.message?.includes('already exists') || error.code === 409) {
      // Try to list stores and find the one for this project
      const client = new GoogleGenAI({ apiKey: getApiKey() });
      const stores = await client.fileSearchStores.list();
      const projectStore = stores.find((s: any) => 
        s.displayName?.includes(projectId) || s.name?.includes(projectId)
      );
      
      if (projectStore) {
        return projectStore.name;
      }
    }
    
    // If we can't find or create, throw the error
    throw new Error(`Failed to get or create file search store: ${error.message}`);
  }
}

/**
 * Upload a file to Google File Search Store using the Python script
 * @param storeName - The store name (format: fileSearchStores/{store_id})
 * @param file - The file to upload
 * @param displayName - The display name for the file in the store
 * @returns The upload result with the file name
 */
export async function uploadFileToFileSearchStore(
  storeName: string,
  file: File,
  displayName: string
): Promise<{ fileName: string; success: boolean }> {
  // Create a temporary file path
  const tempDir = tmpdir();
  const tempFilePath = join(tempDir, `upload-${Date.now()}-${file.name}`);
  
  try {
    // Convert File to Buffer and write to temp file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(tempFilePath, buffer);

    // Get the path to the Python script
    const scriptPath = join(process.cwd(), 'scripts', 'upload_to_file_search.py');

    // Execute the Python script
    const { stdout, stderr } = await execAsync(
      `python3 "${scriptPath}" "${getApiKey()}" "${tempFilePath}" "${storeName}" "${displayName}"`
    );

    // Parse the JSON response from the Python script
    const result = JSON.parse(stdout.trim());

    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    return {
      fileName: result.file_name || displayName,
      success: true,
    };
  } catch (error: any) {
    // Try to parse error from stderr if stdout failed
    if (error.stderr) {
      try {
        const errorResult = JSON.parse(error.stderr.trim());
        throw new Error(errorResult.error || 'Upload failed');
      } catch {
        // If parsing fails, use the original error
      }
    }
    
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
    const documents = await client.fileSearchStores.documents.list({
      parent: storeName,
    });

    return documents || [];
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
    console.log('🔍 [GOOGLE SEARCH] Starting search...');
    console.log('🔍 [GOOGLE SEARCH] Query:', query);
    console.log('🔍 [GOOGLE SEARCH] Store:', storeName);
    console.log('🔍 [GOOGLE SEARCH] Options:', options);

    // Ensure storeName is in the correct format (fileSearchStores/{store_id})
    let normalizedStoreName = storeName;
    if (!storeName.startsWith('fileSearchStores/')) {
      // If it's just the store ID, prepend the prefix
      normalizedStoreName = `fileSearchStores/${storeName}`;
    }
    
    console.log('🔍 [GOOGLE SEARCH] Normalized store name:', normalizedStoreName);

    // Use Python script to search (similar to upload approach)
    // This avoids REST API protobuf issues
    const scriptPath = join(process.cwd(), 'scripts', 'search_file_search.py');

    // Execute the Python script
    const { stdout, stderr } = await execAsync(
      `python3 "${scriptPath}" "${getApiKey()}" "${normalizedStoreName}" "${query.replace(/"/g, '\\"')}"`
    );

    // Parse the JSON response from the Python script
    const result = JSON.parse(stdout.trim());

    if (!result.success) {
      throw new Error(result.error || 'Search failed');
    }

    console.log('🔍 [GOOGLE SEARCH] Raw API response:', JSON.stringify(result, null, 2));
    console.log('🔍 [GOOGLE SEARCH] Number of candidates:', result.candidates?.length || 0);
    
    if (result.candidates && result.candidates.length > 0) {
      const firstCandidate = result.candidates[0];
      const groundingChunks = firstCandidate.groundingMetadata?.groundingChunks || [];
      console.log('🔍 [GOOGLE SEARCH] Grounding chunks found:', groundingChunks.length);
      
      if (groundingChunks.length > 0) {
        console.log('🔍 [GOOGLE SEARCH] First chunk sample:', {
          documentName: groundingChunks[0].documentChunkInfo?.documentName,
          chunkIndex: groundingChunks[0].documentChunkInfo?.chunkIndex,
          relevanceScore: groundingChunks[0].chunk?.chunkRelevanceScore
        });
      }
    }

    return result;
  } catch (error: any) {
    // Try to parse error from stderr if stdout failed
    if (error.stderr) {
      try {
        const errorResult = JSON.parse(error.stderr.trim());
        throw new Error(errorResult.error || 'Search failed');
      } catch {
        // If parsing fails, use the original error
      }
    }
    
    console.error('❌ [GOOGLE SEARCH] Error:', error);
    throw new Error(`Failed to search file store: ${error.message}`);
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
        const documents = await client.fileSearchStores.documents.list({
          parent: storeName,
        });
        
        const document = documents.find((doc: any) => 
          doc.displayName === fileName || doc.name?.includes(fileName)
        );
        
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

