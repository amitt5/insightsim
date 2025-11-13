import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { searchFileStore } from "@/lib/googleFileSearch"

// POST route to perform semantic search using Google File Search
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

    // Verify user has access to this project and get File Search Store ID
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, google_file_search_store_id")
      .eq("id", resolvedParams.projectId)
      .eq("user_id", session.user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (!project.google_file_search_store_id) {
      return NextResponse.json({ 
        error: "No File Search Store found for this project. Please upload documents first." 
      }, { status: 400 })
    }

    // Parse request body
    const { query, limit = 5 } = await request.json()
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: "Query string is required" }, { status: 400 })
    }

    // Search File Search Store using Google Gemini API
    const searchResults = await searchFileStore(
      project.google_file_search_store_id,
      query,
      { maxResults: limit }
    )

    // Map Google's response format to match existing response structure
    const mappedResults: Array<{
      id: string;
      documentId: string;
      chunkIndex: number;
      text: string;
      metadata: any;
      similarity: number;
      source: {
        filename: string;
        projectId: string;
      };
    }> = []

    if (searchResults.candidates && searchResults.candidates.length > 0) {
      const candidate = searchResults.candidates[0]
      
      // Extract text from response
      const responseText = candidate.content?.parts
        ?.map((part: { text?: string }) => part.text)
        .join(' ') || ''

      // Extract grounding metadata (citations)
      const groundingChunks = candidate.groundingMetadata?.groundingChunks || []
      
      groundingChunks.forEach((chunk, index) => {
        const documentName = chunk.documentChunkInfo?.documentName || ''
        const chunkIndex = chunk.documentChunkInfo?.chunkIndex || index
        const relevanceScore = chunk.chunk?.chunkRelevanceScore || 0

        // Extract filename from document name (format: files/{file_id})
        const fileId = documentName.replace('files/', '')
        
        mappedResults.push({
          id: chunk.chunk?.chunkId || `${fileId}-${chunkIndex}`,
          documentId: fileId,
          chunkIndex: chunkIndex,
          text: responseText, // Use the full response text for now
          metadata: {
            documentName,
            chunkId: chunk.chunk?.chunkId,
            relevanceScore
          },
          similarity: relevanceScore,
          source: {
            filename: fileId, // We'll need to look up the actual filename from database
            projectId: resolvedParams.projectId
          }
        })
      })

      // If no grounding chunks but we have text, create a single result
      if (mappedResults.length === 0 && responseText) {
        mappedResults.push({
          id: 'response-0',
          documentId: 'unknown',
          chunkIndex: 0,
          text: responseText,
          metadata: {},
          similarity: 1.0,
          source: {
            filename: 'unknown',
            projectId: resolvedParams.projectId
          }
        })
      }
    }

    // Look up actual filenames from database for better source information
    if (mappedResults.length > 0) {
      const fileIds = mappedResults
        .map(r => r.documentId)
        .filter(id => id !== 'unknown' && id !== '')
        .map(id => `files/${id}`)

      if (fileIds.length > 0) {
        const { data: documents } = await supabase
          .from("rag_documents")
          .select("google_file_name, original_filename")
          .eq("project_id", resolvedParams.projectId)
          .in("google_file_name", fileIds.map(id => id.replace('files/', '')))

        const filenameMap = new Map(
          documents?.map(doc => [doc.google_file_name, doc.original_filename]) || []
        )

        mappedResults.forEach(result => {
          if (result.documentId !== 'unknown') {
            const fileId = result.documentId
            const originalFilename = filenameMap.get(fileId) || result.source.filename
            result.source.filename = originalFilename
          }
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      query: query,
      results: mappedResults,
      totalResults: mappedResults.length,
      searchMethod: 'google_file_search'
    })

  } catch (error: any) {
    console.error('Error in Google File Search:', error)
    return NextResponse.json({ 
      error: error.message || 'File search failed' 
    }, { status: 500 })
  }
}
