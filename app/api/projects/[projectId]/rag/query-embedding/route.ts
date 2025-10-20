import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import OpenAI from "openai"

// POST route to generate embedding for a user query
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
    const { query } = await request.json()
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    console.log(`Generating embedding for query: "${query}"`)

    // Generate embedding for the query
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query.trim(),
    })

    const embedding = response.data[0].embedding
    console.log(`Generated ${embedding.length}-dimensional embedding for query`)

    return NextResponse.json({
      success: true,
      query: query.trim(),
      embedding: embedding,
      embeddingDimensions: embedding.length,
      model: "text-embedding-ada-002"
    })

  } catch (error: any) {
    console.error('Error generating query embedding:', error)
    
    if (error.code === 'insufficient_quota') {
      return NextResponse.json({ 
        error: "OpenAI API quota exceeded. Please check your billing." 
      }, { status: 402 })
    }
    
    return NextResponse.json({ 
      error: error.message || 'Failed to generate query embedding' 
    }, { status: 500 })
  }
}
