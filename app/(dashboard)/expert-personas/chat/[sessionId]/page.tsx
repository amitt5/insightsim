"use client"

import { useParams, useSearchParams } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, MessageCircle, Users, Star, BookOpen, Clock, Zap } from "lucide-react"
import Link from "next/link"

// Mock expert data (reuse from main page)
const expertProfiles = {
  "sarah-chen": {
    id: "sarah-chen",
    name: "Dr. Sarah Chen",
    title: "Supply Chain Strategy Expert",
    avatar: "/placeholder-user.jpg",
    rating: 4.9,
    responseTime: "< 5 min",
    isOnline: true,
    color: "#2196F3",
    specialties: ["Global Logistics", "Risk Management", "Sustainability"]
  },
  "marcus-rodriguez": {
    id: "marcus-rodriguez", 
    name: "Marcus Rodriguez",
    title: "Growth Marketing Strategist",
    avatar: "/placeholder-user.jpg",
    rating: 4.8,
    responseTime: "< 30 min",
    isOnline: false,
    color: "#4CAF50",
    specialties: ["Product-Led Growth", "B2B SaaS", "Performance Marketing"]
  },
  "alex-kim": {
    id: "alex-kim",
    name: "Alex Kim",
    title: "AI Implementation Consultant", 
    avatar: "/placeholder-user.jpg",
    rating: 4.9,
    responseTime: "< 10 min",
    isOnline: true,
    color: "#9C27B0",
    specialties: ["Enterprise AI", "ML Operations", "AI Ethics"]
  }
}

// Mock conversation data
const mockConversations = {
  "sarah-chen": [
    {
      id: "1",
      speaker: "User",
      text: "Hi Dr. Chen, I'm looking to optimize our supply chain for our e-commerce business. We're experiencing delays and high costs. What would you recommend as the first steps?",
      time: "14:32",
      isUser: true
    },
    {
      id: "2", 
      speaker: "Dr. Sarah Chen",
      text: "Great question! Let me start by understanding your current setup. Based on my experience at Amazon, I'd recommend a three-pronged approach: 1) Analyze your current bottlenecks through data mapping, 2) Evaluate your vendor relationships and performance metrics, and 3) Consider implementing demand forecasting tools. What's your current order volume and geographic distribution?",
      time: "14:33",
      isUser: false,
      expertId: "sarah-chen"
    },
    {
      id: "3",
      speaker: "User", 
      text: "We process about 500-1000 orders daily, mostly in North America. Our main issues are inventory stockouts and shipping delays from our warehouse in Ohio.",
      time: "14:35",
      isUser: true
    },
    {
      id: "4",
      speaker: "Dr. Sarah Chen",
      text: "With that volume, you're at a critical scaling point. The Ohio warehouse bottleneck is common. I'd suggest: 1) Implement ABC analysis for inventory prioritization, 2) Consider a second fulfillment center on the West Coast, 3) Evaluate 3PL partnerships for peak periods. For immediate relief, review your safety stock calculations - many companies underestimate demand variability. Have you analyzed your stockout patterns by product category?",
      time: "14:37",
      isUser: false,
      expertId: "sarah-chen"
    }
  ],
  "panel": [
    {
      id: "1",
      speaker: "User",
      text: "Hi everyone, I'm launching a B2B SaaS product and need guidance on go-to-market strategy, initial funding, and team structure. What should be my priorities?",
      time: "15:20",
      isUser: true
    },
    {
      id: "2",
      speaker: "Marcus Rodriguez", 
      text: "From a GTM perspective, I'd focus on product-market fit validation first. Before scaling, ensure you have 5-10 paying customers who can't live without your product. What's your current customer discovery process?",
      time: "15:21",
      isUser: false,
      expertId: "marcus-rodriguez"
    },
    {
      id: "3",
      speaker: "David Thompson",
      text: "Financially, bootstrap as long as possible to maintain control. When you do raise, have 18 months runway minimum. What's your current burn rate and revenue projection?",
      time: "15:22", 
      isUser: false,
      expertId: "david-thompson"
    },
    {
      id: "4",
      speaker: "Lisa Wang",
      text: "For team structure, start lean - focus on hiring A-players in critical roles rather than growing headcount. Your first 10 hires will define your culture. What key roles are you considering?",
      time: "15:23",
      isUser: false,
      expertId: "lisa-wang"
    }
  ]
}

export default function ExpertChatPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const sessionId = params.sessionId as string
  
  // Parse URL parameters
  const mode = searchParams.get('mode') || 'qa'
  const expertIds = searchParams.get('experts')?.split(',') || [sessionId]
  const sessionTitle = searchParams.get('title') || ''
  
  const [messages, setMessages] = useState(mockConversations[sessionId as keyof typeof mockConversations] || [])
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const isMultiExpert = sessionId === 'panel' || expertIds.length > 1
  const activeExperts = expertIds.map(id => expertProfiles[id as keyof typeof expertProfiles]).filter(Boolean)

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      speaker: "User",
      text: newMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUser: true
    }

    setMessages(prev => [...prev, userMessage])
    setNewMessage("")
    setIsTyping(true)

    // Simulate expert response after delay
    setTimeout(() => {
      const expertResponse = {
        id: (Date.now() + 1).toString(),
        speaker: activeExperts[0]?.name || "Expert",
        text: "Thank you for your question. Based on my experience, I'd recommend focusing on the core fundamentals first. Let me provide you with a detailed analysis of your situation...",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isUser: false,
        expertId: activeExperts[0]?.id
      }
      setMessages(prev => [...prev, expertResponse])
      setIsTyping(false)
    }, 2000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/expert-personas">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Experts
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">
                {isMultiExpert ? (sessionTitle || "Expert Panel Session") : `Consultation with ${activeExperts[0]?.name}`}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Badge variant="outline">{mode === 'qa' ? 'Q&A Mode' : 'Consultant Mode'}</Badge>
                <span>{activeExperts.length} expert{activeExperts.length > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Expert Info Panel */}
          <div className="col-span-1 lg:col-span-3">
            <Card className="h-fit">
              <CardContent className="p-4">
                <h2 className="font-semibold mb-4">
                  {isMultiExpert ? 'Expert Panel' : 'Expert'}
                </h2>
                <div className="space-y-4">
                  {activeExperts.map((expert) => (
                    <div key={expert.id} className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={expert.avatar} alt={expert.name} />
                          <AvatarFallback style={{ backgroundColor: expert.color, color: 'white' }}>
                            {expert.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {expert.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{expert.name}</h3>
                        <p className="text-sm text-muted-foreground">{expert.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">{expert.rating}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{expert.responseTime}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {expert.specialties.slice(0, 2).map((specialty) => (
                            <Badge key={specialty} variant="secondary" className="text-xs">
                              {specialty}
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

          {/* Chat Interface */}
          <div className="col-span-1 lg:col-span-9">
            <Card className="h-[70vh] flex flex-col">
              <CardContent className="p-4 flex-1 overflow-auto">
                <div className="space-y-6">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Start Your Consultation</h3>
                      <p className="text-muted-foreground">
                        Ask your first question to begin the expert consultation
                      </p>
                    </div>
                  ) : (
                    <>
                      {messages.map((message) => {
                        const expert = message.expertId ? expertProfiles[message.expertId as keyof typeof expertProfiles] : null
                        
                        return (
                          <div key={message.id} className={`flex gap-4 items-end ${message.isUser ? "flex-row-reverse" : ""}`}>
                            <Avatar className="h-10 w-10">
                              {message.isUser ? (
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  U
                                </AvatarFallback>
                              ) : (
                                <>
                                  <AvatarImage src={expert?.avatar} alt={expert?.name} />
                                  <AvatarFallback style={{ backgroundColor: expert?.color, color: 'white' }}>
                                    {expert?.name.split(' ').map(n => n[0]).join('') || 'E'}
                                  </AvatarFallback>
                                </>
                              )}
                            </Avatar>
                            <div className={`flex-1 ${message.isUser ? "text-right" : ""}`}>
                              <div className={`inline-block rounded-lg px-4 py-2 max-w-[80%] ${
                                message.isUser 
                                  ? "bg-primary text-primary-foreground" 
                                  : "bg-muted"
                              }`}>
                                {!message.isUser && (
                                  <div className="flex items-center justify-between mb-1">
                                    <span 
                                      className="font-semibold text-sm"
                                      style={{ color: expert?.color }}
                                    >
                                      {message.speaker}
                                    </span>
                                    <span className="text-xs text-muted-foreground ml-2">{message.time}</span>
                                  </div>
                                )}
                                {message.isUser && (
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-primary-foreground/70">{message.time}</span>
                                    <span className="font-semibold text-sm text-primary-foreground ml-2">You</span>
                                  </div>
                                )}
                                <p className="text-sm leading-relaxed">{message.text}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      
                      {isTyping && (
                        <div className="flex gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback style={{ backgroundColor: activeExperts[0]?.color, color: 'white' }}>
                              {activeExperts[0]?.name.split(' ').map(n => n[0]).join('') || 'E'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="inline-block rounded-lg px-4 py-2 bg-muted">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 bg-primary rounded-full animate-bounce" />
                                <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                                <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                                <span className="text-xs text-muted-foreground ml-2">Expert is typing...</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
              
              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="space-y-2">
                  <textarea 
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask your question or describe your challenge..."
                    className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    rows={3}
                    disabled={isTyping}
                  />
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                      Press Enter to send, Shift+Enter for new line
                    </div>
                    <Button 
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || isTyping}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 