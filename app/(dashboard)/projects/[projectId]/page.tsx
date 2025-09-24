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

  const getFakeProject = (id: string) => {
    const fakeProjects = {
      "1": {
        id: "1",
        name: "Gen Z Social Media Habits",
        objective: "Understand how Gen Z interacts with social media platforms and their content consumption patterns. Focus on emerging platforms and features that drive engagement.",
        target_group: "Gen Z (18-24)",
        product: "Social Media App",
        brief_text: "Our social media platform aims to better serve Gen Z users. We need to understand their content consumption patterns, sharing behaviors, and platform preferences. Key areas include short-form video engagement, messaging features, and community building tools.",
        discussion_questions: "1. Daily social media routine and platform preferences\n2. Content creation vs consumption habits\n3. Features that drive engagement and sharing\n4. Privacy concerns and settings usage\n5. Community and group interaction patterns\n6. Emerging trends and platform adoption",
        created_at: "2024-03-20",
        updated_at: "2024-03-20",
        user_id: "123",
        is_deleted: false
      },
      "2": {
        id: "2",
        name: "EV Charging Experience",
        objective: "Evaluate user experience with electric vehicle charging stations and identify key pain points in the charging process.",
        target_group: "EV Owners",
        product: "ChargeFast Stations",
        brief_text: "ChargeFast is developing next-generation EV charging stations. We need to understand current user experiences, pain points, and desired features to improve our charging station design and user interface.",
        discussion_questions: "1. Current charging habits and preferences\n2. Pain points in the charging process\n3. Mobile app integration experience\n4. Payment and pricing preferences\n5. Location and accessibility factors\n6. Additional services desired at charging stations",
        created_at: "2024-03-18",
        updated_at: "2024-03-19",
        user_id: "123",
        is_deleted: false
      }
    };

    return fakeProjects[id];
  };

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
        // First try to get fake project
        const fakeProject = getFakeProject(projectId);
        if (fakeProject) {
          setProject(fakeProject);
          setError(null);
        } else {
          // If no fake project, try to fetch from backend
          const backendProject = await fetchProjectFromBackend(projectId);
          if (backendProject) {
            setProject(backendProject);
            setError(null);
          }
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
