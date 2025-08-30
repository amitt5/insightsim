import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { extractTextFromFile, generateContextString, ExtractionResult, cleanText } from '@/utils/textExtraction';

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

    // Process each document individually
    const warnings: string[] = [];
    let processedCount = 0;
    let totalContextLength = 0;
    
    for (const doc of documents) {
      try {
        // Download file from Supabase storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('rag-documents')
          .download(doc.file_path);

        if (downloadError || !fileData) {
          warnings.push(`Failed to download "${doc.file_name}": ${downloadError?.message || 'Unknown error'}`);
          continue;
        }

        // Convert to buffer
        const buffer = Buffer.from(await fileData.arrayBuffer());
        
        // Extract text based on file type
        const extraction = await extractTextFromFile(buffer, doc.file_name, doc.file_type);
        
        if (extraction.success && extraction.text) {
          // Clean the text
          const cleanedText = cleanText(extraction.text);
          
          // Update document with context
          const { error: updateError } = await supabase
            .from('simulation_documents')
            .update({ 
              context_string: cleanedText,
              context_processed_at: new Date().toISOString()
            })
            .eq('id', doc.id);

          if (updateError) {
            console.error(`Error updating document ${doc.id} context:`, updateError);
            warnings.push(`Failed to save context for "${doc.file_name}"`);
          } else {
            processedCount++;
            totalContextLength += cleanedText.length;
          }
        } else {
          warnings.push(`Failed to extract text from "${doc.file_name}": ${extraction.error}`);
        }

      } catch (error) {
        warnings.push(`Processing error for "${doc.file_name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      warnings,
      processedCount,
      totalDocuments: documents.length,
      contextLength: totalContextLength
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

    // Get all documents with their contexts
    const { data: documents, error: docsError } = await supabase
      .from('simulation_documents')
      .select('*')
      .eq('simulation_id', simulationId)
      .order('created_at', { ascending: true });

    if (docsError) {
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    // Aggregate context from all processed documents
    let aggregatedContext = '';
    let latestProcessedAt: string | null = null;
    let totalContextLength = 0;

    if (documents && documents.length > 0) {
      const processedDocs = documents.filter(doc => doc.context_string);
      
      processedDocs.forEach((doc, index) => {
        if (doc.context_string) {
          const documentHeader = `\n=== Document ${index + 1}: ${doc.file_name} ===\n`;
          aggregatedContext += documentHeader + doc.context_string + '\n\n';
          totalContextLength += doc.context_string.length;
          
          // Track latest processing time
          if (!latestProcessedAt || (doc.context_processed_at && doc.context_processed_at > latestProcessedAt)) {
            latestProcessedAt = doc.context_processed_at;
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      contextString: aggregatedContext.trim(),
      contextProcessedAt: latestProcessedAt,
      contextLength: totalContextLength,
      documentsWithContext: documents?.filter(doc => doc.context_string).length || 0,
      totalDocuments: documents?.length || 0
    });

  } catch (error) {
    console.error('Error fetching context:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
