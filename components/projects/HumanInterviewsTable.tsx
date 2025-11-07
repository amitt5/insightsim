"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Copy, ExternalLink, MessageSquare, Calendar, Upload, FileText, Mic, Trash2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import InterviewUpload from "./InterviewUpload"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

interface UploadedInterview {
  id: string
  filename: string
  original_filename: string
  file_type: 'transcript' | 'audio'
  status: 'uploaded' | 'processing' | 'processed' | 'error'
  file_size: number
  created_at: string
  transcript_text?: string | null
  error_message?: string | null
}

interface HumanInterviewsTableProps {
  projectId: string
}

export default function HumanInterviewsTable({ projectId }: HumanInterviewsTableProps) {
  const { toast } = useToast()
  const [humanInterviews, setHumanInterviews] = useState<HumanInterview[]>([])
  const [uploadedInterviews, setUploadedInterviews] = useState<UploadedInterview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'conducted' | 'uploaded'>('conducted')
  const [transcribingIds, setTranscribingIds] = useState<Set<string>>(new Set())

  const fetchHumanInterviews = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/human-interviews`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch human interviews')
      }
      
      const data = await response.json()
      setHumanInterviews(data.humanInterviews || [])
    } catch (err: any) {
      console.error('Error fetching human interviews:', err)
      // Don't set error state here, just log it
    }
  }

  const fetchUploadedInterviews = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/uploaded-interviews`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch uploaded interviews')
      }
      
      const data = await response.json()
      setUploadedInterviews(data.interviews || [])
    } catch (err: any) {
      console.error('Error fetching uploaded interviews:', err)
      // Don't set error state here, just log it
    }
  }

  const fetchAllInterviews = async () => {
    try {
      setLoading(true)
      await Promise.all([fetchHumanInterviews(), fetchUploadedInterviews()])
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load interviews')
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

  const handleDeleteUploadedInterview = async (interviewId: string) => {
    if (!confirm('Are you sure you want to delete this uploaded interview?')) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/uploaded-interviews/${interviewId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete interview')
      }

      toast({
        title: "Interview deleted",
        description: "The uploaded interview has been deleted successfully",
      })

      // Refresh the list
      fetchUploadedInterviews()
    } catch (err: any) {
      console.error('Error deleting interview:', err)
      toast({
        title: "Error",
        description: err.message || 'Failed to delete interview',
        variant: "destructive",
      })
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleCheckStatus = async (interviewId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/uploaded-interviews/${interviewId}/transcribe/check`, {
        method: 'GET',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to check status')
      }

      const result = await response.json()
      
      // Refresh the list
      await fetchUploadedInterviews()

      if (result.status === 'completed') {
        toast({
          title: "Transcription completed",
          description: "Your audio file has been transcribed successfully.",
        })
      } else if (result.status === 'error') {
        toast({
          title: "Transcription failed",
          description: result.error || "There was an error with the transcription.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Status checked",
          description: `Transcription is ${result.status}.`,
        })
      }
    } catch (err: any) {
      console.error('Error checking status:', err)
      toast({
        title: "Error",
        description: err.message || 'Failed to check transcription status',
        variant: "destructive",
      })
    }
  }

  const handleTranscribe = async (interviewId: string) => {
    setTranscribingIds(prev => new Set(prev).add(interviewId))
    
    try {
      const response = await fetch(`/api/projects/${projectId}/uploaded-interviews/${interviewId}/transcribe`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Transcription failed')
      }

      const result = await response.json()
      
      toast({
        title: "Transcription started",
        description: result.message || "Your audio file is being transcribed. This may take a few minutes.",
      })

      // Refresh the list to show updated status
      await fetchUploadedInterviews()
      
      // Poll for updates every 5 seconds until complete
      const pollInterval = setInterval(async () => {
        const response = await fetch(`/api/projects/${projectId}/uploaded-interviews`)
        if (response.ok) {
          const data = await response.json()
          const updated = (data.interviews || []).find((i: UploadedInterview) => i.id === interviewId)
          if (updated && (updated.status === 'processed' || updated.status === 'error')) {
            clearInterval(pollInterval)
            setTranscribingIds(prev => {
              const newSet = new Set(prev)
              newSet.delete(interviewId)
              return newSet
            })
            // Update state with new data
            setUploadedInterviews(data.interviews || [])
            if (updated.status === 'processed') {
              toast({
                title: "Transcription completed",
                description: "Your audio file has been transcribed successfully.",
              })
            }
          } else if (updated) {
            // Update state even if not complete yet
            setUploadedInterviews(data.interviews || [])
          }
        }
      }, 5000)

      // Stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval)
        setTranscribingIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(interviewId)
          return newSet
        })
      }, 5 * 60 * 1000)

    } catch (err: any) {
      console.error('Error starting transcription:', err)
      toast({
        title: "Error",
        description: err.message || 'Failed to start transcription',
        variant: "destructive",
      })
      setTranscribingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(interviewId)
        return newSet
      })
    }
  }

  useEffect(() => {
    fetchAllInterviews()
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Human Interviews</h3>
          <p className="text-sm text-gray-500">
            {humanInterviews.length} conducted • {uploadedInterviews.length} uploaded
          </p>
        </div>
        <Button onClick={copyInterviewLink} className="flex items-center gap-2">
          <Copy className="h-4 w-4" />
          Copy Interview Link
        </Button>
      </div>

      {/* Tabs for Conducted vs Uploaded */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'conducted' | 'uploaded')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="conducted">Conducted Interviews</TabsTrigger>
          <TabsTrigger value="uploaded">Uploaded Interviews</TabsTrigger>
        </TabsList>

        {/* Conducted Interviews Tab */}
        <TabsContent value="conducted" className="space-y-4 mt-4">
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
        </TabsContent>

        {/* Uploaded Interviews Tab */}
        <TabsContent value="uploaded" className="space-y-4 mt-4">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upload Interview Files</CardTitle>
            </CardHeader>
            <CardContent>
              <InterviewUpload 
                projectId={projectId}
                onUploadSuccess={() => {
                  fetchUploadedInterviews()
                }}
              />
            </CardContent>
          </Card>

          {/* Uploaded Interviews List */}
          {uploadedInterviews.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No uploaded interviews yet</h3>
                <p className="text-gray-500">
                  Upload transcript or audio files above to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">
                Uploaded Files ({uploadedInterviews.length})
              </h4>
              {uploadedInterviews.map((interview) => (
                <Card key={interview.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {interview.file_type === 'audio' ? (
                            <Mic className="h-5 w-5 text-gray-400" />
                          ) : (
                            <FileText className="h-5 w-5 text-gray-400" />
                          )}
                          <h4 className="font-medium">{interview.original_filename}</h4>
                          <Badge 
                            variant={
                              interview.status === "processed" ? "default" :
                              interview.status === "error" ? "destructive" :
                              interview.status === "processing" ? "secondary" :
                              "outline"
                            }
                          >
                            {interview.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Type:</span> {interview.file_type}
                          </div>
                          <div>
                            <span className="font-medium">Size:</span> {formatFileSize(interview.file_size)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(interview.created_at).toLocaleDateString()}</span>
                          </div>
                          {interview.transcript_text && (
                            <div>
                              <span className="font-medium">Transcript:</span> Available
                            </div>
                          )}
                        </div>
                        {interview.error_message && (
                          <div className="text-xs text-red-600 mt-2">
                            Error: {interview.error_message}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {interview.file_type === 'audio' && 
                         interview.status !== 'processed' && 
                         interview.status !== 'processing' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleTranscribe(interview.id)}
                            disabled={transcribingIds.has(interview.id)}
                            className="flex items-center gap-2"
                          >
                            {transcribingIds.has(interview.id) ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Starting...
                              </>
                            ) : (
                              <>
                                <Mic className="h-4 w-4" />
                                Transcribe
                              </>
                            )}
                          </Button>
                        )}
                        {interview.status === 'processing' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCheckStatus(interview.id)}
                              className="flex items-center gap-2"
                            >
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Check Status
                            </Button>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Transcribing...
                            </div>
                          </>
                        )}
                        {interview.status === 'processed' && interview.transcript_text && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const interviewUrl = `/idi/${projectId}/uploaded/${interview.id}/text`
                              window.open(interviewUrl, '_blank')
                            }}
                            className="flex items-center gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUploadedInterview(interview.id)}
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
