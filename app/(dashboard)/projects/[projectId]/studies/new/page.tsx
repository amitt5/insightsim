"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Project } from "@/utils/types"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"

interface NewStudyPageProps {
  params: {
    projectId: string
  }
}

export default function NewStudyPage({ params }: NewStudyPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [project, setProject] = useState<Project | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${params.projectId}`)
        if (!response.ok) {
          if (response.status === 404) {
            router.push("/projects")
            return
          }
          throw new Error("Failed to fetch project")
        }
        const data = await response.json()
        setProject(data.project)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load project details",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [params.projectId, router, toast])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      project_id: params.projectId,
      study_title: formData.get("title"),
      study_type: formData.get("type"),
      mode: formData.get("mode"),
      brief_text: project?.brief_text,
      discussion_questions: project?.discussion_questions,
    }

    try {
      const response = await fetch(`/api/projects/${params.projectId}/studies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to create study")
      }

      const result = await response.json()
      toast({
        title: "Success",
        description: "Study created successfully",
      })
      router.push(`/simulations/${result.simulation.id}/edit`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create study",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Project not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Create New Study</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Study Title</label>
              <Input
                name="title"
                required
                placeholder="Enter study title"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Study Type</label>
              <Select name="type" defaultValue="idi">
                <SelectTrigger>
                  <SelectValue placeholder="Select study type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="idi">Individual Interview (IDI)</SelectItem>
                  <SelectItem value="focus-group">Focus Group Discussion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mode</label>
              <Select name="mode" defaultValue="ai-both">
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai-both">AI Moderator + AI Participants</SelectItem>
                  <SelectItem value="human-mod">Human Moderator + AI Participants</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Study"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
