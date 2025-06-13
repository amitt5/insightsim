"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { PersonaCard } from "@/components/persona-card"
import { ArrowLeft, ArrowRight, Upload, X, FileIcon, Sparkles, Loader2, HelpCircle } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { usePersonas } from "@/lib/usePersonas"
import { CreatePersonaDialog } from "@/components/create-persona-dialog"
import { getRandomSimulation } from "@/utils/mockSimulations"
import { Simulation, Persona, AIPersonaGeneration } from "@/utils/types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { v4 as uuidv4 } from 'uuid'
import { useToast } from "@/hooks/use-toast"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { runSimulationAPI } from "@/utils/api"
import { ChatCompletionMessageParam } from "openai/resources/index.mjs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createTitleGenerationPrompt, createPersonaGenerationPrompt } from "@/utils/buildMessagesForOpenAI";

export default function NewSimulationPage() {
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([])
  const [openPersonaModal, setOpenPersonaModal] = useState(false)
  const [hideSystemPersonas, setHideSystemPersonas] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<{[key: string]: string}>({})
  const [fileError, setFileError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [titleGenerationOpen, setTitleGenerationOpen] = useState(false)
  const [titleGenerationInput, setTitleGenerationInput] = useState('')
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false)
  const [studyTypeHelpOpen, setStudyTypeHelpOpen] = useState(false)
  const [simulationModeHelpOpen, setSimulationModeHelpOpen] = useState(false)
  const [aiPersonaAssistantOpen, setAiPersonaAssistantOpen] = useState(false)
  const [aiPersonaStep, setAiPersonaStep] = useState(1)
  const [aiPersonaData, setAiPersonaData] = useState<AIPersonaGeneration>({
    // Step 1: Product/Service Details
    problemSolved: '',
    competitors: '',
    // Step 2: Target Audience
    targetDescription: '',
    location: '',
    primaryGoals: '',
    frustrations: ''
  })
  const [generatedPersonas, setGeneratedPersonas] = useState<Persona[]>([])
  const [selectedGeneratedPersonas, setSelectedGeneratedPersonas] = useState<string[]>([])
  const [editingGeneratedPersona, setEditingGeneratedPersona] = useState<Persona | null>(null)
  const [editGeneratedPersonaOpen, setEditGeneratedPersonaOpen] = useState(false)

  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([])

  const [simulationData, setSimulationData] = useState({
    study_title: "",
    study_type: "focus-group",
    mode: "human-mod",
    topic: "",
    stimulus_media_url: [] as string[],
    discussion_questions: "",
    turn_based: false,
    num_turns: "10",
  });
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  
  const router = useRouter()
  const { personas, loading, error, mutate } = usePersonas()
  const supabase = createClientComponentClient();

  // Filter personas based on hideSystemPersonas state
  const filteredPersonas = hideSystemPersonas 
    ? personas.filter(persona => persona.editable === true)
    : personas;

  const togglePersona = (id: string) => {
    if(simulationData.study_type === 'focus-group') {
      setSelectedPersonas((prev) => (prev.includes(id) ? prev.filter((personaId) => personaId !== id) : [...prev, id]))
    } else { // in case of in-depth interview, we only need one participant
      setSelectedPersonas((prev) => (prev.includes(id) ? prev.filter((personaId) => personaId !== id) : [id]))
    }
  }

  const nextStep = () => {
    console.log('simulationData9', simulationData, selectedPersonas)
    setStep((prev) => Math.min(prev + 1, 4))
  }
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1))
  
  // Input change handlers
  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSimulationData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    // console.log('simulationData1', simulationData)
  };

  // Handle select changes
  const handleSelectChange = (field: string) => (value: string) => {
    setSimulationData(prev => ({
      ...prev,
      [field]: value
    }));
    console.log('simulationData2', simulationData)
  };

  // Handle switch change
  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSimulationData(prev => ({
      ...prev,
      turn_based: e.target.checked
    }));
    console.log('simulationData3', simulationData)
  };

  // Handle radio group change
  const handleRadioChange = (value: string) => {
    setSimulationData(prev => ({
      ...prev,
      mode: value
    }));
    console.log('simulationData4', simulationData)
  };

  // File handling functions
  const validateFile = (file: File): boolean => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setFileError('File type not supported. Please upload a PNG, JPG, or PDF file.');
      return false;
    }
    
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setFileError('File is too large. Maximum size is 10MB.');
      return false;
    }
    
    setFileError(null);
    return true;
  };

  // Handle file selection from input
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Process each file
    const newFiles: File[] = [];
    const newPreviews: {[key: string]: string} = {...previewUrls};
    
    Array.from(files).forEach(file => {
      if (validateFile(file)) {
        newFiles.push(file);
        
        // Create preview URL for images
        if (file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file);
          newPreviews[file.name] = url;
        }
      }
    });
    
    if (newFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...newFiles]);
      setPreviewUrls(newPreviews);
      
      // Update simulationData to indicate files are pending upload - just mark them as pending
      setSimulationData(prev => ({
        ...prev,
        stimulus_media_url: Array(selectedFiles.length + newFiles.length).fill('pending_upload'),
      }));
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    // Process each dropped file
    const newFiles: File[] = [];
    const newPreviews: {[key: string]: string} = {...previewUrls};
    
    Array.from(files).forEach(file => {
      if (validateFile(file)) {
        newFiles.push(file);
        
        // Create preview URL for images
        if (file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file);
          newPreviews[file.name] = url;
        }
      }
    });
    
    if (newFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...newFiles]);
      setPreviewUrls(newPreviews);
      
      // Update simulationData with just one array
      setSimulationData(prev => ({
        ...prev,
        stimulus_media_url: Array(selectedFiles.length + newFiles.length).fill('pending_upload'),
      }));
    }
  };

  // Handle file removal
  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles(prevFiles => {
      const updatedFiles = [...prevFiles];
      const fileToRemove = updatedFiles[indexToRemove];
      
      // Remove the preview URL if exists
      if (previewUrls[fileToRemove.name]) {
        URL.revokeObjectURL(previewUrls[fileToRemove.name]);
        const newPreviews = {...previewUrls};
        delete newPreviews[fileToRemove.name];
        setPreviewUrls(newPreviews);
      }
      
      // Remove the file from the array
      updatedFiles.splice(indexToRemove, 1);
      
      // Update simulationData - use single array
      const newMediaUrls = updatedFiles.length > 0 
        ? Array(updatedFiles.length).fill('pending_upload')
        : [];
      
      setSimulationData(prev => ({
        ...prev,
        stimulus_media_url: newMediaUrls,
      }));
      
      return updatedFiles;
    });
  };

  // Function to save simulation to database
  const saveSimulation = async () => {
    try {
      setIsUploading(true);
      const mediaUrls: string[] = [];
      
      // If there are files selected, upload them first
      if (selectedFiles.length > 0) {
        // Upload each file and collect the URLs
        for (const file of selectedFiles) {
          // Create a unique file name to avoid collisions
          const fileExt = file.name.split('.').pop();
          const fileName = `${uuidv4()}.${fileExt}`;
          const filePath = `simulation-media/${fileName}`;
          
          // Upload the file to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('simulation-media')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });
            
          if (uploadError) {
            throw new Error(`Error uploading file ${file.name}: ${uploadError.message}`);
          }
          
          // Get the public URL for the uploaded file
          const { data: { publicUrl } } = supabase
            .storage
            .from('simulation-media')
            .getPublicUrl(filePath);
            
          // Add the URL to our array
          mediaUrls.push(publicUrl);
        }
        
        toast({
          title: "Files uploaded successfully",
          description: `${selectedFiles.length} file(s) have been uploaded and attached to the simulation.`,
          duration: 3000,
        });
      }
      
      // Parse discussion questions from text to array
      const discussionQuestionsArray = simulationData.discussion_questions
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => line.trim());

      // Call the API to create the simulation with the media URLs array
      const response = await fetch('/api/simulations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...simulationData,
          stimulus_media_url: mediaUrls, // Now this is the array directly (JSONB in database)
          discussion_questions: discussionQuestionsArray,
          num_turns: parseInt(simulationData.num_turns),
          personas: selectedPersonas,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error creating simulation:", data.error);
        toast({
          title: "Error",
          description: `Failed to create simulation: ${data.error}`,
          variant: "destructive",
          duration: 5000,
        });
        return;
      }

      if (data.error) {
        console.warn("Warning:", data.error);
        toast({
          title: "Warning",
          description: data.error,
          variant: "destructive",
          duration: 3000,
        });
      }

      // Navigate to the simulation detail page
      if (data.simulation) {
        router.push(`/simulations/${data.simulation.id}`);
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "An error occurred while creating the simulation.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePlayingAround = () => {
    const randomSimulation: any = getRandomSimulation();
    console.log('handlePlayingAround',randomSimulation);
    setSimulationData(randomSimulation);
  };

  // Function to build OpenAI prompt for discussion questions
  function buildDiscussionQuestionsPrompt(studyTitle: string, topic: string, studyType: 'focus-group' | 'idi' = 'focus-group') {
    const sessionType = studyType === 'idi' ? 'in-depth interview' : 'focus group discussion';
    
    return `You are an expert qualitative market researcher specializing in ${sessionType}s.
  
  Generate 6-8 strategic discussion questions for this research study:
  
  Study Title: "${studyTitle}"
  Topic/Context: "${topic}"
  Session Type: ${sessionType}
  
  Create questions that follow qualitative research best practices:
  - Use open-ended, exploratory language ("How", "What", "Why", "Describe", "Tell me about")
  - Progress from general to specific topics
  - Include both rational and emotional dimensions
  - Encourage storytelling and personal experiences
  - Avoid leading or biased phrasing
  - Include at least one projective or hypothetical scenario question
  
  Return your response as a JSON object with the following structure:
  
  {
    "questions": [
      "Question 1 text here",
      "Question 2 text here",
      "Question 3 text here"
    ]
  }
  
  Format each question as a moderator would naturally ask it in the session. Return only valid JSON with no additional text or explanations.`.trim();
  }

  
  

  // Handle title generation
  const handleGenerateTitles = async () => { 
    // For now, just show the hardcoded suggestions
    const prompt = createTitleGenerationPrompt(titleGenerationInput);

    console.log('prompt111', prompt);
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: prompt }
    ];
    const result = await runSimulationAPI(messages);

    try {
      // Parse the JSON response
      let responseText = result.reply || "";
      console.log('titles111', responseText);
      
      // Clean the response string (remove any markdown formatting)
      responseText = responseText
      .replace(/^```[\s\S]*?\n/, '')  // Remove starting ``` and optional language
      .replace(/```$/, '')            // Remove trailing ```
      .trim();
      
      // Parse the JSON
      const parsedResponse = JSON.parse(responseText);
      
      // Extract questions array
      const titles = parsedResponse.titles || [];
      console.log('titles222', titles);
      setTitleSuggestions(titles);
      // Join questions as textarea value (one per line)
      // setSimulationData(prev => ({
      //   ...prev,
      //   discussion_questions: questions.join("\n")
      // }));
      
    } catch (error) {
      console.error("Error parsing discussion questions JSON:", error);
      
      // Fallback: try to parse as the old numbered list format
      // let questions = result.reply || "";
      // questions = questions.replace(/```[a-z]*[\s\S]*?```/gi, '');
      // let lines = questions.split(/\n|\r/).map(l => l.trim()).filter(Boolean);
      // lines = lines.map(l => l.replace(/^\d+\.?\s*/, ""));
      // console.log('lines111', lines);
      // setSimulationData(prev => ({
      //   ...prev,
      //   discussion_questions: lines.join("\n")
      // }));
    }


    setShowTitleSuggestions(true);
  };

  const handleSelectTitle = (title: string) => {
    setSimulationData(prev => ({
      ...prev,
      study_title: title
    }));
    setTitleGenerationOpen(false);
    setShowTitleSuggestions(false);
    setTitleGenerationInput('');
  };

  const handleCloseTitleDialog = () => {
    setTitleGenerationOpen(false);
    setShowTitleSuggestions(false);
    setTitleGenerationInput('');
  };

  const handleStudyTypeSelection = (studyType: 'focus-group' | 'idi') => {
    setSimulationData(prev => ({
      ...prev,
      study_type: studyType
    }));
    setStudyTypeHelpOpen(false);
  };

  const handleSimulationModeSelection = (mode: 'human-mod' | 'ai-both') => {
    setSimulationData(prev => ({
      ...prev,
      mode: mode
    }));
    setSimulationModeHelpOpen(false);
  };

  // AI Persona Assistant handlers
  const handleAiPersonaInputChange = (field: string, value: string) => {
    setAiPersonaData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAiPersonaNext = () => {
    if (aiPersonaStep < 7) {
      setAiPersonaStep(prev => prev + 1);
    }
  };

  const handleAiPersonaBack = () => {
    if (aiPersonaStep > 1) {
      setAiPersonaStep(prev => prev - 1);
    }
  };

  const handleAiPersonaClose = () => {
    setAiPersonaAssistantOpen(false);
    setAiPersonaStep(1);
    setAiPersonaData({
      problemSolved: '',
      competitors: '',
      targetDescription: '',
      location: '',
      primaryGoals: '',
      frustrations: ''
    });
  };

  // Question validation logic
  const getQuestionValidation = (step: number) => {
    switch (step) {
      case 1: // Problem solved (mandatory)
        return {
          isValid: aiPersonaData.problemSolved.trim() !== '',
          isMandatory: true
        };
      case 2: // Competitors (optional)
        return {
          isValid: true,
          isMandatory: false
        };
      case 3: // Target description (mandatory)
        return {
          isValid: aiPersonaData.targetDescription.trim() !== '',
          isMandatory: true
        };
      case 4: // Location (mandatory)
        return {
          isValid: aiPersonaData.location.trim() !== '',
          isMandatory: true
        };
      case 5: // Primary goals (optional)
        return {
          isValid: true,
          isMandatory: false
        };
      case 6: // Frustrations (optional)
        return {
          isValid: true,
          isMandatory: false
        };
      default:
        return {
          isValid: true,
          isMandatory: false
        };
    }
  };

  // Get stage info
  const getStageInfo = (step: number) => {
    if (step <= 2) {
      return {
        stage: 1,
        stageTitle: "The Brief",
        questionNumber: step,
        totalQuestions: 2
      };
    } else if (step <= 6) {
      return {
        stage: 2,
        stageTitle: "Persona Details",
        questionNumber: step - 2,
        totalQuestions: 4
      };
    } else {
      return {
        stage: 3,
        stageTitle: "Generate Personas",
        questionNumber: 1,
        totalQuestions: 1
      };
    }
  };

  // Generate personas (for now, use hardcoded data)
  const handleGeneratePersonas = async () => {
    // call createPersonaGenerationPrompt passing the aiPersonaData
    const prompt = createPersonaGenerationPrompt(aiPersonaData);
    console.log('prompt333', prompt);
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: prompt }
    ];
    const result = await runSimulationAPI(messages);

    try {
      // Parse the JSON response
      let responseText = result.reply || "";
      console.log('personas111', responseText);
      
      // Clean the response string (remove any markdown formatting)
      responseText = responseText
      .replace(/^```[\s\S]*?\n/, '')  // Remove starting ``` and optional language
      .replace(/```$/, '')            // Remove trailing ```
      .trim();
      
      // Parse the JSON
      const parsedResponse = JSON.parse(responseText);
      
      // Extract personas array and add unique IDs
      const AiGeneratedPersonas = (parsedResponse.personas || []).map((persona: any, index: number) => ({
        ...persona,
        id: persona.id || `generated-${Date.now()}-${index}`, // Ensure unique ID
        editable: true // Make them editable
      }));
      console.log('personas222', AiGeneratedPersonas);
      setGeneratedPersonas(AiGeneratedPersonas);
      setAiPersonaStep(7);
    } catch (error) {
      console.error("Error parsing discussion questions JSON:", error);
      
    }
    // set the generated personas to the parsed result
  };

  // Toggle persona selection
  const toggleGeneratedPersona = (id: string) => {
    setSelectedGeneratedPersonas(prev => 
      prev.includes(id) 
        ? prev.filter(personaId => personaId !== id)
        : [...prev, id]
    );
  };

  // Handle editing a generated persona
  const handleEditGeneratedPersona = (persona: Persona) => {
    setEditingGeneratedPersona(persona);
    setEditGeneratedPersonaOpen(true);
  };

  // Handle successful edit of generated persona
  const handleEditGeneratedPersonaSuccess = (updatedPersona: Persona) => {
    // Update the generated personas list with the edited persona
    setGeneratedPersonas(prev => 
      prev.map(p => p.id === updatedPersona.id ? updatedPersona : p)
    );
    setEditGeneratedPersonaOpen(false);
    setEditingGeneratedPersona(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Create New Simulation</h1>
      </div>

      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex justify-between">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  step >= i ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {i}
              </div>
              <span className="mt-2 text-xs text-gray-500">
                {i === 1 ? "Study Details" : i === 2 ? "Participants" : i === 3 ? "Discussion Guide" : "Summary"}
              </span>
            </div>
          ))}
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Study Details</CardTitle>
              <CardDescription>Set up the basic information for your simulation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

            <div className="space-y-2">
              {/* here add a button "playing around" and add description "This is a test simulation for playing around with the platform" */}
              <Button variant="default" onClick={handlePlayingAround}>Playing around</Button>
              <p className="text-sm text-gray-500">Click this button to play around with the platform. This will create a simulation with a predefined topic and discussion questions. You can then run the simulation and see the results. Clicking it again will create a new simulation with a new topic and discussion questions. You can always change the topic and discussion questions.</p>
            </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="studyTitle">Study Title</Label>
                  <Dialog open={titleGenerationOpen} onOpenChange={setTitleGenerationOpen}>
                    <DialogTrigger asChild>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="p-0 h-5 w-5 bg-transparent border-none cursor-pointer hover:bg-gray-100 rounded-full flex items-center justify-center"
                              onClick={() => setTitleGenerationOpen(true)}
                            >
                              <HelpCircle className="h-4 w-4 text-gray-500" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            Help me generate title
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Generate Study Title</DialogTitle>
                        <DialogDescription>
                          Tell us what you want to learn, and we'll suggest some titles for your study.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="titleInput">What is the main thing you want to learn in this study?</Label>
                          <Textarea
                            id="titleInput"
                            placeholder="e.g., I want to understand how consumers perceive our new eco-friendly packaging and whether it influences their purchase decisions..."
                            rows={4}
                            value={titleGenerationInput}
                            onChange={(e) => setTitleGenerationInput(e.target.value)}
                          />
                        </div>
                        {!showTitleSuggestions && (
                          <Button 
                            onClick={handleGenerateTitles}
                            disabled={!titleGenerationInput.trim()}
                            className="w-full"
                          >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate Title Suggestions
                          </Button>
                        )}
                        {showTitleSuggestions && (
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm">Choose a title:</h4>
                            <div className="space-y-2">
                              {titleSuggestions.map((title, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleSelectTitle(title)}
                                  className="w-full text-left p-3 rounded-md border border-gray-200 hover:border-primary hover:bg-gray-50 transition-colors"
                                >
                                  <span className="text-sm font-medium">{title}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={handleCloseTitleDialog}>
                          Cancel
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <Input 
                  id="studyTitle" 
                  placeholder="e.g., New Product Concept Testing" 
                  value={simulationData.study_title}
                  onChange={handleInputChange('study_title')}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="studyType">Study Type</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="p-0 h-5 w-5 bg-transparent border-none cursor-pointer hover:bg-gray-100 rounded-full flex items-center justify-center"
                          onClick={() => setStudyTypeHelpOpen(true)}
                        >
                          <HelpCircle className="h-4 w-4 text-gray-500" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        Help me choose study type
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select 
                  value={simulationData.study_type}
                  onValueChange={handleSelectChange('study_type')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select study type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="focus-group">Focus Group</SelectItem>
                    <SelectItem value="idi">In-Depth Interview</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Study Type Help Dialog */}
              <Dialog open={studyTypeHelpOpen} onOpenChange={setStudyTypeHelpOpen}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Choose Your Study Type</DialogTitle>
                    <DialogDescription>
                      How do you want to talk to your participants?
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <button
                      onClick={() => handleStudyTypeSelection('focus-group')}
                      className="w-full text-left p-4 rounded-md border border-gray-200 hover:border-primary hover:bg-gray-50 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="font-medium text-primary">Option A: Focus Group</div>
                        <div className="text-sm text-gray-600">
                          "I want to see how they interact and build on each other's ideas."
                        </div>
                        <div className="text-xs text-gray-500">
                          Best for exploring group dynamics, brainstorming, and seeing how participants influence each other's opinions.
                        </div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleStudyTypeSelection('idi')}
                      className="w-full text-left p-4 rounded-md border border-gray-200 hover:border-primary hover:bg-gray-50 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="font-medium text-primary">Option B: In-Depth Interview</div>
                        <div className="text-sm text-gray-600">
                          "I want to speak with them one-on-one for deep, personal insights."
                        </div>
                        <div className="text-xs text-gray-500">
                          Best for exploring personal experiences, sensitive topics, and getting detailed individual perspectives.
                        </div>
                      </div>
                    </button>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setStudyTypeHelpOpen(false)}>
                      Cancel
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Simulation Mode</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="p-0 h-5 w-5 bg-transparent border-none cursor-pointer hover:bg-gray-100 rounded-full flex items-center justify-center"
                          onClick={() => setSimulationModeHelpOpen(true)}
                        >
                          <HelpCircle className="h-4 w-4 text-gray-500" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        Help me choose simulation mode
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <RadioGroup 
                  value={simulationData.mode}
                  onValueChange={handleRadioChange}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="human-mod" id="human-mod" />
                    <Label htmlFor="human-mod">Human {simulationData.study_type === 'focus-group' ? 'Moderator' : 'Interviewer'} + AI {simulationData.study_type === 'focus-group' ? 'Participants' : 'Participant'} </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ai-both" id="ai-both" />
                    <Label htmlFor="ai-both">AI {simulationData.study_type === 'focus-group' ? 'Moderator' : 'Interviewer'} + AI {simulationData.study_type === 'focus-group' ? 'Participants' : 'Participant'} </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Simulation Mode Help Dialog */}
              <Dialog open={simulationModeHelpOpen} onOpenChange={setSimulationModeHelpOpen}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Choose Your Simulation Mode</DialogTitle>
                    <DialogDescription>
                      Who should run your {simulationData.study_type === 'focus-group' ? 'focus group' : 'interview'}?
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <button
                      onClick={() => handleSimulationModeSelection('human-mod')}
                      className="w-full text-left p-4 rounded-md border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-primary">✅ Recommended: Human {simulationData.study_type === 'focus-group' ? 'Moderator' : 'Interviewer'}</div>
                        </div>
                        <div className="text-sm text-gray-600">
                          You guide the conversation while AI participants respond naturally.
                        </div>
                        <div className="text-xs text-gray-500">
                          <strong>Better results:</strong> You control the flow, ask follow-ups, and dig deeper into interesting responses. Don't worry - we'll guide you through every step and it's incredibly simple!
                        </div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleSimulationModeSelection('ai-both')}
                      className="w-full text-left p-4 rounded-md border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="font-medium text-gray-700">AI {simulationData.study_type === 'focus-group' ? 'Moderator' : 'Interviewer'}</div>
                        <div className="text-sm text-gray-600">
                          Fully automated - AI runs the entire {simulationData.study_type === 'focus-group' ? 'focus group' : 'interview'}.
                        </div>
                        <div className="text-xs text-gray-500">
                          Good for quick insights, but you miss the opportunity to explore unexpected responses or ask spontaneous follow-up questions.
                        </div>
                      </div>
                    </button>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSimulationModeHelpOpen(false)}>
                      Cancel
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

            </CardContent>
            <CardFooter className="justify-end">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button onClick={nextStep}
                        disabled={!simulationData.study_title}>
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!simulationData.study_title && (
                    <TooltipContent side="top">
                      Add a study title to proceed
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </CardFooter>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Select {simulationData.study_type === 'focus-group' ? 'Participants' : 'Participant'}</CardTitle>
              <CardDescription>Choose AI personas to participate in your simulation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex justify-end gap-2">
                <Button
                  variant="default"
                  onClick={() => setAiPersonaAssistantOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate Personas
                </Button>
                <CreatePersonaDialog
                  open={openPersonaModal}
                  onOpenChange={setOpenPersonaModal}
                  onHideSystemPersonasChange={setHideSystemPersonas}
                  hideSystemPersonas={hideSystemPersonas}
                  onSuccess={mutate}
                  variant="outline"
                />
              </div>

              {/* AI Persona Assistant Dialog - Placeholder for now */}
              <Dialog open={aiPersonaAssistantOpen} onOpenChange={setAiPersonaAssistantOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      AI Persona Assistant
                    </DialogTitle>
                    <DialogDescription>
                      {(() => {
                        const stageInfo = getStageInfo(aiPersonaStep);
                        if (aiPersonaStep <= 6) {
                          return `Step ${stageInfo.stage} of 3: ${stageInfo.stageTitle} (Question ${stageInfo.questionNumber} of ${stageInfo.totalQuestions})`;
                        } else {
                          return 'Step 3 of 3: Generated Personas';
                        }
                      })()}
                    </DialogDescription>
                    {/* Progress Indicator */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(aiPersonaStep / 7) * 100}%` }}
                      ></div>
                    </div>
                  </DialogHeader>

                  <div className="space-y-6 py-6">
                    {/* Step 1: Problem Solved (Mandatory) */}
                    {aiPersonaStep === 1 && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="problemSolved" className="text-base font-medium">
                            You mentioned your study is about "{simulationData.study_title || 'your product/service'}". In a sentence or two, what problem does this product solve for people?
                          </Label>
                          <Textarea
                            id="problemSolved"
                            placeholder="e.g., Our fitness app helps busy professionals stay consistent with their workout routines by providing quick 15-minute exercises they can do anywhere..."
                            rows={4}
                            value={aiPersonaData.problemSolved}
                            onChange={(e) => handleAiPersonaInputChange('problemSolved', e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {/* Step 2: Competitors (Optional) */}
                    {aiPersonaStep === 2 && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="competitors" className="text-base font-medium">
                            Who are your main competitors, if any? <span className="text-gray-500 font-normal">(Optional)</span>
                          </Label>
                          <Textarea
                            id="competitors"
                            placeholder="e.g., Nike Training Club, Peloton Digital, Fitbit Premium, or 'No direct competitors that I know of'..."
                            rows={3}
                            value={aiPersonaData.competitors}
                            onChange={(e) => handleAiPersonaInputChange('competitors', e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {/* Step 3: Target Description (Mandatory) */}
                    {aiPersonaStep === 3 && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="targetDescription" className="text-base font-medium">
                            Describe the person you imagine using your product. Don't worry about getting it perfect, just give me a general idea.
                          </Label>
                          <Textarea
                            id="targetDescription"
                            placeholder="e.g., Working professionals in their 30s who care about staying fit but struggle to find time for long gym sessions..."
                            rows={3}
                            value={aiPersonaData.targetDescription}
                            onChange={(e) => handleAiPersonaInputChange('targetDescription', e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {/* Step 4: Location (Mandatory) */}
                    {aiPersonaStep === 4 && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="location" className="text-base font-medium">
                            Where do they live? (e.g., Urban cities in the US, suburbs in the UK)
                          </Label>
                          <Input
                            id="location"
                            placeholder="e.g., Major cities across North America, London and Manchester UK..."
                            value={aiPersonaData.location}
                            onChange={(e) => handleAiPersonaInputChange('location', e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {/* Step 5: Primary Goals (Optional) */}
                    {aiPersonaStep === 5 && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="primaryGoals" className="text-base font-medium">
                            What are their primary goals or what are they trying to achieve that your product could help with? <span className="text-gray-500 font-normal">(Optional)</span>
                          </Label>
                          <Textarea
                            id="primaryGoals"
                            placeholder="e.g., Stay healthy and fit, maintain energy throughout the day, reduce stress, look good for special events..."
                            rows={3}
                            value={aiPersonaData.primaryGoals}
                            onChange={(e) => handleAiPersonaInputChange('primaryGoals', e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {/* Step 6: Frustrations (Optional) */}
                    {aiPersonaStep === 6 && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="frustrations" className="text-base font-medium">
                            What are their biggest frustrations or challenges related to this goal? <span className="text-gray-500 font-normal">(Optional)</span>
                          </Label>
                          <Textarea
                            id="frustrations"
                            placeholder="e.g., Not enough time for hour-long gym sessions, intimidated by crowded gyms, lack of consistency, not knowing which exercises are effective..."
                            rows={3}
                            value={aiPersonaData.frustrations}
                            onChange={(e) => handleAiPersonaInputChange('frustrations', e.target.value)}
                          />
                        </div>

                        {/* Generate Personas Button */}
                        <div className="pt-4">
                          <Button 
                            onClick={handleGeneratePersonas}
                            className="w-full"
                          >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate Personas
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Step 7: Generated Personas */}
                    {aiPersonaStep === 7 && (
                      <div className="space-y-4">
                        <div className="text-center mb-6">
                          <h3 className="text-lg font-semibold mb-2">Generated Personas</h3>
                          <p className="text-sm text-gray-600">Select the personas you'd like to use in your simulation</p>
                        </div>

                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {generatedPersonas.map((persona) => (
                            <div key={persona.id} className="relative border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                              {/* Selection Checkbox */}
                              <div className="absolute top-3 right-3">
                                <input
                                  type="checkbox"
                                  id={`persona-${persona.id}`}
                                  checked={selectedGeneratedPersonas.includes(persona.id)}
                                  onChange={() => toggleGeneratedPersona(persona.id)}
                                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                              </div>

                              {/* Persona Header */}
                              <div className="pr-8 mb-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-base">
                                    {persona.name}, {persona.age}{persona.gender?.charAt(0)}, {persona.occupation}
                                  </h4>
                                </div>
                                <div className="text-sm text-primary font-medium mb-2">
                                  {persona.archetype}
                                </div>
                              </div>

                              {/* Bio */}
                              <p className="text-sm text-gray-600 mb-3">
                                {persona.bio}
                              </p>

                              {/* Goal */}
                              <div className="mb-3">
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Goal:</span>
                                <p className="text-sm text-gray-700 mt-1">{persona.goal}</p>
                              </div>

                              {/* Traits */}
                              <div className="mb-4">
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Key Traits:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {persona.traits?.map((trait: string, index: number) => (
                                    <span key={index} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                                      {trait}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Edit/View Details Button */}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleEditGeneratedPersona(persona)}
                              >
                                Edit / View Details
                              </Button>
                            </div>
                          ))}
                        </div>

                        {selectedGeneratedPersonas.length > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                            <p className="text-sm text-blue-700">
                              {selectedGeneratedPersonas.length} persona{selectedGeneratedPersonas.length !== 1 ? 's' : ''} selected
                            </p>
                          </div>
                        )}

                        {/* Edit Generated Persona Dialog */}
                        <CreatePersonaDialog
                          open={editGeneratedPersonaOpen}
                          onOpenChange={setEditGeneratedPersonaOpen}
                          onSuccess={handleEditGeneratedPersonaSuccess}
                          initialData={editingGeneratedPersona || undefined}
                          mode="edit"
                          hideTrigger={true}
                          variant="default"
                          isGeneratedPersona={true}
                        />
                      </div>
                    )}
                  </div>

                  <DialogFooter className="flex justify-between">
                    <div className="flex gap-2">
                      {aiPersonaStep > 1 && (
                        <Button variant="outline" onClick={handleAiPersonaBack}>
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back
                        </Button>
                      )}
                      <Button variant="outline" onClick={handleAiPersonaClose}>
                        Cancel
                      </Button>
                    </div>
                    
                    <div>
                      {aiPersonaStep < 6 && (
                        <Button 
                          onClick={handleAiPersonaNext}
                          disabled={!getQuestionValidation(aiPersonaStep).isValid}
                        >
                          Next
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                      {aiPersonaStep === 7 && (
                        <Button 
                          disabled={selectedGeneratedPersonas.length === 0}
                          onClick={() => {
                            // TODO: Add selected personas to main personas list
                            console.log('Selected personas:', selectedGeneratedPersonas);
                            handleAiPersonaClose();
                          }}
                        >
                          Add Selected Personas
                          <Sparkles className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading personas...</div>
              ) : error ? (
                <div className="p-4 text-center text-red-500">{error}</div>
              ) : (
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                  {filteredPersonas.map((persona) => (
                    <PersonaCard
                      key={persona.id}
                      persona={persona}
                      selected={selectedPersonas.includes(persona.id)}
                      onToggle={() => togglePersona(persona.id)}
                      selectable={true}
                      onUpdate={mutate}
                    />
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              {/* <Button onClick={nextStep}>
                Continue11
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button> */}

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button onClick={nextStep}
                        disabled={selectedPersonas.length === 0}>
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {(selectedPersonas.length === 0) && (
                    <TooltipContent side="top">
                      Select at least one participant to proceed
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </CardFooter>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Topic and Discussion Guide</CardTitle>
              <CardDescription>Set up the topic and questions for your simulation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic/Stimulus</Label>
                <Input 
                  id="topic" 
                  placeholder="e.g., New snack flavor launch" 
                  value={simulationData.topic}
                  onChange={handleInputChange('topic')}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Upload Media 
                  {fileError && <span className="text-red-500 text-xs ml-2">{fileError}</span>}
                </Label>
                <div 
                  className={`flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed ${
                    selectedFiles.length > 0 ? 'border-primary' : 'border-gray-300'
                  } hover:bg-gray-50 p-4`}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileSelect}
                    multiple
                  />
                  
                  {selectedFiles.length > 0 ? (
                    <div className="w-full space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{selectedFiles.length} file(s) selected</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            document.getElementById('file-upload')?.click();
                          }}
                        >
                          Add More
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <div className="flex items-center space-x-2">
                              {previewUrls[file.name] ? (
                                <img 
                                  src={previewUrls[file.name]} 
                                  alt={file.name} 
                                  className="h-8 w-8 object-cover rounded"
                                />
                              ) : (
                                <div className="h-8 w-8 flex items-center justify-center bg-primary/10 rounded">
                                  <FileIcon size={14} className="text-primary" />
                                </div>
                              )}
                              <span className="text-xs truncate max-w-[200px]">{file.name}</span>
                            </div>
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile(index);
                              }}
                              className="text-red-500 hover:text-red-700 text-xs flex items-center"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-2 text-center">
                      <Upload className="h-6 w-6 text-gray-400" />
                      <span className="text-sm text-gray-500">Click to upload or drag and drop</span>
                      <span className="text-xs text-gray-400">PNG, JPG, PDF up to 10MB</span>
                      <span className="text-xs text-gray-400">Select multiple files by holding Ctrl/Cmd</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="questions">Discussion Questions</Label>
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
                              const prompt = buildDiscussionQuestionsPrompt(
                                simulationData.study_title,
                                simulationData.topic,
                              );
                              console.log('prompt111', prompt);
                              const messages: ChatCompletionMessageParam[] = [
                                { role: "system", content: prompt }
                              ];
                              const result = await runSimulationAPI(messages);

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
                                setSimulationData(prev => ({
                                  ...prev,
                                  discussion_questions: questions.join("\n")
                                }));
                                
                              } catch (error) {
                                console.error("Error parsing discussion questions JSON:", error);
                                
                                // Fallback: try to parse as the old numbered list format
                                let questions = result.reply || "";
                                questions = questions.replace(/```[a-z]*[\s\S]*?```/gi, '');
                                let lines = questions.split(/\n|\r/).map(l => l.trim()).filter(Boolean);
                                lines = lines.map(l => l.replace(/^\d+\.?\s*/, ""));
                                console.log('lines111', lines);
                                setSimulationData(prev => ({
                                  ...prev,
                                  discussion_questions: lines.join("\n")
                                }));
                              }

  
                
                              // const result = await runSimulationAPI(messages);
                              // Parse the response: expect a numbered list
                              // let questions = result.reply || "";
                              // // Remove markdown, trim, etc.
                              // questions = questions.replace(/```[a-z]*[\s\S]*?```/g, "").trim();
                              // // If it's a numbered list, split into lines
                              // let lines = questions.split(/\n|\r/).map(l => l.trim()).filter(Boolean);
                              // // Remove leading numbers if present
                              // lines = lines.map(l => l.replace(/^\d+\.?\s*/, ""));
                              // // Join as textarea value (one per line)
                              // setSimulationData(prev => ({
                              //   ...prev,
                              //   discussion_questions: lines.join("\n")
                              // }));
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
                </div>
                <Textarea
                  id="questions"
                  placeholder="Enter your discussion questions here..."
                  rows={5}
                  value={simulationData.discussion_questions}
                  onChange={handleInputChange('discussion_questions')}
                />
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={nextStep}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Simulation Summary</CardTitle>
              {/* <CardDescription>Configure how your simulation will run</CardDescription> */}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* <div className="flex items-center justify-between">
                <Label htmlFor="turn-based">Turn-based simulation</Label>
                <Switch 
                  id="turn-based" 
                  checked={simulationData.turn_based}
                  onCheckedChange={(checked) => 
                    setSimulationData(prev => ({ ...prev, turn_based: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="turns">Number of turns</Label>
                <Select 
                  value={simulationData.num_turns}
                  onValueChange={handleSelectChange('num_turns')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select number of turns" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 turns</SelectItem>
                    <SelectItem value="10">10 turns</SelectItem>
                    <SelectItem value="15">15 turns</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}

              {/* <div className="rounded-md bg-gray-50 p-4"> */}
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>Study Type: {simulationData.study_type === 'focus-group' ? 'Focus Group' : 'In-Depth Interview'}</li>
                  <li>Study mode: {simulationData.mode === 'ai-both' ? 'AI' : 'Human'}</li>
                  <li>Mode: {
                  (simulationData.mode === 'ai-both' ? 
                  'AI ' + (simulationData.study_type === 'focus-group' ? 'Moderator' : 'Interviewer') 
                  : 
                  'Human ' + (simulationData.study_type === 'focus-group' ? 'Moderator' : 'Interviewer') )
                  + 
                  ' + AI ' + (simulationData.study_type === 'focus-group' ? 'Participants' : 'Participant')
                  // + ' + AI' + simulationData.study_type === 'focus-group' ? 'Participants' : 'Participant' : 'Human' + simulationData.study_type === 'focus-group' ? 'Moderator' : 'Interviewer' + ' + AI' + simulationData.study_type === 'focus-group' ? 'Participants' : 'Participant'
                  }
                  </li>
                  <li>Participants: {selectedPersonas.length} selected</li>
                  <li>Topic: {simulationData.topic || 'Not specified'}</li>
                  <li>Discussion Questions: {simulationData.discussion_questions}</li>
                </ul>
              {/* </div> */}
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={saveSimulation}
                disabled={!simulationData.study_title || selectedPersonas.length === 0 || isUploading}
              >
                {isUploading ? 'Uploading...' : 'Launch Simulation'}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}
