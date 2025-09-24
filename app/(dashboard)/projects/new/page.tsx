"use client"

import { Metadata } from "next"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export const metadata: Metadata = {
  title: "New Project | InsightSim",
  description: "Create a new research project",
}

export default function NewProjectPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name"),
      objective: formData.get("objective"),
      target_group: formData.get("target_group"),
      product: formData.get("product"),
      brief_text: formData.get("brief_text"),
    }

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to create project")
      }

      const result = await response.json()
      toast({
        title: "Success",
        description: "Project created successfully",
      })
      router.push(`/projects/${result.project.id}`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Create New Project1</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Name</label>
              <Input
                name="name"
                required
                placeholder="Enter project name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Objective</label>
              <Textarea
                name="objective"
                placeholder="What are the main objectives of this research?"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Target Group</label>
              <Input
                name="target_group"
                placeholder="Who is the target audience?"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Product/Service</label>
              <Input
                name="product"
                placeholder="What product or service is being researched?"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Brief</label>
              <Textarea
                name="brief_text"
                placeholder="Enter project brief..."
                rows={5}
              />
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
                  "Create Project"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
