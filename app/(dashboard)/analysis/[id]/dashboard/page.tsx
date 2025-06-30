"use client"

import { use, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  FileText, 
  Download, 
  Quote,
  Users,
  Target,
  Lightbulb,
  ArrowLeft,
  BarChart3,
  Share2,
  Network,
  Clock,
  MapPin,
  DollarSign,
  Activity,
  Info,
  Calendar
} from "lucide-react"
import Link from "next/link"

// Mock data for analysis results
const mockAnalysis = {
  id: "123",
  name: "Consumer Beverage Preferences Study",
  status: "completed",
  createdAt: "2024-01-15T10:30:00Z",
  fileCount: 3,
  participantCount: 17,
  totalThemes: 8
}

const mockIndividualSummaries = [
  {
    fileId: "1",
    fileName: "Focus_Group_Session_1.txt",
    sessionName: "Consumer Beverage Preferences - Session 1",
    participantCount: 8,
    keyInsights: [
      "Strong preference for natural ingredients over artificial additives",
      "Price sensitivity varies significantly by age group",
      "Brand loyalty is primarily driven by taste consistency"
    ],
    topThemes: [
      { theme: "Natural Ingredients", mentions: 23, sentiment: "positive" },
      { theme: "Price Sensitivity", mentions: 18, sentiment: "neutral" },
      { theme: "Brand Loyalty", mentions: 15, sentiment: "positive" }
    ],
    keyQuotes: [
      {
        quote: "I always check the ingredients list first. If I can't pronounce it, I won't buy it.",
        participant: "P3",
        context: "Natural ingredients discussion"
      },
      {
        quote: "I've been drinking the same brand for 10 years. Why would I change now?",
        participant: "P7",
        context: "Brand loyalty discussion"
      }
    ]
  },
  {
    fileId: "2",
    fileName: "Focus_Group_Session_2.txt", 
    sessionName: "Consumer Beverage Preferences - Session 2",
    participantCount: 8,
    keyInsights: [
      "Packaging design significantly influences purchase decisions",
      "Sustainability concerns are growing among younger consumers",
      "Social media influences brand discovery and trial"
    ],
    topThemes: [
      { theme: "Packaging Design", mentions: 28, sentiment: "positive" },
      { theme: "Sustainability", mentions: 21, sentiment: "positive" },
      { theme: "Social Media Influence", mentions: 16, sentiment: "neutral" }
    ],
    keyQuotes: [
      {
        quote: "The packaging needs to stand out on the shelf. If it looks boring, I'll skip it.",
        participant: "P2",
        context: "Packaging design discussion"
      },
      {
        quote: "I saw this brand on Instagram and had to try it. The influencer made it look so good.",
        participant: "P5",
        context: "Social media influence"
      }
    ]
  },
  {
    fileId: "3",
    fileName: "IDI_Participant_A.txt",
    sessionName: "In-Depth Interview - Participant A",
    participantCount: 1,
    keyInsights: [
      "Decision-making process involves multiple touchpoints over time",
      "Word-of-mouth recommendations carry significant weight",
      "Health benefits are a primary consideration for premium products"
    ],
    topThemes: [
      { theme: "Health Benefits", mentions: 12, sentiment: "positive" },
      { theme: "Word of Mouth", mentions: 8, sentiment: "positive" },
      { theme: "Premium Positioning", mentions: 6, sentiment: "neutral" }
    ],
    keyQuotes: [
      {
        quote: "My doctor recommended I switch to beverages with less sugar. That's when I started looking at premium options.",
        participant: "PA",
        context: "Health benefits discussion"
      }
    ]
  }
]

const mockCombinedAnalysis = {
  overallSentiment: {
    positive: 68,
    neutral: 25,
    negative: 7
  },
  crossCuttingThemes: [
    {
      theme: "Natural & Health Focus",
      prevalence: 85,
      description: "Strong preference for natural ingredients and health benefits across all sessions",
      supportingEvidence: [
        "Natural ingredients mentioned 35+ times across sessions",
        "Health benefits cited as primary purchase driver",
        "Artificial additives consistently viewed negatively"
      ]
    },
    {
      theme: "Visual & Social Influence", 
      prevalence: 72,
      description: "Packaging design and social media significantly impact brand perception and trial",
      supportingEvidence: [
        "Packaging design influences 78% of purchase decisions",
        "Social media drives brand discovery for 65% of participants",
        "Visual appeal correlates with perceived quality"
      ]
    },
    {
      theme: "Price-Value Relationship",
      prevalence: 64,
      description: "Complex relationship between price, perceived value, and purchase behavior",
      supportingEvidence: [
        "Price sensitivity varies by demographic",
        "Premium pricing acceptable for health benefits",
        "Value perception influenced by brand reputation"
      ]
    },
    {
      theme: "Trust & Recommendations",
      prevalence: 58,
      description: "Word-of-mouth and brand trust play crucial roles in decision-making",
      supportingEvidence: [
        "Personal recommendations highly valued",
        "Brand consistency builds long-term loyalty",
        "Trust factors outweigh price for loyal customers"
      ]
    }
  ],
  demographicInsights: [
    {
      segment: "Ages 25-35",
      keyBehaviors: ["Social media influenced", "Sustainability conscious", "Premium willing"],
      preferences: ["Natural ingredients", "Attractive packaging", "Brand authenticity"]
    },
    {
      segment: "Ages 36-45", 
      keyBehaviors: ["Health focused", "Brand loyal", "Research-driven"],
      preferences: ["Health benefits", "Trusted brands", "Ingredient transparency"]
    }
  ]
}

const mockThemeMap = [
  { id: 1, name: "Natural Ingredients", strength: 92, connections: ["Health Benefits", "Premium Positioning"] },
  { id: 2, name: "Packaging Design", strength: 85, connections: ["Visual Appeal", "Brand Perception"] },
  { id: 3, name: "Health Benefits", strength: 78, connections: ["Natural Ingredients", "Premium Positioning"] },
  { id: 4, name: "Social Media Influence", strength: 71, connections: ["Brand Discovery", "Visual Appeal"] },
  { id: 5, name: "Price Sensitivity", strength: 68, connections: ["Value Perception", "Demographics"] },
  { id: 6, name: "Brand Loyalty", strength: 62, connections: ["Trust", "Consistency"] },
  { id: 7, name: "Sustainability", strength: 58, connections: ["Natural Ingredients", "Brand Values"] },
  { id: 8, name: "Word of Mouth", strength: 54, connections: ["Trust", "Recommendations"] }
]

// Mock data for pattern analysis
const mockPatternAnalysis = {
  demographicPatterns: [
    {
      demographic: "Ages 25-35",
      icon: Users,
      topThemes: [
        { theme: "Social Media Influence", strength: 89, change: "+12%" },
        { theme: "Sustainability", strength: 82, change: "+8%" },
        { theme: "Packaging Design", strength: 78, change: "+5%" }
      ],
      insights: [
        "Highly influenced by social media trends and peer recommendations",
        "Strong environmental consciousness drives purchasing decisions",
        "Visual appeal and Instagram-worthy packaging crucial"
      ]
    },
    {
      demographic: "Ages 36-45",
      icon: Users,
      topThemes: [
        { theme: "Health Benefits", strength: 94, change: "+15%" },
        { theme: "Natural Ingredients", strength: 91, change: "+18%" },
        { theme: "Brand Loyalty", strength: 73, change: "+3%" }
      ],
      insights: [
        "Health and wellness are primary decision factors",
        "Ingredient transparency and natural formulations highly valued",
        "Established brand preferences with slower switching behavior"
      ]
    },
    {
      demographic: "High Income",
      icon: DollarSign,
      topThemes: [
        { theme: "Premium Positioning", strength: 87, change: "+22%" },
        { theme: "Health Benefits", strength: 85, change: "+11%" },
        { theme: "Brand Loyalty", strength: 79, change: "+7%" }
      ],
      insights: [
        "Price sensitivity significantly lower than other segments",
        "Quality and health benefits justify premium pricing",
        "Strong preference for established, trusted premium brands"
      ]
    },
    {
      demographic: "Urban Areas",
      icon: MapPin,
      topThemes: [
        { theme: "Social Media Influence", strength: 83, change: "+9%" },
        { theme: "Sustainability", strength: 76, change: "+14%" },
        { theme: "Packaging Design", strength: 72, change: "+6%" }
      ],
      insights: [
        "Higher exposure to social media marketing and trends",
        "Environmental consciousness more pronounced in urban settings",
        "Retail environment emphasizes visual appeal and shelf presence"
      ]
    }
  ],
  cooccurrencePatterns: [
    {
      primaryTheme: "Natural Ingredients",
      secondaryTheme: "Health Benefits",
      cooccurrence: 94,
      strength: "Very Strong",
      description: "These themes almost always appear together, suggesting consumers view natural ingredients as inherently healthier"
    },
    {
      primaryTheme: "Social Media Influence",
      secondaryTheme: "Packaging Design",
      cooccurrence: 78,
      strength: "Strong",
      description: "Visual appeal and social media presence are closely linked in consumer decision-making"
    },
    {
      primaryTheme: "Price Sensitivity",
      secondaryTheme: "Value Perception",
      cooccurrence: 85,
      strength: "Strong",
      description: "Price concerns are consistently paired with discussions about perceived value and quality"
    },
    {
      primaryTheme: "Brand Loyalty",
      secondaryTheme: "Trust",
      cooccurrence: 91,
      strength: "Very Strong",
      description: "Brand loyalty is fundamentally built on trust and consistent experience"
    },
    {
      primaryTheme: "Sustainability",
      secondaryTheme: "Natural Ingredients",
      cooccurrence: 72,
      strength: "Moderate",
      description: "Environmental concerns often overlap with preferences for natural formulations"
    }
  ],
  intensityPatterns: [
    {
      segment: "Focus Group 1",
      themes: [
        { name: "Natural Ingredients", intensity: 95, mentions: 47 },
        { name: "Price Sensitivity", intensity: 82, mentions: 34 },
        { name: "Brand Loyalty", intensity: 71, mentions: 28 }
      ]
    },
    {
      segment: "Focus Group 2", 
      themes: [
        { name: "Packaging Design", intensity: 91, mentions: 52 },
        { name: "Social Media Influence", intensity: 88, mentions: 41 },
        { name: "Sustainability", intensity: 76, mentions: 31 }
      ]
    },
    {
      segment: "Individual Interview",
      themes: [
        { name: "Health Benefits", intensity: 89, mentions: 23 },
        { name: "Word of Mouth", intensity: 84, mentions: 19 },
        { name: "Premium Positioning", intensity: 67, mentions: 14 }
      ]
    }
  ],
  temporalPatterns: [
    {
      phase: "Early Discussion",
      timeframe: "0-15 minutes",
      dominantThemes: ["Brand Loyalty", "Price Sensitivity"],
      emergingThemes: ["Natural Ingredients"],
      insights: "Initial responses focus on familiar brands and cost concerns"
    },
    {
      phase: "Mid Discussion",
      timeframe: "15-30 minutes",
      dominantThemes: ["Natural Ingredients", "Health Benefits", "Packaging Design"],
      emergingThemes: ["Social Media Influence", "Sustainability"],
      insights: "Deeper exploration reveals health consciousness and visual preferences"
    },
    {
      phase: "Late Discussion",
      timeframe: "30-45 minutes",
      dominantThemes: ["Social Media Influence", "Sustainability", "Word of Mouth"],
      emergingThemes: ["Premium Positioning"],
      insights: "Social factors and environmental concerns become more prominent"
    },
    {
      phase: "Session Evolution",
      timeframe: "Across Sessions",
      dominantThemes: ["Natural Ingredients", "Health Benefits"],
      emergingThemes: ["Sustainability", "Social Media Influence"],
      insights: "Consistency in health themes, growing importance of social and environmental factors"
    }
  ]
}

export default function AnalysisDashboardPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params)
  const analysisId = params.id
  const [activeTab, setActiveTab] = useState("individual")

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-100 text-green-800"
      case "negative":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const renderIndividualSummaries = () => (
    <div className="space-y-6">
      {mockIndividualSummaries.map((summary) => (
        <Card key={summary.fileId}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {summary.sessionName}
              </div>
              <Badge variant="outline">
                {summary.participantCount} participants
              </Badge>
            </CardTitle>
            <CardDescription>{summary.fileName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Key Insights */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Key Insights
              </h4>
              <ul className="space-y-2">
                {summary.keyInsights.map((insight, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>

            {/* Top Themes */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Top Themes
              </h4>
              <div className="space-y-2">
                {summary.topThemes.map((theme, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{theme.theme}</span>
                      <Badge className={getSentimentColor(theme.sentiment)}>
                        {theme.sentiment}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {theme.mentions} mentions
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Quotes */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Quote className="h-4 w-4" />
                Key Quotes
              </h4>
              <div className="space-y-3">
                {summary.keyQuotes.map((quote, index) => (
                  <div key={index} className="border-l-4 border-primary pl-4 py-2">
                    <blockquote className="text-sm italic mb-1">
                      "{quote.quote}"
                    </blockquote>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>— {quote.participant}</span>
                      <span>{quote.context}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderCombinedSummary = () => (
    <div className="space-y-6">
      {/* Overall Sentiment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Overall Sentiment Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Positive</span>
              <span className="text-sm text-green-600">{mockCombinedAnalysis.overallSentiment.positive}%</span>
            </div>
            <Progress value={mockCombinedAnalysis.overallSentiment.positive} className="h-2" />
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Neutral</span>
              <span className="text-sm text-gray-600">{mockCombinedAnalysis.overallSentiment.neutral}%</span>
            </div>
            <Progress value={mockCombinedAnalysis.overallSentiment.neutral} className="h-2" />
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Negative</span>
              <span className="text-sm text-red-600">{mockCombinedAnalysis.overallSentiment.negative}%</span>
            </div>
            <Progress value={mockCombinedAnalysis.overallSentiment.negative} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Cross-Cutting Themes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Cross-Cutting Themes
          </CardTitle>
          <CardDescription>
            Themes that emerged across multiple sessions and participants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {mockCombinedAnalysis.crossCuttingThemes.map((theme, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{theme.theme}</h4>
                  <Badge variant="outline">{theme.prevalence}% prevalence</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{theme.description}</p>
                <div className="space-y-1">
                  <h5 className="text-sm font-medium">Supporting Evidence:</h5>
                  <ul className="space-y-1">
                    {theme.supportingEvidence.map((evidence, evidenceIndex) => (
                      <li key={evidenceIndex} className="text-sm flex items-start gap-2">
                        <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                        {evidence}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demographic Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Demographic Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockCombinedAnalysis.demographicInsights.map((segment, index) => (
              <div key={index} className="space-y-3">
                <h4 className="font-semibold">{segment.segment}</h4>
                <div>
                  <h5 className="text-sm font-medium mb-2">Key Behaviors:</h5>
                  <div className="flex flex-wrap gap-1">
                    {segment.keyBehaviors.map((behavior, behaviorIndex) => (
                      <Badge key={behaviorIndex} variant="secondary" className="text-xs">
                        {behavior}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h5 className="text-sm font-medium mb-2">Preferences:</h5>
                  <div className="flex flex-wrap gap-1">
                    {segment.preferences.map((preference, prefIndex) => (
                      <Badge key={prefIndex} variant="outline" className="text-xs">
                        {preference}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderThemesAndPatterns = () => {
    const getStrengthColor = (strength: string) => {
      switch (strength) {
        case "Very Strong":
          return "bg-green-100 text-green-800"
        case "Strong":
          return "bg-blue-100 text-blue-800"
        case "Moderate":
          return "bg-yellow-100 text-yellow-800"
        default:
          return "bg-gray-100 text-gray-800"
      }
    }

    return (
      <div className="space-y-8">
        {/* Theme Map Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Theme Map
            </CardTitle>
            <CardDescription>
              Individual themes and their interconnections across all discussions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockThemeMap.map((theme) => (
                <Card key={theme.id} className="border-muted">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{theme.name}</h4>
                        <Badge variant="outline">{theme.strength}%</Badge>
                      </div>
                      <Progress value={theme.strength} className="h-2" />
                      <div>
                        <h5 className="text-sm font-medium mb-2">Connected to:</h5>
                        <div className="flex flex-wrap gap-1">
                          {theme.connections.map((connection, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {connection}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pattern Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Demographic Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Demographic Patterns
              </CardTitle>
              <CardDescription>
                How themes vary across different demographic segments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {mockPatternAnalysis.demographicPatterns.map((pattern, index) => {
                const IconComponent = pattern.icon
                return (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      <h4 className="font-semibold">{pattern.demographic}</h4>
                    </div>
                    <div className="space-y-2">
                      {pattern.topThemes.map((theme, themeIndex) => (
                        <div key={themeIndex} className="flex items-center justify-between text-sm">
                          <span>{theme.theme}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {theme.strength}%
                            </Badge>
                            <Badge variant={theme.change.startsWith('+') ? 'default' : 'secondary'} className="text-xs">
                              {theme.change}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <ul className="space-y-1">
                        {pattern.insights.map((insight, insightIndex) => (
                          <li key={insightIndex} className="flex items-start gap-1">
                            <div className="w-1 h-1 bg-muted-foreground rounded-full mt-1.5 flex-shrink-0" />
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Co-occurrence Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Co-occurrence Patterns
              </CardTitle>
              <CardDescription>
                Themes that frequently appear together in discussions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockPatternAnalysis.cooccurrencePatterns.map((pattern, index) => (
                <div key={index} className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                      {pattern.primaryTheme} + {pattern.secondaryTheme}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {pattern.cooccurrence}%
                      </Badge>
                      <Badge className={getStrengthColor(pattern.strength)}>
                        {pattern.strength}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{pattern.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Intensity and Temporal Patterns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Intensity Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Intensity Patterns
              </CardTitle>
              <CardDescription>
                Theme strength across different discussion segments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockPatternAnalysis.intensityPatterns.map((segment, index) => (
                <div key={index} className="space-y-3">
                  <h4 className="font-semibold text-sm">{segment.segment}</h4>
                  <div className="space-y-2">
                    {segment.themes.map((theme, themeIndex) => (
                      <div key={themeIndex} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{theme.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {theme.mentions} mentions
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {theme.intensity}%
                            </Badge>
                          </div>
                        </div>
                        <Progress value={theme.intensity} className="h-1" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Temporal Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Temporal Patterns
              </CardTitle>
              <CardDescription>
                How themes evolved throughout discussions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockPatternAnalysis.temporalPatterns.map((phase, index) => (
                <div key={index} className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">{phase.phase}</h4>
                    <Badge variant="outline" className="text-xs">
                      {phase.timeframe}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <h5 className="text-xs font-medium text-muted-foreground mb-1">Dominant:</h5>
                      <div className="flex flex-wrap gap-1">
                        {phase.dominantThemes.map((theme, themeIndex) => (
                          <Badge key={themeIndex} variant="default" className="text-xs">
                            {theme}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-xs font-medium text-muted-foreground mb-1">Emerging:</h5>
                      <div className="flex flex-wrap gap-1">
                        {phase.emergingThemes.map((theme, themeIndex) => (
                          <Badge key={themeIndex} variant="secondary" className="text-xs">
                            {theme}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground italic">{phase.insights}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const renderExportSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Analysis
        </CardTitle>
        <CardDescription>
          Export your analysis results in various formats
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="outline" disabled className="flex flex-col items-center gap-2 h-20">
            <FileText className="h-6 w-6" />
            <span className="text-sm">PDF Report</span>
          </Button>
          <Button variant="outline" disabled className="flex flex-col items-center gap-2 h-20">
            <BarChart3 className="h-6 w-6" />
            <span className="text-sm">Excel Data</span>
          </Button>
          <Button variant="outline" disabled className="flex flex-col items-center gap-2 h-20">
            <Quote className="h-6 w-6" />
            <span className="text-sm">Quote Bank</span>
          </Button>
          <Button variant="outline" disabled className="flex flex-col items-center gap-2 h-20">
            <Share2 className="h-6 w-6" />
            <span className="text-sm">Share Link</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Export functionality will be implemented in future updates
        </p>
      </CardContent>
    </Card>
  )

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Demo Banner */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Demo Analysis Dashboard</h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                This dashboard shows sample analysis results with demo data. All insights, themes, quotes, and visualizations are examples to demonstrate the platform's capabilities. In production, this would show your actual research analysis.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between space-y-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/analysis">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Analysis
              </Button>
            </Link>
          </div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            {mockAnalysis.name} (Demo)
          </h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(mockAnalysis.createdAt).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {mockAnalysis.fileCount} files
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {mockAnalysis.participantCount} participants
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              {mockAnalysis.totalThemes} themes
            </div>
            <Badge variant="outline" className="text-xs">DEMO DATA</Badge>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" disabled>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" disabled>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="individual" className="space-y-4">
        <TabsList>
          <TabsTrigger value="individual">Individual Summaries</TabsTrigger>
          <TabsTrigger value="combined">Combined Analysis</TabsTrigger>
          <TabsTrigger value="themes">Themes & Patterns</TabsTrigger>
          <TabsTrigger value="export">Export & Share</TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Individual File Summaries (Demo Data)
              </CardTitle>
              <CardDescription>
                Review insights from each transcript individually. This is sample analysis data for demonstration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderIndividualSummaries()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="combined" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Combined Analysis Results (Demo Data)
              </CardTitle>
              <CardDescription>
                Cross-cutting insights and themes from all transcripts combined. Sample analysis for demonstration purposes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderCombinedSummary()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="themes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Theme Analysis & Patterns (Demo Data)
              </CardTitle>
              <CardDescription>
                Explore thematic patterns and relationships in your data. Sample themes and connections shown for demo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderThemesAndPatterns()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export & Share Options (Demo)
              </CardTitle>
              <CardDescription>
                Download your analysis in various formats or share with your team. Export features disabled in demo mode.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderExportSection()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 