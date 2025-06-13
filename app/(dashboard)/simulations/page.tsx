"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, MoreVertical, Eye, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { Simulation } from "@/utils/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Interface for the API response
interface SimulationsApiResponse {
  simulations: Simulation[];
  participantCounts: Record<string, number>;
}

// Interface for the view model
interface SimulationViewModel {
  id: string;
  name: string;
  date: string;
  mode: string;
  status: string;
  participants: number;
}

export default function SimulationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [simulations, setSimulations] = useState<SimulationViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const supabase = createClientComponentClient()

  const handleDeleteClick = (simulationId: string) => {
    setDeleteConfirmId(simulationId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/simulations/${deleteConfirmId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_deleted: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete simulation');
      }

      const result = await response.json();
      console.log('Simulation deleted successfully:', result);
      
      // Remove from local state
      setSimulations(prev => prev.filter(sim => sim.id !== deleteConfirmId));
      
      // Show success message
      setSuccessMessage('Simulation deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000); // Hide after 3 seconds
      
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete simulation:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete simulation');
      setTimeout(() => setError(null), 5000); // Hide error after 5 seconds
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmId(null);
  };

  // Function to create draft simulation and redirect
  const handleCreateNewSimulation = async () => {
    try {
      setIsCreating(true);
      
      // Show immediate feedback
      toast({
        title: "Creating simulation...",
        description: "Setting up your new study",
      });

      const response = await fetch('/api/simulations/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Empty body for default values
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

  useEffect(() => {
    const fetchSimulations = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/simulations');
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data: SimulationsApiResponse = await response.json();
        console.log('SimulationsApiResponse', data);
        // Map the API data to the view model
        const mappedSimulations = data.simulations.map(sim => ({
          id: sim.id,
          name: sim.study_title,
          date: new Date(sim.created_at).toISOString().split('T')[0],
          mode: sim.mode === 'ai-both' ? 'AI Mod + AI Participants' : 'Human Mod + AI Participants',
          status: sim.status,
          participants: data.participantCounts[sim.id] || 0
        }));
        
        setSimulations(mappedSimulations);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch simulations:", err);
        setError("Failed to load simulations. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchSimulations();
  }, []);

  return (
    <div className="container mx-auto p-4">
      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Simulations</h1>
          <p className="text-gray-600">Manage your qualitative research simulations</p>
        </div>
        <Button onClick={handleCreateNewSimulation} disabled={isCreating}>
          {isCreating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {isCreating ? 'Creating...' : 'Create New Simulation'}
        </Button>
      </div>

      {/* Desktop view - table */}
      {(!loading && !error && simulations.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <p className="text-lg font-medium mb-2">No simulations found.</p>
          <p className="mb-4">Click <span className="font-semibold">New Simulation</span> to get started.</p>
        </div>
      )}
      {!loading && !error && simulations.length > 0 && (
        <div className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Study Name</th>
                <th className="text-left py-3 px-4">Date Created</th>
                <th className="text-left py-3 px-4">Mode</th>
                <th className="text-left py-3 px-4">Participants</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {simulations.map((simulation) => (
                <tr key={simulation.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{simulation.name}</td>
                  <td className="py-3 px-4">{simulation.date}</td>
                  <td className="py-3 px-4">{simulation.mode}</td>
                  <td className="py-3 px-4">{simulation.participants}</td>
                  <td className="py-3 px-4">
                    <Badge variant={simulation.status === "Completed" ? "default" : "secondary"}>
                      {simulation.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link 
                            href={simulation.status === "Draft" ? `/simulations/${simulation.id}/edit` : `/simulations/${simulation.id}`} 
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            {simulation.status === "Draft" ? "Continue Editing" : "View"}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(simulation.id)}
                          className="flex items-center gap-2 text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile view - cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {simulations.map((simulation) => (
          <Card key={simulation.id}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{simulation.name}</h3>
                    <p className="text-sm text-gray-500">
                      {simulation.date}
                    </p>
                  </div>
                  <Badge variant={simulation.status === "Completed" ? "default" : "secondary"}>
                    {simulation.status}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Mode</span>
                    <span>{simulation.mode}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Participants</span>
                    <span>{simulation.participants}</span>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <div className="flex-1" />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link 
                            href={simulation.status === "Draft" ? `/simulations/${simulation.id}/edit` : `/simulations/${simulation.id}`} 
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            {simulation.status === "Draft" ? "Continue Editing" : "View"}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(simulation.id)}
                          className="flex items-center gap-2 text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Simulation</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this simulation? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={handleDeleteCancel}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
