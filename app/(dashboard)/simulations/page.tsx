import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"

export default function SimulationsPage() {
  // Mock data
  const simulations = [
    {
      id: 1,
      name: "New Snack Product Concept",
      date: "2025-04-10",
      mode: "AI Mod + AI Participants",
      status: "Completed",
      participants: 6,
    },
    {
      id: 2,
      name: "Banking App UX Feedback",
      date: "2025-04-08",
      mode: "Human Mod + AI Participants",
      status: "Completed",
      participants: 5,
    },
    {
      id: 3,
      name: "Health Tracker Feature Exploration",
      date: "2025-04-05",
      mode: "AI Mod + AI Participants",
      status: "Draft",
      participants: 4,
    },
    {
      id: 4,
      name: "Financial App Onboarding Flow",
      date: "2025-04-02",
      mode: "Human Mod + AI Participants",
      status: "Running",
      participants: 5,
    },
    {
      id: 5,
      name: "Eco-Friendly Packaging Feedback",
      date: "2025-03-28",
      mode: "AI Mod + AI Participants",
      status: "Completed",
      participants: 6,
    },
  ]

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
                        sim.status === "Completed" ? "default" : sim.status === "Running" ? "outline" : "secondary"
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
        </CardContent>
      </Card>
    </div>
  )
}
