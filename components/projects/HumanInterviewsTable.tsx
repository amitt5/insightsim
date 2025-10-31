"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Copy, ExternalLink, MessageSquare, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface HumanInterview {
  id: string
  name: string
  age: number
  gender: string
  email: string
  status: 'in_progress' | 'completed'
  created_at: string
  message_count: number
  last_message_at: string | null
  project: {
    id: string
    name: string
  }
}

interface HumanInterviewsTableProps {
  projectId: string
}

export default function HumanInterviewsTable({ projectId }: HumanInterviewsTableProps) {
  const { toast } = useToast()
  const [humanInterviews, setHumanInterviews] = useState<HumanInterview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHumanInterviews = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}/human-interviews`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch human interviews')
      }
      
      const data = await response.json()
      setHumanInterviews(data.humanInterviews || [])
      setError(null)
    } catch (err: any) {
      console.error('Error fetching human interviews:', err)
      setError(err.message || 'Failed to load human interviews')
    } finally {
      setLoading(false)
    }
  }

  const copyInterviewLink = () => {
    const baseUrl = window.location.origin
    const interviewLink = `${baseUrl}/idi/${projectId}`
    
    navigator.clipboard.writeText(interviewLink).then(() => {
      toast({
        title: "Link copied!",
        description: "Human interview link has been copied to clipboard",
      })
    }).catch(() => {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      })
    })
  }

  const openInterview = (respondentId: string) => {
    const interviewUrl = `/idi/${projectId}/${respondentId}/text`
    window.open(interviewUrl, '_blank')
  }

  useEffect(() => {
    fetchHumanInterviews()
  }, [projectId])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Loading human interviews...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchHumanInterviews}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Copy Link Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Human Interviews</h3>
          <p className="text-sm text-gray-500">
            {humanInterviews.length} interview{humanInterviews.length !== 1 ? 's' : ''} conducted
          </p>
        </div>
        <Button onClick={copyInterviewLink} className="flex items-center gap-2">
          <Copy className="h-4 w-4" />
          Copy Interview Link
        </Button>
      </div>

      {/* Table */}
      {humanInterviews.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews yet</h3>
            <p className="text-gray-500 mb-4">
              Share the interview link to start collecting human responses
            </p>
            <Button onClick={copyInterviewLink} className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Copy Interview Link
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {humanInterviews.map((interview) => (
            <Card key={interview.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{interview.name}</h4>
                      <Badge variant={interview.status === "completed" ? "default" : "secondary"}>
                        {interview.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Age:</span> {interview.age}
                      </div>
                      <div>
                        <span className="font-medium">Gender:</span> {interview.gender}
                      </div>
                      <div>
                        <span className="font-medium">Messages:</span> {interview.message_count}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(interview.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {interview.last_message_at && (
                      <div className="text-xs text-gray-500 mt-1">
                        Last message: {new Date(interview.last_message_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openInterview(interview.id)}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
