"use client"
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Project, Simulation } from "@/utils/types"
import { useToast } from "@/hooks/use-toast"
import StudyList from "./StudyList"
import HumanInterviewsTable from "./HumanInterviewsTable"
import { PersonaCard } from "@/components/persona-card"
import { CreatePersonaDialog } from "@/components/create-persona-dialog"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { createTitleGenerationPrompt,createBriefExtractionPrompt, createPersonaGenerationPrompt, buildDiscussionQuestionsPrompt,buildDiscussionQuestionsFromBrief, createBriefPersonaGenerationPrompt } from "@/utils/buildMessagesForOpenAI";

import { ChatCompletionMessageParam } from "openai/resources/index.mjs"
import { runSimulationAPI } from "@/utils/api"
import { ArrowLeft, ArrowRight, Upload, X,Edit2, Save, FileIcon, Sparkles, Loader2, HelpCircle } from "lucide-react"
import AIBriefAssistant from "./AIBriefAssistant"
import { RagDocumentUpload, RagDocumentList } from "./rag"

interface ProjectViewProps {
  project: Project;
  onUpdate?: (updatedProject: Project) => void;
}

export default function ProjectView({ project, onUpdate }: ProjectViewProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState(project);
  const [projectPersonas, setProjectPersonas] = useState<any[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [isGeneratingPersonas, setIsGeneratingPersonas] = useState(false);
  const [isLoadingPersonas, setIsLoadingPersonas] = useState(false);
  const [editingPersona, setEditingPersona] = useState<any>(null);
  const [editPersonaOpen, setEditPersonaOpen] = useState(false);
  const [ragDocuments, setRagDocuments] = useState<any[]>([]);

  const handleEditPersona = (persona: any) => {
    setEditingPersona(persona);
    setEditPersonaOpen(true);
  };

  const handleDeletePersona = async (personaId: string) => {
    try {
      const response = await fetch(`/api/projects/${project.id}/personas/${personaId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete persona');
      }

      setProjectPersonas(prev => prev.filter(p => p.id !== personaId));
      toast({
        title: "Success",
        description: "Persona deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting persona:', error);
      toast({
        title: "Error",
        description: "Failed to delete persona",
        variant: "destructive",
      });
    }
  };

  const handleEditPersonaSuccess = (updatedPersona: any) => {
    setProjectPersonas(prev => prev.map(p => p.id === updatedPersona.id ? updatedPersona : p));
    setEditPersonaOpen(false);
    setEditingPersona(null);
  };

  const handleRagDocumentUpload = (document: any) => {
    setRagDocuments(prev => [...prev, document]);
  };

  const handleRagDocumentDelete = (documentId: string) => {
    setRagDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  // Fetch project personas when the component mounts
  useEffect(() => {
    const fetchProjectPersonas = async () => {
      setIsLoadingPersonas(true);
      try {
        const response = await fetch(`/api/projects/${project.id}/personas`);
        if (!response.ok) {
          throw new Error('Failed to fetch personas');
        }
        const data = await response.json();
        setProjectPersonas(data.personas || []);
      } catch (error) {
        console.error('Error fetching project personas:', error);
        toast({
          title: "Error",
          description: "Failed to load personas",
          variant: "destructive",
        });
      } finally {
        setIsLoadingPersonas(false);
      }
    };

    const fetchProjectSimulations = async () => {
      try {
        const response = await fetch(`/api/projects/${project.id}/simulations`);
        if (!response.ok) {
          throw new Error('Failed to fetch simulations');
        }
        const data = await response.json();
        console.log('data111', data);
        setSimulations(data.projectSimulations || []);
      } catch (error) {
        console.error('Error fetching project simulations:', error);
        toast({
          title: "Error",
          description: "Failed to load simulations",
          variant: "destructive",
        });
      } 
    };

    fetchProjectPersonas();
    fetchProjectSimulations();
  }, [project.id, toast]);

  const handleGeneratePersonasFromBrief = async () => {
    if (!project.brief_text) {
      toast({
        title: "Error",
        description: "Please add a brief first to generate personas",
        variant: "destructive",
      });
      return;
    }
if(!project.brief_text){
  toast({
    title: "Error",
    description: "Please add a brief first to generate personas",
    variant: "destructive",
  });
  return;
}
    setIsGeneratingPersonas(true);
    try {
      const prompt = createBriefPersonaGenerationPrompt(project);
      const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: prompt }
      ];
      const result = await runSimulationAPI(messages, 'gpt-4o-mini', 'persona-generation');

      try {
        let responseText = result.reply || "";
        responseText = responseText
          .replace(/^```[\s\S]*?\n/, '')
          .replace(/```$/, '')
          .trim();

        const parsedResponse = JSON.parse(responseText);
        const generatedPersonas = parsedResponse.personas || [];
        console.log('generatedPersonas111', generatedPersonas)
        // Save the generated personas
        const response = await fetch(`/api/projects/${project.id}/personas`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ personas: generatedPersonas }),
        });

        if (!response.ok) {
          throw new Error('Failed to save personas');
        }

        const data = await response.json();
        setProjectPersonas(data.personas);
        
        toast({
          title: "Success",
          description: `Generated ${generatedPersonas.length} personas`,
        });
      } catch (error) {
        console.error("Error parsing personas:", error);
        toast({
          title: "Error",
          description: "Failed to parse generated personas",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating personas:", error);
      toast({
        title: "Error",
        description: "Failed to generate personas",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPersonas(false);
    }
  };
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
          <TabsTrigger value="ai-brief">AI Brief Assistant</TabsTrigger>
          <TabsTrigger value="discussion">Discussion Guide</TabsTrigger>
          <TabsTrigger value="rag">RAG</TabsTrigger>
          <TabsTrigger value="personas">Personas</TabsTrigger>
          <TabsTrigger value="studies">Simulations</TabsTrigger>
          <TabsTrigger value="interviews">Human Interviews</TabsTrigger>
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

        <TabsContent value="ai-brief" className="space-y-4">
          <AIBriefAssistant 
            projectId={project.id}
            onBriefGenerated={(brief) => {
              setEditedProject({ ...editedProject, brief_text: brief });
              toast({
                title: "Brief Generated",
                description: "The AI-generated brief has been added to your project. You can edit it in the Brief tab.",
              });
            }}
          />
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
                                  project.brief_text || '',
                                );
                                console.log('prompt111', prompt);
                                const messages: ChatCompletionMessageParam[] = [
                                  { role: "system", content: prompt }
                                ];
                                const result = await runSimulationAPI(messages, 'gpt-4o-mini', 'discussion-questions');

                                try {
                                  // Parse the JSON response
                                  let responseText = result.reply || "";
                                  console.log('responseText111', responseText);
                                  // Clean the response string (remove any markdown formatting)
                                  responseText = responseText
                                  .replace(/^```[\s\S]*?\n/, '')  // Remove starting ``` and optional language
                                  .replace(/```$/, '')            // Remove trailing ```
                                  .trim();
                                  
                                  // Parse the JSON
                                  const parsedResponse = JSON.parse(responseText);
                                  console.log('parsedResponse111', parsedResponse);
                                  // Extract questions array
                                  const questions = parsedResponse.questions || [];
                                  
                                  // Join questions as textarea value (one per line)
                                  setEditedProject(prev => ({
                                    ...prev,
                                    discussion_questions: questions
                                  }));
                                  
                                } catch (error) {
                                  console.error("Error parsing discussion questions JSON:", error);
                                  
                                  // Fallback: try to parse as the old numbered list format
                                  let questions = result.reply || "";
                                  questions = questions.replace(/```[a-z]*[\s\S]*?```/gi, '');
                                  let lines = questions.split(/\n|\r/).map(l => l.trim()).filter(Boolean);
                                  lines = lines.map(l => l.replace(/^\d+\.?\s*/, ""));
                                  console.log('lines111', lines);
                                  setEditedProject(prev => ({
                                    ...prev,
                                    discussion_questions: lines
                                  }));
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
                value={editedProject.discussion_questions?.join('\n') || ''}
                onChange={(e) => setEditedProject({ ...editedProject, discussion_questions: e.target.value.split('\n').filter(Boolean) })}
                className="w-full mt-1 min-h-[400px] p-2 border rounded-md"
                placeholder="Enter discussion questions..."
              />
            ) : (
              <div className="mt-1 whitespace-pre-wrap">
                {project.discussion_questions?.join('\n') || 'No discussion guide added'}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rag" className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-500">RAG Documents</label>
            <p className="text-sm text-gray-400 mt-1">
              Upload and manage documents for retrieval-augmented generation
            </p>
          </div>
          
          <RagDocumentUpload 
            projectId={project.id}
            onUploadSuccess={handleRagDocumentUpload}
          />
          
          <RagDocumentList 
            documents={ragDocuments}
            onDelete={handleRagDocumentDelete}
          />
        </TabsContent>

        <TabsContent value="personas">
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button
                variant="default"
                onClick={handleGeneratePersonasFromBrief}
                disabled={isGeneratingPersonas || !project.brief_text}
                className="flex items-center gap-2"
              >
                {isGeneratingPersonas ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Personas
                  </>
                )}
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {isLoadingPersonas ? (
                <div className="col-span-full flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <>
                  {projectPersonas.map((persona) => (
                    <PersonaCard
                      key={persona.id}
                      persona={{ ...persona, editable: true }}
                      selected={false}
                      onToggle={() => {}}
                      selectable={false}
                      onUpdate={(updatedPersona) => {
                        setProjectPersonas(prev => prev.map(p => p.id === updatedPersona.id ? updatedPersona : p));
                      }}
                    />
                  ))}
                  {projectPersonas.length === 0 && !isGeneratingPersonas && (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      No personas generated yet. Click "Generate Personas" to create personas based on your brief.
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Edit Persona Dialog */}
            <CreatePersonaDialog
              open={editPersonaOpen}
              onOpenChange={setEditPersonaOpen}
              onSuccess={handleEditPersonaSuccess}
              initialData={editingPersona}
              mode="edit"
              hideTrigger={true}
            />
          </div>
        </TabsContent>

        <TabsContent value="studies">
          <StudyList project={project} simulations={simulations} />
        </TabsContent>

        <TabsContent value="interviews">
          <HumanInterviewsTable projectId={project.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
