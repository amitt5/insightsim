/**
 * Utility functions for project media operations
 */

export interface ProjectMediaUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  fileName?: string;
  error?: string;
}

export interface ProjectMediaDeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Uploads a single file to a project
 */
export async function uploadProjectMedia(
  file: File,
  projectId: string
): Promise<ProjectMediaUploadResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    formData.append('bucket', 'project-media');

    const response = await fetch(`/api/projects/${projectId}/media`, {
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

    return {
      success: true,
      url: data.url,
      path: data.path,
      fileName: data.fileName
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Uploads multiple files to a project
 */
export async function uploadMultipleProjectMedia(
  files: File[],
  projectId: string,
  onProgress?: (fileIndex: number, result: ProjectMediaUploadResult) => void
): Promise<ProjectMediaUploadResult[]> {
  const uploadPromises = files.map((file, index) => 
    uploadProjectMedia(file, projectId).then(result => {
      onProgress?.(index, result);
      return result;
    })
  );

  return Promise.all(uploadPromises);
}

/**
 * Deletes a media file from a project
 */
export async function deleteProjectMedia(
  projectId: string,
  mediaUrl: string
): Promise<ProjectMediaDeleteResult> {
  try {
    const response = await fetch(`/api/projects/${projectId}/media?url=${encodeURIComponent(mediaUrl)}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Delete failed'
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Gets all media files for a project
 */
export async function getProjectMedia(projectId: string): Promise<string[]> {
  try {
    const response = await fetch(`/api/projects/${projectId}/media`);
    const data = await response.json();

    if (!response.ok) {
      console.error('Error fetching project media:', data.error);
      return [];
    }

    return data.mediaUrls || [];
  } catch (error) {
    console.error('Error fetching project media:', error);
    return [];
  }
}

/**
 * Updates project media URLs
 */
export async function updateProjectMediaUrls(
  projectId: string,
  mediaUrls: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ media_urls: mediaUrls }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to update project media'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating project media:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Gets a signed URL for displaying a stored project media file
 */
export async function getSignedUrlForProjectMedia(url: string): Promise<string> {
  try {
    // If it's already a signed URL (has token parameter), return as-is
    if (url.includes('token=')) {
      return url;
    }

    // Extract file path from public URL
    // URL format: https://[project].supabase.co/storage/v1/object/public/project-media/path/to/file.jpg
    const urlParts = url.split('/storage/v1/object/public/project-media/');
    if (urlParts.length !== 2) {
      console.error('Invalid project media URL format:', url);
      return url; // Return original URL as fallback
    }

    const filePath = urlParts[1];

    // Generate signed URL via API
    const response = await fetch(`/api/storage?path=${encodeURIComponent(filePath)}&bucket=project-media`);
    
    if (!response.ok) {
      console.error('Failed to get signed URL for project media:', filePath);
      return url; // Return original URL as fallback
    }

    const data = await response.json();
    return data.url || url;
  } catch (error) {
    console.error('Error getting signed URL for project media:', error);
    return url; // Return original URL as fallback
  }
}

/**
 * Gets signed URLs for multiple project media files
 */
export async function getSignedUrlsForProjectMedia(urls: string[]): Promise<string[]> {
  const signedUrlPromises = urls.map(url => getSignedUrlForProjectMedia(url));
  return Promise.all(signedUrlPromises);
}
