"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Eye, Play, BarChart2 } from "lucide-react"
import { CalibrationSession } from "@/utils/types"
import { useState, useEffect } from "react"

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

  const [calibrationSessions, setCalibrationSessions] = useState<CalibrationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCalibrationSessions = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/calibration_sessions');
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setCalibrationSessions(data.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch simulations:", err);
        setError("Failed to load simulations. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCalibrationSessions();
  }, []);

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Real vs AI Calibration</h1>
        <Link href="/calibration/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            New Calibration
          </Button>
        </Link>
      </div>
    {loading && <div>Loading...</div>}
    {error && <div>{error}</div>}
    {!loading && !error && calibrationSessions.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle>All Calibrations</CardTitle>
          <CardDescription>Compare real research transcripts with AI simulations to improve accuracy</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden sm:block w-full overflow-x-auto">
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
                {calibrationSessions.map((calibration) => (
                  <TableRow key={calibration.id}>
                    <TableCell className="font-medium">{calibration.title}</TableCell>
                    <TableCell>{calibration.topic}</TableCell>
                    <TableCell>{calibration.created_at?.slice(0, 10)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(calibration.status)}>{calibration.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{renderActions(calibration)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Mobile Card List */}
          <div className="sm:hidden space-y-4">
            {calibrationSessions.map((calibration) => (
              <div key={calibration.id} className="border rounded-lg p-4 flex flex-col gap-2 shadow-sm bg-card">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-base">{calibration.title}</span>
                  <Badge variant={getStatusBadge(calibration.status)}>{calibration.status}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">{calibration.topic}</div>
                <div className="text-xs text-muted-foreground">Uploaded: {calibration.created_at?.slice(0, 10)}</div>
                <div className="flex justify-end gap-2 mt-2">{renderActions(calibration)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )}
    </div>
  )
}
