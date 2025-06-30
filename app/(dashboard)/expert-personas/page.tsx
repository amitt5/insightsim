"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  GraduationCap, 
  Search, 
  Plus, 
  Star, 
  MessageCircle,
  Users,
  TrendingUp,
  DollarSign,
  Briefcase,
  Cpu,
  ShoppingCart,
  Globe,
  Building,
  Zap,
  Target,
  BookOpen,
  Award,
  Clock
} from "lucide-react"
import Link from "next/link"

// Mock data for expert categories
const expertCategories = [
  {
    id: "supply-chain",
    name: "Supply Chain & Operations",
    icon: Building,
    count: 8,
    color: "bg-blue-100 text-blue-700",
    description: "Logistics, procurement, manufacturing"
  },
  {
    id: "marketing-gtm",
    name: "Marketing & Go-to-Market",
    icon: Target,
    count: 12,
    color: "bg-green-100 text-green-700",
    description: "Brand strategy, digital marketing, growth"
  },
  {
    id: "ai-tech",
    name: "AI & Technology",
    icon: Cpu,
    count: 15,
    color: "bg-purple-100 text-purple-700",
    description: "AI strategy, software development, tech innovation"
  },
  {
    id: "finance",
    name: "Finance & Investment",
    icon: DollarSign,
    count: 7,
    color: "bg-emerald-100 text-emerald-700",
    description: "CFO insights, investment strategy, financial modeling"
  },
  {
    id: "hr-leadership",
    name: "HR & Leadership",
    icon: Users,
    count: 6,
    color: "bg-orange-100 text-orange-700",
    description: "People strategy, organizational development"
  },
  {
    id: "ecommerce",
    name: "E-commerce & Retail",
    icon: ShoppingCart,
    count: 9,
    color: "bg-pink-100 text-pink-700",
    description: "Online retail, customer experience, marketplace"
  }
]

// Mock data for featured experts
const featuredExperts = [
  {
    id: "sarah-chen",
    name: "Dr. Sarah Chen",
    title: "Supply Chain Strategy Expert",
    category: "supply-chain",
    avatar: "/placeholder-user.jpg",
    rating: 4.9,
    consultations: 247,
    specialties: ["Global Logistics", "Risk Management", "Sustainability"],
    experience: "Former VP Supply Chain at Amazon, 15+ years",
    isOnline: true,
    responseTime: "< 5 min",
    priceRange: "$$",
    knowledgeSources: 127,
    recentUpdate: "2 hours ago"
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
    experience: "Founded 3 startups, CMO at Stripe",
    isOnline: false,
    responseTime: "< 30 min",
    priceRange: "$$$",
    knowledgeSources: 203,
    recentUpdate: "1 day ago"
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
    experience: "Former AI Research Lead at Google, PhD Stanford",
    isOnline: true,
    responseTime: "< 10 min",
    priceRange: "$$$",
    knowledgeSources: 341,
    recentUpdate: "30 min ago"
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
    experience: "Built $50M+ e-commerce brands, ex-Shopify",
    isOnline: true,
    responseTime: "< 15 min", 
    priceRange: "$$",
    knowledgeSources: 189,
    recentUpdate: "1 hour ago"
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
    experience: "CFO at 3 unicorn startups, ex-Goldman Sachs",
    isOnline: false,
    responseTime: "< 1 hour",
    priceRange: "$$$",
    knowledgeSources: 156,
    recentUpdate: "3 hours ago"
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
    experience: "CHRO at Airbnb, Built teams at 5 scale-ups",
    isOnline: true,
    responseTime: "< 20 min",
    priceRange: "$$",
    knowledgeSources: 134,
    recentUpdate: "45 min ago"
  }
]

const searchSuggestions = [
  "AI implementation strategy",
  "Supply chain optimization", 
  "Go-to-market for B2B SaaS",
  "E-commerce conversion rates",
  "Remote team management",
  "Financial modeling for startups"
]

export default function ExpertPersonasPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const filteredExperts = featuredExperts.filter(expert => {
    const matchesSearch = expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         expert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         expert.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = !selectedCategory || expert.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const ExpertCard = ({ expert }: { expert: typeof featuredExperts[0] }) => {
    return (
      <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={expert.avatar} alt={expert.name} />
                  <AvatarFallback>{expert.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                {expert.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg leading-tight">{expert.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">{expert.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{expert.rating}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Specialties */}
          <div className="flex flex-wrap gap-1">
            {expert.specialties.slice(0, 3).map((specialty) => (
              <Badge key={specialty} variant="secondary" className="text-xs">
                {specialty}
              </Badge>
            ))}
            {expert.specialties.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{expert.specialties.length - 3} more
              </Badge>
            )}
          </div>

          {/* Experience snippet */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {expert.experience}
          </p>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                <span>{expert.consultations} sessions</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                <span>{expert.knowledgeSources} sources</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{expert.responseTime}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Link href={`/expert-personas/chat/${expert.id}`} className="flex-1">
              <Button size="sm" className="w-full">
                <MessageCircle className="h-4 w-4 mr-2" />
                Consult
              </Button>
            </Link>
            <Link href={`/expert-personas/${expert.id}`}>
              <Button size="sm" variant="outline">
                View Profile
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            Expert Personas
          </h2>
          <p className="text-muted-foreground mt-1">
            Get strategic advice from AI-powered expert consultants across various domains
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Multi-Expert Session
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Custom Expert
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for expertise (e.g., 'AI strategy', 'supply chain optimization')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="pl-10"
            />
            {showSuggestions && searchQuery.length === 0 && (
              <div className="absolute top-full mt-1 w-full bg-white border rounded-md shadow-lg z-10">
                <div className="p-2">
                  <p className="text-xs text-muted-foreground mb-2">Popular searches:</p>
                  {searchSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      className="block w-full text-left px-2 py-1 text-sm hover:bg-muted rounded text-muted-foreground"
                      onClick={() => setSearchQuery(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Grid */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Browse by Expertise</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {expertCategories.map((category) => {
            const Icon = category.icon
            const isSelected = selectedCategory === category.id
            
            return (
              <Card 
                key={category.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedCategory(isSelected ? null : category.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${category.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{category.name}</h4>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                    <Badge variant="secondary">{category.count}</Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Expert Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">
            {selectedCategory 
              ? `${expertCategories.find(c => c.id === selectedCategory)?.name} Experts`
              : "Featured Experts"
            }
          </h3>
          {selectedCategory && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              Clear filter
            </Button>
          )}
        </div>
        
        {filteredExperts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No experts found</h3>
              <p className="text-muted-foreground text-center mb-4">
                Try adjusting your search terms or browse different categories
              </p>
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear search
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExperts.map((expert) => (
              <ExpertCard key={expert.id} expert={expert} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-1">Quick Consultation</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Get immediate answers from our top-rated experts
              </p>
              <Button size="sm" variant="outline">Start Chat</Button>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold mb-1">Expert Panel</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Collaborate with multiple experts simultaneously
              </p>
              <Button size="sm" variant="outline">Create Panel</Button>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold mb-1">Custom Expert</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Build a specialized expert for your unique needs
              </p>
              <Button size="sm" variant="outline">Get Started</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 