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

// Expert data by ID
const expertsData = {
  "gary-vaynerchuk": {
    id: "gary-vaynerchuk",
    name: "Gary Vaynerchuk",
    title: "Digital Marketing & Entrepreneurship Influencer",
    avatar: "/placeholder-user.jpg",
    rating: 4.9,
    totalReviews: 1250,
    consultations: 1250,
    responseTime: "< 15 min",
    isOnline: true,
    categories: ["Digital Marketing", "Entrepreneurship", "Personal Branding"],
    specialties: ["Digital Marketing", "Entrepreneurship", "Personal Branding", "Social Media Strategy", "E-commerce", "Wine Industry"],
    experience: "20+ years",
    currentRole: "CEO of VaynerMedia",
    previousRoles: [
      "Founder & CEO - VaynerX (2017-Present)",
      "Co-founder & CEO - VaynerMedia (2009-Present)",
      "Director of Operations - Wine Library TV (2006-2011)"
    ],
    education: [
      "Mount Ida College - Communications"
    ],
    certifications: [
      "New York Times Bestselling Author",
      "Forbes 40 Under 40",
      "Inc. Magazine's 30 Under 30"
    ],
    languages: ["English (Native)", "Russian (Conversational)"],
    bio: "Gary Vaynerchuk is a serial entrepreneur, CEO of VaynerMedia, and digital marketing pioneer with over 20 years of experience building brands and businesses. He transformed his family's wine business from $3M to $60M through innovative digital marketing strategies. Gary is a 5-time New York Times bestselling author and one of the most sought-after public speakers on entrepreneurship and digital marketing.",
    priceRange: "$$$",
    knowledgeSourcesCount: 847,
    lastUpdated: "1 hour ago",
    trustScore: 98,
    verifiedSources: 847,
    followers: "5,795,075 LinkedIn followers"
  },
  "sarah-chen": {
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
}

// Knowledge sources by expert ID
const knowledgeSourcesByExpert = {
  "gary-vaynerchuk": [
    // Books (5)
    {
      id: "1",
      title: "Crushing It!: How Great Entrepreneurs Build Their Business",
      type: "book",
      author: "Gary Vaynerchuk",
      year: "2018",
      confidence: 98,
      enabled: true,
      summary: "Gary's own guide to building a personal brand and business in the digital age"
    },
    {
      id: "2", 
      title: "The Thank You Economy",
      type: "book",
      author: "Gary Vaynerchuk",
      year: "2011",
      confidence: 96,
      enabled: true,
      summary: "How businesses can thrive by being grateful and customer-focused"
    },
    {
      id: "3",
      title: "Jab, Jab, Jab, Right Hook",
      type: "book",
      author: "Gary Vaynerchuk",
      year: "2013",
      confidence: 95,
      enabled: true,
      summary: "How to tell your story in a noisy social world through content marketing"
    },
    {
      id: "4",
      title: "$100M Offers: How To Make Offers So Good People Feel Stupid Saying No",
      type: "book",
      author: "Alex Hormozi",
      year: "2021",
      confidence: 92,
      enabled: false,
      summary: "Framework for creating irresistible business offers and value propositions"
    },
    {
      id: "5",
      title: "Building a StoryBrand",
      type: "book",
      author: "Donald Miller",
      year: "2017",
      confidence: 88,
      enabled: true,
      summary: "Clarify your message so customers will listen and engage"
    },
    // Articles (12)
    {
      id: "6",
      title: "The Future of Social Media Marketing",
      type: "article",
      author: "Harvard Business Review",
      year: "2023",
      confidence: 94,
      enabled: true,
      summary: "Latest trends and strategies in social media marketing"
    },
    {
      id: "7",
      title: "Building Personal Brand in the Digital Age",
      type: "article",
      author: "Forbes",
      year: "2023",
      confidence: 91,
      enabled: true,
      summary: "Strategies for entrepreneurs to build authentic personal brands"
    },
    {
      id: "8",
      title: "E-commerce Growth Strategies for 2024",
      type: "article",
      author: "McKinsey & Company",
      year: "2023",
      confidence: 89,
      enabled: false,
      summary: "Data-driven approaches to scaling online businesses"
    },
    {
      id: "9",
      title: "The Wine Industry Digital Transformation",
      type: "article",
      author: "Wine Business Monthly",
      year: "2023",
      confidence: 87,
      enabled: true,
      summary: "How traditional wine businesses are embracing digital marketing"
    },
    {
      id: "10",
      title: "Content Marketing ROI Optimization",
      type: "article",
      author: "Content Marketing Institute",
      year: "2023",
      confidence: 93,
      enabled: true,
      summary: "Measuring and improving content marketing effectiveness"
    },
    {
      id: "11",
      title: "Influencer Marketing Best Practices",
      type: "article",
      author: "Social Media Examiner",
      year: "2023",
      confidence: 85,
      enabled: false,
      summary: "Building authentic influencer partnerships for brand growth"
    },
    {
      id: "12",
      title: "Entrepreneurial Mindset Development",
      type: "article",
      author: "Inc. Magazine",
      year: "2023",
      confidence: 90,
      enabled: true,
      summary: "Cultivating the mental frameworks of successful entrepreneurs"
    },
    {
      id: "13",
      title: "Social Commerce Trends",
      type: "article",
      author: "TechCrunch",
      year: "2023",
      confidence: 88,
      enabled: false,
      summary: "The convergence of social media and e-commerce platforms"
    },
    {
      id: "14",
      title: "Video Marketing Strategy Guide",
      type: "article",
      author: "Wistia",
      year: "2023",
      confidence: 86,
      enabled: true,
      summary: "Creating compelling video content that drives engagement"
    },
    {
      id: "15",
      title: "Building Company Culture Remotely",
      type: "article",
      author: "Fast Company",
      year: "2023",
      confidence: 84,
      enabled: true,
      summary: "Maintaining team culture and values in distributed organizations"
    },
    {
      id: "16",
      title: "Digital Marketing Attribution Models",
      type: "article",
      author: "Google Marketing Platform",
      year: "2023",
      confidence: 92,
      enabled: false,
      summary: "Understanding customer journey and marketing touchpoint effectiveness"
    },
    {
      id: "17",
      title: "Authentic Leadership in Business",
      type: "article",
      author: "MIT Sloan Management Review",
      year: "2023",
      confidence: 87,
      enabled: true,
      summary: "Leading with transparency and genuine connection to stakeholders"
    },
    // Videos (8)
    {
      id: "18",
      title: "Gary Vaynerchuk Keynote: Digital Marketing Trends 2024",
      type: "video",
      author: "VaynerMedia",
      year: "2023",
      confidence: 97,
      enabled: true,
      summary: "Gary's insights on emerging digital marketing opportunities"
    },
    {
      id: "19",
      title: "Building a $100M Agency from Scratch",
      type: "video",
      author: "Entrepreneur Magazine",
      year: "2023",
      confidence: 94,
      enabled: true,
      summary: "Gary's journey scaling VaynerMedia to a global agency"
    },
    {
      id: "20",
      title: "Wine Library TV: The Early Days",
      type: "video",
      author: "Wine Library",
      year: "2022",
      confidence: 89,
      enabled: false,
      summary: "Documentary about Gary's early video marketing innovations"
    },
    {
      id: "21",
      title: "Social Media Strategy Masterclass",
      type: "video",
      author: "MasterClass",
      year: "2023",
      confidence: 95,
      enabled: true,
      summary: "Comprehensive guide to social media marketing strategy"
    },
    {
      id: "22",
      title: "Entrepreneurship in the Creator Economy",
      type: "video",
      author: "TEDx",
      year: "2023",
      confidence: 88,
      enabled: false,
      summary: "How creators can build sustainable businesses"
    },
    {
      id: "23",
      title: "Personal Branding Workshop",
      type: "video",
      author: "LinkedIn Learning",
      year: "2023",
      confidence: 91,
      enabled: true,
      summary: "Step-by-step guide to building your personal brand online"
    },
    {
      id: "24",
      title: "E-commerce Marketing Automation",
      type: "video",
      author: "Shopify Plus",
      year: "2023",
      confidence: 86,
      enabled: false,
      summary: "Scaling e-commerce through marketing automation tools"
    },
    {
      id: "25",
      title: "The Future of Digital Advertising",
      type: "video",
      author: "Facebook Business",
      year: "2023",
      confidence: 90,
      enabled: true,
      summary: "Emerging trends in digital advertising and customer acquisition"
    },
    // Podcasts (3)
    {
      id: "26",
      title: "The GaryVee Audio Experience",
      type: "podcast",
      author: "Gary Vaynerchuk",
      year: "2023",
      confidence: 98,
      enabled: true,
      summary: "Gary's daily insights on entrepreneurship, marketing, and business"
    },
    {
      id: "27",
      title: "Marketing School Podcast",
      type: "podcast",
      author: "Neil Patel & Eric Siu",
      year: "2023",
      confidence: 87,
      enabled: false,
      summary: "Daily marketing tips and strategies from industry experts"
    },
    {
      id: "28",
      title: "How I Built This",
      type: "podcast",
      author: "NPR",
      year: "2023",
      confidence: 85,
      enabled: true,
      summary: "Stories behind the entrepreneurs who built successful companies"
    }
  ],
  "sarah-chen": [
  // Books (5)
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
    title: "The Goal: A Process of Ongoing Improvement",
    type: "book",
    author: "Eliyahu M. Goldratt",
    year: "2004",
    confidence: 94,
    enabled: true,
    summary: "Theory of constraints and continuous improvement in operations"
  },
  {
    id: "4",
    title: "Lean Thinking: Banish Waste and Create Wealth",
    type: "book",
    author: "James P. Womack",
    year: "2003",
    confidence: 91,
    enabled: false,
    summary: "Principles of lean manufacturing and waste elimination"
  },
  {
    id: "5",
    title: "The Resilient Enterprise: Overcoming Vulnerability",
    type: "book",
    author: "Yossi Sheffi",
    year: "2005",
    confidence: 88,
    enabled: true,
    summary: "Building supply chain resilience and risk management strategies"
  },
  // Articles (12)
  {
    id: "6",
    title: "Resilient Supply Chains in Uncertain Times",
    type: "article",
    author: "Harvard Business Review",
    year: "2023",
    confidence: 92,
    enabled: true,
    summary: "Latest strategies for building antifragile supply networks"
  },
  {
    id: "7",
    title: "Digital Supply Chain Transformation",
    type: "article",
    author: "McKinsey & Company",
    year: "2023",
    confidence: 96,
    enabled: true,
    summary: "Leveraging AI and IoT for supply chain optimization"
  },
  {
    id: "8",
    title: "Sustainable Supply Chain Practices",
    type: "article",
    author: "MIT Sloan Management Review",
    year: "2022",
    confidence: 89,
    enabled: false,
    summary: "Environmental and social responsibility in logistics"
  },
  {
    id: "9",
    title: "The Amazon Supply Chain Revolution",
    type: "article",
    author: "Supply Chain Management Review",
    year: "2023",
    confidence: 93,
    enabled: true,
    summary: "How Amazon redefined customer fulfillment expectations"
  },
  {
    id: "10",
    title: "Risk Management in Global Supply Chains",
    type: "article",
    author: "Journal of Operations Management",
    year: "2022",
    confidence: 87,
    enabled: true,
    summary: "Identifying and mitigating supply chain vulnerabilities"
  },
  {
    id: "11",
    title: "Industry 4.0 and Supply Chain Innovation",
    type: "article",
    author: "Deloitte Insights",
    year: "2023",
    confidence: 90,
    enabled: false,
    summary: "Smart manufacturing and connected supply networks"
  },
  {
    id: "12",
    title: "Vendor Management Best Practices",
    type: "article",
    author: "Procurement Leaders",
    year: "2023",
    confidence: 85,
    enabled: true,
    summary: "Building strategic supplier relationships"
  },
  {
    id: "13",
    title: "Circular Economy in Supply Chains",
    type: "article",
    author: "World Economic Forum",
    year: "2022",
    confidence: 88,
    enabled: false,
    summary: "Implementing circular business models in logistics"
  },
  {
    id: "14",
    title: "Supply Chain Finance Innovations",
    type: "article",
    author: "Financial Times",
    year: "2023",
    confidence: 82,
    enabled: true,
    summary: "New financing models for supply chain optimization"
  },
  {
    id: "15",
    title: "Last-Mile Delivery Optimization",
    type: "article",
    author: "Boston Consulting Group",
    year: "2023",
    confidence: 91,
    enabled: true,
    summary: "Strategies for efficient final delivery solutions"
  },
  {
    id: "16",
    title: "Supply Chain Talent Crisis",
    type: "article",
    author: "Supply Chain Quarterly",
    year: "2022",
    confidence: 86,
    enabled: false,
    summary: "Addressing workforce challenges in logistics"
  },
  {
    id: "17",
    title: "Blockchain in Supply Chain Management",
    type: "article",
    author: "IBM Research",
    year: "2023",
    confidence: 84,
    enabled: true,
    summary: "Enhancing transparency and traceability with blockchain"
  },
  // Videos (8)
  {
    id: "18",
    title: "The Future of Logistics: Automation and AI",
    type: "video",
    author: "MIT Technology Review",
    year: "2023",
    confidence: 89,
    enabled: false,
    summary: "Emerging technologies reshaping global logistics"
  },
  {
    id: "19",
    title: "Amazon's Supply Chain Secrets",
    type: "video",
    author: "CNBC Documentary",
    year: "2023",
    confidence: 92,
    enabled: true,
    summary: "Behind the scenes of Amazon's fulfillment network"
  },
  {
    id: "20",
    title: "Lean Manufacturing Principles",
    type: "video",
    author: "Toyota Production System",
    year: "2022",
    confidence: 95,
    enabled: true,
    summary: "Toyota's approach to waste elimination and efficiency"
  },
  {
    id: "21",
    title: "Supply Chain Disruption Case Studies",
    type: "video",
    author: "Stanford Business School",
    year: "2023",
    confidence: 88,
    enabled: false,
    summary: "Lessons learned from major supply chain crises"
  },
  {
    id: "22",
    title: "Digital Twin Technology in Logistics",
    type: "video",
    author: "Siemens Digital Factory",
    year: "2023",
    confidence: 86,
    enabled: true,
    summary: "Virtual modeling for supply chain optimization"
  },
  {
    id: "23",
    title: "Sustainable Packaging Solutions",
    type: "video",
    author: "Unilever Sustainability",
    year: "2022",
    confidence: 83,
    enabled: false,
    summary: "Eco-friendly packaging innovations in supply chains"
  },
  {
    id: "24",
    title: "Warehouse Automation Trends",
    type: "video",
    author: "Robotics Business Review",
    year: "2023",
    confidence: 90,
    enabled: true,
    summary: "Robotic solutions transforming warehouse operations"
  },
  {
    id: "25",
    title: "Global Trade and Supply Chains",
    type: "video",
    author: "World Trade Organization",
    year: "2023",
    confidence: 87,
    enabled: false,
    summary: "International trade impacts on supply chain design"
  },
  // Podcasts (3)
  {
    id: "26",
    title: "Supply Chain Sustainability Podcast Series",
    type: "podcast",
    author: "Supply Chain Dive",
    year: "2023",
    confidence: 87,
    enabled: true,
    summary: "Weekly discussions on sustainable supply chain practices"
  },
  {
    id: "27",
    title: "The Logistics of Everything",
    type: "podcast",
    author: "FreightWaves",
    year: "2023",
    confidence: 85,
    enabled: false,
    summary: "Deep dives into supply chain strategy and operations"
  },
  {
    id: "28",
    title: "Supply Chain Revolution",
    type: "podcast",
    author: "Material Handling Network",
    year: "2023",
    confidence: 88,
    enabled: true,
    summary: "Innovations and trends shaping the future of logistics"
     }
  ]
}

const getKnowledgeSources = (expertId: string) => {
  return knowledgeSourcesByExpert[expertId as keyof typeof knowledgeSourcesByExpert] || knowledgeSourcesByExpert["sarah-chen"]
}

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
  const expertData = expertsData[params.id as keyof typeof expertsData] || expertsData["sarah-chen"]
  const knowledgeSources = getKnowledgeSources(expertData.id)
  
  const [selectedSources, setSelectedSources] = useState(
    knowledgeSources.filter((source: any) => source.enabled).map((source: any) => source.id)
  )
  const [consultationMode, setConsultationMode] = useState<"qa" | "consultant">("qa")

  const toggleSource = (sourceId: string) => {
    setSelectedSources((prev: string[]) => 
      prev.includes(sourceId) 
        ? prev.filter((id: string) => id !== sourceId)
        : [...prev, sourceId]
    )
  }

  const enabledSources = knowledgeSources.filter((source: any) => selectedSources.includes(source.id))
  const averageConfidence = enabledSources.reduce((acc: number, source: any) => acc + source.confidence, 0) / enabledSources.length

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
              </div>
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
                  <div className="flex gap-4 mt-2">
                    <Badge variant="outline" className="text-xs">
                      Books ({knowledgeSources.filter(s => s.type === 'book').length})
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Articles ({knowledgeSources.filter(s => s.type === 'article').length})
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Videos ({knowledgeSources.filter(s => s.type === 'video').length})
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Podcasts ({knowledgeSources.filter(s => s.type === 'podcast').length})
                    </Badge>
                  </div>
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
            <CardContent className="space-y-6">
              {/* Books Section */}
              <div>
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Books ({knowledgeSources.filter(s => s.type === 'book').length})
                </h4>
                <div className="space-y-3">
                  {knowledgeSources.filter(source => source.type === 'book').map((source) => {
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
                              <BookOpen className="h-4 w-4" />
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
                </div>
              </div>

              {/* Articles Section */}
              <div>
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Articles ({knowledgeSources.filter(s => s.type === 'article').length})
                </h4>
                <div className="space-y-3">
                  {knowledgeSources.filter(source => source.type === 'article').map((source) => {
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
                              <FileText className="h-4 w-4" />
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
                </div>
              </div>

              {/* Videos Section */}
              <div>
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Videos ({knowledgeSources.filter(s => s.type === 'video').length})
                </h4>
                <div className="space-y-3">
                  {knowledgeSources.filter(source => source.type === 'video').map((source) => {
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
                              <Play className="h-4 w-4" />
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
                </div>
              </div>

              {/* Podcasts Section */}
              <div>
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Headphones className="h-5 w-5" />
                  Podcasts ({knowledgeSources.filter(s => s.type === 'podcast').length})
                </h4>
                <div className="space-y-3">
                  {knowledgeSources.filter(source => source.type === 'podcast').map((source) => {
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
                              <Headphones className="h-4 w-4" />
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
                </div>
              </div>
              
                                <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>{selectedSources.length}</strong> of {knowledgeSources.length} sources selected. 
                  {expertData.name}'s responses will be based on these sources with an average confidence of <strong>{Math.round(averageConfidence)}%</strong>.
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