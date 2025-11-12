"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, MoreVertical, Trash2, Edit2 } from "lucide-react"
import { useEffect, useState } from "react"
import { Project } from "@/utils/types"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ProjectViewModel {
  id: string;
  name: string;
  objective: string;
  target_group: string;
  created_at: string;
  updated_at: string;
  studies_count: number;
  simulation_count: number;
  interview_count: number;
  personas_count: number;
}

export default function ProjectsList() {
  const router = useRouter();
  const { toast } = useToast();
  const [projects, setProjects] = useState<ProjectViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function to open modal for project name input
  const handleOpenModal = () => {
    setIsModalOpen(true);
    setProjectName("");
  };

  // Function to close modal and reset form
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setProjectName("");
    setIsSubmitting(false);
  };

  // Function to create new project with name
  const handleCreateProject = async () => {
    // Validate project name
    if (!projectName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a project name",
        variant: "destructive",
      });
      return;
    }

    if (projectName.trim().length < 2) {
      toast({
        title: "Error",
        description: "Project name must be at least 2 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      toast({
        title: "Creating project...",
        description: "Setting up your new research project",
      });

      const response = await fetch('/api/projects/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: projectName.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.project?.id) {
          toast({
            title: "Project created!",
            description: "Redirecting to the project...",
          });
          handleCloseModal();
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
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Simulate API fetch with fake data
    const fakeProjects = [
      {
        id: "1",
        name: "Gen Z Social Media Habits22",
        objective: null,
        // objective: "Understand how Gen Z interacts with social media platforms and their content consumption patterns",
        target_group: "Gen Z (18-24)",
        product: "Social Media App",
        brief_text: "Deep dive into Gen Z social media behavior",
        created_at: "2024-03-20",
        studies_count: 3,
        simulation_count: 2,
        interview_count: 5
      },
      {
        id: "2",
        name: "EV Charging Experience",
        objective: "Evaluate user experience with electric vehicle charging stations",
        target_group: "EV Owners",
        product: "ChargeFast Stations",
        brief_text: "Research on EV charging pain points",
        created_at: "2024-03-18",
        studies_count: 2,
        simulation_count: 1,
        interview_count: 3
      },
      {
        id: "3",
        name: "Food Delivery App Redesign",
        objective: "Gather feedback on new UI/UX design for food delivery application",
        target_group: "Urban food delivery users",
        product: "FoodNow App",
        brief_text: "Testing new app interface",
        created_at: "2024-03-15",
        studies_count: 4,
        simulation_count: 3,
        interview_count: 0
      },
      {
        id: "4",
        name: "Smart Home Device Usage",
        objective: "Understanding smart home device integration and usage patterns",
        target_group: "Smart home owners",
        product: "HomeConnect Hub",
        brief_text: "Smart home ecosystem research",
        created_at: "2024-03-10",
        studies_count: 1,
        simulation_count: 0,
        interview_count: 2
      }
    ];

    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/projects');
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('ProjectsApiResponse', data);
        // Sort projects by updated_at (most recent first)
        const sortedProjects = (data.projects || []).sort((a: ProjectViewModel, b: ProjectViewModel) => {
          const dateA = new Date(a.updated_at || a.created_at).getTime();
          const dateB = new Date(b.updated_at || b.created_at).getTime();
          return dateB - dateA; // Descending order (newest first)
        });
        setProjects(sortedProjects);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch simulations:", err);
        setError("Failed to load simulations. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
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
        <Button onClick={handleOpenModal} disabled={isCreating}>
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

      {/* Projects Table */}
      {!loading && !error && projects.length > 0 && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Simulations</TableHead>
                <TableHead>Human Interviews</TableHead>
                <TableHead>Personas</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => {
                const formattedDate = new Date(project.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });

                return (
                  <TableRow 
                    key={project.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    <TableCell>
                      <span className="font-semibold">
                        {project.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {project.simulation_count} {project.simulation_count === 1 ? 'simulation' : 'simulations'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {project.interview_count} {project.interview_count === 1 ? 'interview' : 'interviews'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {project.personas_count} {project.personas_count === 1 ? 'persona' : 'personas'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {formattedDate}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const response = await fetch(`/api/projects/${project.id}`, {
                              method: 'DELETE',
                            });
                            if (!response.ok) throw new Error('Failed to delete project');
                            setProjects(prev => prev.filter(p => p.id !== project.id));
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
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Project Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Enter a name for your new research project. You can always change this later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project-name">
                Name
              </Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name..."
                className="col-span-3"
                disabled={isSubmitting}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSubmitting && projectName.trim()) {
                    handleCreateProject();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateProject}
              disabled={isSubmitting || !projectName.trim()}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
