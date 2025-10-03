"use client"

import React, { useState, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, FileIcon, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RagDocumentUploadProps {
  projectId: string;
  onUploadSuccess?: (document: any) => void;
  onUploadError?: (error: string) => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export default function RagDocumentUpload({ 
  projectId, 
  onUploadSuccess, 
  onUploadError 
}: RagDocumentUploadProps) {
  const { toast } = useToast();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    // Validate files
    const validFiles = fileArray.filter(file => {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid file type",
          description: "Only PDF files are supported",
          variant: "destructive",
        });
        return false;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: "Maximum file size is 10MB",
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    // Add files to uploading state
    const newUploadingFiles: UploadingFile[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    // Simulate upload process (will be replaced with real API call)
    validFiles.forEach((file, index) => {
      simulateUpload(file, index);
    });
  }, [toast]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const onFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const simulateUpload = async (file: File, index: number) => {
    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setUploadingFiles(prev => 
        prev.map((uploadingFile, i) => 
          i === index ? { ...uploadingFile, progress } : uploadingFile
        )
      );
    }

    // Simulate successful upload
    const mockDocument = {
      id: `doc_${Date.now()}_${index}`,
      filename: file.name,
      originalFilename: file.name,
      fileSize: file.size,
      uploadDate: new Date().toISOString(),
      status: 'uploaded' as const
    };

    setUploadingFiles(prev => 
      prev.map((uploadingFile, i) => 
        i === index ? { ...uploadingFile, status: 'completed' } : uploadingFile
      )
    );

    onUploadSuccess?.(mockDocument);
    
    toast({
      title: "Upload successful",
      description: `${file.name} has been uploaded successfully`,
    });

    // Remove from uploading state after a delay
    setTimeout(() => {
      setUploadingFiles(prev => prev.filter((_, i) => i !== index));
    }, 2000);
  };


  const removeUploadingFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={openFileDialog}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${uploadingFiles.some(f => f.status === 'uploading') ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={onFileInputChange}
          className="hidden"
          disabled={uploadingFiles.some(f => f.status === 'uploading')}
        />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-700 mb-2">
          {isDragActive ? 'Drop files here' : 'Upload RAG Documents'}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Drag and drop PDF files here, or click to select files
        </p>
        <p className="text-xs text-gray-400">
          Maximum file size: 10MB • Supported format: PDF
        </p>
      </div>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Uploading files...</h4>
          {uploadingFiles.map((uploadingFile, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <FileIcon className="h-5 w-5 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {uploadingFile.file.name}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadingFile.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {uploadingFile.progress}% uploaded
                </p>
              </div>
              {uploadingFile.status === 'uploading' && (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              )}
              {uploadingFile.status === 'completed' && (
                <div className="text-green-600 text-sm">✓</div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeUploadingFile(index)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
