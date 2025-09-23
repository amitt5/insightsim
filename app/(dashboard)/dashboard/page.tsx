"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, BarChart, Users, FileText, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

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

  // Mock data
  const recentSimulations = [
    {
      id: 1,
      name: "New Snack Product Concept",
      date: "2025-04-10",
      mode: "AI Mod + AI Participants",
      status: "Completed",
    },
    {
      id: 2,
      name: "Banking App UX Feedback",
      date: "2025-04-08",
      mode: "Human Mod + AI Participants",
      status: "Completed",
    },
    {
      id: 3,
      name: "Health Tracker Feature Exploration",
      date: "2025-04-05",
      mode: "AI Mod + AI Participants",
      status: "Draft",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={handleCreateNewSimulation} disabled={isCreating}>
          {isCreating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {isCreating ? 'Creating...' : 'Create New Simulation'}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Simulations</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Personas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">Across 5 industries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Generated Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">PDF and PPT formats</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Simulations</CardTitle>
          <CardDescription>Your most recent qualitative research simulations</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Study Name</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSimulations.map((sim) => (
                <TableRow key={sim.id}>
                  <TableCell className="font-medium">{sim.name}</TableCell>
                  <TableCell>{sim.date}</TableCell>
                  <TableCell>{sim.mode}</TableCell>
                  <TableCell>
                    <Badge variant={sim.status === "Completed" ? "default" : "secondary"}>{sim.status}</Badge>
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
        </CardContent>
      </Card>
    </div>
  )
}
