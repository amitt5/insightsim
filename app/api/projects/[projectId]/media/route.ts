import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from 'uuid';

// POST route to upload media files for a project
export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify project exists and user has access
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", params.projectId)
      .eq("user_id", session.user.id)
      .eq("is_deleted", false)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload JPG, PNG, or PDF files only.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Sanitize the filename and generate a unique path
    const fileExtension = file.name.split('.').pop();
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");

    // Sanitize the file name: convert to lowercase, replace spaces and special characters with hyphens
    const sanitizedFileName = fileNameWithoutExt
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w\-]+/g, '') // Remove all non-word chars except -
      .replace(/\-\-+/g, '-'); // Replace multiple - with single -

    const uniqueId = uuidv4();
    // Path format: projectId/sanitized-file-name-uniqueId.extension
    const filePath = `${params.projectId}/${sanitizedFileName}-${uniqueId}.${fileExtension}`;

    console.log(`Uploading project media to bucket: project-media, path: ${filePath}`);

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('project-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json(
        { error: error.message || 'Upload failed' },
        { status: 500 }
      );
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('project-media')
      .getPublicUrl(filePath);

    // Update project with new media URL
    const { data: currentProject } = await supabase
      .from("projects")
      .select("media_urls")
      .eq("id", params.projectId)
      .single();

    const currentMediaUrls = currentProject?.media_urls || [];
    const updatedMediaUrls = [...currentMediaUrls, publicUrl];

    const { error: updateError } = await supabase
      .from("projects")
      .update({ 
        media_urls: updatedMediaUrls,
        updated_at: new Date().toISOString()
      })
      .eq("id", params.projectId);

    if (updateError) {
      console.error('Error updating project media URLs:', updateError);
      // Try to clean up the uploaded file
      await supabase.storage
        .from('project-media')
        .remove([filePath]);
      
      return NextResponse.json(
        { error: 'Failed to update project with media URL' },
        { status: 500 }
      );
    }

    console.log(`Successfully uploaded project media: ${filePath}`);
    
    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
      fileName: file.name
    });

  } catch (error: any) {
    console.error('Error in project media upload API:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// DELETE route to remove a media file from a project
export async function DELETE(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify project exists and user has access
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, user_id, media_urls")
      .eq("id", params.projectId)
      .eq("user_id", session.user.id)
      .eq("is_deleted", false)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get the URL to remove from query parameters
    const url = new URL(request.url);
    const mediaUrl = url.searchParams.get('url');

    if (!mediaUrl) {
      return NextResponse.json({ error: 'Media URL is required' }, { status: 400 });
    }

    // Remove the URL from the project's media_urls array
    const currentMediaUrls = project.media_urls || [];
    const updatedMediaUrls = currentMediaUrls.filter((url: string) => url !== mediaUrl);

    // Update the project
    const { error: updateError } = await supabase
      .from("projects")
      .update({ 
        media_urls: updatedMediaUrls,
        updated_at: new Date().toISOString()
      })
      .eq("id", params.projectId);

    if (updateError) {
      console.error('Error updating project media URLs:', updateError);
      return NextResponse.json(
        { error: 'Failed to remove media URL from project' },
        { status: 500 }
      );
    }

    // Extract file path from URL and delete from storage
    try {
      const urlParts = mediaUrl.split('/storage/v1/object/public/project-media/');
      if (urlParts.length === 2) {
        const filePath = urlParts[1];
        const { error: deleteError } = await supabase.storage
          .from('project-media')
          .remove([filePath]);

        if (deleteError) {
          console.error('Error deleting file from storage:', deleteError);
          // Don't fail the request if storage deletion fails
        }
      }
    } catch (error) {
      console.error('Error parsing media URL for deletion:', error);
      // Don't fail the request if URL parsing fails
    }

    return NextResponse.json({
      success: true,
      message: 'Media file removed successfully'
    });

  } catch (error: any) {
    console.error('Error in project media delete API:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// GET route to list all media files for a project
export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify project exists and user has access
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, user_id, media_urls")
      .eq("id", params.projectId)
      .eq("user_id", session.user.id)
      .eq("is_deleted", false)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      mediaUrls: project.media_urls || []
    });

  } catch (error: any) {
    console.error('Error in project media list API:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
