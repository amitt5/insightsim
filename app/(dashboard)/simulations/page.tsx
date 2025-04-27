"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { Simulation } from "@/utils/types"
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Simulations</h1>
          <p className="text-gray-600">Manage your qualitative research simulations</p>
        </div>
        <Button asChild>
          <Link href="/simulations/new">
            <Plus className="h-4 w-4 mr-2" />
            New
          </Link>
        </Button>
      </div>

      {/* Desktop view - table */}
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
                  <Button variant="ghost" asChild>
                    <Link href={`/simulations/${simulation.id}`}>View</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
                  <Button className="w-full" variant="outline" asChild>
                    <Link href={`/simulations/${simulation.id}`}>View Details</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
