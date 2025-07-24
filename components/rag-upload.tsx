"use client"

import React, { useState, useCallback, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Upload, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Loader2,
  FileText,
  Download,
  ChevronUp,
  ChevronDown
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { 
  uploadRAGDocument, 
  getRAGDocuments, 
  deleteRAGDocument,
  formatFileSize,
  getStatusColor,
  type RAGDocument 
} from "@/utils/ragApi"

interface RAGUploadProps {
  simulationId: string
  disabled?: boolean
}

export function RAGUpload({ simulationId, disabled = false }: RAGUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, number>>(new Map())
  const [documents, setDocuments] = useState<RAGDocument[]>([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Load existing documents
  const loadDocuments = useCallback(async () => {
    if (!simulationId) return
    
    setIsLoadingDocuments(true)
    try {
      const response = await getRAGDocuments(simulationId)
      setDocuments(response.documents)
    } catch (error) {
      console.error('Failed to load documents:', error)
      toast({
        title: "Error",
        description: "Failed to load existing documents",
        variant: "destructive"
      })
    } finally {
      setIsLoadingDocuments(false)
    }
  }, [simulationId, toast])

  // Load documents on mount and when expanded
  React.useEffect(() => {
    if (isExpanded) {
      loadDocuments()
    }
  }, [isExpanded, loadDocuments])

  // Handle file selection
  const handleFiles = useCallback(async (files: FileList) => {
    if (disabled) return

    const validFiles = Array.from(files).filter(file => {
      const allowedTypes = ['text/plain', 'text/csv', 'application/json']
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not supported. Only text files are allowed.`,
          variant: "destructive"
        })
        return false
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File Too Large",
          description: `${file.name} is too large. Maximum size is 10MB.`,
          variant: "destructive"
        })
        return false
      }
      
      return true
    })

    for (const file of validFiles) {
      const fileId = `${file.name}-${Date.now()}`
      setUploadingFiles(prev => new Map(prev.set(fileId, 0)))

      try {
        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setUploadingFiles(prev => {
            const current = prev.get(fileId) || 0
            if (current < 90) {
              return new Map(prev.set(fileId, current + 10))
            }
            return prev
          })
        }, 200)

        const response = await uploadRAGDocument(file, simulationId)
        
        clearInterval(progressInterval)
        setUploadingFiles(prev => new Map(prev.set(fileId, 100)))
        
        toast({
          title: "Upload Successful",
          description: `${file.name} has been uploaded and is being processed.`
        })

        // Remove from uploading list after a delay
        setTimeout(() => {
          setUploadingFiles(prev => {
            const newMap = new Map(prev)
            newMap.delete(fileId)
            return newMap
          })
        }, 2000)

        // Reload documents if expanded
        if (isExpanded) {
          loadDocuments()
        }

      } catch (error) {
        setUploadingFiles(prev => {
          const newMap = new Map(prev)
          newMap.delete(fileId)
          return newMap
        })
        
        toast({
          title: "Upload Failed",
          description: error instanceof Error ? error.message : "Failed to upload file",
          variant: "destructive"
        })
      }
    }
  }, [simulationId, disabled, toast, isExpanded, loadDocuments])

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragOver(true)
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (!disabled && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }, [disabled, handleFiles])

  // File input handler
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }, [handleFiles])

  // Delete document
  const handleDeleteDocument = useCallback(async (documentId: string) => {
    try {
      await deleteRAGDocument(documentId)
      toast({
        title: "Document Deleted",
        description: "Document has been successfully deleted."
      })
      loadDocuments()
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete document",
        variant: "destructive"
      })
    }
  }, [toast, loadDocuments])

  const getStatusIcon = (status: RAGDocument['processing_status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <File className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {/* Main Upload Area */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragOver 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm font-medium text-gray-700">Upload docs for RAG</p>
          <p className="text-xs text-gray-500 mt-1">
            Drag & drop text files here, or click to browse
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Supports: .txt, .csv, .json (max 10MB)
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.csv,.json,text/plain,text/csv,application/json"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />

        {/* Upload Progress */}
        {uploadingFiles.size > 0 && (
          <div className="mt-4 space-y-2">
            {Array.from(uploadingFiles.entries()).map(([fileId, progress]) => (
              <div key={fileId} className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">{fileId.split('-')[0]}</span>
                    <span className="text-gray-500">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-1 mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Documents List Toggle */}
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full justify-between"
          >
            <span>
              View Documents ({documents.length})
            </span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Documents List */}
        {isExpanded && (
          <div className="mt-4">
            <Separator className="mb-4" />
            
            {isLoadingDocuments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2 text-sm text-gray-600">Loading documents...</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No documents uploaded yet
              </div>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0">
                        {getStatusIcon(doc.processing_status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {doc.filename}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getStatusColor(doc.processing_status)}`}
                          >
                            {doc.processing_status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatFileSize(doc.file_size)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(doc.upload_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="flex-shrink-0 text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 