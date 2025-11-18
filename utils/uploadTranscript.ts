import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { formatSyntheticTranscript, formatHumanTranscript, textToFile } from "./formatTranscript"
import { 
  getOrCreateFileSearchStore, 
  uploadFileToFileSearchStore 
} from "@/lib/googleFileSearch"
import { v4 as uuidv4 } from 'uuid'
import { put } from '@vercel/blob'

interface SyntheticSimulation {
  simulationId: string;
  messages: Array<{
    role: string;
    text: string;
    turn?: number;
    createdAt?: string;
  }>;
}

interface HumanInterview {
  respondentId: string;
  name?: string;
  email?: string;
  age?: number | null;
  gender?: string;
  messages: Array<{
    role: string;
    text: string;
    turn?: number;
    createdAt?: string;
  }>;
  source?: string;
}

/**
 * Check if a transcript already exists in the database
 */
async function checkTranscriptExists(
  supabase: any,
  projectId: string,
  simulationId?: string,
  respondentId?: string,
  transcriptType?: 'synthetic' | 'human'
): Promise<boolean> {
  let query = supabase
    .from("rag_documents")
    .select("id")
    .eq("project_id", projectId)
    .eq("transcript_type", transcriptType)
    .eq("status", "completed")
    .limit(1);

  if (simulationId) {
    query = query.eq("simulation_id", simulationId);
  }
  if (respondentId) {
    query = query.eq("respondent_id", respondentId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error checking transcript existence:", error);
    return false; // If error, assume doesn't exist and try to upload
  }

  return (data && data.length > 0);
}

/**
 * Upload a synthetic simulation transcript to Google File Search Store
 */
export async function uploadSyntheticTranscript(
  projectId: string,
  userId: string,
  simulation: SyntheticSimulation,
  projectStoreId?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check if transcript already exists
    const exists = await checkTranscriptExists(
      supabase,
      projectId,
      simulation.simulationId,
      undefined,
      'synthetic'
    );

    if (exists) {
      console.log(`Transcript for simulation ${simulation.simulationId} already exists, skipping upload`);
      return { success: true };
    }

    // Get or create File Search Store
    let storeName: string;
    try {
      storeName = await getOrCreateFileSearchStore(projectId, projectStoreId);
      
      // Update project with store ID if it's new
      if (!projectStoreId && storeName) {
        const supabase = createRouteHandlerClient({ cookies });
        await supabase
          .from("projects")
          .update({ google_file_search_store_id: storeName })
          .eq("id", projectId);
      }
    } catch (error: any) {
      if (error.message?.includes('GEMINI_API_KEY')) {
        throw new Error('Google Gemini API key is not configured');
      }
      throw error;
    }

    // Format transcript to text
    const transcriptText = formatSyntheticTranscript(simulation);
    const filename = `synthetic-transcript-${simulation.simulationId}.txt`;
    
    // Convert text to File object
    const file = textToFile(transcriptText, filename, 'text/plain');

    // Upload to Vercel Blob first (to avoid serverless function payload limits)
    let blobUrl: string;
    try {
      const blob = await put(filename, file, {
        access: 'public',
        addRandomSuffix: true,
      });
      blobUrl = blob.url;
    } catch (blobError: any) {
      throw new Error(`Failed to upload file to storage: ${blobError.message || 'Unknown error'}`);
    }

    // Upload to Google File Search Store
    let googleFileNameResult: string;
    try {
      const uploadResult = await uploadFileToFileSearchStore(
        storeName,
        blobUrl,
        filename
      );
      googleFileNameResult = uploadResult.fileName;
    } catch (uploadError: any) {
      if (uploadError.message?.includes('GEMINI_API_KEY')) {
        throw new Error('Google Gemini API key is not configured');
      }
      throw new Error(`Failed to upload to Google File Search Store: ${uploadError.message}`);
    }

    // Save to database
    const documentData = {
      id: uuidv4(),
      project_id: projectId,
      user_id: userId,
      filename: filename,
      original_filename: filename,
      file_path: null,
      file_size: file.size,
      mime_type: 'text/plain',
      status: 'completed',
      processing_method: 'google_file_search',
      google_file_name: googleFileNameResult,
      simulation_id: simulation.simulationId,
      transcript_type: 'synthetic'
    };

    const { error: dbError } = await supabase
      .from("rag_documents")
      .insert(documentData);

    if (dbError) {
      console.error('Database error saving transcript:', dbError);
      throw new Error(`Failed to save transcript record: ${dbError.message}`);
    }

    console.log(`Successfully uploaded synthetic transcript for simulation ${simulation.simulationId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error uploading synthetic transcript:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Upload a human interview transcript to Google File Search Store
 */
export async function uploadHumanTranscript(
  projectId: string,
  userId: string,
  interview: HumanInterview,
  projectStoreId?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check if transcript already exists
    const exists = await checkTranscriptExists(
      supabase,
      projectId,
      undefined,
      interview.respondentId,
      'human'
    );

    if (exists) {
      console.log(`Transcript for interview ${interview.respondentId} already exists, skipping upload`);
      return { success: true };
    }

    // Get or create File Search Store
    let storeName: string;
    try {
      storeName = await getOrCreateFileSearchStore(projectId, projectStoreId);
      
      // Update project with store ID if it's new
      if (!projectStoreId && storeName) {
        const supabase = createRouteHandlerClient({ cookies });
        await supabase
          .from("projects")
          .update({ google_file_search_store_id: storeName })
          .eq("id", projectId);
      }
    } catch (error: any) {
      if (error.message?.includes('GEMINI_API_KEY')) {
        throw new Error('Google Gemini API key is not configured');
      }
      throw error;
    }

    // Format transcript to text
    const transcriptText = formatHumanTranscript(interview);
    const filename = `human-transcript-${interview.respondentId}.txt`;
    
    // Convert text to File object
    const file = textToFile(transcriptText, filename, 'text/plain');

    // Upload to Vercel Blob first
    let blobUrl: string;
    try {
      const blob = await put(filename, file, {
        access: 'public',
        addRandomSuffix: true,
      });
      blobUrl = blob.url;
    } catch (blobError: any) {
      throw new Error(`Failed to upload file to storage: ${blobError.message || 'Unknown error'}`);
    }

    // Upload to Google File Search Store
    let googleFileNameResult: string;
    try {
      const uploadResult = await uploadFileToFileSearchStore(
        storeName,
        blobUrl,
        filename
      );
      googleFileNameResult = uploadResult.fileName;
    } catch (uploadError: any) {
      if (uploadError.message?.includes('GEMINI_API_KEY')) {
        throw new Error('Google Gemini API key is not configured');
      }
      throw new Error(`Failed to upload to Google File Search Store: ${uploadError.message}`);
    }

    // Save to database
    const documentData = {
      id: uuidv4(),
      project_id: projectId,
      user_id: userId,
      filename: filename,
      original_filename: filename,
      file_path: null,
      file_size: file.size,
      mime_type: 'text/plain',
      status: 'completed',
      processing_method: 'google_file_search',
      google_file_name: googleFileNameResult,
      respondent_id: interview.respondentId,
      transcript_type: 'human'
    };

    const { error: dbError } = await supabase
      .from("rag_documents")
      .insert(documentData);

    if (dbError) {
      console.error('Database error saving transcript:', dbError);
      throw new Error(`Failed to save transcript record: ${dbError.message}`);
    }

    console.log(`Successfully uploaded human transcript for interview ${interview.respondentId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error uploading human transcript:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

