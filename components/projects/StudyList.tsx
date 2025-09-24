"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import { Simulation } from "@/utils/types"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface StudyListProps {
  projectId: string;
}

export default function StudyList({ projectId }: StudyListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [studies, setStudies] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateNewStudy = async () => {
    try {
      setIsCreating(true);
      
      toast({
        title: "Creating study...",
        description: "Setting up your new research study",
      });

      const response = await fetch(`/api/projects/${projectId}/studies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: projectId,
          study_type: "idi", // default type
          mode: "ai-both", // default mode
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.simulation?.id) {
          toast({
            title: "Study created!",
            description: "Redirecting to setup...",
          });
          router.push(`/simulations/${data.simulation.id}/edit`);
        }
      } else {
        throw new Error('Failed to create study');
      }
    } catch (error) {
      console.error('Error creating study:', error);
      toast({
        title: "Error",
        description: "Failed to create study",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    const fetchStudies = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}/studies`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setStudies(data.studies);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch studies:", err);
        setError("Failed to load studies. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudies();
  }, [projectId]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Studies</h2>
        <Button onClick={handleCreateNewStudy} disabled={isCreating}>
          {isCreating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {isCreating ? 'Creating...' : 'New Study'}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {(!loading && !error && studies.length === 0) && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg font-medium mb-2">No studies yet</p>
          <p className="mb-4">Create your first study to get started</p>
        </div>
      )}

      {/* Studies Grid */}
      {!loading && !error && studies.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {studies.map((study) => (
            <Link 
              key={study.id}
              href={study.status === "Draft" ? `/simulations/${study.id}/edit` : `/simulations/${study.id}`}
            >
              <Card className="hover:border-blue-100 transition-colors">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium">{study.study_title}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(study.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={study.status === "Completed" ? "default" : "secondary"}>
                      {study.status}
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>{study.study_type === "focus-group" ? "Focus Group" : "IDI"}</span>
                    <span>{study.mode === "ai-both" ? "AI Mod + AI Participants" : "Human Mod"}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
