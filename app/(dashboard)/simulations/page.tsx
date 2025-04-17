"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { Simulation } from "../simulations/new/page"

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
  const [simulations, setSimulations] = useState<SimulationViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSimulations = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/simulations');
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data: SimulationsApiResponse = await response.json();
        
        // Map the API data to the view model
        const mappedSimulations = data.simulations.map(sim => ({
          id: sim.id,
          name: sim.title,
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Simulations</h1>
        <Link href="/simulations/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create New Simulation
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Simulations</CardTitle>
          <CardDescription>Manage your qualitative research simulations</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading simulations...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : simulations.length === 0 ? (
            <div className="text-center py-8">
              No simulations found. Create your first simulation!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Study Name</TableHead>
                  <TableHead>Date Created</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {simulations.map((sim) => (
                  <TableRow key={sim.id}>
                    <TableCell className="font-medium">{sim.name}</TableCell>
                    <TableCell>{sim.date}</TableCell>
                    <TableCell>{sim.mode}</TableCell>
                    <TableCell>{sim.participants}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          sim.status === "Completed" ? "default" : 
                          sim.status === "Running" ? "outline" : "secondary"
                        }
                      >
                        {sim.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/simulations/${sim.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
