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
    const bucket = formData.get('bucket') as string || 'simulation-media';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!simulationId) {
      return NextResponse.json(
        { error: 'Simulation ID is required' },
        { status: 400 }
      );
    }

    // Validate file type based on bucket
    const mediaTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    const allowedTypes = bucket === 'rag-documents' ? documentTypes : mediaTypes;
    const fileTypeMessage = bucket === 'rag-documents' 
      ? 'Invalid file type. Please upload PDF, DOCX, DOC, TXT, MD, CSV, or XLSX files only.'
      : 'Invalid file type. Please upload JPG, PNG, or PDF files only.';
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: fileTypeMessage },
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
    // New path format: simulationId/sanitized-file-name-uniqueId.extension
    const filePath = `${simulationId}/${sanitizedFileName}-${uniqueId}.${fileExtension}`;




    console.log(`Uploading file to bucket: ${bucket}, path: ${filePath}`);

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucket)
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
      .from(bucket)
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