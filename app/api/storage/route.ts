import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

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