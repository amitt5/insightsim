import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// POST route to perform vector similarity search
export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
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
      .eq("id", params.projectId)
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

    console.log(`Performing vector similarity search for query: "${query || 'unnamed'}"`)
    console.log(`Search parameters: limit=${limit}, threshold=${threshold}`)

    // Perform vector similarity search using pgvector
    // Using cosine similarity (<=> operator) and ordering by distance (ascending = most similar)
    const { data: searchResults, error: searchError } = await supabase
      .rpc('search_rag_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit,
        project_id: params.projectId
      })

    if (searchError) {
      console.error("Error performing vector search:", searchError)
      
      // Fallback to direct SQL query if RPC function doesn't exist
      const { data: fallbackResults, error: fallbackError } = await supabase
        .from('rag_document_chunks')
        .select(`
          id,
          document_id,
          chunk_index,
          chunk_text,
          metadata,
          chunk_embedding <=> '[${queryEmbedding.join(',')}]'::vector as distance,
          rag_documents!inner(original_filename, project_id)
        `)
        .eq('rag_documents.project_id', params.projectId)
        .order('distance', { ascending: true })
        .limit(limit)

      if (fallbackError) {
        console.error("Fallback search also failed:", fallbackError)
        throw new Error("Vector search failed")
      }

      console.log(`Found ${fallbackResults?.length || 0} similar chunks using fallback method`)
      
      return NextResponse.json({
        success: true,
        query: query || 'unnamed',
        results: fallbackResults?.map(result => ({
          id: result.id,
          documentId: result.document_id,
          chunkIndex: result.chunk_index,
          text: result.chunk_text,
          metadata: result.metadata,
          similarity: 1 - result.distance, // Convert distance to similarity score
          distance: result.distance,
          source: {
            filename: result.rag_documents.original_filename,
            projectId: result.rag_documents.project_id
          }
        })) || [],
        totalResults: fallbackResults?.length || 0,
        searchMethod: 'fallback'
      })
    }

    console.log(`Found ${searchResults?.length || 0} similar chunks using RPC function`)
    
    return NextResponse.json({
      success: true,
      query: query || 'unnamed',
      results: searchResults?.map(result => ({
        id: result.id,
        documentId: result.document_id,
        chunkIndex: result.chunk_index,
        text: result.chunk_text,
        metadata: result.metadata,
        similarity: result.similarity,
        distance: result.distance,
        source: {
          filename: result.original_filename,
          projectId: params.projectId
        }
      })) || [],
      totalResults: searchResults?.length || 0,
      searchMethod: 'rpc'
    })

  } catch (error: any) {
    console.error('Error in vector similarity search:', error)
    return NextResponse.json({ 
      error: error.message || 'Vector search failed' 
    }, { status: 500 })
  }
}
