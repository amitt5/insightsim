import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { extractTextFromFile, generateContextString, ExtractionResult } from '@/utils/textExtraction';

export async function POST(
  request: NextRequest,
  { params }: { params: { simulationId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { simulationId } = params;
    // Verify simulation exists and user has access
    const { data: simulation, error: simError } = await supabase
      .from('simulations')
      .select('id, user_id')
      .eq('id', simulationId)
      .single();

    if (simError || !simulation) {
      return NextResponse.json({ error: 'Simulation not found' }, { status: 404 });
    }

    if (simulation.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    // Fetch all documents for this simulation
    const { data: documents, error: docsError } = await supabase
      .from('simulation_documents')
      .select('*')
      .eq('simulation_id', simulationId)
      .order('created_at', { ascending: true });

    if (docsError) {
      console.error('Error fetching documents:', docsError);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    if (!documents || documents.length === 0) {
      // No documents to process - clear context
      const { error: updateError } = await supabase
        .from('simulations')
        .update({ 
          context_string: null,
          context_processed_at: new Date().toISOString()
        })
        .eq('id', simulationId);

      if (updateError) {
        console.error('Error clearing context:', updateError);
        return NextResponse.json({ error: 'Failed to update simulation' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        contextString: '',
        warnings: [],
        processedCount: 0
      });
    }

    // Process each document
    const extractions: ExtractionResult[] = [];
    
    for (const doc of documents) {
      try {
        // Download file from Supabase storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('rag-documents')
          .download(doc.file_path);

        if (downloadError || !fileData) {
          extractions.push({
            success: false,
            error: `Failed to download file: ${downloadError?.message || 'Unknown error'}`,
            fileName: doc.file_name
          });
          continue;
        }

        // Convert to buffer
        const buffer = Buffer.from(await fileData.arrayBuffer());
        
        // Extract text based on file type
        const extraction = await extractTextFromFile(buffer, doc.file_name, doc.file_type);
        extractions.push(extraction);

      } catch (error) {
        extractions.push({
          success: false,
          error: `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          fileName: doc.file_name
        });
      }
    }

    // Generate context string
    const { contextString, warnings } = generateContextString(extractions);

    // Update simulation with context
    const { error: updateError } = await supabase
      .from('simulations')
      .update({ 
        context_string: contextString || null,
        context_processed_at: new Date().toISOString()
      })
      .eq('id', simulationId);

    if (updateError) {
      console.error('Error updating simulation context:', updateError);
      return NextResponse.json({ error: 'Failed to save context' }, { status: 500 });
    }

    const successfulExtractions = extractions.filter(e => e.success).length;

    return NextResponse.json({
      success: true,
      contextString,
      warnings,
      processedCount: successfulExtractions,
      totalDocuments: documents.length,
      contextLength: contextString.length
    });

  } catch (error) {
    console.error('Document processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { simulationId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { simulationId } = params;

    // Get simulation context info
    const { data: simulation, error: simError } = await supabase
      .from('simulations')
      .select('context_string, context_processed_at, user_id')
      .eq('id', simulationId)
      .single();

    if (simError || !simulation) {
      return NextResponse.json({ error: 'Simulation not found' }, { status: 404 });
    }

    if (simulation.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      contextString: simulation.context_string,
      contextProcessedAt: simulation.context_processed_at,
      contextLength: simulation.context_string?.length || 0
    });

  } catch (error) {
    console.error('Error fetching context:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
