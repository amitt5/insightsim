"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  Plus, 
  Eye, 
  Download, 
  Trash2, 
  Calendar,
  FileText,
  Users,
  Clock,
  Info
} from "lucide-react"
import Link from "next/link"

// Mock data for analysis history
const mockAnalyses = [
  {
    id: "1",
    name: "Consumer Beverage Preferences Study",
    date: "2024-01-15",
    status: "completed",
    fileCount: 3,
    participantCount: 24,
    themes: 8,
    createdAt: "2024-01-15T10:30:00Z"
  },
  {
    id: "2", 
    name: "Mobile App UX Research",
    date: "2024-01-12",
    status: "completed",
    fileCount: 2,
    participantCount: 16,
    themes: 12,
    createdAt: "2024-01-12T14:20:00Z"
  },
  {
    id: "3",
    name: "Brand Perception Analysis",
    date: "2024-01-10",
    status: "processing",
    fileCount: 4,
    participantCount: 32,
    themes: 0,
    createdAt: "2024-01-10T09:15:00Z"
  },
  {
    id: "4",
    name: "Product Launch Feedback",
    date: "2024-01-08",
    status: "completed",
    fileCount: 1,
    participantCount: 12,
    themes: 6,
    createdAt: "2024-01-08T16:45:00Z"
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800"
    case "processing":
      return "bg-yellow-100 text-yellow-800"
    case "failed":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export default function AnalysisPage() {
  const [analyses] = useState(mockAnalyses)

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Demo Banner */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Demo Mode</h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                This is a demo using sample data. Click "Start New Analysis" to see the complete analysis workflow. You don't need to upload any files - just click through the steps to explore all features.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            Analysis
          </h2>
          <p className="text-muted-foreground">
            Upload and analyze qualitative research transcripts to extract insights, themes, and key findings.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/analysis/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Start New Analysis
            </Button>
          </Link>
        </div>
      </div>

      {/* Analysis History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Analysis History (Demo Data)
          </CardTitle>
          <CardDescription>
            View and manage your previous qualitative research analyses. These are sample analyses for demonstration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analyses.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No analyses yet</h3>
              <p className="text-muted-foreground mb-4">
                Start your first analysis by uploading research transcripts
              </p>
              <Link href="/analysis/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Analysis
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {analyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{analysis.name}</h3>
                      <Badge className={getStatusColor(analysis.status)}>
                        {analysis.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">DEMO</Badge>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(analysis.createdAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {analysis.fileCount} files
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {analysis.participantCount} participants
                      </div>
                      {analysis.themes > 0 && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          {analysis.themes} themes
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/analysis/${analysis.id}`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        View Demo
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1"
                      disabled
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1 text-destructive hover:text-destructive"
                      disabled
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 