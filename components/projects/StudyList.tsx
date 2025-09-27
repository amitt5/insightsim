"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, Link } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Project, Simulation } from "@/utils/types"
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
  project: Project;
  simulations: Simulation[];
}

export default function StudyList({ project, simulations }: StudyListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
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
          project_id: project.id,
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