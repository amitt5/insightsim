"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowLeft,
  Plus,
  User,
  Sparkles,
  BookOpen,
  FileText,
  Play,
  Headphones,
  CheckCircle2,
  Loader2,
  Link as LinkIcon,
  Award,
  Briefcase,
  GraduationCap,
  Search,
  ExternalLink
} from "lucide-react"
import Link from "next/link"

export default function CreateExpertPage() {
  const [creationType, setCreationType] = useState<"custom" | "influencer" | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  
  // Custom Expert Form Data
  const [expertiseField, setExpertiseField] = useState("")
  const [yearsExperience, setYearsExperience] = useState("")
  const [specialties, setSpecialties] = useState<string[]>([])
  const [currentRole, setCurrentRole] = useState("")
  const [previousRoles, setPreviousRoles] = useState<string[]>([""])
  const [education, setEducation] = useState<string[]>([""])
  const [certifications, setCertifications] = useState<string[]>([""])
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  
  // Influencer Form Data
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [twitterUrl, setTwitterUrl] = useState("")
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [analysisResults, setAnalysisResults] = useState({
    posts: 247,
    videos: 15,
    articles: 89,
    totalSources: 351
  })

  // Mock curated sources for custom experts
  const curatedSources = [
    {
      id: "1",
      title: "Digital Marketing Strategy Handbook",
      type: "book",
      author: "Digital Marketing Institute",
      year: "2023",
      confidence: 95,
      selected: true
    },
    {
      id: "2",
      title: "Social Media Marketing Trends 2024",
      type: "article",
      author: "HubSpot",
      year: "2023",
      confidence: 92,
      selected: true
    },
    {
      id: "3",
      title: "Advanced Marketing Analytics",
      type: "video",
      author: "Google Marketing Platform",
      year: "2023",
      confidence: 89,
      selected: false
    },
    {
      id: "4",
      title: "Marketing Leadership Podcast",
      type: "podcast",
      author: "Marketing Week",
      year: "2023",
      confidence: 87,
      selected: true
    }
  ]

  // Mock discovered sources for influencer
  const discoveredSources = [
    {
      id: "1",
      title: "10 Digital Marketing Strategies That Actually Work",
      type: "post",
      platform: "LinkedIn",
      engagement: "2.4K likes, 89 comments",
      date: "2023-12-15",
      selected: true
    },
    {
      id: "2", 
      title: "How I Built My Personal Brand from Zero",
      type: "video",
      platform: "YouTube",
      views: "45K views",
      date: "2023-12-10",
      selected: true
    },
    {
      id: "3",
      title: "The Future of Content Marketing",
      type: "article",
      platform: "Medium",
      claps: "1.2K claps",
      date: "2023-12-08",
      selected: false
    }
  ]

  const handleAnalyzeInfluencer = () => {
    setIsAnalyzing(true)
    setTimeout(() => {
      setIsAnalyzing(false)
      setAnalysisComplete(true)
      setCurrentStep(3)
    }, 3000)
  }

  const addSpecialty = (specialty: string) => {
    if (specialty && !specialties.includes(specialty)) {
      setSpecialties([...specialties, specialty])
    }
  }

  const removeSpecialty = (specialty: string) => {
    setSpecialties(specialties.filter(s => s !== specialty))
  }

  const getSourceIcon = (type: string) => {
    switch (type) {
      case "book": return BookOpen
      case "article": return FileText
      case "video": return Play
      case "podcast": return Headphones
      case "post": return FileText
      default: return FileText
    }
  }

  if (!creationType) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        {/* Back Button */}
        <div className="flex items-center gap-2">
          <Link href="/expert-personas">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Experts
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Create Custom Expert</h1>
          <p className="text-muted-foreground text-lg">
            Build your own AI expert consultant tailored to your specific needs
          </p>
        </div>

        {/* Creation Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card 
            className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-2 hover:border-primary"
            onClick={() => setCreationType("custom")}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Custom Expert Creation</CardTitle>
              <CardDescription className="text-base">
                Define expertise areas and let our AI curate relevant knowledge sources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Define field of expertise & specialties</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>AI-curated knowledge sources</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Professional experience setup</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Source review & selection</span>
                </div>
              </div>
              <Button className="w-full mt-4">
                Start Custom Creation
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-2 hover:border-primary"
            onClick={() => setCreationType("influencer")}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl">Influencer-Based Creation</CardTitle>
              <CardDescription className="text-base">
                Create an expert based on a real influencer's content and expertise
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Import from social media profiles</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>AI content analysis & extraction</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Automated knowledge base creation</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Source confirmation & customization</span>
                </div>
              </div>
              <Button className="w-full mt-4">
                Start Influencer Import
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (creationType === "custom") {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        {/* Back Button */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCreationType(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Creation Types
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-white' : 'bg-muted'}`}>
                1
              </div>
              <span className="font-medium">Define Expertise</span>
            </div>
            <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-white' : 'bg-muted'}`}>
                2
              </div>
              <span className="font-medium">Experience & Education</span>
            </div>
            <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-primary text-white' : 'bg-muted'}`}>
                3
              </div>
              <span className="font-medium">Source Selection</span>
            </div>
          </div>

          {/* Step 1: Define Expertise */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Define Expertise
                </CardTitle>
                <CardDescription>
                  Tell us about the expert's field of expertise and specialties
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="field">Field of Expertise</Label>
                    <Input
                      id="field"
                      placeholder="e.g., Digital Marketing, Supply Chain, AI Strategy"
                      value={expertiseField}
                      onChange={(e) => setExpertiseField(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="years">Years of Experience</Label>
                    <Input
                      id="years"
                      placeholder="e.g., 15+ years"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Key Specialties</Label>
                  <div className="flex flex-wrap gap-2">
                    {specialties.map((specialty) => (
                      <Badge key={specialty} variant="secondary" className="cursor-pointer" onClick={() => removeSpecialty(specialty)}>
                        {specialty} ×
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a specialty (press Enter)"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addSpecialty((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-sm text-muted-foreground">Suggestions:</span>
                    {["Social Media Strategy", "Content Marketing", "Brand Building", "E-commerce", "Growth Hacking"].map((suggestion) => (
                      <Badge 
                        key={suggestion} 
                        variant="outline" 
                        className="cursor-pointer hover:bg-primary hover:text-white"
                        onClick={() => addSpecialty(suggestion)}
                      >
                        + {suggestion}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={() => setCurrentStep(2)}
                    disabled={!expertiseField || !yearsExperience || specialties.length === 0}
                  >
                    Next: Experience & Education
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Experience & Education */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Professional Experience */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Professional Experience
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Current Role</Label>
                      <Input
                        placeholder="e.g., Chief Marketing Officer at TechCorp"
                        value={currentRole}
                        onChange={(e) => setCurrentRole(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Previous Roles</Label>
                      {previousRoles.map((role, index) => (
                        <Input
                          key={index}
                          placeholder="e.g., Marketing Director at StartupXYZ (2018-2021)"
                          value={role}
                          onChange={(e) => {
                            const newRoles = [...previousRoles]
                            newRoles[index] = e.target.value
                            setPreviousRoles(newRoles)
                          }}
                        />
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviousRoles([...previousRoles, ""])}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Role
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Education & Certifications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Education & Certifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Education</Label>
                      {education.map((edu, index) => (
                        <Input
                          key={index}
                          placeholder="e.g., MBA Marketing - Harvard Business School"
                          value={edu}
                          onChange={(e) => {
                            const newEducation = [...education]
                            newEducation[index] = e.target.value
                            setEducation(newEducation)
                          }}
                        />
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEducation([...education, ""])}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Education
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Certifications</Label>
                      {certifications.map((cert, index) => (
                        <Input
                          key={index}
                          placeholder="e.g., Google Ads Certified Professional"
                          value={cert}
                          onChange={(e) => {
                            const newCertifications = [...certifications]
                            newCertifications[index] = e.target.value
                            setCertifications(newCertifications)
                          }}
                        />
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCertifications([...certifications, ""])}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Certification
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Back: Define Expertise
                </Button>
                <Button 
                  onClick={() => setCurrentStep(3)}
                  disabled={!currentRole}
                >
                  Next: Source Selection
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Source Selection */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  AI Source Discovery
                </CardTitle>
                <CardDescription>
                  Our AI has curated {curatedSources.length} relevant knowledge sources for {expertiseField}. Review and select the sources you want to include.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {curatedSources.map((source) => {
                    const Icon = getSourceIcon(source.type)
                    const isSelected = selectedSources.includes(source.id)
                    
                    return (
                      <div 
                        key={source.id}
                        className={`flex items-start gap-4 p-4 border rounded-lg transition-all ${
                          isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-muted/50'
                        }`}
                      >
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSources([...selectedSources, source.id])
                            } else {
                              setSelectedSources(selectedSources.filter(id => id !== source.id))
                            }
                          }}
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-white rounded-lg border">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold leading-tight">{source.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                by {source.author} • {source.year}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium">{source.confidence}%</span>
                              </div>
                              <p className="text-xs text-muted-foreground">confidence</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>{selectedSources.length}</strong> of {curatedSources.length} sources selected. 
                    Your expert will be trained on these knowledge sources.
                  </p>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    Back: Experience & Education
                  </Button>
                  <Button disabled={selectedSources.length === 0}>
                    Create Expert
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  if (creationType === "influencer") {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        {/* Back Button */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCreationType(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Creation Types
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-white' : 'bg-muted'}`}>
                1
              </div>
              <span className="font-medium">Social Media Input</span>
            </div>
            <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-white' : 'bg-muted'}`}>
                2
              </div>
              <span className="font-medium">Content Analysis</span>
            </div>
            <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-primary text-white' : 'bg-muted'}`}>
                3
              </div>
              <span className="font-medium">Source Confirmation</span>
            </div>
          </div>

          {/* Step 1: Social Media Input */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  Social Media Profiles
                </CardTitle>
                <CardDescription>
                  Provide links to the influencer's social media profiles. We'll analyze their content to create an AI expert.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn Profile</Label>
                    <div className="flex gap-2">
                      <Input
                        id="linkedin"
                        placeholder="https://linkedin.com/in/influencer-name"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                      />
                      <Button variant="outline" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter/X Profile</Label>
                    <div className="flex gap-2">
                      <Input
                        id="twitter"
                        placeholder="https://twitter.com/influencer"
                        value={twitterUrl}
                        onChange={(e) => setTwitterUrl(e.target.value)}
                      />
                      <Button variant="outline" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="youtube">YouTube Channel</Label>
                    <div className="flex gap-2">
                      <Input
                        id="youtube"
                        placeholder="https://youtube.com/@influencer"
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                      />
                      <Button variant="outline" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">What we'll analyze:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Recent posts and articles (last 12 months)</li>
                    <li>• Video content and transcripts</li>
                    <li>• Professional background and expertise</li>
                    <li>• Writing style and communication patterns</li>
                    <li>• Key topics and specialties</li>
                  </ul>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={() => setCurrentStep(2)}
                    disabled={!linkedinUrl && !twitterUrl && !youtubeUrl}
                  >
                    Start Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Content Analysis */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className={`h-5 w-5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  Content Analysis
                </CardTitle>
                <CardDescription>
                  {isAnalyzing ? "Analyzing content from provided profiles..." : "Analysis complete! Review the discovered content below."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isAnalyzing && !analysisComplete && (
                  <>
                    <div className="text-center py-8">
                      <Button onClick={handleAnalyzeInfluencer} size="lg">
                        <Search className="h-5 w-5 mr-2" />
                        Analyze Content
                      </Button>
                    </div>
                  </>
                )}

                {isAnalyzing && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-lg font-semibold mb-4">
                        Analyzing {analysisResults.posts} posts, {analysisResults.videos} videos, {analysisResults.articles} articles...
                      </div>
                      <Progress value={75} className="w-full max-w-md mx-auto" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <div className="font-semibold text-lg">{analysisResults.posts}</div>
                        <div className="text-sm text-muted-foreground">Posts & Articles</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <Play className="h-8 w-8 mx-auto mb-2 text-red-600" />
                        <div className="font-semibold text-lg">{analysisResults.videos}</div>
                        <div className="text-sm text-muted-foreground">Videos</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <BookOpen className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <div className="font-semibold text-lg">{analysisResults.totalSources}</div>
                        <div className="text-sm text-muted-foreground">Total Sources</div>
                      </div>
                    </div>
                  </div>
                )}

                {analysisComplete && (
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">Analysis Complete!</h4>
                      <p className="text-green-800 text-sm">
                        Successfully analyzed {analysisResults.totalSources} pieces of content. 
                        Discovered expertise in digital marketing, personal branding, and entrepreneurship.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <div className="font-semibold text-lg">{analysisResults.posts}</div>
                        <div className="text-sm text-muted-foreground">Posts & Articles</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <Play className="h-8 w-8 mx-auto mb-2 text-red-600" />
                        <div className="font-semibold text-lg">{analysisResults.videos}</div>
                        <div className="text-sm text-muted-foreground">Videos</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <BookOpen className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <div className="font-semibold text-lg">{analysisResults.articles}</div>
                        <div className="text-sm text-muted-foreground">Articles</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button onClick={() => setCurrentStep(3)}>
                        Review Sources
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Source Confirmation */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Source Confirmation
                </CardTitle>
                <CardDescription>
                  Review and confirm the discovered sources. All content will be used to train your AI expert.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {discoveredSources.map((source) => {
                    const Icon = getSourceIcon(source.type)
                    const isSelected = selectedSources.includes(source.id)
                    
                    return (
                      <div 
                        key={source.id}
                        className={`flex items-start gap-4 p-4 border rounded-lg transition-all ${
                          isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-muted/50'
                        }`}
                      >
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSources([...selectedSources, source.id])
                            } else {
                              setSelectedSources(selectedSources.filter(id => id !== source.id))
                            }
                          }}
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-white rounded-lg border">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold leading-tight">{source.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {source.platform} • {source.date}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {'engagement' in source && source.engagement}
                                {'views' in source && source.views}
                                {'claps' in source && source.claps}
                              </p>
                            </div>
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>{analysisResults.totalSources}</strong> sources discovered. 
                    Your AI expert will be trained on this content to replicate the influencer's expertise and communication style.
                  </p>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    Back: Content Analysis
                  </Button>
                  <Button>
                    Create Influencer Expert
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  return null
} 