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

// Categories for browsing experts
const categories = [
  { id: "supply-chain", name: "Supply Chain", icon: "🚚" },
  { id: "marketing", name: "Marketing/GTM", icon: "📈" },
  { id: "ai-tech", name: "AI/Tech", icon: "🤖" },
  { id: "finance", name: "Finance", icon: "💰" },
  { id: "hr", name: "HR", icon: "👥" },
  { id: "ecommerce", name: "E-commerce", icon: "🛒" },
  { id: "influencer", name: "Influencer Personas", icon: "⭐" }
]

// Mock expert data with more detailed profiles
const allExperts = [
  {
    id: "sarah-chen",
    name: "Dr. Sarah Chen",
    title: "Supply Chain Strategy Expert",
    category: "supply-chain",
    avatar: "/placeholder-user.jpg",
    rating: 4.9,
    responseTime: "< 5 min",
    isOnline: true,
    specialties: ["Global Logistics", "Risk Management", "Sustainability"],
    bio: "Former Amazon supply chain director with 15+ years optimizing global operations",
    experience: "15+ years",
    consultations: 847,
    successRate: 98
  },
  {
    id: "marcus-rodriguez", 
    name: "Marcus Rodriguez",
    title: "Growth Marketing Strategist",
    category: "marketing",
    avatar: "/placeholder-user.jpg",
    rating: 4.8,
    responseTime: "< 30 min",
    isOnline: false,
    specialties: ["Product-Led Growth", "B2B SaaS", "Performance Marketing"],
    bio: "Built and scaled marketing teams at 3 unicorn startups",
    experience: "12+ years",
    consultations: 623,
    successRate: 96
  },
  {
    id: "alex-kim",
    name: "Alex Kim",
    title: "AI Implementation Consultant", 
    category: "ai-tech",
    avatar: "/placeholder-user.jpg",
    rating: 4.9,
    responseTime: "< 10 min",
    isOnline: true,
    specialties: ["Enterprise AI", "ML Operations", "AI Ethics"],
    bio: "Former Google AI researcher helping enterprises adopt AI responsibly",
    experience: "10+ years",
    consultations: 412,
    successRate: 99
  },
  {
    id: "david-thompson",
    name: "David Thompson",
    title: "Strategic Finance Advisor",
    category: "finance", 
    avatar: "/placeholder-user.jpg",
    rating: 4.7,
    responseTime: "< 2 hours",
    isOnline: true,
    specialties: ["Fundraising", "Financial Planning", "Valuation"],
    bio: "Ex-Goldman Sachs VP, helped raise $2B+ for startups",
    experience: "18+ years",
    consultations: 789,
    successRate: 94
  },
  {
    id: "lisa-wang",
    name: "Lisa Wang",
    title: "People Operations Expert",
    category: "hr",
    avatar: "/placeholder-user.jpg", 
    rating: 4.8,
    responseTime: "< 1 hour",
    isOnline: false,
    specialties: ["Scaling Teams", "Culture", "Performance Management"],
    bio: "Former Airbnb Head of People, scaled from 50 to 5000 employees",
    experience: "14+ years",
    consultations: 556,
    successRate: 97
  },
  {
    id: "james-miller",
    name: "James Miller",
    title: "E-commerce Growth Specialist",
    category: "ecommerce",
    avatar: "/placeholder-user.jpg",
    rating: 4.6,
    responseTime: "< 45 min", 
    isOnline: true,
    specialties: ["Conversion Optimization", "Amazon FBA", "DTC Brands"],
    bio: "Grew 3 e-commerce brands from 0 to $10M+ revenue",
    experience: "11+ years",
    consultations: 334,
    successRate: 95
  },
  // Influencer Personas
  {
    id: "gary-vaynerchuk",
    name: "Gary Vaynerchuk",
    title: "Digital Marketing & Entrepreneurship Influencer",
    category: "influencer",
    avatar: "/placeholder-user.jpg",
    rating: 4.9,
    responseTime: "< 15 min",
    isOnline: true,
    specialties: ["Digital Marketing", "Entrepreneurship", "Personal Branding"],
    bio: "CEO of VaynerMedia, serial entrepreneur, and digital marketing pioneer",
    experience: "20+ years",
    consultations: 1250,
    successRate: 98,
    followers: "5,795,075 LinkedIn followers"
  },
  {
    id: "adam-grant",
    name: "Adam Grant", 
    title: "Organizational Psychology Expert",
    category: "influencer",
    avatar: "/placeholder-user.jpg",
    rating: 4.9,
    responseTime: "< 20 min",
    isOnline: false,
    specialties: ["Organizational Psychology", "Leadership", "Productivity", "Work-life Balance"],
    bio: "Wharton professor, bestselling author of 'Give and Take' and 'Think Again'",
    experience: "15+ years",
    consultations: 890,
    successRate: 99,
    followers: "6,000,000+ LinkedIn followers"
  },
  {
    id: "steven-bartlett",
    name: "Steven Bartlett",
    title: "Entrepreneur & Media Personality",
    category: "influencer", 
    avatar: "/placeholder-user.jpg",
    rating: 4.8,
    responseTime: "< 30 min",
    isOnline: true,
    specialties: ["Entrepreneurship", "Media", "Investment"],
    bio: "Founder of Social Chain, host of 'The Diary of a CEO' podcast",
    experience: "12+ years",
    consultations: 675,
    successRate: 96,
    followers: "2,871,281 LinkedIn followers"
  },
  {
    id: "sara-blakely",
    name: "Sara Blakely",
    title: "Women's Entrepreneurship Champion",
    category: "influencer",
    avatar: "/placeholder-user.jpg", 
    rating: 4.9,
    responseTime: "< 25 min",
    isOnline: true,
    specialties: ["Entrepreneurship", "Women in Business", "Product Innovation"],
    bio: "Founder of Spanx, self-made billionaire and women's empowerment advocate",
    experience: "20+ years",
    consultations: 543,
    successRate: 98,
    followers: "2,291,704 LinkedIn followers"
  },
  {
    id: "allie-miller",
    name: "Allie K. Miller",
    title: "AI & Business Innovation Expert", 
    category: "influencer",
    avatar: "/placeholder-user.jpg",
    rating: 4.8,
    responseTime: "< 15 min",
    isOnline: true,
    specialties: ["AI", "Business Growth", "Innovation"],
    bio: "Former Amazon AI leader, helping businesses harness AI for growth",
    experience: "10+ years",
    consultations: 723,
    successRate: 97,
    followers: "1,540,749 LinkedIn followers"
  },
  {
    id: "bernard-marr",
    name: "Bernard Marr",
    title: "Future Tech & Strategy Advisor",
    category: "influencer",
    avatar: "/placeholder-user.jpg",
    rating: 4.7,
    responseTime: "< 20 min", 
    isOnline: false,
    specialties: ["Futurism", "Technology", "Business Strategy", "AI", "Big Data"],
    bio: "World-renowned futurist, author of 20+ books on business and technology",
    experience: "18+ years",
    consultations: 934,
    successRate: 95,
    followers: "1,542,289 LinkedIn followers"
  },
  {
    id: "mel-robbins",
    name: "Mel Robbins",
    title: "Motivation & Mindset Coach",
    category: "influencer",
    avatar: "/placeholder-user.jpg",
    rating: 4.9,
    responseTime: "< 10 min",
    isOnline: true,
    specialties: ["Motivation", "Mindset", "Productivity"],
    bio: "Creator of The 5 Second Rule, bestselling author and motivational speaker",
    experience: "15+ years",
    consultations: 812,
    successRate: 99,
    followers: "1,257,656 LinkedIn followers"
  },
  {
    id: "alex-hormozi",
    name: "Alex Hormozi",
    title: "Business Scaling Expert",
    category: "influencer",
    avatar: "/placeholder-user.jpg",
    rating: 4.8,
    responseTime: "< 30 min",
    isOnline: true,
    specialties: ["Business Scaling", "Entrepreneurship", "Investing"],
    bio: "Serial entrepreneur, author of '$100M Offers' and '$100M Leads'",
    experience: "12+ years",
    consultations: 456,
    successRate: 97,
    followers: "774,667 LinkedIn followers"
  },
  {
    id: "justin-welsh",
    name: "Justin Welsh",
    title: "Solopreneurship Strategist",
    category: "influencer",
    avatar: "/placeholder-user.jpg",
    rating: 4.9,
    responseTime: "< 15 min",
    isOnline: true,
    specialties: ["Solopreneurship", "Brand-building", "Audience Growth"],
    bio: "Built a $5M+ one-person business, teaches solopreneurship strategies",
    experience: "8+ years",
    consultations: 634,
    successRate: 98,
    followers: "751,266 LinkedIn followers"
  },
  {
    id: "lenny-rachitsky",
    name: "Lenny Rachitsky",
    title: "Product Growth Specialist",
    category: "influencer",
    avatar: "/placeholder-user.jpg",
    rating: 4.8,
    responseTime: "< 25 min",
    isOnline: false,
    specialties: ["Growth Strategies", "Product Management", "Scaling Businesses"],
    bio: "Former Airbnb PM, creator of Lenny's Newsletter with 500k+ subscribers",
    experience: "10+ years", 
    consultations: 387,
    successRate: 96,
    followers: "216,000+ LinkedIn followers"
  },
  {
    id: "tom-hunt",
    name: "Tom Hunt",
    title: "SaaS Growth Expert",
    category: "influencer",
    avatar: "/placeholder-user.jpg",
    rating: 4.7,
    responseTime: "< 35 min",
    isOnline: true,
    specialties: ["SaaS", "Entrepreneurship", "Content Marketing"],
    bio: "Serial SaaS entrepreneur, podcast host, and content marketing strategist",
    experience: "9+ years",
    consultations: 298,
    successRate: 94,
    followers: "213,154 LinkedIn followers"
  },
  {
    id: "harry-stebbings",
    name: "Harry Stebbings",
    title: "Venture Capital & Fundraising Expert",
    category: "influencer",
    avatar: "/placeholder-user.jpg",
    rating: 4.8,
    responseTime: "< 40 min",
    isOnline: true,
    specialties: ["Venture Capital", "Fundraising", "Tech Industry Insights"],
    bio: "Host of '20 Minute VC' podcast, General Partner at 20VC",
    experience: "8+ years",
    consultations: 445,
    successRate: 95,
    followers: "203,513 LinkedIn followers"
  },
  {
    id: "dave-gerhardt",
    name: "Dave Gerhardt",
    title: "B2B Marketing & Brand Expert",
    category: "influencer",
    avatar: "/placeholder-user.jpg",
    rating: 4.8,
    responseTime: "< 20 min",
    isOnline: false,
    specialties: ["Demand Generation", "B2B Growth Strategies", "Brand Visibility"],
    bio: "Former Drift CMO, founder of Exit Five B2B marketing community",
    experience: "12+ years",
    consultations: 567,
    successRate: 97,
    followers: "172,000+ LinkedIn followers"
  },
  {
    id: "cathy-hackl",
    name: "Cathy Hackl",
    title: "Metaverse & Spatial Computing Expert",
    category: "influencer",
    avatar: "/placeholder-user.jpg",
    rating: 4.7,
    responseTime: "< 30 min",
    isOnline: true,
    specialties: ["Metaverse", "AI", "AR/VR", "Spatial Computing"],
    bio: "Chief Metaverse Officer, leading strategist for Web3 and spatial computing",
    experience: "15+ years",
    consultations: 234,
    successRate: 93,
    followers: "171,669 LinkedIn followers"
  },
  {
    id: "alex-lieberman",
    name: "Alex Lieberman",
    title: "Growth Marketing & Content Strategist",
    category: "influencer",
    avatar: "/placeholder-user.jpg",
    rating: 4.8,
    responseTime: "< 25 min",
    isOnline: true,
    specialties: ["Growth Marketing", "Audience Engagement", "Content Strategy"],
    bio: "Co-founder of Morning Brew, expert in audience-first business building",
    experience: "8+ years",
    consultations: 423,
    successRate: 96,
    followers: "168,000+ LinkedIn followers"
  },
  {
    id: "jason-fried",
    name: "Jason Fried",
    title: "Remote Work & Business Philosophy Expert",
    category: "influencer",
    avatar: "/placeholder-user.jpg",
    rating: 4.9,
    responseTime: "< 45 min",
    isOnline: false,
    specialties: ["Entrepreneurship", "Business", "Remote Work"],
    bio: "Co-founder of Basecamp, author of 'Remote' and 'ReWork'",
    experience: "20+ years",
    consultations: 356,
    successRate: 98,
    followers: "155,597 LinkedIn followers"
  },
  {
    id: "susan-etlinger",
    name: "Susan Etlinger",
    title: "AI Ethics & Digital Strategy Expert",
    category: "influencer",
    avatar: "/placeholder-user.jpg",
    rating: 4.8,
    responseTime: "< 35 min",
    isOnline: true,
    specialties: ["AI", "Digital Strategy", "Ethics"],
    bio: "Industry analyst focused on AI ethics and responsible technology adoption",
    experience: "16+ years",
    consultations: 189,
    successRate: 95,
    followers: "105,000+ LinkedIn followers"
  },
  {
    id: "jason-vana",
    name: "Jason Vana",
    title: "Client Acquisition & LinkedIn Expert",
    category: "influencer",
    avatar: "/placeholder-user.jpg",
    rating: 4.7,
    responseTime: "< 20 min",
    isOnline: true,
    specialties: ["Clients", "Brand", "LinkedIn"],
    bio: "LinkedIn marketing strategist helping B2B companies generate leads",
    experience: "7+ years",
    consultations: 312,
    successRate: 94,
    followers: "83,395 LinkedIn followers"
  },
  {
    id: "dean-seddon",
    name: "Dean Seddon",
    title: "LinkedIn & Business Development Expert",
    category: "influencer",
    avatar: "/placeholder-user.jpg",
    rating: 4.6,
    responseTime: "< 30 min",
    isOnline: false,
    specialties: ["LinkedIn", "Clients", "Business"],
    bio: "LinkedIn specialist helping professionals build their personal brand",
    experience: "6+ years",
    consultations: 278,
    successRate: 92,
    followers: "75,571 LinkedIn followers"
  },
  {
    id: "katelyn-bourgoin",
    name: "Katelyn Bourgoin",
    title: "Customer Psychology & Growth Expert",
    category: "influencer",
    avatar: "/placeholder-user.jpg",
    rating: 4.9,
    responseTime: "< 15 min",
    isOnline: true,
    specialties: ["Customer Psychology", "Audience Insights", "Data-driven Growth Strategies"],
    bio: "Founder of Customer Camp, expert in customer research and behavioral insights",
    experience: "9+ years",
    consultations: 445,
    successRate: 98,
    followers: "74,000+ LinkedIn followers"
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

  const filteredExperts = allExperts.filter(expert => {
    const matchesSearch = expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         expert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         expert.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = !selectedCategory || expert.category === selectedCategory
    return matchesSearch && matchesCategory
  })



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

      {/* Browse by Expertise */}
      <h3 className="text-xl font-semibold mb-4">Browse by Expertise</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => {
          const isSelected = selectedCategory === category.id
          const categoryExperts = allExperts.filter(expert => expert.category === category.id)
          
          return (
            <Card 
              key={category.id}
              className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
                isSelected 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200 hover:border-primary/50'
              }`}
              onClick={() => setSelectedCategory(isSelected ? null : category.id)}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {category.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{category.name}</h4>
                  <p className="text-sm text-gray-600">
                    {categoryExperts.length} expert{categoryExperts.length !== 1 ? 's' : ''} available
                  </p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Expert Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">
            {selectedCategory 
              ? `${categories.find(c => c.id === selectedCategory)?.name} Experts`
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
              <Card key={expert.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
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
                      <h3 className="font-semibold text-lg leading-tight mb-1">{expert.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{expert.title}</p>
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{expert.rating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Show follower count for influencer personas */}
                  {expert.category === 'influencer' && 'followers' in expert && (
                    <div className="mb-3">
                      <Badge variant="secondary" className="text-xs">
                        {expert.followers}
                      </Badge>
                    </div>
                  )}

                  {/* Specialties */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {expert.specialties.slice(0, 3).map((specialty) => (
                      <Badge key={specialty} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                    {expert.specialties.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{expert.specialties.length - 3} more
                      </Badge>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        <span>{expert.consultations} sessions</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{expert.responseTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
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