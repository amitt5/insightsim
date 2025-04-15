import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, FileText } from "lucide-react"

export default function ReportsPage() {
  // Mock data
  const reports = [
    {
      id: 1,
      name: "New Snack Product Concept",
      date: "2025-04-10",
      type: "Focus Group",
      formats: ["PDF", "PPT", "CSV"],
    },
    {
      id: 2,
      name: "Banking App UX Feedback",
      date: "2025-04-08",
      type: "In-Depth Interview",
      formats: ["PDF", "CSV"],
    },
    {
      id: 3,
      name: "Health Tracker Feature Exploration",
      date: "2025-04-05",
      type: "Focus Group",
      formats: ["PDF", "PPT"],
    },
    {
      id: 4,
      name: "Financial App Onboarding Flow",
      date: "2025-04-02",
      type: "In-Depth Interview",
      formats: ["PDF", "CSV"],
    },
    {
      id: 5,
      name: "Eco-Friendly Packaging Feedback",
      date: "2025-03-28",
      type: "Focus Group",
      formats: ["PDF", "PPT", "CSV"],
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reports</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
          <CardDescription>Download and manage your simulation reports</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Study Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Available Formats</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.name}</TableCell>
                  <TableCell>{report.date}</TableCell>
                  <TableCell>{report.type}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {report.formats.map((format) => (
                        <Badge key={format} variant="outline" className="text-xs">
                          {format}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-3 w-3" />
                        Download
                      </Button>
                      <Link href={`/simulations/${report.id}`}>
                        <Button variant="ghost" size="sm">
                          <FileText className="mr-2 h-3 w-3" />
                          View
                        </Button>
                      </Link>
                    </div>
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
