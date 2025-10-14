"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X, FileIcon, ImageIcon, Loader2, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { validateFile, createFilePreview, revokeFilePreview } from '@/utils/fileUpload'
import { uploadMultipleProjectMedia, deleteProjectMedia, getSignedUrlsForProjectMedia } from '@/utils/projectMedia'

interface ProjectMediaUploadProps {
  projectId: string
  mediaUrls: string[]
  onMediaUpdate: (mediaUrls: string[]) => void
}

interface MediaFile {
  id: string
  name: string
  size: number
  type: string
  url?: string
  preview?: string
  isUploading?: boolean
  uploadProgress?: number
}

export default function ProjectMediaUpload({ projectId, mediaUrls, onMediaUpdate }: ProjectMediaUploadProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({})
  const [signedUrls, setSignedUrls] = useState<{[key: string]: string}>({})

  // Load signed URLs for existing media files
  useEffect(() => {
    const loadSignedUrls = async () => {
      if (mediaUrls.length > 0) {
        try {
          const urls = await getSignedUrlsForProjectMedia(mediaUrls)
          const urlMap: {[key: string]: string} = {}
          mediaUrls.forEach((originalUrl, index) => {
            urlMap[originalUrl] = urls[index] || originalUrl
          })
          setSignedUrls(urlMap)
        } catch (error) {
          console.error('Error loading signed URLs:', error)
        }
      }
    }

    loadSignedUrls()
  }, [mediaUrls])

  // Handle file selection
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const newFiles: MediaFile[] = []
    const newPreviews: {[key: string]: string} = {}

    Array.from(files).forEach((file) => {
      const validation = validateFile(file)
      if (!validation.isValid) {
        toast({
          title: "Invalid file",
          description: validation.error,
          variant: "destructive",
        })
        return
      }

      const mediaFile: MediaFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        isUploading: false,
        uploadProgress: 0
      }

      // Create preview for images
      if (file.type.startsWith('image/')) {
        mediaFile.preview = createFilePreview(file)
        newPreviews[file.name] = mediaFile.preview
      }

      newFiles.push(mediaFile)
    })

    if (newFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...newFiles])
      toast({
        title: "Files selected",
        description: `${newFiles.length} file(s) ready for upload`,
      })
    }
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    handleFileSelect(e.dataTransfer.files)
  }

  // Upload selected files
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    setIsUploading(true)
    const uploadedUrls: string[] = []

    try {
      // Convert selected files to File objects
      const filesToUpload = selectedFiles.map(file => new File([], file.name, { type: file.type }))

      // Upload files with progress tracking
      const results = await uploadMultipleProjectMedia(
        filesToUpload,
        projectId,
        (fileIndex, result) => {
          const file = selectedFiles[fileIndex]
          if (result.success) {
            setSelectedFiles(prev => prev.map(f => 
              f.id === file.id ? { ...f, isUploading: false, url: result.url } : f
            ))
            uploadedUrls.push(result.url!)
          } else {
            setSelectedFiles(prev => prev.map(f => 
              f.id === file.id ? { ...f, isUploading: false } : f
            ))
            toast({
              title: "Upload failed",
              description: `Failed to upload ${file.name}: ${result.error}`,
              variant: "destructive",
            })
          }
        }
      )

      // Update project media URLs with successful uploads
      if (uploadedUrls.length > 0) {
        const updatedMediaUrls = [...mediaUrls, ...uploadedUrls]
        onMediaUpdate(updatedMediaUrls)

        toast({
          title: "Upload successful",
          description: `${uploadedUrls.length} file(s) uploaded successfully`,
        })
      }

      // Clear selected files
      setSelectedFiles([])
      setUploadProgress({})

    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Remove file from selection
  const handleRemoveFile = (fileId: string) => {
    setSelectedFiles(prev => {
      const file = prev.find(f => f.id === fileId)
      if (file?.preview) {
        revokeFilePreview(file.preview)
      }
      return prev.filter(f => f.id !== fileId)
    })
  }

  // Remove uploaded media
  const handleRemoveMedia = async (urlToRemove: string) => {
    try {
      const result = await deleteProjectMedia(projectId, urlToRemove)
      
      if (result.success) {
        const updatedMediaUrls = mediaUrls.filter(url => url !== urlToRemove)
        onMediaUpdate(updatedMediaUrls)
        
        toast({
          title: "File removed",
          description: "Media file has been removed from the project",
        })
      } else {
        toast({
          title: "Remove failed",
          description: result.error || "Failed to remove media file",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error removing media:', error)
      toast({
        title: "Remove failed",
        description: "Failed to remove media file. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Check if URL is an image
  const isImageUrl = (url: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    return imageExtensions.some(ext => url.toLowerCase().includes(ext))
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Media Files</CardTitle>
          <CardDescription>
            Upload images and PDFs to share with your project team. Maximum file size: 10MB
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Drag & Drop Area */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">Drop files here or click to browse</p>
            <p className="text-sm text-gray-500 mb-4">
              Supports JPG, PNG, and PDF files up to 10MB each
            </p>
            <Button variant="outline" type="button">
              Select Files
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,application/pdf"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-3">Selected Files ({selectedFiles.length})</h4>
              <div className="space-y-2">
                {selectedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {file.preview ? (
                        <img src={file.preview} alt={file.name} className="w-10 h-10 object-cover rounded" />
                      ) : (
                        <FileIcon className="w-10 h-10 text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                        {file.isUploading && (
                          <div className="flex items-center space-x-2 mt-1">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm text-blue-600">
                              Uploading... {Math.round(uploadProgress[file.name] || 0)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(file.id)}
                      disabled={file.isUploading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedFiles([])}
                  disabled={isUploading}
                >
                  Clear All
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || selectedFiles.length === 0}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Files
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media Gallery */}
      {mediaUrls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Project Media ({mediaUrls.length})</CardTitle>
            <CardDescription>
              Media files uploaded to this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mediaUrls.map((url, index) => {
                const displayUrl = signedUrls[url] || url
                return (
                  <div key={index} className="relative group">
                    <div className="aspect-square border rounded-lg overflow-hidden bg-gray-100">
                      {isImageUrl(url) ? (
                        <img
                          src={displayUrl}
                          alt={`Media ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to original URL if signed URL fails
                            if (displayUrl !== url) {
                              (e.target as HTMLImageElement).src = url
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileIcon className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                  
                  {/* Remove button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveMedia(url)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  
                    {/* File info overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs truncate">
                        {url.split('/').pop() || `Media ${index + 1}`}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {mediaUrls.length === 0 && selectedFiles.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No media files yet</h3>
            <p className="text-gray-500 mb-4">
              Upload images and PDFs to share with your project team
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
