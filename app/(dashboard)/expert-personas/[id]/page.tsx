"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  ArrowLeft,
  Star, 
  MessageCircle,
  Users,
  BookOpen,
  Clock,
  Shield,
  Calendar,
  Award,
  TrendingUp,
  ExternalLink,
  Play,
  FileText,
  Globe,
  Youtube,
  Headphones,
  CheckCircle2,
  Zap,
  Target,
  Briefcase
} from "lucide-react"
import Link from "next/link"

// Mock expert data
const expertData = {
  id: "sarah-chen",
  name: "Dr. Sarah Chen",
  title: "Supply Chain Strategy Expert", 
  avatar: "/placeholder-user.jpg",
  rating: 4.9,
  totalReviews: 247,
  consultations: 247,
  responseTime: "< 5 min",
  isOnline: true,
  categories: ["Supply Chain", "Operations", "Risk Management"],
  specialties: ["Global Logistics", "Risk Management", "Sustainability", "Lean Operations", "Vendor Management", "Digital Transformation"],
  experience: "15+ years",
  currentRole: "Former VP Supply Chain at Amazon",
  previousRoles: [
    "Senior Director, Global Logistics - Microsoft (2018-2021)",
    "Principal Consultant - McKinsey & Company (2015-2018)",
    "Operations Manager - Toyota (2012-2015)"
  ],
  education: [
    "PhD Operations Research - MIT Sloan School",
    "MS Industrial Engineering - Stanford University", 
    "BS Mechanical Engineering - UC Berkeley"
  ],
  certifications: [
    "APICS Supply Chain Operations Reference (SCOR)",
    "Certified Supply Chain Professional (CSCP)",
    "Six Sigma Black Belt"
  ],
  languages: ["English (Native)", "Mandarin (Fluent)", "Spanish (Conversational)"],
  bio: "Dr. Sarah Chen is a globally recognized supply chain strategist with over 15 years of experience optimizing complex logistics networks for Fortune 500 companies. She led Amazon's supply chain transformation initiatives across 12 countries, resulting in 30% cost reduction and 40% improvement in delivery times. Sarah specializes in building resilient supply chains that balance efficiency with sustainability.",
  priceRange: "$$",
  knowledgeSourcesCount: 127,
  lastUpdated: "2 hours ago",
  trustScore: 96,
  verifiedSources: 847
}

// Mock knowledge sources
const knowledgeSources = [
  {
    id: "1",
    title: "The Everything Store: Jeff Bezos and the Age of Amazon",
    type: "book",
    author: "Brad Stone",
    year: "2013",
    confidence: 95,
    enabled: true,
    summary: "Comprehensive insights into Amazon's operational excellence and logistics innovation"
  },
  {
    id: "2", 
    title: "Supply Chain Management: Strategy, Planning, and Operation",
    type: "book",
    author: "Sunil Chopra",
    year: "2019",
    confidence: 98,
    enabled: true,
    summary: "Foundational principles of supply chain strategy and optimization"
  },
  {
    id: "3",
    title: "Resilient Supply Chains in Uncertain Times",
    type: "article",
    author: "Harvard Business Review",
    year: "2023",
    confidence: 92,
    enabled: true,
    summary: "Latest strategies for building antifragile supply networks"
  },
  {
    id: "4",
    title: "The Future of Logistics: Automation and AI",
    type: "video",
    author: "MIT Technology Review",
    year: "2023",
    confidence: 89,
    enabled: false,
    summary: "Emerging technologies reshaping global logistics"
  },
  {
    id: "5",
    title: "Supply Chain Sustainability Podcast Series",
    type: "podcast",
    author: "Supply Chain Dive",
    year: "2023",
    confidence: 87,
    enabled: true,
    summary: "Weekly discussions on sustainable supply chain practices"
  }
]

// Mock reviews
const reviews = [
  {
    id: "1",
    author: "Michael R.",
    role: "VP Operations, TechCorp",
    rating: 5,
    date: "2 days ago",
    comment: "Dr. Chen provided exceptional insights for our supply chain transformation. Her expertise in risk management saved us from potential disruptions during the supply crisis."
  },
  {
    id: "2", 
    author: "Jennifer L.",
    role: "Founder, E-commerce Startup",
    rating: 5,
    date: "1 week ago",
    comment: "Incredible depth of knowledge in logistics optimization. Sarah helped us reduce shipping costs by 25% while improving delivery times."
  },
  {
    id: "3",
    author: "David K.",
    role: "Supply Chain Director, ManufactureCo",
    rating: 5,
    date: "2 weeks ago", 
    comment: "Outstanding strategic guidance on vendor management and sustainability initiatives. Highly recommended for any supply chain challenges."
  }
]

const getSourceIcon = (type: string) => {
  switch (type) {
    case "book": return BookOpen
    case "article": return FileText
    case "video": return Play
    case "podcast": return Headphones
    default: return Globe
  }
}

export default function ExpertProfilePage({ params }: { params: { id: string } }) {
  const [selectedSources, setSelectedSources] = useState(
    knowledgeSources.filter(source => source.enabled).map(source => source.id)
  )
  const [consultationMode, setConsultationMode] = useState<"qa" | "consultant">("qa")

  const toggleSource = (sourceId: string) => {
    setSelectedSources(prev => 
      prev.includes(sourceId) 
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    )
  }

  const enabledSources = knowledgeSources.filter(source => selectedSources.includes(source.id))
  const averageConfidence = enabledSources.reduce((acc, source) => acc + source.confidence, 0) / enabledSources.length

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
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center md:items-start">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={expertData.avatar} alt={expertData.name} />
                  <AvatarFallback className="text-2xl">
                    {expertData.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {expertData.isOnline && (
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white"></div>
                )}
              </div>
              <Badge variant="outline" className="mt-3">
                {expertData.responseTime} response
              </Badge>
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold">{expertData.name}</h1>
                <p className="text-xl text-muted-foreground">{expertData.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{expertData.currentRole}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{expertData.rating}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">({expertData.totalReviews} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{expertData.consultations} consultations</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">{expertData.trustScore}% trust score</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {expertData.specialties.slice(0, 6).map((specialty) => (
                  <Badge key={specialty} variant="secondary">
                    {specialty}
                  </Badge>
                ))}
              </div>

              <p className="text-muted-foreground leading-relaxed">
                {expertData.bio}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link href={`/expert-personas/chat/${expertData.id}`}>
                <Button size="lg" className="w-full md:w-auto">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Start Consultation
                </Button>
              </Link>
              <Link href="/expert-personas/multi-session">
                <Button variant="outline" size="lg" className="w-full md:w-auto">
                  <Users className="h-5 w-5 mr-2" />
                  Add to Panel
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="knowledge" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="knowledge">Knowledge Sources</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="session-setup">Session Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Knowledge Sources
                  </CardTitle>
                  <CardDescription>
                    Select which sources to include in your consultation. Based on {expertData.verifiedSources} verified sources.
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Average Confidence</p>
                  <div className="flex items-center gap-2">
                    <Progress value={averageConfidence} className="w-20" />
                    <span className="font-semibold">{Math.round(averageConfidence)}%</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {knowledgeSources.map((source) => {
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
                      onCheckedChange={() => toggleSource(source.id)}
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
                          <p className="text-sm mt-1">{source.summary}</p>
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
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>{selectedSources.length}</strong> of {knowledgeSources.length} sources selected. 
                  Dr. Chen's responses will be based on these sources with an average confidence of <strong>{Math.round(averageConfidence)}%</strong>.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="experience" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Professional Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-primary">{expertData.currentRole}</h4>
                  <p className="text-sm text-muted-foreground">Current Role</p>
                </div>
                {expertData.previousRoles.map((role, index) => (
                  <div key={index}>
                    <h4 className="font-semibold">{role}</h4>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Education & Certifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Education</h4>
                  {expertData.education.map((edu, index) => (
                    <p key={index} className="text-sm mb-1">{edu}</p>
                  ))}
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Certifications</h4>
                  {expertData.certifications.map((cert, index) => (
                    <p key={index} className="text-sm mb-1">{cert}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Client Reviews
              </CardTitle>
              <CardDescription>
                Recent feedback from {expertData.totalReviews} consultations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{review.author}</h4>
                      <p className="text-sm text-muted-foreground">{review.role}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${
                              i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                            }`} 
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{review.date}</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="session-setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Consultation Setup
              </CardTitle>
              <CardDescription>
                Configure your session preferences and consultation mode
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Consultation Mode</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card 
                    className={`cursor-pointer transition-all ${
                      consultationMode === "qa" ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setConsultationMode("qa")}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Zap className="h-6 w-6 text-blue-600" />
                        <div>
                          <h5 className="font-semibold">Q&A Mode</h5>
                          <p className="text-sm text-muted-foreground">Quick questions and specific answers</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    className={`cursor-pointer transition-all ${
                      consultationMode === "consultant" ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setConsultationMode("consultant")}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Users className="h-6 w-6 text-green-600" />
                        <div>
                          <h5 className="font-semibold">Consultant Mode</h5>
                          <p className="text-sm text-muted-foreground">Deep strategic discussion and planning</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Session Summary</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Expert:</strong> {expertData.name}</p>
                  <p><strong>Mode:</strong> {consultationMode === "qa" ? "Q&A Session" : "Strategic Consultation"}</p>
                  <p><strong>Knowledge Sources:</strong> {selectedSources.length} sources selected</p>
                  <p><strong>Confidence Level:</strong> {Math.round(averageConfidence)}%</p>
                  <p><strong>Response Time:</strong> {expertData.responseTime}</p>
                </div>
              </div>

              <Link href={`/expert-personas/chat/${expertData.id}?mode=${consultationMode}&sources=${selectedSources.join(',')}`}>
                <Button size="lg" className="w-full">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Start {consultationMode === "qa" ? "Q&A Session" : "Strategic Consultation"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 