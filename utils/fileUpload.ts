import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClientComponentClient()

export interface FileUploadResult {
  success: boolean
  url?: string
  error?: string
  path?: string
}

export interface FileValidationResult {
  isValid: boolean
  error?: string
}

// File validation constants
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB in bytes
export const SIMULATION_MEDIA_BUCKET = 'simulation-media'

/**
 * Validates file type and size
 */
export function validateFile(file: File): FileValidationResult {
  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Please upload JPG, PNG, or PDF files only.'
    }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
    }
  }

  return { isValid: true }
}

/**
 * Generates a unique file path for storage
 */
export function generateFilePath(file: File, simulationId: string): string {
  const fileExtension = file.name.split('.').pop()
  const uniqueId = uuidv4()
  return `${simulationId}/${uniqueId}.${fileExtension}`
}

/**
 * Uploads a file to Supabase storage
 */
export async function uploadFile(
  file: File, 
  simulationId: string,
  onProgress?: (progress: number) => void
): Promise<FileUploadResult> {
  try {
    // Validate file
    const validation = validateFile(file)
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      }
    }

    // Generate unique file path
    const filePath = generateFilePath(file, simulationId)

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(SIMULATION_MEDIA_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return {
        success: false,
        error: error.message || 'Upload failed'
      }
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(SIMULATION_MEDIA_BUCKET)
      .getPublicUrl(filePath)

    return {
      success: true,
      url: publicUrl,
      path: filePath
    }
  } catch (error) {
    console.error('Unexpected upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Uploads multiple files concurrently
 */
export async function uploadMultipleFiles(
  files: File[],
  simulationId: string,
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<FileUploadResult[]> {
  const uploadPromises = files.map((file, index) => 
    uploadFile(file, simulationId, (progress) => {
      onProgress?.(index, progress)
    })
  )

  return Promise.all(uploadPromises)
}

/**
 * Deletes a file from Supabase storage
 */
export async function deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(SIMULATION_MEDIA_BUCKET)
      .remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      return {
        success: false,
        error: error.message || 'Delete failed'
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected delete error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Deletes multiple files
 */
export async function deleteMultipleFiles(filePaths: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(SIMULATION_MEDIA_BUCKET)
      .remove(filePaths)

    if (error) {
      console.error('Delete multiple files error:', error)
      return {
        success: false,
        error: error.message || 'Delete failed'
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected delete multiple files error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Creates a file preview URL (for images)
 */
export function createFilePreview(file: File): string {
  if (file.type.startsWith('image/')) {
    return URL.createObjectURL(file)
  }
  return ''
}

/**
 * Revokes a file preview URL to free up memory
 */
export function revokeFilePreview(url: string): void {
  if (url) {
    URL.revokeObjectURL(url)
  }
}

/**
 * Gets a signed URL for displaying a stored file
 * Converts stored public URLs back to file paths and generates signed URLs
 */
export async function getSignedUrlForDisplay(url: string): Promise<string> {
  try {
    // If it's already a signed URL (has token parameter), return as-is
    if (url.includes('token=')) {
      return url;
    }

    // Extract file path from public URL
    // URL format: https://[project].supabase.co/storage/v1/object/public/simulation-media/path/to/file.jpg
    const urlParts = url.split('/storage/v1/object/public/simulation-media/');
    if (urlParts.length !== 2) {
      console.error('Invalid URL format:', url);
      return url; // Return original URL as fallback
    }

    const filePath = urlParts[1];

    // Generate signed URL via API
    const response = await fetch(`/api/storage?path=${encodeURIComponent(filePath)}&bucket=simulation-media`);
    
    if (!response.ok) {
      console.error('Failed to get signed URL for:', filePath);
      return url; // Return original URL as fallback
    }

    const data = await response.json();
    return data.url || url;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    return url; // Return original URL as fallback
  }
}

/**
 * Gets signed URLs for multiple files
 */
export async function getSignedUrlsForDisplay(urls: string[]): Promise<string[]> {
  const signedUrlPromises = urls.map(url => getSignedUrlForDisplay(url));
  return Promise.all(signedUrlPromises);
} 