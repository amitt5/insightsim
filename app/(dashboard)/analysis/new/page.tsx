"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dashboard } from '@/components/Dashboard';
import { apiClient } from '@/lib/api-client';
import { 
  Upload, 
  FileText, 
  X, 
  Calendar,
  Users,
  MapPin,
  TrendingUp,
  ArrowLeft,
  ArrowRight,
  Check
} from "lucide-react"
import Link from "next/link"

// File wrapper type for UI management
interface FileWithId {
  id: string
  file: File
  name: string
  size: string
  type: string
  uploadedAt: string
}

// Mock data for uploaded files
const mockFiles = [
  {
    id: "1",
    name: "Focus_Group_Session_1.txt",
    size: "245 KB",
    type: "text/plain",
    uploadedAt: new Date().toISOString()
  },
  {
    id: "2", 
    name: "Focus_Group_Session_2.txt",
    size: "312 KB",
    type: "text/plain",
    uploadedAt: new Date().toISOString()
  },
  {
    id: "3",
    name: "IDI_Participant_A.txt", 
    size: "189 KB",
    type: "text/plain",
    uploadedAt: new Date().toISOString()
  }
]

// Mock metadata for files
const mockMetadata = [
  {
    fileId: "1",
    fgdName: "Consumer Beverage Preferences - Session 1",
    date: "2024-01-15",
    location: "Chicago, IL",
    moderator: "Sarah Johnson",
    participantCount: 8,
    demographics: "Adults 25-45, Mixed income",
    notes: "Focus on taste preferences and brand loyalty"
  },
  {
    fileId: "2",
    fgdName: "Consumer Beverage Preferences - Session 2", 
    date: "2024-01-16",
    location: "Chicago, IL",
    moderator: "Sarah Johnson",
    participantCount: 8,
    demographics: "Adults 25-45, Mixed income",
    notes: "Focus on packaging and marketing appeal"
  },
  {
    fileId: "3",
    fgdName: "In-Depth Interview - Participant A",
    date: "2024-01-17", 
    location: "Remote",
    moderator: "Mike Chen",
    participantCount: 1,
    demographics: "Female, 32, High income",
    notes: "Deep dive into brand switching behavior"
  }
]

export default function NewAnalysisPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [files, setFiles] = useState<FileWithId[]>([])
  const [metadata, setMetadata] = useState(mockMetadata)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStepText, setCurrentStepText] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({})
  const [isUploading, setIsUploading] = useState(false)
  const [studyId, setStudyId] = useState<string | null>(null)
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null)
  const [realProgress, setRealProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState("")
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const totalSteps = 4
  const stepProgress = (currentStep / totalSteps) * 100

  // File validation
  const validateFile = (file: File): boolean => {
    const allowedTypes = [
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/pdf'
    ]
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    return allowedTypes.includes(file.type) && file.size <= maxSize
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Handle file selection
  const handleFileSelect = (selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles)
    const validFiles: FileWithId[] = []
    
    fileArray.forEach(file => {
      if (validateFile(file)) {
        const fileWithId: FileWithId = {
          id: crypto.randomUUID(),
          file: file,
          name: file.name,
          size: formatFileSize(file.size),
          type: file.type,
          uploadedAt: new Date().toISOString()
        }
        validFiles.push(fileWithId)
      }
    })
    
    setFiles(prev => [...prev, ...validFiles])
  }

  // Handle file input change
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      handleFileSelect(event.target.files)
    }
  }

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const handleRemoveFile = (fileId: string) => {
    setFiles(files.filter(f => f.id !== fileId))
    setMetadata(metadata.filter(m => m.fileId !== fileId))
    // Also remove from upload progress/errors
    setUploadProgress(prev => {
      const newProgress = { ...prev }
      delete newProgress[fileId]
      return newProgress
    })
    setUploadErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[fileId]
      return newErrors
    })
  }

  const handleMetadataChange = (fileId: string, field: string, value: string) => {
    setMetadata(metadata.map(m => 
      m.fileId === fileId ? { ...m, [field]: value } : m
    ))
  }

  // Start analysis API call
  const startAnalysisRequest = async (studyId: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/analysis/${studyId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to start analysis: ${response.statusText}`)
    }
    
    return response.json()
  }

  // Check analysis status API call
  const checkAnalysisStatus = async (studyId: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/analysis/${studyId}/status`)
    
    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.statusText}`)
    }
    
    return response.json()
  }

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  // Poll analysis status every 3 seconds
  const startStatusPolling = (studyId: string) => {
    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }
    
    const pollInterval = setInterval(async () => {
      try {
        const statusResponse = await checkAnalysisStatus(studyId)
        
        setAnalysisStatus(statusResponse.status)
        setStatusMessage(statusResponse.message || "")
        
        // Map status to progress percentage
        let progressPercent = 0
        switch (statusResponse.status) {
          case "pending":
            progressPercent = 10
            break
          case "processing":
            progressPercent = statusResponse.progress || 50 // Use real progress if available
            break
          case "completed":
            progressPercent = 100
            break
          case "failed":
            progressPercent = 0
            break
        }
        
        setRealProgress(progressPercent)
        setCurrentStepText(statusResponse.message || `Analysis ${statusResponse.status}...`)
        
        // Stop polling if completed or failed
        if (statusResponse.status === "completed") {
          clearInterval(pollInterval)
          pollIntervalRef.current = null
          setIsProcessing(false)
          setTimeout(() => {
            setCurrentStep(4) // Move to completion step
          }, 1000)
        } else if (statusResponse.status === "failed") {
          clearInterval(pollInterval)
          pollIntervalRef.current = null
          setIsProcessing(false)
          alert(`Analysis failed: ${statusResponse.message}`)
        }
        
      } catch (error) {
        console.error('Status polling error:', error)
        clearInterval(pollInterval)
        pollIntervalRef.current = null
        setIsProcessing(false)
        alert(`Status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }, 3000) // Poll every 3 seconds
    
    // Store interval reference for cleanup
    pollIntervalRef.current = pollInterval
  }

  const handleStartAnalysis = async () => {
    if (files.length === 0) return
    
    setIsUploading(true)
    setUploadProgress({})
    setUploadErrors({})
    
    try {
      // Prepare metadata for upload (matching StudyMetadata model)
      const uploadMetadata = {
        title: `Analysis Study - ${new Date().toLocaleDateString()}`,
        description: "Qualitative research analysis study",
        research_type: "focus_group",
        participant_count: 8,
        session_date: new Date().toISOString().split('T')[0],
        location: "Remote",
        moderator: "System Admin",
        files_metadata: files.map(f => ({
          name: f.name,
          size: f.size,
          type: f.type,
          uploadedAt: f.uploadedAt
        }))
      }
      
      // Extract actual File objects for upload
      const actualFiles = files.map(f => f.file)
      
      // Upload files with progress tracking
      const result = await apiClient.uploadTranscripts(
        actualFiles, 
        uploadMetadata,
        (progressPercent) => {
          // Update overall progress (simplified for now)
          setUploadProgress(prev => ({
            ...prev,
            overall: progressPercent
          }))
        }
      )
      
      console.log('Upload successful:', result)
      
      // Store the study_id from the response
      setStudyId(result.study_id)
      
      // If upload successful, start analysis and begin real progress tracking
      setIsUploading(false)
      
      // Start the actual analysis
      await startAnalysisRequest(result.study_id)
      
      // Move to processing step and start polling
      setCurrentStep(3)
      setIsProcessing(true)
      setRealProgress(0)
      setCurrentStepText("Starting analysis...")
      
      // Start polling for real progress
      startStatusPolling(result.study_id)
      
    } catch (error) {
      console.error('Upload failed:', error)
      setIsUploading(false)
      
      // Handle upload errors - for now, show alert (we can improve this later)
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full border-2 
              ${currentStep >= step 
                ? 'bg-primary border-primary text-primary-foreground' 
                : 'border-muted-foreground text-muted-foreground'
              }
            `}>
              {currentStep > step ? (
                <Check className="h-5 w-5" />
              ) : (
                <span className="text-sm font-semibold">{step}</span>
              )}
            </div>
            {step < 4 && (
              <div className={`
                w-12 h-0.5 mx-2
                ${currentStep > step ? 'bg-primary' : 'bg-muted'}
              `} />
            )}
          </div>
        ))}
      </div>
    </div>
  )

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Transcript Files
        </CardTitle>
        <CardDescription>
          Upload your qualitative research transcripts for analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Area */}
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Drop files here or click to upload</h3>
          <p className="text-muted-foreground mb-4">
            Supported formats: .txt, .doc, .docx, .pdf (Max 10MB each)
          </p>
          <input
            type="file"
            multiple
            accept=".txt,.doc,.docx,.pdf"
            onChange={handleFileInputChange}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button variant="outline" asChild>
              <span className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Choose Files
              </span>
            </Button>
          </label>
        </div>

        {/* Uploaded Files List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Uploaded Files ({files.length})</h4>
            {files.map((file) => (
              <div key={file.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">{file.size}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(file.id)}
                    className="text-destructive hover:text-destructive"
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Upload Progress Bar */}
                {isUploading && uploadProgress[file.id] !== undefined && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Uploading...</span>
                      <span>{Math.round(uploadProgress[file.id])}%</span>
                    </div>
                    <Progress value={uploadProgress[file.id]} className="h-1" />
                  </div>
                )}
                
                {/* Upload Error */}
                {uploadErrors[file.id] && (
                  <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                    Upload failed: {uploadErrors[file.id]}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between">
          <Link href="/analysis">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Analysis
            </Button>
          </Link>
          <Button 
            onClick={() => setCurrentStep(2)}
            disabled={files.length === 0}
          >
            Next: Review Metadata
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Review & Edit Metadata
        </CardTitle>
        <CardDescription>
          Review and edit the metadata for each uploaded file
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {metadata.map((meta, index) => {
          const file = files.find(f => f.id === meta.fileId)
          return (
            <Card key={meta.fileId} className="border-muted">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {file?.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`fgdName-${meta.fileId}`}>FGD/Session Name</Label>
                    <Input
                      id={`fgdName-${meta.fileId}`}
                      value={meta.fgdName}
                      onChange={(e) => handleMetadataChange(meta.fileId, 'fgdName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`date-${meta.fileId}`}>Date</Label>
                    <Input
                      id={`date-${meta.fileId}`}
                      type="date"
                      value={meta.date}
                      onChange={(e) => handleMetadataChange(meta.fileId, 'date', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`location-${meta.fileId}`}>Location</Label>
                    <Input
                      id={`location-${meta.fileId}`}
                      value={meta.location}
                      onChange={(e) => handleMetadataChange(meta.fileId, 'location', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`moderator-${meta.fileId}`}>Moderator</Label>
                    <Input
                      id={`moderator-${meta.fileId}`}
                      value={meta.moderator}
                      onChange={(e) => handleMetadataChange(meta.fileId, 'moderator', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`participantCount-${meta.fileId}`}>Participant Count</Label>
                    <Input
                      id={`participantCount-${meta.fileId}`}
                      type="number"
                      value={meta.participantCount}
                      onChange={(e) => handleMetadataChange(meta.fileId, 'participantCount', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`demographics-${meta.fileId}`}>Demographics</Label>
                    <Input
                      id={`demographics-${meta.fileId}`}
                      value={meta.demographics}
                      onChange={(e) => handleMetadataChange(meta.fileId, 'demographics', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`notes-${meta.fileId}`}>Notes</Label>
                  <Textarea
                    id={`notes-${meta.fileId}`}
                    value={meta.notes}
                    onChange={(e) => handleMetadataChange(meta.fileId, 'notes', e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep(1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Upload
          </Button>
          <Button onClick={handleStartAnalysis} disabled={isProcessing || isUploading || files.length === 0}>
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading Files... {uploadProgress.overall ? `${Math.round(uploadProgress.overall)}%` : ''}
              </>
            ) : isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                Start Analysis
                <TrendingUp className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const AnalysisProcessingStep = () => (
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
      <h3 className="text-xl font-semibold mb-2">Analyzing Your Transcripts</h3>
      <p className="text-gray-600 mb-4">This may take 2-5 minutes depending on file size</p>
      
      {/* Real-time progress from your FastAPI backend */}
      <div className="max-w-md mx-auto">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Processing transcripts...</span>
          <span>{Math.round(realProgress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${realProgress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">{currentStepText}</p>
        {analysisStatus && (
          <p className="text-xs text-gray-400 mt-1">Status: {analysisStatus}</p>
        )}
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Analysis Complete
          </CardTitle>
          <CardDescription>
            Your qualitative research analysis is ready for review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Analysis Complete!</h3>
            <p className="text-muted-foreground mb-6">
              Your transcripts have been analyzed and insights have been generated.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/analysis/123/dashboard">
                <Button>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Analysis Dashboard
                </Button>
              </Link>
              <Link href="/analysis">
                <Button variant="outline">
                  Back to Analysis List
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      
      <div>
        <h1>Testing Dashboard Integration</h1>
          <Dashboard />
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight mb-2">New Analysis</h2>
          <p className="text-muted-foreground">
            Upload your research transcripts and generate insights
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{Math.round(stepProgress)}% Complete</span>
        </div>
        <Progress value={stepProgress} className="h-2" />
        </div>

        {renderStepIndicator()}

        {/* Step Content */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && AnalysisProcessingStep()}
        {currentStep === 4 && renderStep4()}
      </div>
    </div>
  )
} 