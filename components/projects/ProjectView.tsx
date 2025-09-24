"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Project } from "@/utils/types"
import { useToast } from "@/hooks/use-toast"
import { Edit2, Save } from "lucide-react"
import StudyList from "./StudyList"

interface ProjectViewProps {
  project: Project;
  onUpdate?: (updatedProject: Project) => void;
}

export default function ProjectView({ project, onUpdate }: ProjectViewProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState(project);

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedProject),
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

      const updatedProject = await response.json();
      onUpdate?.(updatedProject);
      setIsEditing(false);
      
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-start mb-8">
        <div>
          {isEditing ? (
            <input
              type="text"
              value={editedProject.name}
              onChange={(e) => setEditedProject({ ...editedProject, name: e.target.value })}
              className="text-2xl font-bold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
            />
          ) : (
            <h1 className="text-2xl font-bold">{project.name}</h1>
          )}
        </div>
        <Button
          variant="outline"
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
        >
          {isEditing ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          ) : (
            <>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Project
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="brief" className="space-y-4">
        <TabsList>
          <TabsTrigger value="brief">Brief</TabsTrigger>
          <TabsTrigger value="discussion">Discussion Guide</TabsTrigger>
          <TabsTrigger value="studies">Studies</TabsTrigger>
        </TabsList>

        <TabsContent value="brief" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Objective</label>
                {isEditing ? (
                  <textarea
                    value={editedProject.objective || ''}
                    onChange={(e) => setEditedProject({ ...editedProject, objective: e.target.value })}
                    className="w-full mt-1 min-h-[100px] p-2 border rounded-md"
                    placeholder="Enter project objective..."
                  />
                ) : (
                  <p className="mt-1">{project.objective || 'No objective set'}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Target Group</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProject.target_group || ''}
                    onChange={(e) => setEditedProject({ ...editedProject, target_group: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-md"
                    placeholder="Enter target group..."
                  />
                ) : (
                  <p className="mt-1">{project.target_group || 'No target group specified'}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Product/Service</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProject.product || ''}
                    onChange={(e) => setEditedProject({ ...editedProject, product: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-md"
                    placeholder="Enter product or service name..."
                  />
                ) : (
                  <p className="mt-1">{project.product || 'No product specified'}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Brief</label>
              {isEditing ? (
                <textarea
                  value={editedProject.brief_text || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, brief_text: e.target.value })}
                  className="w-full mt-1 min-h-[200px] p-2 border rounded-md"
                  placeholder="Enter project brief..."
                />
              ) : (
                <p className="mt-1 whitespace-pre-wrap">{project.brief_text || 'No brief added'}</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="discussion" className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Discussion Guide</label>
            {isEditing ? (
              <textarea
                value={editedProject.discussion_questions || ''}
                onChange={(e) => setEditedProject({ ...editedProject, discussion_questions: e.target.value })}
                className="w-full mt-1 min-h-[400px] p-2 border rounded-md"
                placeholder="Enter discussion questions..."
              />
            ) : (
              <div className="mt-1 whitespace-pre-wrap">
                {project.discussion_questions || 'No discussion guide added'}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="studies">
          <StudyList projectId={project.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
