import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// GET request to fetch all documents for a specific simulation
export async function GET(
  request: Request,
  { params }: { params: { simulationId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { simulationId } = params
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('simulation_documents')
      .select('*')
      .eq('simulation_id', simulationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error("Error fetching documents:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ documents: data || [] })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

// POST request to save document metadata
export async function POST(
  request: Request,
  { params }: { params: { simulationId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { simulationId } = params
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { documents } = await request.json() as { 
      documents: Array<{
        file_name: string;
        file_path: string;
        file_type: string;
        file_size: number;
      }>
    }

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json(
        { error: 'No documents provided' },
        { status: 400 }
      );
    }

    // Add simulation_id to each document
    const documentsWithSimulationId = documents.map(doc => ({
      ...doc,
      simulation_id: simulationId
    }));

    const { data, error } = await supabase
      .from('simulation_documents')
      .insert(documentsWithSimulationId)
      .select()

    if (error) {
      console.error("Error saving documents:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      documents: data,
      message: `Successfully saved ${documents.length} document(s)`
    })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

// DELETE request to remove a document
export async function DELETE(
  request: Request,
  { params }: { params: { simulationId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { simulationId } = params
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const documentId = url.searchParams.get('documentId');
    const filePath = url.searchParams.get('filePath');

    if (!documentId || !filePath) {
      return NextResponse.json(
        { error: 'Document ID and file path are required' },
        { status: 400 }
      );
    }

    // Delete from storage first
    const { error: storageError } = await supabase.storage
      .from('rag-documents')
      .remove([filePath]);

    if (storageError) {
      console.error("Error deleting file from storage:", storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('simulation_documents')
      .delete()
      .eq('id', documentId)
      .eq('simulation_id', simulationId); // Extra security check

    if (dbError) {
      console.error("Error deleting document from database:", dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Document deleted successfully'
    })
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
