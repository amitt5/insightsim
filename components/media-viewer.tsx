"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { FileIcon } from "lucide-react"

interface MediaViewerProps {
  url: string
  title?: string
  className?: string
}

export function MediaViewer({ url, title, className = "" }: MediaViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Determine file type from URL
  const isPDF = url.toLowerCase().endsWith('.pdf')
  const isImage = /\.(jpeg|jpg|png|gif|webp)$/i.test(url)

  // Handle image load complete
  const handleImageLoad = () => {
    setIsLoading(false)
  }

  // Handle image load error
  const handleError = () => {
    setIsLoading(false)
    setError("Failed to load media")
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-0">
        {title && (
          <div className="p-3 bg-muted border-b">
            <h3 className="text-sm font-medium">{title}</h3>
          </div>
        )}
        
        <div className="relative min-h-[200px]">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
              <div className="animate-pulse">Loading...</div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-50">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {isImage && (
            <div className="flex justify-center p-4">
              <img 
                src={url} 
                alt={title || "Media"} 
                className="max-h-[500px] object-contain"
                onLoad={handleImageLoad}
                onError={handleError}
              />
            </div>
          )}
          
          {isPDF && (
            <div className="p-4">
              <div className="flex flex-col items-center justify-center gap-3">
                <FileIcon className="h-10 w-10 text-primary" />
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  View PDF Document
                </a>
                <div className="w-full">
                  <iframe 
                    src={`${url}#toolbar=0&navpanes=0`} 
                    className="w-full h-[400px] border"
                    title={title || "PDF Document"}
                    onLoad={handleImageLoad}
                    onError={handleError}
                  />
                </div>
              </div>
            </div>
          )}
          
          {!isImage && !isPDF && (
            <div className="p-4 flex flex-col items-center justify-center">
              <FileIcon className="h-10 w-10 text-primary" />
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-2 text-sm text-primary hover:underline"
              >
                Download File
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 