"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
  Check,
  Info,
  Play
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

  const totalSteps = 3
  const progress = (currentStep / totalSteps) * 100

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
    setIsProcessing(true)
    // Simulate processing time
    setTimeout(() => {
      setCurrentStep(3)
      setIsProcessing(false)
    }, 2000)
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {[1, 2, 3].map((step) => (
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
            {step < 3 && (
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
    <div className="space-y-6">
      {/* Step-specific Demo Banner */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Play className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Demo Step 1: File Upload</h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                In the real version, you would upload your transcript files here. For this demo, we've pre-loaded sample files. Just click "Next" to continue exploring the workflow.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Transcript Files (Demo Mode)
          </CardTitle>
          <CardDescription>
            In production, upload your qualitative research transcripts for analysis. For demo purposes, sample files are already loaded.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Area */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center bg-muted/20">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Demo Mode - Files Pre-loaded</h3>
            <p className="text-muted-foreground mb-4">
              In the full version, you would drag and drop files here (.txt, .doc, .docx, .pdf)
            </p>
            <Button variant="outline" disabled>
              <Upload className="h-4 w-4 mr-2" />
              Choose Files (Disabled in Demo)
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              No need to upload files - sample data is ready for you!
            </p>
          </div>

          {/* Uploaded Files List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">Sample Files Loaded ({files.length})</h4>
                <Badge variant="outline" className="text-xs">DEMO DATA</Badge>
              </div>
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
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Step-specific Demo Banner */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Play className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Demo Step 2: Metadata Review</h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                Normally you would add details about your research sessions here. For the demo, sample metadata is pre-filled. You can edit it or just click "Start Analysis" to proceed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Review & Edit Metadata (Demo Mode)
          </CardTitle>
          <CardDescription>
            Review and edit the metadata for each uploaded file. Sample data is pre-filled for the demo - you can modify it or proceed as-is.
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
                    <Badge variant="outline" className="text-xs ml-2">SAMPLE DATA</Badge>
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
                  Processing Demo...
                </>
              ) : (
                <>
                  Start Analysis (Demo)
                  <TrendingUp className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      {/* Step-specific Demo Banner */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/50 dark:border-green-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-100">Demo Complete!</h3>
              <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                Click "View Analysis Dashboard" to explore the comprehensive analysis results with sample insights, themes, and visualizations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Analysis Complete (Demo)
          </CardTitle>
          <CardDescription>
            Your demo analysis is ready for review with comprehensive insights and themes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Demo Analysis Complete!</h3>
            <p className="text-muted-foreground mb-6">
              Your sample transcripts have been analyzed and demo insights have been generated. Explore the full analysis dashboard to see all features.
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
      <div className="max-w-4xl mx-auto">
        {/* Main Demo Banner */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-800 mb-8">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">Analysis Demo Workflow</h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                  This is a complete demo of the analysis workflow using sample data. You don't need to upload files or add details - just click through each step to see how the analysis works. All data shown is for demonstration purposes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight mb-2">New Analysis (Demo)</h2>
          <p className="text-muted-foreground">
            Explore the complete analysis workflow with sample data - no setup required!
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {renderStepIndicator()}

        {/* Step Content */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>
    </div>
  )
} 