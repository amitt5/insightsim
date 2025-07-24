import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { simulationId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { simulationId } = params

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

    // Get all documents for this simulation
    const { data: documents, error: docError } = await supabase
      .from('rag_documents')
      .select('*')
      .eq('simulation_id', simulationId)
      .order('created_at', { ascending: false })

    if (docError) {
      console.error('Error fetching documents:', docError)
      return NextResponse.json(
        { error: "Failed to fetch documents" }, 
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      documents: documents || [],
      count: documents?.length || 0
    })

  } catch (error) {
    console.error('RAG documents list error:', error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
} 