"use client"
import { useParams } from "next/navigation";
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface HumanRespondent {
  id: string;
  name: string;
  age: number;
  gender: string;
  email: string;
  status: 'in_progress' | 'completed';
  simulation: {
    id: string;
    topic: string;
    discussion_questions: string[];
    created_at: string;
  };
}

export default function InterviewPage() {
  const params = useParams();
  const simulationId = params.id as string;
  const humanRespondentId = params.human_respondent_id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [respondentData, setRespondentData] = useState<HumanRespondent | null>(null);

  useEffect(() => {
    const fetchRespondentData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/public/human-respondents/${humanRespondentId}`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('humandata', data);
        if (data.error) {
          throw new Error(data.error);
        }

        // Verify this respondent belongs to this simulation
        if (data.simulation_id !== simulationId) {
          throw new Error('Invalid simulation ID');
        }
        
        setRespondentData(data);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch respondent data:", err);
        setError(err.message || "Failed to load interview data");
        setRespondentData(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRespondentData();
  }, [simulationId, humanRespondentId]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-[70vh]">Loading interview...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <div className="text-xl font-semibold text-red-500">Error</div>
        <div className="text-gray-500">{error}</div>
      </div>
    );
  }

  if (!respondentData || !respondentData.simulation) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <div className="text-xl font-semibold">Interview not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{respondentData.simulation.topic}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{new Date(respondentData.simulation.created_at).toLocaleDateString()}</span>
              <span>•</span>
              <span>In-Depth Interview</span>
              <Badge variant={respondentData.status === "completed" ? "default" : "secondary"}>
                {respondentData.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Chat Window */}
        <Card className="h-[600px]">
          <CardContent className="p-4 h-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
              {/* Chat messages will go here */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
