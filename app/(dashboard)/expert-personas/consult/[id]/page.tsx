"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  ArrowLeft,
  MessageCircle,
  Target,
  Upload,
  FileText,
  Image,
  Video,
  CheckCircle2,
  Zap,
  Users
} from "lucide-react"
import Link from "next/link"

// Expert data (simplified for consultation setup)
const expertsData = {
  "gary-vaynerchuk": {
    id: "gary-vaynerchuk",
    name: "Gary Vaynerchuk",
    title: "Digital Marketing & Entrepreneurship Influencer",
    avatar: "/placeholder-user.jpg",
    rating: 4.9,
    specialties: ["Digital Marketing", "Entrepreneurship", "Personal Branding", "Social Media Strategy"]
  },
  "sarah-chen": {
    id: "sarah-chen",
    name: "Dr. Sarah Chen",
    title: "Supply Chain Strategy Expert",
    avatar: "/placeholder-user.jpg",
    rating: 4.9,
    specialties: ["Global Logistics", "Risk Management", "Sustainability", "Lean Operations"]
  },
  "alex-rodriguez": {
    id: "alex-rodriguez",
    name: "Alex Rodriguez",
    title: "AI Strategy Consultant",
    avatar: "/placeholder-user.jpg",
    rating: 4.8,
    specialties: ["AI Implementation", "Digital Transformation", "Tech Strategy"]
  },
  "emma-thompson": {
    id: "emma-thompson",
    name: "Emma Thompson",
    title: "Marketing Director",
    avatar: "/placeholder-user.jpg",
    rating: 4.7,
    specialties: ["Growth Marketing", "Customer Acquisition", "Brand Strategy"]
  },
  "michael-kim": {
    id: "michael-kim",
    name: "Michael Kim",
    title: "Financial Strategist",
    avatar: "/placeholder-user.jpg",
    rating: 4.9,
    specialties: ["Financial Planning", "Investment Strategy", "Risk Assessment"]
  },
  "lisa-wang": {
    id: "lisa-wang",
    name: "Lisa Wang",
    title: "HR & People Operations Expert",
    avatar: "/placeholder-user.jpg",
    rating: 4.8,
    specialties: ["Talent Management", "Organizational Development", "Performance Management"]
  }
}

export default function ConsultationSetupPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [selectedMode, setSelectedMode] = useState<"qa" | "consultant" | null>(null)
  const [context, setContext] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  
  const expertData = expertsData[params.id as keyof typeof expertsData]
  
  if (!expertData) {
    return <div>Expert not found</div>
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const fileNames = Array.from(files).map(file => file.name)
      setUploadedFiles(prev => [...prev, ...fileNames])
    }
  }

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(f => f !== fileName))
  }

  const startConsultation = () => {
    // In a real app, you'd save the mode and context to state/database
    // For demo, we'll just navigate to chat with URL params
    const params = new URLSearchParams({
      mode: selectedMode || 'qa',
      context: context || '',
      files: uploadedFiles.join(',')
    })
    
    router.push(`/expert-personas/chat/${expertData.id}?${params.toString()}`)
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Back Button */}
      <div className="flex items-center gap-2">
        <Link href={`/expert-personas/${expertData.id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={expertData.avatar} alt={expertData.name} />
          <AvatarFallback>{expertData.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{expertData.name}</h1>
          <p className="text-muted-foreground">{expertData.title}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {expertData.specialties.slice(0, 3).map((specialty) => (
              <Badge key={specialty} variant="secondary" className="text-xs">
                {specialty}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Mode Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Choose Consultation Mode
            </CardTitle>
            <CardDescription>
              Select how you'd like to interact with {expertData.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  selectedMode === 'qa' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
                }`}
                onClick={() => setSelectedMode('qa')}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold">Q&A Mode</h3>
                  </div>
                  {selectedMode === 'qa' && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Ask specific questions, get expert answers
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    <span>Perfect for quick, focused questions</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    <span>Get direct, actionable answers</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    <span>Ideal for learning and clarification</span>
                  </div>
                </div>
              </div>

              <div 
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  selectedMode === 'consultant' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
                }`}
                onClick={() => setSelectedMode('consultant')}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold">Consultant Mode</h3>
                  </div>
                  {selectedMode === 'consultant' && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Deep strategic discussion and recommendations
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    <span>Comprehensive strategic analysis</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    <span>Detailed recommendations & roadmaps</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    <span>Best for complex business challenges</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Context Setting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Provide Context
            </CardTitle>
            <CardDescription>
              Help {expertData.name} understand your situation for more relevant advice
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Text Description */}
            <div className="space-y-2">
              <Label htmlFor="context">Describe your situation or challenge</Label>
              <Textarea
                id="context"
                placeholder={`Tell ${expertData.name} about your current situation, goals, challenges, or what you're trying to achieve. The more context you provide, the better the consultation will be.`}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="min-h-32"
              />
              <p className="text-xs text-muted-foreground">
                {context.length}/1000 characters
              </p>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Add relevant documents or media (optional)</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Upload files to provide additional context</p>
                    <p className="text-xs text-muted-foreground">
                      Supports PDFs, images, videos, and documents (Max 10MB each)
                    </p>
                    <Input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.mov"
                    />
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <Button variant="outline" className="mt-2">
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Files
                      </Button>
                    </Label>
                  </div>
                </div>
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploaded Files ({uploadedFiles.length})</Label>
                  <div className="space-y-2">
                    {uploadedFiles.map((fileName, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="p-2 bg-white rounded border">
                          {fileName.toLowerCase().includes('.pdf') && <FileText className="h-4 w-4" />}
                          {fileName.toLowerCase().match(/\.(jpg|jpeg|png)$/) && <Image className="h-4 w-4" />}
                          {fileName.toLowerCase().match(/\.(mp4|mov)$/) && <Video className="h-4 w-4" />}
                          {!fileName.toLowerCase().match(/\.(pdf|jpg|jpeg|png|mp4|mov)$/) && <FileText className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{fileName}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(fileName)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {selectedMode === 'qa' && "Perfect for quick questions and specific advice"}
            {selectedMode === 'consultant' && "Ideal for strategic planning and comprehensive analysis"}
            {!selectedMode && "Select a consultation mode to continue"}
          </div>
          <Button 
            onClick={startConsultation}
            disabled={!selectedMode}
            size="lg"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Start Consultation
          </Button>
        </div>
      </div>
    </div>
  )
} 