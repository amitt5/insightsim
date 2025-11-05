import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import {
  getOrCreateCollection,
  getFileUploadUrl,
  uploadFileToNeedle,
  getFileDownloadUrl,
  addFileToCollection,
} from "@/lib/needle"

// POST route to process a RAG document using Needle API
export async function POST(
  request: Request,
  { params }: { params: { projectId: string; documentId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get session data to verify user is logged in
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // First, get the document to verify ownership
    const { data: document, error: fetchError } = await supabase
      .from("rag_documents")
      .select("*")
      .eq("id", params.documentId)
      .eq("project_id", params.projectId)
      .eq("user_id", session.user.id)
      .single()

    if (fetchError) {
      console.error("Error fetching document:", fetchError)
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Check if document is already processed
    if (document.status === 'completed') {
      return NextResponse.json({ 
        message: "Document is already processed",
        document 
      })
    }

    // Update document status to processing
    const { error: updateError } = await supabase
      .from("rag_documents")
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq("id", params.documentId)

    if (updateError) {
      console.error("Error updating document status:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    try {
      // Step 1: Get or create Needle collection for the project
      console.log(`Getting or creating Needle collection for project: ${params.projectId}`)
      
      // Get project to check for existing collection ID
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("needle_collection_id")
        .eq("id", params.projectId)
        .eq("user_id", session.user.id)
        .single()

      if (projectError || !project) {
        console.error("Error fetching project:", projectError)
        throw new Error("Failed to fetch project information")
      }

      const collectionId = await getOrCreateCollection(
        params.projectId,
        project.needle_collection_id || null
      )

      // Update project with collection ID if it's new
      if (!project.needle_collection_id) {
        const { error: updateProjectError } = await supabase
          .from("projects")
          .update({ needle_collection_id: collectionId })
          .eq("id", params.projectId)

        if (updateProjectError) {
          console.error("Error updating project with collection ID:", updateProjectError)
          // Continue anyway, collection is created
        }
      }

      console.log(`Using Needle collection: ${collectionId}`)

      // Step 2: Download file from Supabase storage
      console.log(`Downloading file from Supabase: ${document.file_path}`)
      const { data: fileBlob, error: downloadError } = await supabase.storage
        .from('rag-documents')
        .download(document.file_path)

      if (downloadError) {
        console.error("Error downloading file:", downloadError)
        throw new Error("Failed to download document from storage")
      }

      // Convert Blob to Buffer for Needle upload
      const fileBuffer = Buffer.from(await fileBlob.arrayBuffer())
      const contentType = document.mime_type || 'application/pdf'

      console.log(`File downloaded: ${fileBuffer.length} bytes, type: ${contentType}`)

      // Step 3: Get upload URL from Needle
      console.log("Getting upload URL from Needle...")
      const uploadUrlResponse = await getFileUploadUrl(contentType)
      const { upload_url, file_id } = uploadUrlResponse.result

      console.log(`Got upload URL, file_id: ${file_id}`)

      // Step 4: Upload file to Needle
      console.log("Uploading file to Needle...")
      await uploadFileToNeedle(upload_url, fileBuffer, contentType)
      console.log("File uploaded successfully to Needle")

      // Step 5: Get download URL for the uploaded file (required for adding to collection)
      console.log("Getting file download URL from Needle...")
      const downloadUrlResponse = await getFileDownloadUrl(file_id)
      const fileUrl = downloadUrlResponse.result.download_url

      console.log(`Got file download URL for Needle collection`)

      // Step 6: Add file to collection
      console.log(`Adding file to Needle collection: ${collectionId}`)
      const addFileResponse = await addFileToCollection(
        collectionId,
        fileUrl,
        document.original_filename,
        document.updated_at
      )

      console.log(`File added to collection successfully`)

      // Step 7: Update document with Needle information
      const { error: updateDocumentError } = await supabase
        .from("rag_documents")
        .update({ 
          needle_collection_id: collectionId,
          needle_file_id: file_id,
          processing_method: 'needle',
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq("id", params.documentId)

      if (updateDocumentError) {
        console.error("Error updating document with Needle info:", updateDocumentError)
        throw new Error("Failed to update document with Needle information")
      }

      console.log(`Successfully processed RAG document with Needle: ${document.original_filename}`)
      
      return NextResponse.json({
        success: true,
        message: "Document processed successfully with Needle API",
        collectionId: collectionId,
        fileId: file_id,
        processingMethod: 'needle',
        document: {
          id: document.id,
          filename: document.original_filename,
          status: 'completed'
        }
      })

    } catch (processingError: any) {
      console.error("Error processing document with Needle:", processingError)
      
      // Update document status to failed
      await supabase
        .from("rag_documents")
        .update({ 
          status: 'failed',
          processing_error: processingError.message || 'Document processing failed',
          updated_at: new Date().toISOString()
        })
        .eq("id", params.documentId)

      return NextResponse.json({ 
        error: processingError.message || 'Document processing failed. Please try again.' 
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Error in RAG document processing API:', error)
    return NextResponse.json({ 
      error: error.message || 'An unexpected error occurred' 
    }, { status: 500 })
  }
}
