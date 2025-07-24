import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const PYTHON_RAG_SERVICE_URL = process.env.PYTHON_RAG_SERVICE_URL || 'http://localhost:8000'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { query, simulationId, maxChunks = 5 } = body

    if (!query || !simulationId) {
      return NextResponse.json(
        { error: "Query and simulationId are required" }, 
        { status: 400 }
      )
    }

    // Verify user has access to this simulation
    const { data: simulation, error: simError } = await supabase
      .from('simulations')
      .select('id')
      .eq('id', simulationId)
      .single()

    if (simError || !simulation) {
      return NextResponse.json(
        { error: "Simulation not found or access denied" }, 
        { status: 404 }
      )
    }

    // Call Python service for context retrieval
    try {
      const response = await fetch(`${PYTHON_RAG_SERVICE_URL}/api/retrieve-context`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          simulation_id: simulationId,
          max_chunks: maxChunks
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Python service error:', errorText)
        return NextResponse.json(
          { error: "Failed to retrieve context from RAG service" }, 
          { status: 500 }
        )
      }

      const ragResponse = await response.json()
      
      return NextResponse.json({
        success: true,
        context: ragResponse.context || '',
        chunks: ragResponse.chunks || [],
        totalChunks: ragResponse.total_chunks || 0,
        query
      })

    } catch (error) {
      console.error('Error calling Python RAG service:', error)
      return NextResponse.json(
        { error: "RAG service unavailable" }, 
        { status: 503 }
      )
    }

  } catch (error) {
    console.error('RAG retrieve error:', error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
} 