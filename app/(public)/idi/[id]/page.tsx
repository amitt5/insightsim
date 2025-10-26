"use client"
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Project } from "@/utils/types";

interface ProjectResponse {
  project: Project;
  error?: string;
}

export default function PublicIDIPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectData, setProjectData] = useState<ProjectResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    email: ""
  });

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/public/idi/${params.id}`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setProjectData(data);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch project:", err);
        setError(err.message || "Failed to load project data");
        setProjectData(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProjectData();
  }, [projectId]);

  const handleStartInterview = async (type: "text" | "voice") => {
    // Validate form data
    if (!formData.name.trim() || !formData.age.trim() || !formData.gender || !formData.email.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/public/human-respondents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: projectId,
          ...formData,
          age: parseInt(formData.age),
          interview_type: type
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      const data = await response.json();
      router.push(`/idi/${projectId}/${data.id}`);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-[70vh]">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <div className="text-xl font-semibold text-red-500">Error</div>
        <div className="text-gray-500">{error}</div>
      </div>
    );
  }

  if (!projectData || !projectData.project) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <div className="text-xl font-semibold">Interview not found</div>
      </div>
    );
  }

  const { project } = projectData;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{new Date(project.created_at).toLocaleDateString()}</span>
              <span>•</span>
              <span>In-Depth Interview</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card className="max-w-xl mx-auto">
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min="18"
                  max="100"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              {/* Interview Type Selection */}
              <div className="space-y-3">
                <Label>Choose Interview Type</Label>
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    onClick={() => handleStartInterview("voice")}
                    className="h-12 text-base"
                    disabled={isSubmitting}
                  >
                    🎤 Start Voice Interview
                  </Button>
                  <Button
                    onClick={() => handleStartInterview("text")}
                    className="h-12 text-base"
                    disabled={isSubmitting}
                  >
                    💬 Start Text Interview
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}