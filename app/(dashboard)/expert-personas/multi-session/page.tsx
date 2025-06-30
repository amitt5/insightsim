"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  ArrowLeft,
  Users, 
  Plus,
  X,
  Star,
  MessageCircle,
  Lightbulb,
  Target,
  Clock,
  Zap,
  BookOpen,
  Search,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Building,
  Cpu,
  DollarSign,
  ShoppingCart
} from "lucide-react"
import Link from "next/link"

// Mock experts data (subset from main page)
const availableExperts = [
  {
    id: "sarah-chen",
    name: "Dr. Sarah Chen",
    title: "Supply Chain Strategy Expert",
    category: "supply-chain",
    avatar: "/placeholder-user.jpg",
    rating: 4.9,
    consultations: 247,
    specialties: ["Global Logistics", "Risk Management", "Sustainability"],
    responseTime: "< 5 min",
    isOnline: true,
    color: "bg-blue-100 text-blue-700"
  },
  {
    id: "marcus-rodriguez", 
    name: "Marcus Rodriguez",
    title: "Growth Marketing Strategist",
    category: "marketing-gtm",
    avatar: "/placeholder-user.jpg",
    rating: 4.8,
    consultations: 389,
    specialties: ["Product-Led Growth", "B2B SaaS", "Performance Marketing"],
    responseTime: "< 30 min",
    isOnline: false,
    color: "bg-green-100 text-green-700"
  },
  {
    id: "alex-kim",
    name: "Alex Kim", 
    title: "AI Implementation Consultant",
    category: "ai-tech",
    avatar: "/placeholder-user.jpg",
    rating: 4.9,
    consultations: 156,
    specialties: ["Enterprise AI", "Machine Learning Operations", "AI Ethics"],
    responseTime: "< 10 min",
    isOnline: true,
    color: "bg-purple-100 text-purple-700"
  },
  {
    id: "priya-patel",
    name: "Priya Patel",
    title: "E-commerce Growth Expert", 
    category: "ecommerce",
    avatar: "/placeholder-user.jpg",
    rating: 4.7,
    consultations: 298,
    specialties: ["Amazon Marketplace", "D2C Strategy", "Conversion Optimization"],
    responseTime: "< 15 min",
    isOnline: true,
    color: "bg-pink-100 text-pink-700"
  },
  {
    id: "david-thompson",
    name: "David Thompson",
    title: "CFO & Finance Strategy Expert",
    category: "finance", 
    avatar: "/placeholder-user.jpg",
    rating: 4.8,
    consultations: 167,
    specialties: ["Financial Modeling", "M&A Strategy", "Venture Capital"],
    responseTime: "< 1 hour",
    isOnline: false,
    color: "bg-emerald-100 text-emerald-700"
  },
  {
    id: "lisa-wang",
    name: "Lisa Wang",
    title: "People & Culture Leader",
    category: "hr-leadership",
    avatar: "/placeholder-user.jpg",
    rating: 4.9,
    consultations: 223,
    specialties: ["Remote Team Building", "Performance Management", "Culture Design"],
    responseTime: "< 20 min",
    isOnline: true,
    color: "bg-orange-100 text-orange-700"
  }
]

// Smart expert combinations
const smartCombinations = [
  {
    id: "startup-launch",
    title: "Startup Launch Panel", 
    description: "Complete guidance for launching a new business",
    experts: ["marcus-rodriguez", "david-thompson", "lisa-wang"],
    useCase: "Perfect for entrepreneurs planning their go-to-market strategy, funding, and team building"
  },
  {
    id: "digital-transformation",
    title: "Digital Transformation Board",
    description: "Technology adoption and operational efficiency",
    experts: ["alex-kim", "sarah-chen", "marcus-rodriguez"], 
    useCase: "Ideal for companies looking to modernize operations and implement AI/tech solutions"
  },
  {
    id: "ecommerce-scaling",
    title: "E-commerce Growth Council",
    description: "Scale your online business profitably",
    experts: ["priya-patel", "marcus-rodriguez", "sarah-chen"],
    useCase: "Great for online retailers looking to optimize operations and marketing for growth"
  }
]

export default function MultiExpertSessionPage() {
  const [selectedExperts, setSelectedExperts] = useState<string[]>([])
  const [sessionTitle, setSessionTitle] = useState("")
  const [sessionContext, setSessionContext] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [sessionMode, setSessionMode] = useState<"panel" | "individual">("panel")

  const filteredExperts = availableExperts.filter(expert =>
    expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expert.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const toggleExpert = (expertId: string) => {
    setSelectedExperts(prev => 
      prev.includes(expertId) 
        ? prev.filter(id => id !== expertId)
        : [...prev, expertId]
    )
  }

  const addSmartCombination = (combination: typeof smartCombinations[0]) => {
    setSelectedExperts(combination.experts)
    setSessionTitle(combination.title)
  }

  const selectedExpertData = availableExperts.filter(expert => selectedExperts.includes(expert.id))
  const estimatedCost = selectedExperts.length * 15 // $15 per expert per session
  const maxResponseTime = selectedExpertData.length > 0 
    ? Math.max(...selectedExpertData.map(expert => {
        const time = expert.responseTime.replace(/[^\d]/g, '')
        return parseInt(time) || 60
      }))
    : 0

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/expert-personas">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Experts
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Multi-Expert Session
          </h2>
          <p className="text-muted-foreground mt-1">
            Collaborate with multiple experts simultaneously for comprehensive insights
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expert Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Smart Combinations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Smart Expert Combinations
              </CardTitle>
              <CardDescription>
                Pre-configured expert panels for common business scenarios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {smartCombinations.map((combination) => (
                <div key={combination.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{combination.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{combination.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">{combination.useCase}</p>
                      <div className="flex items-center gap-2 mt-3">
                        {combination.experts.map((expertId) => {
                          const expert = availableExperts.find(e => e.id === expertId)
                          return expert ? (
                            <Avatar key={expertId} className="h-6 w-6">
                              <AvatarImage src={expert.avatar} alt={expert.name} />
                              <AvatarFallback className="text-xs">
                                {expert.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                          ) : null
                        })}
                        <span className="text-xs text-muted-foreground">
                          {combination.experts.length} experts
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => addSmartCombination(combination)}
                    >
                      Select Panel
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Expert Search & Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Available Experts
              </CardTitle>
              <CardDescription>
                Search and select individual experts for your custom panel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Search experts by name, title, or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredExperts.map((expert) => {
                  const isSelected = selectedExperts.includes(expert.id)
                  
                  return (
                    <div 
                      key={expert.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        isSelected ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleExpert(expert.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={expert.avatar} alt={expert.name} />
                            <AvatarFallback>
                              {expert.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          {expert.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm leading-tight">{expert.name}</h4>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{expert.title}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs">{expert.rating}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{expert.responseTime}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Session Configuration */}
        <div className="space-y-6">
          {/* Selected Experts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Selected Experts</span>
                <Badge variant="secondary">{selectedExperts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedExperts.length === 0 ? (
                <div className="text-center py-6">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No experts selected</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedExpertData.map((expert) => (
                    <div key={expert.id} className="flex items-center gap-3 p-2 border rounded">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={expert.avatar} alt={expert.name} />
                        <AvatarFallback className="text-xs">
                          {expert.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">{expert.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{expert.title}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpert(expert.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Session Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Session Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Session Title</label>
                <Input
                  placeholder="e.g., Startup Growth Strategy Session"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Business Context</label>
                <Textarea
                  placeholder="Describe your situation, challenges, and what you hope to achieve from this expert panel..."
                  value={sessionContext}
                  onChange={(e) => setSessionContext(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Discussion Mode</label>
                <div className="space-y-2">
                  <div 
                    className={`p-3 border rounded cursor-pointer transition-all ${
                      sessionMode === "panel" ? 'bg-primary/5 border-primary' : ''
                    }`}
                    onClick={() => setSessionMode("panel")}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox checked={sessionMode === "panel"} readOnly />
                      <div>
                        <p className="text-sm font-medium">Panel Discussion</p>
                        <p className="text-xs text-muted-foreground">
                          Experts collaborate and build on each other's insights
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-3 border rounded cursor-pointer transition-all ${
                      sessionMode === "individual" ? 'bg-primary/5 border-primary' : ''
                    }`}
                    onClick={() => setSessionMode("individual")}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox checked={sessionMode === "individual"} readOnly />
                      <div>
                        <p className="text-sm font-medium">Individual Responses</p>
                        <p className="text-xs text-muted-foreground">
                          Get separate perspective from each expert
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Summary */}
          {selectedExperts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Session Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Experts:</span>
                  <span className="font-medium">{selectedExperts.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Est. Response Time:</span>
                  <span className="font-medium">< {maxResponseTime} min</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Mode:</span>
                  <span className="font-medium capitalize">{sessionMode}</span>
                </div>
                <div className="flex items-center justify-between text-sm border-t pt-3">
                  <span>Estimated Cost:</span>
                  <span className="font-semibold">${estimatedCost}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Start Session */}
          <Link 
            href={selectedExperts.length > 0 ? 
              `/expert-personas/chat/panel?experts=${selectedExperts.join(',')}&mode=${sessionMode}&title=${encodeURIComponent(sessionTitle)}` : 
              '#'
            }
          >
            <Button 
              size="lg" 
              className="w-full"
              disabled={selectedExperts.length === 0 || !sessionTitle.trim()}
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Start Expert Panel
            </Button>
          </Link>
          
          {selectedExperts.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3" />
              <span>Select at least one expert to continue</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 