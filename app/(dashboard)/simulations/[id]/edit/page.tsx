"use client"

import { useState, useEffect, use } from "react"
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
import { uploadMultipleFilesToServer } from '@/utils/uploadApi'
import { validateFile, createFilePreview, revokeFilePreview } from '@/utils/fileUpload'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { runSimulationAPI } from "@/utils/api"
import { ChatCompletionMessageParam } from "openai/resources/index.mjs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createTitleGenerationPrompt,createBriefExtractionPrompt, createPersonaGenerationPrompt, buildDiscussionQuestionsPrompt, createBriefPersonaGenerationPrompt } from "@/utils/buildMessagesForOpenAI";
import { Badge } from "@/components/ui/badge"

export default function EditSimulationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params) 
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([])
  const [openPersonaModal, setOpenPersonaModal] = useState(false)
  const [hideSystemPersonas, setHideSystemPersonas] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<{[key: string]: string}>({})
  const [fileError, setFileError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({})
  const [isLoading, setIsLoading] = useState(true)
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
  const [isGeneratingPersonas, setIsGeneratingPersonas] = useState(false)
  const [isSavingPersonas, setIsSavingPersonas] = useState(false)

  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([])

  // Brief upload state
  const [briefUploadOpen, setBriefUploadOpen] = useState(false)
  const [briefText, setBriefText] = useState('')
  const [briefSource, setBriefSource] = useState<'upload' | 'playing-around' | null>(null)
  const [isProcessingBrief, setIsProcessingBrief] = useState(false)

  const [simulationData, setSimulationData] = useState({
    study_title: "",
    study_type: "focus-group",
    mode: "human-mod",
    topic: "",
    stimulus_media_url: [] as string[],
    discussion_questions: "",
    turn_based: false,
    num_turns: "10",
    brief_text: "",
    brief_source: null as 'upload' | 'playing-around' | null,
  });
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  
  const router = useRouter()
  const { personas, loading, error, mutate } = usePersonas()
  const supabase = createClientComponentClient();

  const [simulationStatus, setSimulationStatus] = useState<string>('Draft')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Load existing simulation data
  useEffect(() => {
    const loadSimulation = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/simulations/${id}`);
        if (response.ok) {
          const data = await response.json();
          const simulation = data.simulation;
          
          // Set simulation status
          setSimulationStatus(simulation.status || 'Draft');
          
          // Set the current step from active_step (default to 1 if not set)
          setStep(simulation.active_step || 1);
          
          // Data consistency checks
          const processedData = {
            study_title: simulation.study_title || "",
            study_type: simulation.study_type || "focus-group",
            mode: simulation.mode || "human-mod",
            topic: simulation.topic || "",
            stimulus_media_url: Array.isArray(simulation.stimulus_media_url) 
              ? simulation.stimulus_media_url 
              : [],
            discussion_questions: Array.isArray(simulation.discussion_questions) 
              ? simulation.discussion_questions.join('\n')
              : simulation.discussion_questions || "",
            turn_based: Boolean(simulation.turn_based),
            num_turns: simulation.num_turns?.toString() || "10",
            brief_text: simulation.brief_text || "",
            brief_source: simulation.brief_source || null,
          };

          // Validate num_turns is a valid number
          const numTurns = parseInt(processedData.num_turns);
          if (isNaN(numTurns) || numTurns < 1 || numTurns > 50) {
            processedData.num_turns = "10"; // Default fallback
          }

          // Populate simulation data
          setSimulationData(processedData);

          // Set selected personas with validation
          if (data.personas && data.personas.length > 0) {
            const personaIds = data.personas.map((p: any) => p.id);
            
            // Apply study type constraints
            if (processedData.study_type === 'idi' && personaIds.length > 1) {
              // For IDI, only keep the first persona
              setSelectedPersonas([personaIds[0]]);
              toast({
                title: "Participants adjusted",
                description: "In-depth interviews can only have 1 participant. Only the first participant was kept.",
                variant: "default",
              });
            } else if (processedData.study_type === 'focus-group' && personaIds.length > 8) {
              // For focus groups, limit to 8 participants
              setSelectedPersonas(personaIds.slice(0, 8));
              toast({
                title: "Participants adjusted",
                description: "Focus groups can have maximum 8 participants. Only the first 8 were kept.",
                variant: "default",
              });
            } else {
              setSelectedPersonas(personaIds);
            }
          }
        } else {
          toast({
            title: "Error",
            description: "Failed to load simulation",
            variant: "destructive",
          });
          router.push('/simulations');
        }
      } catch (error) {
        console.error('Error loading simulation:', error);
        toast({
          title: "Error", 
          description: "Failed to load simulation",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSimulation();
  }, [id, router, toast]);

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach(url => {
        if (url) {
          revokeFilePreview(url);
        }
      });
    };
  }, [previewUrls]);

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  // Auto-save function with retry logic
  const autoSave = async (isRetry = false) => {
    if (isLoading || (isSaving && !isRetry)) return; // Don't auto-save while initial loading or already saving (unless retry)
    
    try {
      setIsSaving(true);
      setSaveError(null);
      
      const questionsString = Array.isArray(simulationData.discussion_questions) 
      ? simulationData.discussion_questions.join('\n')
      : simulationData.discussion_questions;

      const response = await fetch(`/api/simulations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...simulationData,
          discussion_questions: questionsString
            ? questionsString.split('\n').filter(line => line.trim() !== '')
            : [],
          num_turns: parseInt(simulationData.num_turns),
          personas: selectedPersonas,
          active_step: step, // Include current step in auto-save
        }),
      });

      if (response.ok) {
        setLastSaved(new Date());
        setRetryCount(0); // Reset retry count on success
      } else {
        throw new Error(`Save failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      setSaveError('Failed to save changes');
      
      // Retry logic - up to 3 attempts
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          autoSave(true);
        }, 1000 * (retryCount + 1)); // Exponential backoff
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Manual retry function
  const retryAutoSave = () => {
    setRetryCount(0);
    autoSave(true);
  };

  // Debounced auto-save function
  const debouncedAutoSave = () => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    const timeout = setTimeout(() => {
      autoSave();
    }, 2000); // Auto-save 2 seconds after user stops typing
    
    setAutoSaveTimeout(timeout);
  };

  // Filter personas based on hideSystemPersonas state
  const filteredPersonas = hideSystemPersonas 
    ? personas.filter(persona => persona.editable === true)
    : personas;

  const togglePersona = (id: string) => {
    if(simulationData.study_type === 'focus-group') {
      setSelectedPersonas((prev) => {
        const newSelection = prev.includes(id) ? prev.filter((personaId) => personaId !== id) : [...prev, id];
        // Trigger auto-save after state update
        setTimeout(() => autoSave(), 100);
        return newSelection;
      });
    } else { // in case of in-depth interview, we only need one participant
      setSelectedPersonas((prev) => {
        const newSelection = prev.includes(id) ? prev.filter((personaId) => personaId !== id) : [id];
        // Trigger auto-save after state update
        setTimeout(() => autoSave(), 100);
        return newSelection;
      });
    }
  }

  const nextStep = async () => {
    // If moving from step 3 to step 4, upload media files first
    console.log('amit-nextStep-selectedFiles', selectedFiles);
    if (step === 3 && selectedFiles.length > 0) {
      try {
        setIsUploading(true);
        const mediaUrls = await uploadMedia();
        console.log('amit-nextStep-mediaUrls', mediaUrls);
        console.log('amit-nextStep-simulationData', simulationData.stimulus_media_url);
        // Update simulation data with uploaded URLs
        setSimulationData(prev => ({
          ...prev,
          stimulus_media_url: [...getStimulusUrlsAsArray(prev.stimulus_media_url).filter(url => url !== 'pending_upload'), ...mediaUrls]
        }));
        
        // Also save to database immediately
        await fetch(`/api/simulations/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...simulationData,
            stimulus_media_url: [...simulationData.stimulus_media_url.filter(url => url !== 'pending_upload'), ...mediaUrls],
            discussion_questions: simulationData.discussion_questions
              ? simulationData.discussion_questions.split('\n').filter(line => line.trim() !== '')
              : [],
            num_turns: parseInt(simulationData.num_turns),
            personas: selectedPersonas,
            active_step: step + 1,
          }),
        });
        
      } catch (error) {
        console.error('Error uploading media:', error);
        toast({
          title: "Upload Error",
          description: error instanceof Error ? error.message : "Failed to upload media files. Please try again.",
          variant: "destructive",
          duration: 5000,
        });
        return; // Don't proceed to next step if upload fails
      } finally {
        setIsUploading(false);
      }
    }
    
    const newStep = Math.min(step + 1, 4);
    setStep(newStep);
    saveActiveStep(newStep); // Save the new step to database
  }
  
  const prevStep = () => {
    const newStep = Math.max(step - 1, 1);
    setStep(newStep);
    saveActiveStep(newStep); // Save the new step to database
  }

  // Function to upload media files
  const uploadMedia = async (): Promise<string[]> => {
    const mediaUrls: string[] = [];
    
    // If there are files selected, upload them first
    if (selectedFiles.length > 0) {
      setUploadProgress({});
      const uploadResults = await uploadMultipleFilesToServer(
        selectedFiles,
        id, // simulation ID
        'simulation-media',
        (fileIndex, result) => {
          // Track upload progress
          setUploadProgress(prev => ({
            ...prev,
            [fileIndex]: result.success ? 100 : 0
          }));
          console.log(`File ${fileIndex + 1} upload result:`, result);
        }
      );
      
      // Check for upload errors
      const failedUploads = uploadResults.filter(result => !result.success);
      if (failedUploads.length > 0) {
        const errorMessages = failedUploads.map(result => result.error).join(', ');
        throw new Error(`Failed to upload ${failedUploads.length} file(s): ${errorMessages}`);
      }
      
      // Collect successful upload URLs
      uploadResults.forEach(result => {
        if (result.success && result.url) {
          mediaUrls.push(result.url);
        }
      });
      
      toast({
        title: "Files uploaded successfully",
        description: `${selectedFiles.length} file(s) have been uploaded and attached to the simulation.`,
        duration: 3000,
      });
      
      // Clear uploaded files after successful upload
      Object.values(previewUrls).forEach(url => {
        if (url) {
          revokeFilePreview(url);
        }
      });
      setSelectedFiles([]);
      setPreviewUrls({});
      setUploadProgress({});
    }
    
    return mediaUrls;
  };

  // Function to save simulation to database
  const saveSimulation = async () => {
    console.log('amit-saveSimulation', selectedFiles)
    try {
      setIsUploading(true);
      
      // Parse discussion questions from text to array if not already an array
      let discussionQuestionsArray = [];
      if (Array.isArray(simulationData.discussion_questions)) {
        discussionQuestionsArray = simulationData.discussion_questions;
      } else {
        discussionQuestionsArray = simulationData.discussion_questions
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => line.trim());
      }
      // Use existing media URLs (already uploaded in step 3)
      const finalMediaUrls = simulationData.stimulus_media_url;

      // Update the existing simulation (now we're editing, not creating)
      const response = await fetch(`/api/simulations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...simulationData,
          stimulus_media_url: finalMediaUrls,
          discussion_questions: discussionQuestionsArray,
          num_turns: parseInt(simulationData.num_turns),
          personas: selectedPersonas,
          status: 'Running', // Change status from Draft to Running when launching
          active_step: step, // Include current step
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error updating simulation:", data.error);
        toast({
          title: "Error",
          description: `Failed to update simulation: ${data.error}`,
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

      // Navigate to the simulation detail page (discussion window)
      router.push(`/simulations/${id}`);
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "An error occurred while updating the simulation.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsUploading(false);
    }
  };


  // Function to save active_step to database
  const saveActiveStep = async (activeStep: number) => {
    try {
      await fetch(`/api/simulations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          active_step: activeStep
        }),
      });
    } catch (error) {
      console.error('Error saving active step:', error);
      // Don't show error to user as this is background functionality
    }
  };

  // Input change handlers with debounced auto-save
  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSimulationData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    debouncedAutoSave(); // Trigger debounced auto-save
  };

  // Handle select changes with auto-save
  const handleSelectChange = (field: string) => (value: string) => {
    setSimulationData(prev => ({
      ...prev,
      [field]: value
    }));
    autoSave(); // Immediate auto-save for select changes
  };

  // Handle switch change
  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSimulationData(prev => ({
      ...prev,
      turn_based: e.target.checked
    }));
    console.log('simulationData3', simulationData)
  };

  // Handle radio group change with auto-save
  const handleRadioChange = (value: string) => {
    setSimulationData(prev => ({
      ...prev,
      mode: value
    }));
    autoSave(); // Immediate auto-save for radio changes
  };

  // File handling functions
  const validateAndProcessFile = (file: File): boolean => {
    const validation = validateFile(file);
    if (!validation.isValid) {
      setFileError(validation.error || 'File validation failed');
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
      if (validateAndProcessFile(file)) {
        newFiles.push(file);
        
        // Create preview URL for images using utility function
        const previewUrl = createFilePreview(file);
        if (previewUrl) {
          newPreviews[file.name] = previewUrl;
        }
      }
    });
    
    if (newFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...newFiles]);
      setPreviewUrls(newPreviews);
      
      // Update simulationData to indicate files are pending upload
      setSimulationData(prev => ({
        ...prev,
        stimulus_media_url: [
          ...(prev.stimulus_media_url || []),           // Preserve existing URLs
          ...Array(newFiles.length).fill('pending_upload')  // Add placeholders for new files only
        ]
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
      if (validateAndProcessFile(file)) {
        newFiles.push(file);
        
        // Create preview URL for images using utility function
        const previewUrl = createFilePreview(file);
        if (previewUrl) {
          newPreviews[file.name] = previewUrl;
        }
      }
    });
    
    if (newFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...newFiles]);
      setPreviewUrls(newPreviews);
      
      // Update simulationData with pending upload indicators
      setSimulationData(prev => ({
        ...prev,
        stimulus_media_url: [
          ...(prev.stimulus_media_url || []),           // Preserve existing URLs
          ...Array(newFiles.length).fill('pending_upload')  // Add placeholders for new files only
        ]
      }));
    }
  };

  // Handle file removal (for local files before upload)
  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles(prevFiles => {
      const updatedFiles = [...prevFiles];
      const fileToRemove = updatedFiles[indexToRemove];
      
      // Remove the preview URL if exists using utility function
      if (previewUrls[fileToRemove.name]) {
        revokeFilePreview(previewUrls[fileToRemove.name]);
        const newPreviews = {...previewUrls};
        delete newPreviews[fileToRemove.name];
        setPreviewUrls(newPreviews);
      }
      
      // Remove the file from the array
      updatedFiles.splice(indexToRemove, 1);
      
      // Update simulationData with correct array length
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

  // Handle removal of uploaded files
  const handleRemoveUploadedFile = async (urlToRemove: string) => {
    try {
      // Remove from simulation data
      const updatedUrls = simulationData.stimulus_media_url.filter(url => url !== urlToRemove);
      setSimulationData(prev => ({
        ...prev,
        stimulus_media_url: updatedUrls,
      }));

      // Save to database immediately
      await fetch(`/api/simulations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...simulationData,
          stimulus_media_url: updatedUrls,
          discussion_questions: simulationData.discussion_questions
            ? simulationData.discussion_questions.split('\n').filter(line => line.trim() !== '')
            : [],
          num_turns: parseInt(simulationData.num_turns),
          personas: selectedPersonas,
          active_step: step,
        }),
      });

      toast({
        title: "File removed",
        description: "The file has been removed from your simulation.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error removing file:', error);
      toast({
        title: "Error",
        description: "Failed to remove file. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // Extract filename from URL for display
  const getFileNameFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const segments = pathname.split('/');
      let filename = segments[segments.length - 1];
      
      // Remove UUID prefix if present (format: uuid.extension)
      const parts = filename.split('.');
      if (parts.length === 2 && parts[0].length === 36) {
        // This looks like a UUID, return a generic name
        return `uploaded-file.${parts[1]}`;
      }
      
      return filename || 'uploaded-file';
    } catch {
      return 'uploaded-file';
    }
  };

  // Check if a URL is an image
  const isImageUrl = (url: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return imageExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  // Helper function to ensure stimulus_media_url is always treated as an array
  const getStimulusUrlsAsArray = (urls: any) => {
    if (!urls) return [];
    return Array.isArray(urls) ? urls : [urls];
  };

  // Get uploaded files that aren't pending
  const getUploadedFiles = () => {
    const urls = getStimulusUrlsAsArray(simulationData.stimulus_media_url);
    return urls.filter(url => url !== 'pending_upload');
  };

  
  const handlePlayingAround = () => {
    const randomSimulation: any = getRandomSimulation();
    console.log('handlePlayingAround',randomSimulation);
    setSimulationData({
      ...randomSimulation,
      brief_text: "",
      brief_source: 'playing-around'
    });
    setBriefSource('playing-around');
  };

  // Brief upload handlers
  const handleBriefUpload = () => {
    setBriefUploadOpen(true);
  };

  const handleBriefTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBriefText(e.target.value);
  };

  const handleCloseBriefDialog = () => {
    setBriefUploadOpen(false);
    setBriefText('');
  };

  const handleGenerateFromBrief = async () => {
    if (!briefText.trim()) {
      toast({
        title: "Error",
        description: "Please enter your research brief first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingBrief(true);
    try {
      // For now, we'll just extract a simple title from the brief
      // Later this will be replaced with API call
      const prompt = createBriefExtractionPrompt(briefText);
      console.log('prompt111', prompt);
      const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: prompt }
      ];
      const result = await runSimulationAPI(messages);
      let title = '';
      let topic = '';
      let discussionQuestions = [];
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
        title = parsedResponse.title || '';
        topic = parsedResponse.topic || '';
        discussionQuestions = parsedResponse.questions || [];

        console.log('titles333',parsedResponse, title, topic);
        // setTitleSuggestions(titles);
        
      } catch (error) {
        console.error("Error parsing discussion questions JSON:", error);
      }


     
      // Update simulation data with extracted title and brief info
      const updatedData = {
        ...simulationData,
        study_title: title,
        topic: topic,
        brief_text: briefText,
        discussion_questions: discussionQuestions,
        brief_source: 'upload' as const
      };
      
      setSimulationData(updatedData);
      console.log('updatedData111', updatedData);
      // Save to database
      const response = await fetch(`/api/simulations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updatedData,
          // discussion_questions: updatedData.discussion_questions
          //   ? updatedData.discussion_questions.split('\n').filter(line => line.trim() !== '')
          //   : [],
          num_turns: parseInt(updatedData.num_turns),
          personas: selectedPersonas,
          active_step: step,
        }),
      });

      if (!response.ok) {
        throw new Error(`Save failed: ${response.status}`);
      }

      // Set brief source and close dialog
      setBriefSource('upload');
      setBriefUploadOpen(false);
      setLastSaved(new Date());
      
      toast({
        title: "Brief processed successfully",
        description: "Study title has been generated from your brief and saved. You can edit it if needed.",
      });

    } catch (error) {
      console.error('Error processing brief:', error);
      toast({
        title: "Error",
        description: "Failed to process brief. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingBrief(false);
    }
  };

 
  
  

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

  // Handle Generate Personas button click - checks if brief exists
  const handleGeneratePersonasClick = async () => {
    // Check if brief exists
    if (simulationData.brief_text && simulationData.brief_text.trim()) {
      // Generate personas directly from brief
      await handleGeneratePersonasFromBrief();
    } else {
      // Open the 6-step wizard
      setAiPersonaAssistantOpen(true);
    }
  };

  // Generate personas from brief (skip wizard)
  const handleGeneratePersonasFromBrief = async () => {
    setIsGeneratingPersonas(true);
    try {
      // Create simulation object for the prompt - cast to any to avoid type issues
      console.log('simulationData111', simulationData);
      const questionsString = Array.isArray(simulationData.discussion_questions) 
    ? simulationData.discussion_questions.join('\n')
    : simulationData.discussion_questions;
      const simulationForPrompt = {
        id: id,
        user_id: '',
        status: 'Draft',
        created_at: new Date().toISOString(),
        study_title: simulationData.study_title,
        study_type: simulationData.study_type,
        mode: simulationData.mode,
        topic: simulationData.topic,
        stimulus_media_url: '',
        turn_based: simulationData.turn_based,
        num_turns: parseInt(simulationData.num_turns),
        brief_text: simulationData.brief_text,
        brief_source: simulationData.brief_source,
        discussion_questions: questionsString
          ? questionsString.split('\n').filter(line => line.trim() !== '')
          : []
      } as Simulation;

      // Call createBriefPersonaGenerationPrompt
      const prompt = createBriefPersonaGenerationPrompt(simulationForPrompt);
      console.log('Brief persona generation prompt:', prompt);
      
      const messages: ChatCompletionMessageParam[] = [
        { 
          role: "system", 
          content: "You are a persona generator. You MUST return exactly 3 personas as a valid JSON array. Never return just 1 persona. Always return an array with exactly 3 objects." 
        },
        { 
          role: "user", content: prompt }
      ];
      const result = await runSimulationAPI(messages, 'groq');

      try {
        // Parse the JSON response
        let responseText = result.reply || "";
        console.log('Brief personas response:', responseText);
        
        // Clean the response string (remove any markdown formatting)
        responseText = responseText
          .replace(/^```[\s\S]*?\n/, '')  // Remove starting ``` and optional language
          .replace(/```$/, '')            // Remove trailing ```
          .trim();
        
        // Parse the JSON
        const parsedResponse = JSON.parse(responseText);
        
        // Extract personas array and add unique IDs
        const briefGeneratedPersonas = (parsedResponse.personas || parsedResponse || []).map((persona: any, index: number) => ({
          ...persona,
          id: persona.id || `brief-generated-${Date.now()}-${index}`, // Ensure unique ID
          editable: true // Make them editable
        }));
        
        console.log('Brief generated personas:', briefGeneratedPersonas);
        setGeneratedPersonas(briefGeneratedPersonas);
        
        // Open dialog and go directly to step 7
        setAiPersonaStep(7);
        setAiPersonaAssistantOpen(true);
        
        toast({
          title: "Personas generated from brief",
          description: `Generated ${briefGeneratedPersonas.length} personas based on your research brief.`,
        });
        
      } catch (error) {
        console.error("Error parsing brief personas JSON:", error);
        toast({
          title: "Error",
          description: "Failed to generate personas from brief. Please try the manual wizard instead.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating personas from brief:", error);
      toast({
        title: "Error",
        description: "Failed to generate personas from brief. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPersonas(false);
    }
  };

  // Generate personas using wizard (existing function)
  const handleGeneratePersonas = async () => {
    setIsGeneratingPersonas(true);
    try {
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
        console.error("Error parsing personas JSON:", error);
        toast({
          title: "Error",
          description: "Failed to generate personas. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating personas:", error);
      toast({
        title: "Error",
        description: "Failed to generate personas. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPersonas(false);
    }
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

  // Handle saving selected generated personas to database
  const handleAddSelectedPersonas = async () => {
    if (selectedGeneratedPersonas.length === 0) return;
    
    setIsSavingPersonas(true);
    try {
      const selectedPersonaObjects = generatedPersonas.filter(p => 
        selectedGeneratedPersonas.includes(p.id)
      );
      
      const savedPersonaIds: string[] = [];
      
      // Save each selected persona to the database
      for (const persona of selectedPersonaObjects) {
        const personaData = {
          name: persona.name,
          age: persona.age,
          gender: persona.gender,
          occupation: persona.occupation,
          location: persona.location,
          archetype: persona.archetype,
          bio: persona.bio,
          traits: persona.traits,
          goal: persona.goal,
          attitude: persona.attitude,
          family_status: persona.family_status,
          education_level: persona.education_level,
          income_level: persona.income_level,
          lifestyle: persona.lifestyle,
          category_products: persona.category_products,
          product_relationship: persona.product_relationship,
          category_habits: persona.category_habits,
          tags: persona.tags,
        };
        
        const response = await fetch('/api/personas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(personaData),
        });
        
        if (response.ok) {
          const savedPersona = await response.json();
          savedPersonaIds.push(savedPersona.id);
        } else {
          throw new Error(`Failed to save persona: ${persona.name}`);
        }
      }
      
      // Add the saved personas to the selected personas list
      setSelectedPersonas(prev => [...prev, ...savedPersonaIds]);
      
      // Refresh the personas list to show the new personas
      await mutate();
      
      // Show success message
      toast({
        title: "Personas added successfully",
        description: `${savedPersonaIds.length} persona${savedPersonaIds.length !== 1 ? 's' : ''} have been added to your simulation.`,
      });
      
      // Close the dialog and reset state
      handleAiPersonaClose();
      
    } catch (error) {
      console.error('Error saving personas:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save personas. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingPersonas(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Simulation</h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant={simulationStatus === 'Draft' ? 'secondary' : 'default'}>
                {simulationStatus}
              </Badge>
              {lastSaved && (
                <span className="text-sm text-gray-500">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}
              {isSaving && (
                <span className="text-sm text-blue-600 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </span>
              )}
              {saveError && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600 flex items-center gap-1">
                    ⚠️ {saveError}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={retryAutoSave}
                    className="h-6 px-2 text-xs"
                  >
                    Retry
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="mx-auto max-w-4xl">
          {/* Progress indicator skeleton */}
          <div className="mb-8 flex justify-between">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 animate-pulse" />
                <div className="mt-2 h-3 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Form skeleton */}
          <Card>
            <CardHeader>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Study title skeleton */}
              <div className="space-y-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
              </div>
              
              {/* Study type skeleton */}
              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
              </div>
              
              {/* Mode skeleton */}
              <div className="space-y-3">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse" />
                    <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse" />
                    <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
            </CardFooter>
          </Card>
        </div>
      ) : (
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

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Upload Brief Button */}
                  <div className="space-y-2">
                    <Button 
                      variant="default" 
                      onClick={handleBriefUpload}
                      className="w-full h-12 text-base font-medium"
                    >
                      <Upload className="mr-2 h-5 w-5" />
                      Upload Brief
                    </Button>
                    <p className="text-sm text-gray-500">
                      Have an existing research brief? Upload it and we'll auto-generate your simulation details.
                    </p>
                  </div>

                  {/* Playing Around Button */}
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      onClick={handlePlayingAround}
                      className="w-full h-12 text-base font-medium"
                    >
                      <Sparkles className="mr-2 h-5 w-5" />
                      Playing Around
                    </Button>
                    <p className="text-sm text-gray-500">
                      New to the platform? Try a sample simulation with pre-filled content to explore features.
                    </p>
                  </div>
                </div>
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
                                <Sparkles className="h-4 w-4 text-primary" />
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
                    placeholder="Enter your study title (e.g., New Product Concept Testing, Customer Satisfaction Study)" 
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

                {/* <div className="space-y-2">
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
                </div> */}

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

          {/* Brief Upload Dialog */}
          <Dialog open={briefUploadOpen} onOpenChange={setBriefUploadOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Upload Research Brief
                </DialogTitle>
                <DialogDescription>
                  Paste your research brief below and we'll auto-generate your simulation details.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="briefTextarea">Research Brief</Label>
                  <Textarea
                    id="briefTextarea"
                    placeholder="Paste your research brief here...

Example:
Research Objective: Understand consumer perceptions of our new eco-friendly packaging
Target Audience: Environmentally conscious consumers aged 25-45
Key Questions:
- How do consumers perceive the new packaging design?
- Does the eco-friendly messaging resonate with the target audience?
- What are the main barriers to purchase consideration?
- How does this compare to competitor offerings?"
                    rows={12}
                    value={briefText}
                    onChange={handleBriefTextChange}
                    className="resize-none"
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    <strong>Tip:</strong> Include your research objectives, target audience, key questions, and any background information. The more detail you provide, the better we can auto-generate your simulation.
                  </p>
                </div>
              </div>
              <DialogFooter className="flex justify-between">
                <Button variant="outline" onClick={handleCloseBriefDialog}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleGenerateFromBrief}
                  disabled={!briefText.trim() || isProcessingBrief}
                >
                  {isProcessingBrief ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing Brief...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate from Brief
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
                    onClick={handleGeneratePersonasClick}
                    disabled={isGeneratingPersonas}
                    className="flex items-center gap-2"
                  >
                    {isGeneratingPersonas ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate Personas
                      </>
                    )}
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
                  <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 flex flex-col">
                    <DialogHeader className="px-6 pt-6">
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

                    <div className="space-y-6 px-6 py-6 flex-1 overflow-y-auto">
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
                              disabled={isGeneratingPersonas}
                              className="w-full"
                            >
                              {isGeneratingPersonas ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Generating Personas...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="mr-2 h-4 w-4" />
                                  Generate Personas
                                </>
                              )}
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
                                      {persona.location && `, ${persona.location}`}
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

                    <DialogFooter className="flex justify-between px-6 py-4 border-t">
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
                            disabled={selectedGeneratedPersonas.length === 0 || isSavingPersonas}
                            onClick={handleAddSelectedPersonas}
                          >
                            {isSavingPersonas ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving Personas...
                              </>
                            ) : (
                              <>
                                Add Selected Personas
                                <Sparkles className="ml-2 h-4 w-4" />
                              </>
                            )}
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
                      selectedFiles.length > 0 || getUploadedFiles().length > 0 ? 'border-primary' : 'border-gray-300'
                    } hover:bg-gray-50 p-4 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => !isUploading && document.getElementById('file-upload')?.click()}
                  >
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleFileSelect}
                      multiple
                    />
                    
                    {(selectedFiles.length > 0 || getUploadedFiles().length > 0) ? (
                      <div className="w-full space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            {getUploadedFiles().length > 0 && `${getUploadedFiles().length} uploaded`}
                            {getUploadedFiles().length > 0 && selectedFiles.length > 0 && ', '}
                            {selectedFiles.length > 0 && `${selectedFiles.length} selected`}
                            {getUploadedFiles().length === 0 && selectedFiles.length === 0 && '0 files'}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 text-xs"
                            disabled={isUploading}
                            onClick={(e) => {
                              e.stopPropagation();
                              document.getElementById('file-upload')?.click();
                            }}
                          >
                            Add More
                          </Button>
                        </div>
                        
                        {isUploading && (
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(Object.keys(uploadProgress).length / selectedFiles.length) * 100}%` }}
                            />
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          {/* Show uploaded files first */}
                          {getUploadedFiles().map((url, index) => (
                            <div key={`uploaded-${index}`} className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-200">
                              <div className="flex items-center space-x-2">
                                {isImageUrl(url) ? (
                                  <img 
                                    src={url} 
                                    alt={getFileNameFromUrl(url)} 
                                    className="h-8 w-8 object-cover rounded"
                                  />
                                ) : (
                                  <div className="h-8 w-8 flex items-center justify-center bg-green-100 rounded">
                                    <FileIcon size={14} className="text-green-600" />
                                  </div>
                                )}
                                <div className="flex flex-col">
                                  <span className="text-xs truncate max-w-[200px]">{getFileNameFromUrl(url)}</span>
                                  <span className="text-xs text-green-600 font-medium">✓ Uploaded</span>
                                </div>
                              </div>
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveUploadedFile(url);
                                }}
                                className="text-red-500 hover:text-red-700 text-xs flex items-center"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          
                          {/* Show selected files (pending upload) */}
                          {selectedFiles.map((file, index) => (
                            <div key={`selected-${index}`} className="flex items-center justify-between bg-blue-50 p-2 rounded border border-blue-200">
                              <div className="flex items-center space-x-2">
                                {previewUrls[file.name] ? (
                                  <img 
                                    src={previewUrls[file.name]} 
                                    alt={file.name} 
                                    className="h-8 w-8 object-cover rounded"
                                  />
                                ) : (
                                  <div className="h-8 w-8 flex items-center justify-center bg-blue-100 rounded">
                                    <FileIcon size={14} className="text-blue-600" />
                                  </div>
                                )}
                                <div className="flex flex-col">
                                  <span className="text-xs truncate max-w-[200px]">{file.name}</span>
                                  <span className="text-xs text-blue-600 font-medium">Pending upload</span>
                                </div>
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
                        {isUploading ? (
                          <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                        ) : (
                          <Upload className="h-6 w-6 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-500">
                          {isUploading ? 'Uploading files...' : 'Click to upload or drag and drop'}
                        </span>
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
                    rows={15}
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
                <Button onClick={nextStep} disabled={isUploading}>
                  {isUploading && selectedFiles.length > 0 ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
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
                  {isUploading ? 'Launching...' : 'Launch Simulation'}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
