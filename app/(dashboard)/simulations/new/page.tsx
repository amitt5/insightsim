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
import { ArrowLeft, ArrowRight, Upload, X, FileIcon } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { usePersonas } from "@/lib/usePersonas"
import { CreatePersonaDialog } from "@/components/create-persona-dialog"
import { getRandomSimulation } from "@/utils/mockSimulations"
import { Simulation } from "@/utils/types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { v4 as uuidv4 } from 'uuid'
import { useToast } from "@/hooks/use-toast"

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
  const [simulationData, setSimulationData] = useState({
    study_title: "",
    study_type: "focus-group",
    mode: "ai-both",
    topic: "",
    stimulus_media_url: [] as string[],
    discussion_questions: "",
    turn_based: false,
    num_turns: "10",
  });
  
  const router = useRouter()
  const { personas, loading, error } = usePersonas()
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
                <Label htmlFor="studyTitle">Study Title</Label>
                <Input 
                  id="studyTitle" 
                  placeholder="e.g., New Product Concept Testing" 
                  value={simulationData.study_title}
                  onChange={handleInputChange('study_title')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="studyType">Study Type</Label>
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

              <div className="space-y-2">
                <Label>Simulation Mode</Label>
                <RadioGroup 
                  value={simulationData.mode}
                  onValueChange={handleRadioChange}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ai-both" id="ai-both" />
                    <Label htmlFor="ai-both">AI {simulationData.study_type === 'focus-group' ? 'Moderator' : 'Interviewer'} + AI {simulationData.study_type === 'focus-group' ? 'Participants' : 'Participant'} </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="human-mod" id="human-mod" />
                    <Label htmlFor="human-mod">Human {simulationData.study_type === 'focus-group' ? 'Moderator' : 'Interviewer'} + AI {simulationData.study_type === 'focus-group' ? 'Participants' : 'Participant'} </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={nextStep}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
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
              <div className="mb-4 flex justify-end">
                <CreatePersonaDialog
                  open={openPersonaModal}
                  onOpenChange={setOpenPersonaModal}
                  onHideSystemPersonasChange={setHideSystemPersonas}
                  hideSystemPersonas={hideSystemPersonas}
                />
              </div>

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
              <Button onClick={nextStep}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
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
                <Label htmlFor="questions">Discussion Questions</Label>
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
