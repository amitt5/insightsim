"use client"

import React, { useState, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, FileIcon, X, Loader2, FileText, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InterviewUploadProps {
  projectId: string;
  onUploadSuccess?: () => void;
  onUploadError?: (error: string) => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export default function InterviewUpload({ 
  projectId, 
  onUploadSuccess, 
  onUploadError 
}: InterviewUploadProps) {
  const { toast } = useToast();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileType = (file: File): 'transcript' | 'audio' => {
    const mimeType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    
    if (mimeType.startsWith('audio/') || 
        mimeType.includes('audio') ||
        ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac'].some(ext => 
          fileName.endsWith(ext)
        )) {
      return 'audio';
    }
    return 'transcript';
  };

  const validateFile = (file: File): string | null => {
    const fileType = getFileType(file);
    const fileName = file.name.toLowerCase();
    
    // Check file extension
    const validTranscriptExts = ['.txt', '.doc', '.docx', '.rtf'];
    const validAudioExts = ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac'];
    
    const isValidExt = fileType === 'audio' 
      ? validAudioExts.some(ext => fileName.endsWith(ext))
      : validTranscriptExts.some(ext => fileName.endsWith(ext));
    
    if (!isValidExt) {
      return fileType === 'audio'
        ? 'Invalid audio file. Supported formats: MP3, WAV, M4A, OGG, FLAC, AAC'
        : 'Invalid transcript file. Supported formats: TXT, DOC, DOCX, RTF';
    }
    
    // Check file size
    const maxSize = fileType === 'audio' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return `File too large. Maximum size is ${fileType === 'audio' ? '50MB' : '10MB'}`;
    }
    
    return null;
  };

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Validate files
    const validFiles: File[] = [];
    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        toast({
          title: "Invalid file",
          description: `${file.name}: ${error}`,
          variant: "destructive",
        });
      } else {
        validFiles.push(file);
      }
    });

    if (validFiles.length === 0) return;

    // Add files to uploading state
    const newUploadingFiles: UploadingFile[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    // Upload files to API
    validFiles.forEach((file, index) => {
      uploadFile(file, uploadingFiles.length + index);
    });
  }, [toast, uploadingFiles.length]);

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

  const uploadFile = async (file: File, index: number) => {
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev => 
          prev.map((uploadingFile, i) => {
            if (i === index && uploadingFile.progress < 90) {
              return { ...uploadingFile, progress: uploadingFile.progress + 10 };
            }
            return uploadingFile;
          })
        );
      }, 200);

      // Upload file to API
      const response = await fetch(`/api/projects/${projectId}/uploaded-interviews`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      // Complete progress
      setUploadingFiles(prev => 
        prev.map((uploadingFile, i) => 
          i === index ? { ...uploadingFile, progress: 100, status: 'completed' } : uploadingFile
        )
      );

      onUploadSuccess?.();
      
      const fileType = getFileType(file);
      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded successfully${fileType === 'audio' ? '. Transcription will be processed shortly.' : ''}`,
      });

      // Remove from uploading state after a delay
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter((_, i) => i !== index));
      }, 2000);

    } catch (error: any) {
      console.error('Upload error:', error);
      
      setUploadingFiles(prev => 
        prev.map((uploadingFile, i) => 
          i === index ? { ...uploadingFile, status: 'error', error: error.message } : uploadingFile
        )
      );

      onUploadError?.(error.message);
      
      toast({
        title: "Upload failed",
        description: error.message || 'Failed to upload file',
        variant: "destructive",
      });
    }
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
          accept=".txt,.doc,.docx,.rtf,.mp3,.wav,.m4a,.ogg,.flac,.aac,audio/*,text/*"
          multiple
          onChange={onFileInputChange}
          className="hidden"
          disabled={uploadingFiles.some(f => f.status === 'uploading')}
        />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-700 mb-2">
          {isDragActive ? 'Drop files here' : 'Upload Interview Files'}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Drag and drop transcript or audio files here, or click to select files
        </p>
        <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>Transcripts: TXT, DOC, DOCX, RTF (max 10MB)</span>
          </div>
          <div className="flex items-center gap-1">
            <Mic className="h-4 w-4" />
            <span>Audio: MP3, WAV, M4A, OGG (max 50MB)</span>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Uploading files...</h4>
          {uploadingFiles.map((uploadingFile, index) => {
            const fileType = getFileType(uploadingFile.file);
            return (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {fileType === 'audio' ? (
                  <Mic className="h-5 w-5 text-gray-400" />
                ) : (
                  <FileText className="h-5 w-5 text-gray-400" />
                )}
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
            );
          })}
        </div>
      )}
    </div>
  );
}

