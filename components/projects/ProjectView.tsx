"use client"
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Project, Simulation, RagDocument } from "@/utils/types"
import { useToast } from "@/hooks/use-toast"
import StudyList from "./StudyList"
import HumanInterviewsTable from "./HumanInterviewsTable"
import ProjectMediaUpload from "./ProjectMediaUpload"
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
  const [editedProject, setEditedProject] = useState(project);
  const [projectPersonas, setProjectPersonas] = useState<any[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [isGeneratingPersonas, setIsGeneratingPersonas] = useState(false);
  const [isLoadingPersonas, setIsLoadingPersonas] = useState(false);
  const [editingPersona, setEditingPersona] = useState<any>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [hasNameChanged, setHasNameChanged] = useState(false);
  const [editPersonaOpen, setEditPersonaOpen] = useState(false);
  const [briefMode, setBriefMode] = useState<'manual' | 'ai' | null>(null);
  const [briefText, setBriefText] = useState(project.brief_text || '');
  const [isBriefModified, setIsBriefModified] = useState(false);
  const [isSavingBrief, setIsSavingBrief] = useState(false);
  const [projectMediaUrls, setProjectMediaUrls] = useState<string[]>(project.media_urls || []);
  const [ragDocuments, setRagDocuments] = useState<RagDocument[]>([]);
  const [processingDocuments, setProcessingDocuments] = useState<Set<string>>(new Set());

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

  const handleRagDocumentUpload = (document: RagDocument) => {
    setRagDocuments(prev => [...prev, document]);
  };

  const handleRagDocumentDelete = async (documentId: string) => {
    try {
      const response = await fetch(`/api/projects/${project.id}/rag/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete document');
      }

      setRagDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
      toast({
        title: "Document deleted",
        description: "Document has been deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const handleRagDocumentProcess = async (documentId: string) => {
    try {
      // Add to processing set
      setProcessingDocuments(prev => new Set(prev).add(documentId));

      const response = await fetch(`/api/projects/${project.id}/rag/documents/${documentId}/process`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process document');
      }

      const result = await response.json();
      
      toast({
        title: "Processing started",
        description: "Document processing has been initiated. This may take a few minutes.",
      });

      // Refresh documents to get updated status
      const refreshResponse = await fetch(`/api/projects/${project.id}/rag/documents`);
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setRagDocuments(refreshData.documents || []);
      }

    } catch (error: any) {
      console.error('Error processing document:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process document",
        variant: "destructive",
      });
    } finally {
      // Remove from processing set
      setProcessingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  // Update brief text when project changes
  useEffect(() => {
    setBriefText(project.brief_text || '');
  }, [project.brief_text]);

  // Update media URLs when project changes
  useEffect(() => {
    setProjectMediaUrls(project.media_urls || []);
  }, [project.media_urls]);

  // Fetch project personas when the component mounts
  useEffect(() => {
    const fetchProjectPersonas = async () => {
      setIsLoadingPersonas(true);
      try {
        const response = await fetch(`/api/projects/${project.id}/personas`);
        if (response.status === 404) {
          // No personas yet - normal for new projects
          setProjectPersonas([]);
        } else if (!response.ok) {
          // Actual server error
          console.error('Server error fetching personas:', response.status, response.statusText);
          toast({
            title: "Error",
            description: "Server error loading personas",
            variant: "destructive",
          });
        } else {
          const data = await response.json();
          setProjectPersonas(data.personas || []);
        }
      } catch (error) {
        // Network or other errors
        console.error('Network error fetching project personas:', error);
        toast({
          title: "Error",
          description: "Network error loading personas",
          variant: "destructive",
        });
      } finally {
        setIsLoadingPersonas(false);
      }
    };

    const fetchProjectSimulations = async () => {
      try {
        const response = await fetch(`/api/projects/${project.id}/simulations`);
        if (response.status === 404) {
          // No simulations yet - normal for new projects
          setSimulations([]);
        } else if (!response.ok) {
          // Actual server error
          console.error('Server error fetching simulations:', response.status, response.statusText);
          toast({
            title: "Error",
            description: "Server error loading simulations",
            variant: "destructive",
          });
        } else {
          const data = await response.json();
          console.log('data111', data);
          setSimulations(data.projectSimulations || []);
        }
      } catch (error) {
        // Network or other errors
        console.error('Network error fetching project simulations:', error);
        toast({
          title: "Error",
          description: "Network error loading simulations",
          variant: "destructive",
        });
      } 
    };

    const fetchRagDocuments = async () => {
      try {
        const response = await fetch(`/api/projects/${project.id}/rag/documents`);
        if (response.status === 404) {
          // No RAG documents yet - normal for new projects
          setRagDocuments([]);
        } else if (!response.ok) {
          // Actual server error - log more details
          const errorText = await response.text();
          console.error('Server error fetching RAG documents:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });
          toast({
            title: "Error",
            description: `Server error loading RAG documents (${response.status})`,
            variant: "destructive",
          });
        } else {
          const data = await response.json();
          setRagDocuments(data.documents || []);
        }
      } catch (error) {
        // Network or other errors
        console.error('Network error fetching RAG documents:', error);
        toast({
          title: "Error",
          description: "Network error loading RAG documents",
          variant: "destructive",
        });
      }
    };

    // Only fetch data if project.id exists
    if (project.id) {
      fetchProjectPersonas();
      fetchProjectSimulations();
      fetchRagDocuments();
    }
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

  const handleSaveBrief = async () => {
    setIsSavingBrief(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ brief_text: briefText }),
      });

      if (!response.ok) {
        throw new Error('Failed to update brief');
      }

      const updatedProject = await response.json();
      onUpdate?.(updatedProject);
      setIsBriefModified(false);
      
      toast({
        title: "Success",
        description: "Brief updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update brief",
        variant: "destructive",
      });
    } finally {
      setIsSavingBrief(false);
    }
  };


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-start mb-8">
        <div className="flex-1">
          <input
            type="text"
            value={editedProject.name}
            onChange={(e) => {
              setEditedProject({ ...editedProject, name: e.target.value });
              setHasNameChanged(e.target.value !== project.name);
            }}
            onFocus={() => setIsEditingName(true)}
            onBlur={() => {
              // Delay hiding the button to allow clicking on it
              setTimeout(() => setIsEditingName(false), 200);
            }}
            className="text-2xl font-bold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none w-full"
          />
        </div>
        {isEditingName && hasNameChanged && (
          <Button
            onClick={async () => {
              try {
                const response = await fetch(`/api/projects/${project.id}`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    name: editedProject.name
                  }),
                });

                if (response.ok) {
                  setHasNameChanged(false);
                  toast({
                    title: "Project Name Saved",
                    description: "Your project name has been saved.",
                  });
                } else {
                  throw new Error('Failed to save project name');
                }
              } catch (error) {
                console.error('Error saving project name:', error);
                toast({
                  title: "Error",
                  description: "Failed to save project name. Please try again.",
                  variant: "destructive",
                });
              }
            }}
            size="sm"
            className="ml-4"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Name
          </Button>
        )}
      </div>

      <Tabs defaultValue="brief" className="space-y-4">
        <TabsList>
          <TabsTrigger value="brief">Brief</TabsTrigger>
          <TabsTrigger value="discussion">Discussion Guide</TabsTrigger>
          <TabsTrigger value="rag">RAG</TabsTrigger>
          <TabsTrigger value="personas">Personas</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="studies">Simulations</TabsTrigger>
          <TabsTrigger value="interviews">Human Interviews</TabsTrigger>
        </TabsList>

        <TabsContent value="brief" className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Brief</label>
            
            {!briefMode ? (
              // Show option selection if no mode is selected
              <div className="mt-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div 
                    className="p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    onClick={() => setBriefMode('manual')}
                  >
                    <div className="text-center">
                      <FileIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold mb-2">I have a brief</h3>
                      <p className="text-gray-600">Add your own project brief manually</p>
                    </div>
                  </div>
                  
                  <div 
                    className="p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    onClick={() => setBriefMode('ai')}
                  >
                    <div className="text-center">
                      <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold mb-2">Generate with AI</h3>
                      <p className="text-gray-600">Use AI to help create your project brief</p>
                    </div>
                  </div>
                </div>
                
                {briefText && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Current Brief:</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{briefText}</p>
                    <div className="mt-3 flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setBriefMode('manual')}
                      >
                        Edit Brief
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setBriefMode('ai')}
                      >
                        Regenerate with AI
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : briefMode === 'manual' ? (
              // Show manual brief input
              <div className="mt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Manual Brief Input</h3>
                  <div className="flex gap-2">
                    {isBriefModified && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={handleSaveBrief}
                        disabled={isSavingBrief}
                      >
                        {isSavingBrief ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Brief
                          </>
                        )}
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setBriefMode(null)}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Options
                    </Button>
                  </div>
                </div>
                <textarea
                  value={briefText}
                  onChange={(e) => {
                    setBriefText(e.target.value);
                    setIsBriefModified(e.target.value !== (project.brief_text || ''));
                  }}
                  className="w-full min-h-[400px] p-2 border rounded-md"
                  placeholder="Enter project brief..."
                />
              </div>
            ) : (
              // Show AI Brief Assistant
              <div className="mt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">AI Brief Assistant</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setBriefMode(null)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Options
                  </Button>
                </div>
                <AIBriefAssistant 
                  projectId={project.id}
                  onBriefGenerated={(brief) => {
                    setBriefText(brief);
                    setEditedProject({ ...editedProject, brief_text: brief });
                    setIsBriefModified(true);
                    toast({
                      title: "Brief Generated",
                      description: "The AI-generated brief has been added to your project. You can edit it by switching to manual mode.",
                    });
                  }}
                />
              </div>
            )}
          </div>
        </TabsContent>


        <TabsContent value="discussion" className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Discussion Guide</label>

            <Button
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
              disabled={isGeneratingQuestions}
              variant="outline"
              size="sm"
              className="ml-2"
            >
              {isGeneratingQuestions ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate
                </>
              )}
            </Button>



            <div className="mt-4 space-y-2">
              <textarea
                value={editedProject.discussion_questions?.join('\n') || ''}
                onChange={(e) => setEditedProject({ ...editedProject, discussion_questions: e.target.value.split('\n').filter(Boolean) })}
                className="w-full min-h-[400px] p-2 border rounded-md"
                placeholder="Enter discussion questions..."
              />
              <div className="flex justify-end">
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/projects/${project.id}`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          discussion_questions: editedProject.discussion_questions
                        }),
                      });

                      if (response.ok) {
                        toast({
                          title: "Discussion Guide Saved",
                          description: "Your discussion guide has been saved.",
                        });
                      } else {
                        throw new Error('Failed to save discussion guide');
                      }
                    } catch (error) {
                      console.error('Error saving discussion guide:', error);
                      toast({
                        title: "Error",
                        description: "Failed to save discussion guide. Please try again.",
                        variant: "destructive",
                      });
                    }
                  }}
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Discussion Guide
                </Button>
              </div>
            </div>
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
            onProcess={handleRagDocumentProcess}
            processingDocuments={processingDocuments}
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

        <TabsContent value="media">
          <ProjectMediaUpload
            projectId={project.id}
            mediaUrls={projectMediaUrls}
            onMediaUpdate={setProjectMediaUrls}
          />
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
