import { DocumentProcessorServiceClient, protos } from '@google-cloud/documentai';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { PDFDocument } from 'pdf-lib';

// Define interfaces based on the actual structure we receive
interface DocumentPage {
  pageNumber: number | undefined;
  text: string | undefined;
}

interface DocumentEntity {
  type: string | undefined;
  mentionText: string | undefined;
  confidence: number | undefined;
}

interface DocumentCell {
  text: string | undefined;
}

interface DocumentRow {
  cells: DocumentCell[] | undefined;
}

interface DocumentTable {
  headerRows: DocumentRow[] | undefined;
  bodyRows: DocumentRow[] | undefined;
  text: string | undefined;
}

interface DocumentImage {
  text: string | undefined;
}

interface ProcessedDocument {
  text: string | undefined;
  pages: DocumentPage[];
  entities: DocumentEntity[];
  tables: DocumentTable[];
  images: DocumentImage[];
}

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
    const mimeType = file.type;

    // If it's a PDF, split into chunks
    let results = [];
    if (mimeType === 'application/pdf') {
      // Load PDF document
      const pdfDoc = await PDFDocument.load(buffer);
      const totalPages = pdfDoc.getPageCount();
      
      // Split into chunks of 14 pages
      const CHUNK_SIZE = 14;
      const chunks = [];
      
      for (let i = 0; i < totalPages; i += CHUNK_SIZE) {
        const chunkDoc = await PDFDocument.create();
        const pages = await chunkDoc.copyPages(pdfDoc, Array.from(Array(Math.min(CHUNK_SIZE, totalPages - i)), (_, index) => i + index));
        pages.forEach(page => chunkDoc.addPage(page));
        
        const chunkBytes = await chunkDoc.save();
        chunks.push(Buffer.from(chunkBytes));
      }

      // Process each chunk
      for (const chunk of chunks) {
        const [chunkResult] = await client.processDocument({
          name: processorName,
          rawDocument: {
            content: chunk,
            mimeType: mimeType,
          },
        });
        results.push(chunkResult);
      }
    } else {
      // For non-PDF files, process normally
      const [result] = await client.processDocument({
        name: processorName,
        rawDocument: {
          content: buffer,
          mimeType: mimeType,
        },
      });
      results = [result];
    }

    // Combine results if multiple chunks
    const combinedResult: { document: ProcessedDocument } = {
      document: {
        text: results.map(r => r.document?.text || '').join('\n'),
        pages: results.flatMap(r => r.document?.pages || []).map(page => ({
          pageNumber: page.pageNumber || undefined,
          text: (page as any).text || undefined
        })),
        entities: results.flatMap(r => r.document?.entities || []).map(entity => ({
          type: entity.type || undefined,
          mentionText: entity.mentionText || undefined,
          confidence: entity.confidence || undefined
        })),
        tables: results.flatMap(r => (r.document as any)?.tables || []).map(table => ({
          headerRows: table.headerRows?.map((row: any) => ({
            cells: row.cells?.map((cell: any) => ({ 
              text: cell.text || undefined 
            }))
          })),
          bodyRows: table.bodyRows?.map((row: any) => ({
            cells: row.cells?.map((cell: any) => ({ 
              text: cell.text || undefined 
            }))
          })),
          text: table.text || undefined
        })),
        images: results.flatMap(r => (r.document as any)?.images || []).map(image => ({
          text: image.text || undefined
        }))
      }
    };

    // Structure the extracted information
    const processedData = {
      text: combinedResult.document.text,
      pages: combinedResult.document.pages?.map(page => ({
        pageNumber: page.pageNumber,
        text: page.text,
      })) || [],
      entities: combinedResult.document.entities?.map(entity => ({
        type: entity.type,
        text: entity.mentionText,
        confidence: entity.confidence,
      })) || [],
      tables: combinedResult.document.tables?.map(table => ({
        headerRows: table.headerRows?.map(row => 
          row.cells?.map(cell => cell.text).filter(Boolean)
        ),
        bodyRows: table.bodyRows?.map(row => 
          row.cells?.map(cell => cell.text).filter(Boolean)
        ),
        data: table.text,
      })) || [],
      images: combinedResult.document.images?.map(image => ({
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