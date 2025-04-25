import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Eye, Play, BarChart2 } from "lucide-react"

export default function CalibrationPage() {
  // Mock data for calibrations
  const calibrations = [
    {
      id: 1,
      title: "Snack Product Focus Group",
      topic: "Plant-based snack preferences",
      date: "2025-04-15",
      status: "Ready to Compare",
    },
    {
      id: 2,
      title: "Banking App User Testing",
      topic: "Mobile banking UX feedback",
      date: "2025-04-10",
      status: "Simulation Pending",
    },
    {
      id: 3,
      title: "Health Tracker Interviews",
      topic: "Fitness tracking feature preferences",
      date: "2025-04-05",
      status: "Transcript Only",
    },
    {
      id: 4,
      title: "E-commerce Checkout Flow",
      topic: "Payment method preferences",
      date: "2025-04-01",
      status: "Ready to Compare",
    },
  ]

  // Function to get badge variant based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Ready to Compare":
        return "default"
      case "Simulation Pending":
        return "outline"
      case "Transcript Only":
        return "secondary"
      default:
        return "secondary"
    }
  }

  // Function to render action buttons based on status
  const renderActions = (calibration: any) => {
    return (
      <div className="flex justify-end gap-2">
        <Link href={`/calibration/${calibration.id}`}>
          <Button variant="ghost" size="sm">
            <Eye className="mr-2 h-3 w-3" />
            View
          </Button>
        </Link>

        {calibration.status === "Transcript Only" && (
          <Button variant="outline" size="sm">
            <Play className="mr-2 h-3 w-3" />
            Run Simulation
          </Button>
        )}

        {calibration.status === "Ready to Compare" && (
          <Link href={`/calibration/${calibration.id}/compare`}>
            <Button variant="outline" size="sm">
              <BarChart2 className="mr-2 h-3 w-3" />
              Compare & Calibrate
            </Button>
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Real vs AI Calibration</h1>
        <Link href="/calibration/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Calibration
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Calibrations</CardTitle>
          <CardDescription>Compare real research transcripts with AI simulations to improve accuracy</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Study Title</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Date Uploaded</TableHead>
                <TableHead>Calibration Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calibrations.map((calibration) => (
                <TableRow key={calibration.id}>
                  <TableCell className="font-medium">{calibration.title}</TableCell>
                  <TableCell>{calibration.topic}</TableCell>
                  <TableCell>{calibration.date}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(calibration.status)}>{calibration.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{renderActions(calibration)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
