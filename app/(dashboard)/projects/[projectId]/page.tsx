"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Project } from "@/utils/types"
import ProjectView from "@/components/projects/ProjectView"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface ProjectPageProps {
  params: {
    projectId: string
  }
}

export default function ProjectPage({ 
  params 
}: { 
  params: Promise<{ projectId: string }> 
}) {
  const { projectId } = use(params);
  const router = useRouter()
  const { toast } = useToast()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjectFromBackend = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push("/projects");
          return null;
        }
        throw new Error("Failed to fetch project");
      }
      const data = await response.json();
      return data.project;
    } catch (error) {
      console.error("Error fetching project:", error);
      throw error;
    }
  };

  useEffect(() => {
    const loadProject = async () => {
      setLoading(true);
      try {
        const backendProject = await fetchProjectFromBackend(projectId);
        if (backendProject) {
          setProject(backendProject);
          setError(null);
        }
        
      } catch (error) {
        setError("Failed to load project");
        toast({
          title: "Error",
          description: "Failed to load project details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId, router, toast])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">
            {error || "Project not found"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <ProjectView
      project={project}
      onUpdate={(updatedProject) => setProject(updatedProject)}
    />
  )
}
