"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, Link } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Project } from "@/utils/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface StudyListProps {
  projectId: string;
  project: Project;
}

export default function StudyList({ projectId, project }: StudyListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [simulations, setSimulations] = useState([
    {
      id: "1",
      study_title: "Product Usage Patterns",
      study_type: "focus-group",
      mode: "ai-both",
      status: "Draft",
      created_at: "2024-03-20",
      participants: 6
    },
    {
      id: "2",
      study_title: "Feature Feedback Session",
      study_type: "idi",
      mode: "human-mod",
      status: "Completed",
      created_at: "2024-03-19",
      participants: 1
    },
    {
      id: "3",
      study_title: "User Experience Discussion",
      study_type: "focus-group",
      mode: "ai-both",
      status: "Draft",
      created_at: "2024-03-18",
      participants: 4
    }
  ]);

  const handleCreateNewSimulation = async () => {
    try {
      setIsCreating(true);
      
      toast({
        title: "Creating simulation...",
        description: "Setting up your new study",
      });

      const response = await fetch('/api/simulations/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: projectId,
          study_title: project.name,
          brief_text: project.brief_text,
          discussion_questions: project.discussion_questions || [],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.simulation?.id) {
          toast({
            title: "Simulation created!",
            description: "Redirecting to the editor...",
          });
          router.push(`/simulations/${data.simulation.id}/edit`);
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to create simulation",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating draft simulation:', error);
      toast({
        title: "Error",
        description: "Failed to create simulation",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Project Simulations</h2>
        <Button 
          onClick={handleCreateNewSimulation}
          disabled={isCreating || !project.brief_text}
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              New Simulation
            </>
          )}
        </Button>
      </div>

      {simulations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg font-medium mb-2">No simulations yet</p>
          <p className="mb-4">Create your first simulation to get started</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {simulations.map((simulation) => (
                <TableRow key={simulation.id}>
                  <TableCell>
                    <Link 
                      href={`/simulations/${simulation.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {simulation.study_title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {simulation.study_type === 'focus-group' ? 'Focus Group' : 'IDI'}
                  </TableCell>
                  <TableCell>
                    {simulation.mode === 'ai-both' ? 'AI Mod + AI Participants' : 'Human Mod'}
                  </TableCell>
                  <TableCell>{simulation.participants}</TableCell>
                  <TableCell>
                    <Badge variant={simulation.status === "Completed" ? "default" : "secondary"}>
                      {simulation.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(simulation.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}