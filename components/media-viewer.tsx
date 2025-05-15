"use client"

import { useEffect, useState } from "react"
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
  const [mediaUrl, setMediaUrl] = useState<string>(url)
  const [usingSignedUrl, setUsingSignedUrl] = useState(false)

  // Determine file type from URL
  const isPDF = url.toLowerCase().endsWith('.pdf')
  const isImage = /\.(jpeg|jpg|png|gif|webp)$/i.test(url)

  // Fetch a signed URL as fallback if direct access fails
  const fetchSignedUrl = async () => {
    try {
      console.log("Falling back to signed URL for:", url)
      
      // Extract bucket and path from the URL
      const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/)
      if (!match) {
        console.error("Could not parse Supabase URL:", url)
        throw new Error("Invalid media URL format")
      }
      
      const [, bucket, path] = match
      console.log("Extracted - Bucket:", bucket, "Path:", path)
      
      // Fetch signed URL from our API
      const apiUrl = `/api/storage?path=${encodeURIComponent(path)}&bucket=${encodeURIComponent(bucket)}`
      console.log("Requesting signed URL from:", apiUrl)
      
      const response = await fetch(apiUrl)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("API error:", response.status, errorData)
        throw new Error(`Failed to get signed URL: ${response.statusText}`)
      }
      
      const data = await response.json()
      if (!data.url) {
        throw new Error("No URL returned from API")
      }
      
      console.log("Using signed URL instead:", data.url)
      setMediaUrl(data.url)
      setUsingSignedUrl(true)
      setIsLoading(false)
      return true
    } catch (err) {
      console.error("Error fetching signed URL:", err)
      return false
    }
  }

  // Handle image load complete
  const handleImageLoad = () => {
    setIsLoading(false)
  }

  // Handle image load error
  const handleError = async () => {
    // If we're already using a signed URL or have already tried fetching one, just show the error
    if (usingSignedUrl || !await fetchSignedUrl()) {
      setIsLoading(false)
      setError("Failed to load media")
      console.error("Media loading error for URL:", mediaUrl)
    }
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
                src={mediaUrl} 
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
                  href={mediaUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  View PDF Document
                </a>
                <div className="w-full">
                  <iframe 
                    src={`${mediaUrl}#toolbar=0&navpanes=0`} 
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
                href={mediaUrl} 
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