"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AnalysisDetailPage({ params }: { params: { id: string } }) {
    const analysisId = params.id;
  const router = useRouter()

  useEffect(() => {
    // Redirect to the dashboard automatically
    router.replace(`/analysis/${analysisId}/dashboard`)
  }, [analysisId, router])

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading analysis...</p>
      </div>
    </div>
  )
} 