"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dashboard } from '@/components/Dashboard';
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
  const [files, setFiles] = useState(mockFiles)
  const [metadata, setMetadata] = useState(mockMetadata)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStepText, setCurrentStepText] = useState("")

  const totalSteps = 4
  const stepProgress = (currentStep / totalSteps) * 100

  const handleRemoveFile = (fileId: string) => {
    setFiles(files.filter(f => f.id !== fileId))
    setMetadata(metadata.filter(m => m.fileId !== fileId))
  }

  const handleMetadataChange = (fileId: string, field: string, value: string) => {
    setMetadata(metadata.map(m => 
      m.fileId === fileId ? { ...m, [field]: value } : m
    ))
  }

  const handleStartAnalysis = () => {
    setCurrentStep(3) // Go to processing step
    setIsProcessing(true)
    setProgress(0)
    setCurrentStepText("Initializing analysis...")
    
    // Simulate processing with progress updates
    const progressSteps = [
      { progress: 10, text: "Extracting text from transcripts..." },
      { progress: 25, text: "Chunking content for analysis..." },
      { progress: 45, text: "Analyzing themes and patterns..." },
      { progress: 65, text: "Extracting key insights..." },
      { progress: 85, text: "Generating comprehensive report..." },
      { progress: 100, text: "Analysis complete!" }
    ]
    
    progressSteps.forEach((step, index) => {
      setTimeout(() => {
        setProgress(step.progress)
        setCurrentStepText(step.text)
        
        // Move to step 4 when complete
        if (step.progress === 100) {
          setTimeout(() => {
            setCurrentStep(4)
            setIsProcessing(false)
          }, 1000)
        }
      }, (index + 1) * 2000) // 2 seconds between each step
    })
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
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Drop files here or click to upload</h3>
          <p className="text-muted-foreground mb-4">
            Supported formats: .txt, .doc, .docx, .pdf
          </p>
          <Button variant="outline" disabled>
            <Upload className="h-4 w-4 mr-2" />
            Choose Files
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            (File upload functionality will be implemented later)
          </p>
        </div>

        {/* Uploaded Files List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Uploaded Files ({files.length})</h4>
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
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
                >
                  <X className="h-4 w-4" />
                </Button>
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
          <Button onClick={handleStartAnalysis} disabled={isProcessing}>
            {isProcessing ? (
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
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">{currentStepText}</p>
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