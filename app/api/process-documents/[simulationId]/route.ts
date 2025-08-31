import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { NextResponse } from 'next/server';
// import { createClient } from '@/lib/supabase';
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Initialize Document AI client
const client = new DocumentProcessorServiceClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us';
const processorId = process.env.GOOGLE_CLOUD_PROCESSOR_ID;

if (!projectId || !processorId) {
  throw new Error('Missing required environment variables for Document AI');
}

const processorName = `projects/${projectId}/locations/${location}/processors/${processorId}`;

export async function GET(req: Request, { params }: { params: { simulationId: string } }) {
  try {
    const { simulationId } = params;
    const supabase = createRouteHandlerClient({ cookies });

    // Get all documents for this simulation
    const { data: documents, error } = await supabase
      .from('simulation_documents')
      .select('context_string, context_processed_at')
      .eq('simulation_id', simulationId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    // Calculate total context length and get latest processed time
    let contextLength = 0;
    let latestProcessedAt: string | null = null;

    documents?.forEach(doc => {
      if (doc.context_string) {
        contextLength += doc.context_string.length;
      }
      if (doc.context_processed_at) {
        if (!latestProcessedAt || new Date(doc.context_processed_at) > new Date(latestProcessedAt)) {
          latestProcessedAt = doc.context_processed_at;
        }
      }
    });

    return NextResponse.json({
      success: true,
      contextLength,
      contextProcessedAt: latestProcessedAt
    });

  } catch (error) {
    console.error('Error fetching context:', error);
    return NextResponse.json(
      { error: 'Failed to fetch context' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: { params: { simulationId: string } }) {
  try {
    const { simulationId } = params;
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const documentId = formData.get('documentId') as string;

    if (!file || !documentId) {
      return NextResponse.json(
        { error: 'File and document ID are required' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Get mime type
    const mimeType = file.type;
    console.log('amit-mimeType',process.env.GOOGLE_APPLICATION_CREDENTIALS, mimeType, client);
    // Process document with Document AI
    const [result] = await client.processDocument({
      name: processorName,
      rawDocument: {
        content: buffer,
        mimeType: mimeType,
      },
    });

    const document = result.document;

    // Structure the extracted information
    const processedData = {
      text: document?.text || '',
      pages: document?.pages?.map(page => ({
        pageNumber: page.pageNumber,
        text: page.text,
      })) || [],
      entities: document?.entities?.map(entity => ({
        type: entity.type,
        text: entity.mentionText,
        confidence: entity.confidence,
      })) || [],
      tables: document?.tables?.map(table => ({
        headerRows: table.headerRows?.map(row => 
          row.cells?.map(cell => cell.text).filter(Boolean)
        ),
        bodyRows: table.bodyRows?.map(row => 
          row.cells?.map(cell => cell.text).filter(Boolean)
        ),
        data: table.text,
      })) || [],
      images: document?.images?.map(image => ({
        description: image.text,
      })) || [],
    };

    // Update the document in the database
    const supabase = createRouteHandlerClient({ cookies })
    const { error: updateError } = await supabase
      .from('simulation_documents')
      .update({
        context_string: JSON.stringify(processedData),
        context_processed_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Error updating document:', updateError);
      return NextResponse.json(
        { error: 'Failed to update document in database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document processed successfully',
      data: processedData,
    });

  } catch (error) {
    console.error('Error processing document:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
}