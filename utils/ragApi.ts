export interface RAGDocument {
  id: string
  simulation_id: string
  document_name: string
  storage_path: string
  file_type: string
  file_size: number
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}

export interface RAGContext {
  success: boolean
  context: string
  chunks: Array<{
    content: string
    metadata: any
  }>
  totalChunks: number
  query: string
}

export interface RAGUploadResponse {
  success: boolean
  documentId: string
  fileName: string
  storagePath: string
  message: string
}

// Upload a document for RAG processing
export async function uploadRAGDocument(
  file: File, 
  simulationId: string
): Promise<RAGUploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('simulationId', simulationId)

  const response = await fetch('/api/rag/upload', {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Upload failed')
  }

  return response.json()
}

// Retrieve context for a query
export async function retrieveRAGContext(
  query: string,
  simulationId: string,
  maxChunks: number = 5
): Promise<RAGContext> {
  const response = await fetch('/api/rag/retrieve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query,
      simulationId,
      maxChunks
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Context retrieval failed')
  }

  return response.json()
}

// Get all documents for a simulation
export async function getRAGDocuments(simulationId: string): Promise<{
  success: boolean
  documents: RAGDocument[]
  count: number
}> {
  const response = await fetch(`/api/rag/documents/${simulationId}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch documents')
  }

  return response.json()
}

// Get individual document status
export async function getRAGDocumentStatus(documentId: string): Promise<{
  success: boolean
  document: RAGDocument
}> {
  const response = await fetch(`/api/rag/documents/${documentId}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch document status')
  }

  return response.json()
}

// Delete a document
export async function deleteRAGDocument(documentId: string): Promise<{
  success: boolean
  message: string
}> {
  const response = await fetch(`/api/rag/documents/${documentId}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete document')
  }

  return response.json()
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Get status badge color
export function getStatusColor(status: RAGDocument['processing_status']): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'processing':
      return 'bg-blue-100 text-blue-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'failed':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
} 