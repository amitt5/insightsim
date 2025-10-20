import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// POST route to perform vector similarity search
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const resolvedParams = await params;
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get session data to verify user is logged in
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user has access to this project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", resolvedParams.projectId)
      .eq("user_id", session.user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Parse request body
    const { query, queryEmbedding, limit = 5, threshold = 0.7 } = await request.json()
    
    if (!queryEmbedding || !Array.isArray(queryEmbedding)) {
      return NextResponse.json({ error: "Query embedding is required" }, { status: 400 })
    }

    if (queryEmbedding.length !== 1536) {
      return NextResponse.json({ 
        error: "Query embedding must be 1536-dimensional (OpenAI ada-002)" 
      }, { status: 400 })
    }

    console.log(`🔍 [API] Performing vector similarity search for query: "${query || 'unnamed'}"`)
    console.log(`🔍 [API] Search parameters: limit=${limit}, threshold=${threshold}`)
    console.log(`🔍 [API] Project ID: ${resolvedParams.projectId}`)
    console.log(`🔍 [API] Query embedding length: ${queryEmbedding.length}`)

    // Use RPC function with proper parameter handling
    console.log("🔧 [API] Using RPC function...");
    
    const { data: searchResults, error: searchError } = await supabase
      .rpc('search_rag_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit,
        target_project_id: resolvedParams.projectId
      })

    if (searchError) {
      console.error("RPC function failed:", searchError)
      throw new Error("Vector search failed")
    }

    console.log(`✅ [API] Found ${searchResults?.length || 0} similar chunks using RPC function`)
    console.log(`✅ [API] Raw search results:`, searchResults);
    
    const mappedResults = searchResults?.map(result => ({
      id: result.id,
      documentId: result.document_id,
      chunkIndex: result.chunk_index,
      text: result.chunk_text,
      metadata: result.metadata,
      similarity: result.similarity,
      distance: result.distance,
      source: {
        filename: result.original_filename,
        projectId: resolvedParams.projectId
      }
    })) || [];
    
    console.log(`✅ [API] Mapped results:`, mappedResults);
    console.log(`✅ [API] Mapped results length:`, mappedResults.length);
    
    return NextResponse.json({
      success: true,
      query: query || 'unnamed',
      results: mappedResults,
      totalResults: mappedResults.length,
      searchMethod: 'rpc'
    })

  } catch (error: any) {
    console.error('Error in vector similarity search:', error)
    return NextResponse.json({ 
      error: error.message || 'Vector search failed' 
    }, { status: 500 })
  }
}
