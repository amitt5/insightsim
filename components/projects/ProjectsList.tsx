"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { Project } from "@/utils/types"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import ProjectCard from "./ProjectCard"

interface ProjectViewModel {
  id: string;
  name: string;
  objective: string;
  target_group: string;
  created_at: string;
  studies_count: number;
}

export default function ProjectsList() {
  const router = useRouter();
  const { toast } = useToast();
  const [projects, setProjects] = useState<ProjectViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Function to create new project
  const handleCreateNewProject = async () => {
    try {
      setIsCreating(true);
      
      toast({
        title: "Creating project...",
        description: "Setting up your new research project",
      });

      const response = await fetch('/api/projects/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Empty body for default values
      });

      if (response.ok) {
        const data = await response.json();
        if (data.project?.id) {
          toast({
            title: "Project created!",
            description: "Redirecting to the project...",
          });
          router.push(`/projects/${data.project.id}`);
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to create project",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    // Simulate API fetch with fake data
    const fakeProjects = [
      {
        id: "1",
        name: "Gen Z Social Media Habits",
        objective: null,
        // objective: "Understand how Gen Z interacts with social media platforms and their content consumption patterns",
        target_group: "Gen Z (18-24)",
        product: "Social Media App",
        brief_text: "Deep dive into Gen Z social media behavior",
        created_at: "2024-03-20",
        studies_count: 3
      },
      {
        id: "2",
        name: "EV Charging Experience",
        objective: "Evaluate user experience with electric vehicle charging stations",
        target_group: "EV Owners",
        product: "ChargeFast Stations",
        brief_text: "Research on EV charging pain points",
        created_at: "2024-03-18",
        studies_count: 2
      },
      {
        id: "3",
        name: "Food Delivery App Redesign",
        objective: "Gather feedback on new UI/UX design for food delivery application",
        target_group: "Urban food delivery users",
        product: "FoodNow App",
        brief_text: "Testing new app interface",
        created_at: "2024-03-15",
        studies_count: 4
      },
      {
        id: "4",
        name: "Smart Home Device Usage",
        objective: "Understanding smart home device integration and usage patterns",
        target_group: "Smart home owners",
        product: "HomeConnect Hub",
        brief_text: "Smart home ecosystem research",
        created_at: "2024-03-10",
        studies_count: 1
      }
    ];

    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setProjects(fakeProjects);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="container mx-auto p-4">
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Research Projects</h1>
          <p className="text-gray-600">Manage your qualitative research projects</p>
        </div>
        <Button onClick={handleCreateNewProject} disabled={isCreating}>
          {isCreating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {isCreating ? 'Creating...' : 'Create New Project'}
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {(!loading && !error && projects.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <p className="text-lg font-medium mb-2">No projects found.</p>
          <p className="mb-4">Click <span className="font-semibold">Create New Project</span> to get started.</p>
        </div>
      )}

      {/* Projects Grid */}
      {!loading && !error && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              studyCount={project.studies_count}
              onDelete={async (projectId) => {
                try {
                  const response = await fetch(`/api/projects/${projectId}`, {
                    method: 'DELETE',
                  });
                  if (!response.ok) throw new Error('Failed to delete project');
                  setProjects(prev => prev.filter(p => p.id !== projectId));
                  toast({
                    title: "Success",
                    description: "Project deleted successfully",
                  });
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to delete project",
                    variant: "destructive",
                  });
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
