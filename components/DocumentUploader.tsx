"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Upload, FileText, X, Loader2 } from "lucide-react"
import { uploadDocumentsForRAG, saveDocumentMetadata } from "@/utils/uploadApi"
import { SimulationDocument } from "@/utils/types"

interface DocumentUploaderProps {
  simulationId: string;
  uploadedDocuments: SimulationDocument[];
  onDocumentsChange: (documents: SimulationDocument[]) => void;
  disabled?: boolean;
}

export function DocumentUploader({ 
  simulationId, 
  uploadedDocuments, 
  onDocumentsChange, 
  disabled = false 
}: DocumentUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, boolean>>({})
  const [fileError, setFileError] = useState<string>("")
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Validate file type and size
  const validateFile = (file: File): string | null => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Please upload PDF, DOCX, DOC, TXT, MD, CSV, or XLSX files only.';
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return 'File size too large. Maximum size is 10MB.';
    }

    return null;
  };

  // Get file type icon
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('text') || fileType.includes('markdown')) return '📄';
    if (fileType.includes('csv') || fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    return '📄';
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: File[] = [];
    let errorMessages: string[] = [];

    Array.from(files).forEach(file => {
      const error = validateFile(file);
      if (error) {
        errorMessages.push(`${file.name}: ${error}`);
      } else {
        newFiles.push(file);
      }
    });

    if (errorMessages.length > 0) {
      setFileError(errorMessages.join('; '));
      toast({
        title: "File Validation Error",
        description: errorMessages.join('; '),
        variant: "destructive",
      });
    } else {
      setFileError("");
    }

    if (newFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const newFiles: File[] = [];
    let errorMessages: string[] = [];

    Array.from(files).forEach(file => {
      const error = validateFile(file);
      if (error) {
        errorMessages.push(`${file.name}: ${error}`);
      } else {
        newFiles.push(file);
      }
    });

    if (errorMessages.length > 0) {
      setFileError(errorMessages.join('; '));
      toast({
        title: "File Validation Error",
        description: errorMessages.join('; '),
        variant: "destructive",
      });
    } else {
      setFileError("");
    }

    if (newFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  // Remove selected file
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Upload documents
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress({});

    try {
      // Upload files to storage
      const uploadResults = await uploadDocumentsForRAG(
        selectedFiles,
        simulationId,
        (fileIndex, result) => {
          setUploadProgress(prev => ({
            ...prev,
            [selectedFiles[fileIndex].name]: result.success
          }));
        }
      );

      // Filter successful uploads
      const successfulUploads = uploadResults
        .map((result, index) => ({ result, file: selectedFiles[index] }))
        .filter(({ result }) => result.success);

      if (successfulUploads.length === 0) {
        throw new Error('No files were uploaded successfully');
      }

      // Prepare document metadata
      const documentMetadata = successfulUploads.map(({ result, file }) => ({
        file_name: result.fileName || file.name,
        file_path: result.path || '',
        file_type: file.type,
        file_size: file.size
      }));

      // Save metadata to database
      const saveResult = await saveDocumentMetadata(simulationId, documentMetadata);
      
      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Failed to save document metadata');
      }

      // Create new document objects for state update
      const newDocuments: SimulationDocument[] = successfulUploads.map(({ result, file }) => ({
        id: `temp-${Date.now()}-${Math.random()}`, // Temporary ID
        simulation_id: simulationId,
        file_name: result.fileName || file.name,
        file_path: result.path || '',
        file_type: file.type,
        file_size: file.size,
        created_at: new Date().toISOString()
      }));

      // Update parent component
      onDocumentsChange([...uploadedDocuments, ...newDocuments]);

      // Clear selected files
      setSelectedFiles([]);
      
      toast({
        title: "Upload Successful",
        description: `${successfulUploads.length} document(s) uploaded successfully`,
      });

      // Show any failed uploads
      const failedUploads = uploadResults.filter(result => !result.success);
      if (failedUploads.length > 0) {
        toast({
          title: "Some uploads failed",
          description: `${failedUploads.length} file(s) failed to upload`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>
          Upload Documents for Context
          {fileError && <span className="text-destructive text-xs ml-2">{fileError}</span>}
        </Label>
        <div 
          className={`flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed ${
            selectedFiles.length > 0 || uploadedDocuments.length > 0 ? 'border-primary' : 'border-gray-300'
          } hover:bg-gray-50 p-4 ${isUploading || disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !isUploading && !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.xls"
            onChange={handleFileSelect}
            multiple
            disabled={disabled}
          />
          
          {(selectedFiles.length > 0 || uploadedDocuments.length > 0) ? (
            <div className="w-full space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {uploadedDocuments.length > 0 && `${uploadedDocuments.length} uploaded`}
                  {uploadedDocuments.length > 0 && selectedFiles.length > 0 && ', '}
                  {selectedFiles.length > 0 && `${selectedFiles.length} selected`}
                  {uploadedDocuments.length === 0 && selectedFiles.length === 0 && '0 documents'}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2 text-xs"
                  disabled={isUploading || disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Add More
                </Button>
              </div>
              
              {isUploading && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(Object.keys(uploadProgress).length / selectedFiles.length) * 100}%` }}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                {/* Show uploaded documents first */}
                {uploadedDocuments.map((doc, index) => (
                  <div key={`uploaded-${doc.id}`} className="flex items-center justify-between bg-green-50 p-3 rounded border border-green-200">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getFileIcon(doc.file_type)}</div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium truncate max-w-[200px]">{doc.file_name}</span>
                        <div className="flex items-center space-x-2 text-xs text-green-600">
                          <span>✓ Uploaded</span>
                          <span>•</span>
                          <span>{formatFileSize(doc.file_size)}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle document removal (will implement in parent)
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                      disabled={disabled}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                
                {/* Show selected files (pending upload) */}
                {selectedFiles.map((file, index) => (
                  <div key={`selected-${index}`} className="flex items-center justify-between bg-blue-50 p-3 rounded border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getFileIcon(file.type)}</div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                        <div className="flex items-center space-x-2 text-xs text-blue-600">
                          <span>Pending upload</span>
                          <span>•</span>
                          <span>{formatFileSize(file.size)}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(index);
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2 text-center">
              {isUploading ? (
                <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
              ) : (
                <FileText className="h-6 w-6 text-gray-400" />
              )}
              <span className="text-sm text-gray-500">
                {isUploading ? 'Uploading documents...' : 'Click to upload or drag and drop documents'}
              </span>
              <span className="text-xs text-gray-400">PDF, DOCX, TXT, MD, CSV, XLSX up to 10MB</span>
              <span className="text-xs text-gray-400">Select multiple files by holding Ctrl/Cmd</span>
            </div>
          )}
        </div>
      </div>

      {/* Upload button */}
      {selectedFiles.length > 0 && (
        <div className="flex justify-end">
          <Button 
            onClick={handleUpload}
            disabled={isUploading || disabled}
            className="gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload {selectedFiles.length} Document{selectedFiles.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
