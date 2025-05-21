'use client'

import { cn } from "@/lib/utils"
import { forwardRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

// Enhanced dialog components with refined styling and states
export interface ModalProps extends React.ComponentProps<typeof Dialog> {}

const Modal = Dialog

export interface ModalContentProps extends React.ComponentProps<typeof DialogContent> {}

const ModalContent = forwardRef<
  React.ElementRef<typeof DialogContent>,
  ModalContentProps
>(({ className, children, ...props }, ref) => (
  <DialogContent
    ref={ref}
    className={cn(
      "sm:max-w-lg bg-card border border-border shadow-lg",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%]",
      "duration-200",
      className
    )}
    {...props}
  >
    {children}
  </DialogContent>
))
ModalContent.displayName = "ModalContent"

export interface ModalHeaderProps extends React.ComponentProps<typeof DialogHeader> {}

const ModalHeader = forwardRef<
  HTMLDivElement,
  ModalHeaderProps
>(({ className, ...props }, ref) => (
  <DialogHeader
    ref={ref}
    className={cn("px-6 pt-6 pb-3", className)}
    {...props}
  />
))
ModalHeader.displayName = "ModalHeader"

export interface ModalTitleProps extends React.ComponentProps<typeof DialogTitle> {}

const ModalTitle = forwardRef<
  HTMLHeadingElement,
  ModalTitleProps
>(({ className, ...props }, ref) => (
  <DialogTitle
    ref={ref}
    className={cn("typography-h4 text-foreground", className)}
    {...props}
  />
))
ModalTitle.displayName = "ModalTitle"

export interface ModalDescriptionProps extends React.ComponentProps<typeof DialogDescription> {}

const ModalDescription = forwardRef<
  HTMLParagraphElement,
  ModalDescriptionProps
>(({ className, ...props }, ref) => (
  <DialogDescription
    ref={ref}
    className={cn("typography-body-small text-muted-foreground mt-2", className)}
    {...props}
  />
))
ModalDescription.displayName = "ModalDescription"

export interface ModalFooterProps extends React.ComponentProps<typeof DialogFooter> {}

const ModalFooter = forwardRef<
  HTMLDivElement,
  ModalFooterProps
>(({ className, ...props }, ref) => (
  <DialogFooter
    ref={ref}
    className={cn("flex justify-end gap-2 px-6 py-4 border-t border-border/50 mt-4", className)}
    {...props}
  />
))
ModalFooter.displayName = "ModalFooter"

export {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter
}
