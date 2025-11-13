import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from 'uuid';

// GET route to generate a signed URL for a file
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const path = url.searchParams.get('path');
    const bucket = url.searchParams.get('bucket') || 'simulation-media';

    if (!path) {
      return NextResponse.json(
        { error: 'Path parameter is required' },
        { status: 400 }
      );
    }

    console.log(`Creating signed URL for bucket: ${bucket}, path: ${path}`);
    
    const supabase = createRouteHandlerClient({ cookies });

    // Create a signed URL that will work even for private buckets
    const { data, error } = await supabase
      .storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60); // 1 hour expiration

    if (error) {
      console.error('Error creating signed URL:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to generate URL' },
        { status: 500 }
      );
    }

    if (!data || !data.signedUrl) {
      console.error('No signed URL was generated');
      return NextResponse.json(
        { error: 'Failed to generate URL' },
        { status: 500 }
      );
    }

    console.log(`Successfully created signed URL for ${path}`);
    return NextResponse.json({ url: data.signedUrl });
  } catch (error: any) {
    console.error('Error in storage API:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST route to upload a file
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const simulationId = formData.get('simulationId') as string;
    const projectId = formData.get('projectId') as string;
    const bucket = formData.get('bucket') as string || 'simulation-media';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Either simulationId or projectId must be provided
    if (!simulationId && !projectId) {
      return NextResponse.json(
        { error: 'Either Simulation ID or Project ID is required' },
        { status: 400 }
      );
    }

    // Determine the entity ID and bucket
    const entityId = simulationId || projectId;
    const defaultBucket = simulationId ? 'simulation-media' : 'project-media';
    const finalBucket = bucket || defaultBucket;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload JPG, PNG, or PDF files only.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 50MB.' },
        { status: 400 }
      );
    }

    // Generate unique file path
    // const fileExtension = file.name.split('.').pop();
    // const uniqueId = uuidv4();
    // const filePath = `${simulationId}/${uniqueId}.${fileExtension}`;


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
    // New path format: entityId/sanitized-file-name-uniqueId.extension
    const filePath = `${entityId}/${sanitizedFileName}-${uniqueId}.${fileExtension}`;

    console.log(`Uploading file to bucket: ${finalBucket}, path: ${filePath}`);

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(finalBucket)
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
      .from(finalBucket)
      .getPublicUrl(filePath);

    console.log(`Successfully uploaded file: ${filePath}`);
    
    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
      fileName: file.name
    });

  } catch (error: any) {
    console.error('Error in storage upload API:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 