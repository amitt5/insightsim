"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Project } from "@/utils/types"
import { useToast } from "@/hooks/use-toast"
import { Edit2, Save } from "lucide-react"
import StudyList from "./StudyList"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { createTitleGenerationPrompt,createBriefExtractionPrompt, createPersonaGenerationPrompt, buildDiscussionQuestionsPrompt,buildDiscussionQuestionsFromBrief, createBriefPersonaGenerationPrompt } from "@/utils/buildMessagesForOpenAI";

import { ChatCompletionMessageParam } from "openai/resources/index.mjs"
import { runSimulationAPI } from "@/utils/api"
import { ArrowLeft, ArrowRight, Upload, X, FileIcon, Sparkles, Loader2, HelpCircle } from "lucide-react"

interface ProjectViewProps {
  project: Project;
  onUpdate?: (updatedProject: Project) => void;
}

export default function ProjectView({ project, onUpdate }: ProjectViewProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState(project);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  const handleSave = async () => {
    console.log('editedProject-111', editedProject)
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
          <div>
            <label className="text-sm font-medium text-gray-500">Brief</label>
            {isEditing ? (
              <textarea
                value={editedProject.brief_text || ''}
                onChange={(e) => setEditedProject({ ...editedProject, brief_text: e.target.value })}
                className="w-full mt-1 min-h-[400px] p-2 border rounded-md"
                placeholder="Enter project brief..."
              />
            ) : (
              <p className="mt-1 whitespace-pre-wrap">{project.brief_text || 'No brief added'}</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="discussion" className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Discussion Guide</label>

            <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="p-0 h-6 w-6 bg-transparent border-none cursor-pointer"
                            tabIndex={-1}
                            disabled={isGeneratingQuestions}
                            onClick={async () => {
                              if (isGeneratingQuestions) return;
                              setIsGeneratingQuestions(true);
                              try {
                                const prompt = buildDiscussionQuestionsFromBrief(
                                  'study_title',
                                );
                                console.log('prompt111', prompt);
                                const messages: ChatCompletionMessageParam[] = [
                                  { role: "system", content: prompt }
                                ];
                                const result = await runSimulationAPI(messages, 'gpt-4o-mini', 'discussion-questions');

                                try {
                                  // Parse the JSON response
                                  let responseText = result.reply || "";
                                  
                                  // Clean the response string (remove any markdown formatting)
                                  responseText = responseText
                                  .replace(/^```[\s\S]*?\n/, '')  // Remove starting ``` and optional language
                                  .replace(/```$/, '')            // Remove trailing ```
                                  .trim();
                                  
                                  // Parse the JSON
                                  const parsedResponse = JSON.parse(responseText);
                                  
                                  // Extract questions array
                                  const questions = parsedResponse.questions || [];
                                  
                                  // Join questions as textarea value (one per line)
                                  // setSimulationData(prev => ({
                                  //   ...prev,
                                  //   discussion_questions: questions.join("\n")
                                  // }));
                                  
                                } catch (error) {
                                  console.error("Error parsing discussion questions JSON:", error);
                                  
                                  // Fallback: try to parse as the old numbered list format
                                  let questions = result.reply || "";
                                  questions = questions.replace(/```[a-z]*[\s\S]*?```/gi, '');
                                  let lines = questions.split(/\n|\r/).map(l => l.trim()).filter(Boolean);
                                  lines = lines.map(l => l.replace(/^\d+\.?\s*/, ""));
                                  console.log('lines111', lines);
                                  // setSimulationData(prev => ({
                                  //   ...prev,
                                  //   discussion_questions: lines.join("\n")
                                  // }));
                                }

                
                              } catch (err) {
                                toast({
                                  title: "Error",
                                  description: "Failed to generate questions. Please try again.",
                                  variant: "destructive",
                                  duration: 5000,
                                });
                              } finally {
                                setIsGeneratingQuestions(false);
                              }
                            }}
                          >
                            {isGeneratingQuestions ? (
                              <Loader2 className="h-4 w-4 text-primary animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4 text-primary" />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          Generate discussion questions with AI
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>



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
