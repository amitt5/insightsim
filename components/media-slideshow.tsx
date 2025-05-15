"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogTrigger, DialogTitle, DialogClose } from "@/components/ui/dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react"
import { MediaViewer } from "@/components/media-viewer"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { cn } from "@/lib/utils"

interface MediaSlideshowProps {
  urls: string[]
  triggerLabel?: string
}

// Custom DialogContent without the built-in close button
const CustomDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
))
CustomDialogContent.displayName = "CustomDialogContent"

export function MediaSlideshow({ urls, triggerLabel = "View Media" }: MediaSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  // Reset to first slide when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0)
    }
  }, [isOpen])

  // Navigate to previous slide
  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : urls.length - 1))
  }

  // Navigate to next slide
  const handleNext = () => {
    setCurrentIndex((prev) => (prev < urls.length - 1 ? prev + 1 : 0))
  }

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      if (e.key === "ArrowLeft") {
        handlePrevious()
      } else if (e.key === "ArrowRight") {
        handleNext()
      } else if (e.key === "Escape") {
        setIsOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, urls.length])

  if (!urls.length) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          {urls.length > 1 ? `${triggerLabel} (${urls.length})` : triggerLabel}
        </Button>
      </DialogTrigger>
      
      <CustomDialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden p-0 gap-0">
        <VisuallyHidden>
          <DialogTitle>
            {triggerLabel} {urls.length > 1 ? `(${currentIndex + 1} of ${urls.length})` : ''}
          </DialogTitle>
        </VisuallyHidden>
        
        <div className="relative flex flex-col h-full min-h-[50vh]">
          {/* Header with our own close button */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="text-sm font-medium">
              {urls.length > 1 && (
                <span className="text-muted-foreground">
                  {currentIndex + 1} / {urls.length}
                </span>
              )}
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="sm">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </div>
          
          {/* Media content */}
          <div className="flex-1 overflow-auto p-4 relative">
            <MediaViewer 
              url={urls[currentIndex]} 
              className="border-0 shadow-none" 
              key={`slide-${currentIndex}-${urls[currentIndex]}`} 
            />
          </div>
          
          {/* Navigation controls - Only show if we have multiple items */}
          {urls.length > 1 && (
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-12 w-12 rounded-full bg-background/80 shadow-sm ml-2 pointer-events-auto"
                onClick={handlePrevious}
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-12 w-12 rounded-full bg-background/80 shadow-sm mr-2 pointer-events-auto"
                onClick={handleNext}
                aria-label="Next slide"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          )}
        </div>
      </CustomDialogContent>
    </Dialog>
  )
} 