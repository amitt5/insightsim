"use client"

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileIcon, Trash2, Download, Eye, Play, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RagDocument } from "@/utils/types";


interface RagDocumentCardProps {
  document: RagDocument;
  onDelete: (documentId: string) => void;
  onView?: (document: RagDocument) => void;
  onProcess?: (documentId: string) => void;
  isProcessing?: boolean;
}

export default function RagDocumentCard({ 
  document, 
  onDelete, 
  onView,
  onProcess,
  isProcessing = false
}: RagDocumentCardProps) {
  const { toast } = useToast();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      uploaded: { variant: 'secondary' as const, label: 'Uploaded' },
      processing: { variant: 'default' as const, label: 'Processing' },
      completed: { variant: 'default' as const, label: 'Completed' },
      failed: { variant: 'destructive' as const, label: 'Failed' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.uploaded;
    
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const handleDelete = () => {
    onDelete(document.id);
  };

  const handleView = () => {
    if (onView) {
      onView(document);
    } else {
      toast({
        title: "Preview not available",
        description: "Document preview functionality will be implemented soon",
      });
    }
  };

  const handleProcess = () => {
    if (onProcess) {
      onProcess(document.id);
    }
  };

  const canProcess = document.status === 'uploaded' && !isProcessing;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <FileIcon className="h-5 w-5 text-red-600" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {document.original_filename}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {formatFileSize(document.file_size)} • {formatDate(document.created_at)}
              </p>
              
              {document.status === 'failed' && document.processing_error && (
                <p className="text-xs text-red-600 mt-1">
                  Error: {document.processing_error}
                </p>
              )}
              
              <div className="mt-2">
                {getStatusBadge(document.status)}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1 ml-2">
            {canProcess && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleProcess}
                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                title="Process document for RAG"
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
            
            {isProcessing && (
              <div className="h-8 w-8 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              </div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleView}
              className="h-8 w-8 p-0"
              title="View document"
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Delete document"
              disabled={isProcessing}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
