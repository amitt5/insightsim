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
import { createTitleGenerationPrompt, createBriefExtractionPrompt, buildDiscussionQuestionsFromBrief } from "@/utils/buildMessagesForOpenAI";
import { runSimulationAPI } from '@/utils/api';
import { createTargetSegmentGenerationPrompt } from '@/utils/buildMessagesForOpenAI';
import { createBriefPersonaGenerationPrompt } from '@/utils/buildMessagesForOpenAI';

import { ArrowLeft, ArrowRight, Upload, X,Edit2, Save, FileIcon, Sparkles, Loader2, HelpCircle } from "lucide-react"
import AIBriefAssistant from "./AIBriefAssistant"
import { RagDocumentUpload, RagDocumentList } from "./rag"
import { TargetSegmentSelectionModal } from "./TargetSegmentSelectionModal"
import { runPersonaAnalysis, AnalysisProgress } from "@/utils/personaAnalysis"
import warmUpService from "@/utils/warmupService"
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

// Define the tab interface
interface TabItem {
  value: string;
  label: string;
}

interface ProjectViewProps {
  project: Project;
  onUpdate?: (updatedProject: Project) => void;
}

export default function ProjectView({ project, onUpdate }: ProjectViewProps) {
  const { toast } = useToast();
  const [editedProject, setEditedProject] = useState({
    ...project,
    discussion_questions: project.discussion_questions || []
  });
  const [activeTab, setActiveTab] = useState(project.active_tab || 'brief');
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
  
  // Target segment selection modal state
  const [showTargetSegmentModal, setShowTargetSegmentModal] = useState(false);
  const [targetSegments, setTargetSegments] = useState<string[]>([]);
  const [isGeneratingSegments, setIsGeneratingSegments] = useState(false);
  
  // Analysis progress state
  const [analysisStep, setAnalysisStep] = useState<'idle' | 'analyzing_requirements' | 'source_selection' | 'scraping_web' | 'generating_personas' | 'completed'>('idle');
  const [analysisMessage, setAnalysisMessage] = useState<string>('');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [sourceData, setSourceData] = useState<any>(null);

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

  const analysisObj = {
    "analysis": [
        {
            "question": "What does homeownership mean to you, and how do you feel about the responsibilities that come with it?",
            "summary": "Homeownership is viewed as a significant milestone that symbolizes stability and security for families. Participants express pride in owning their homes but also acknowledge the overwhelming responsibilities that come with it, such as maintenance and financial obligations. Many feel a strong sense of duty to protect their investment and ensure a safe environment for their families, which can sometimes lead to feelings of anxiety.",
            "categories": [
                {
                    "name": "Stability and Security",
                    "percentage": 80
                },
                {
                    "name": "Responsibilities and Obligations",
                    "percentage": 75
                },
                {
                    "name": "Pride in Ownership",
                    "percentage": 60
                },
                {
                    "name": "Financial Concerns",
                    "percentage": 55
                },
                {
                    "name": "Emotional Impact",
                    "percentage": 50
                }
            ],
            "verbatims": [
                {
                    "quote": "Homeownership to me represents stability and security.",
                    "tags": [
                        "Stability and Security"
                    ]
                },
                {
                    "quote": "I feel a heavy weight when it comes to making sure everything is taken care of.",
                    "tags": [
                        "Responsibilities and Obligations"
                    ]
                },
                {
                    "quote": "It signifies stability for my family and a place where we can create lasting memories.",
                    "tags": [
                        "Pride in Ownership"
                    ]
                },
                {
                    "quote": "I want to ensure that my family and I are safe, and that we have a reliable plan in place.",
                    "tags": [
                        "Financial Concerns",
                        "Emotional Impact"
                    ]
                },
                {
                    "quote": "I want to be proactive and make informed decisions, especially when it comes to home insurance.",
                    "tags": [
                        "Responsibilities and Obligations"
                    ]
                }
            ]
        },
        {
            "question": "Can you describe your thoughts and feelings when it comes to protecting your home? What are your main concerns?",
            "summary": "Participants emphasize the importance of protecting their homes, viewing it as a top priority. Main concerns include risks from natural disasters, theft, and ensuring adequate insurance coverage. Many express anxiety about being underinsured and the potential financial implications of unexpected events, highlighting the need for comprehensive protection.",
            "categories": [
                {
                    "name": "Home Protection Importance",
                    "percentage": 85
                },
                {
                    "name": "Concerns about Risks",
                    "percentage": 80
                },
                {
                    "name": "Financial Security",
                    "percentage": 70
                },
                {
                    "name": "Insurance Coverage",
                    "percentage": 65
                },
                {
                    "name": "Anxiety about Vulnerability",
                    "percentage": 60
                }
            ],
            "verbatims": [
                {
                    "quote": "Protecting my home is a top priority for me.",
                    "tags": [
                        "Home Protection Importance"
                    ]
                },
                {
                    "quote": "I worry about potential risks like natural disasters, theft, or even accidents.",
                    "tags": [
                        "Concerns about Risks"
                    ]
                },
                {
                    "quote": "I want to feel secure knowing that if something unfortunate happens, we have the right support.",
                    "tags": [
                        "Financial Security",
                        "Insurance Coverage"
                    ]
                },
                {
                    "quote": "The thought of my family being vulnerable really drives my desire to have a solid insurance plan in place.",
                    "tags": [
                        "Anxiety about Vulnerability"
                    ]
                },
                {
                    "quote": "I strive to understand the specifics of our policy to avoid any surprises in the event of a claim.",
                    "tags": [
                        "Insurance Coverage"
                    ]
                }
            ]
        },
        {
            "question": "Tell me about your experiences with home insurance. How have they shaped your perceptions of the industry?",
            "summary": "Participants report mixed experiences with home insurance, often feeling overwhelmed by the options and complexities involved. Many have faced challenges during the claims process, leading to a desire for clearer communication and better customer service. Positive experiences with supportive agents have shifted perceptions towards valuing transparency and personalized service.",
            "categories": [
                {
                    "name": "Mixed Experiences",
                    "percentage": 75
                },
                {
                    "name": "Challenges with Claims Process",
                    "percentage": 70
                },
                {
                    "name": "Importance of Communication",
                    "percentage": 65
                },
                {
                    "name": "Value of Customer Service",
                    "percentage": 60
                },
                {
                    "name": "Need for Transparency",
                    "percentage": 55
                }
            ],
            "verbatims": [
                {
                    "quote": "My experiences with home insurance have been quite mixed.",
                    "tags": [
                        "Mixed Experiences"
                    ]
                },
                {
                    "quote": "Navigating the claims process was frustrating.",
                    "tags": [
                        "Challenges with Claims Process"
                    ]
                },
                {
                    "quote": "I want to deal with companies that take the time to explain the details of my coverage clearly.",
                    "tags": [
                        "Importance of Communication"
                    ]
                },
                {
                    "quote": "This experience taught me the importance of communication and support in the insurance process.",
                    "tags": [
                        "Value of Customer Service"
                    ]
                },
                {
                    "quote": "I realized that there are companies out there genuinely committed to helping families like mine.",
                    "tags": [
                        "Need for Transparency"
                    ]
                }
            ]
        },
        {
            "question": "What role do you think technology plays in your home insurance decisions? How has it changed your expectations?",
            "summary": "Technology is seen as a crucial factor in home insurance decisions, with participants appreciating the convenience of online tools for comparing policies and managing claims. Expectations have shifted towards a demand for user-friendly digital experiences and integration with smart home technologies. Many express a desire for insurers to leverage technology to enhance customer service and efficiency.",
            "categories": [
                {
                    "name": "Importance of Technology",
                    "percentage": 80
                },
                {
                    "name": "Convenience of Online Tools",
                    "percentage": 75
                },
                {
                    "name": "Expectations for User Experience",
                    "percentage": 70
                },
                {
                    "name": "Integration with Smart Home Tech",
                    "percentage": 65
                },
                {
                    "name": "Desire for Efficiency",
                    "percentage": 60
                }
            ],
            "verbatims": [
                {
                    "quote": "Technology plays a significant role in my home insurance decisions.",
                    "tags": [
                        "Importance of Technology"
                    ]
                },
                {
                    "quote": "I appreciate being able to access information quickly and conduct my research at my own pace.",
                    "tags": [
                        "Convenience of Online Tools"
                    ]
                },
                {
                    "quote": "I now expect insurance companies to have user-friendly websites and apps.",
                    "tags": [
                        "Expectations for User Experience"
                    ]
                },
                {
                    "quote": "I see the value in smart home devices potentially lowering premiums.",
                    "tags": [
                        "Integration with Smart Home Tech"
                    ]
                },
                {
                    "quote": "I expect my insurance provider to leverage technology not just for efficiency, but also to enhance my overall experience.",
                    "tags": [
                        "Desire for Efficiency"
                    ]
                }
            ]
        },
        {
            "question": "When you think about a brand that you trust for home protection, what qualities or attributes come to mind? Why are these important to you?",
            "summary": "Trustworthy brands are characterized by reliability, transparency, and excellent customer service. Participants emphasize the need for insurers to have a solid track record and clear communication regarding policy details. These attributes are crucial for building confidence and peace of mind in the home protection process.",
            "categories": [
                {
                    "name": "Reliability",
                    "percentage": 85
                },
                {
                    "name": "Transparency",
                    "percentage": 80
                },
                {
                    "name": "Customer Service",
                    "percentage": 75
                },
                {
                    "name": "Clear Communication",
                    "percentage": 70
                },
                {
                    "name": "Trust and Confidence",
                    "percentage": 65
                }
            ],
            "verbatims": [
                {
                    "quote": "Reliability is crucial; I want to know that the company has a solid track record.",
                    "tags": [
                        "Reliability"
                    ]
                },
                {
                    "quote": "Transparency is equally important because I don't want to be caught off guard by hidden clauses.",
                    "tags": [
                        "Transparency"
                    ]
                },
                {
                    "quote": "Good customer service is vital, too, as I expect to be treated with respect.",
                    "tags": [
                        "Customer Service"
                    ]
                },
                {
                    "quote": "These attributes matter to me because they directly affect my peace of mind.",
                    "tags": [
                        "Clear Communication",
                        "Trust and Confidence"
                    ]
                },
                {
                    "quote": "Knowing that I can count on my insurance provider during a crisis allows me to focus on what truly matters.",
                    "tags": [
                        "Trust and Confidence"
                    ]
                }
            ]
        },
        {
            "question": "Imagine you have a friend who is a new homeowner. What would you tell them about choosing a home insurance provider? What factors would you emphasize?",
            "summary": "Participants emphasize the importance of thorough research when selecting a home insurance provider. Key factors include understanding coverage options, customer service quality, and the claims process. Recommendations also include seeking out providers with positive reviews and ensuring clear communication about policy details.",
            "categories": [
                {
                    "name": "Research and Comparison",
                    "percentage": 85
                },
                {
                    "name": "Understanding Coverage Options",
                    "percentage": 80
                },
                {
                    "name": "Customer Service Quality",
                    "percentage": 75
                },
                {
                    "name": "Importance of Reviews",
                    "percentage": 70
                },
                {
                    "name": "Clear Communication",
                    "percentage": 65
                }
            ],
            "verbatims": [
                {
                    "quote": "I would emphasize the importance of researching multiple providers.",
                    "tags": [
                        "Research and Comparison"
                    ]
                },
                {
                    "quote": "I’d urge them to read online reviews and seek recommendations.",
                    "tags": [
                        "Importance of Reviews"
                    ]
                },
                {
                    "quote": "It’s crucial to fully understand what a policy covers and what it excludes.",
                    "tags": [
                        "Understanding Coverage Options"
                    ]
                },
                {
                    "quote": "I would stress the significance of clear communication.",
                    "tags": [
                        "Clear Communication"
                    ]
                },
                {
                    "quote": "Choosing a provider that is transparent about coverage details is essential.",
                    "tags": [
                        "Customer Service Quality"
                    ]
                }
            ]
        },
        {
            "question": "Describe a time when you felt particularly secure or vulnerable in your home. How did that experience influence your views on home protection?",
            "summary": "Participants share experiences that highlight feelings of vulnerability during storms or after neighborhood incidents, which have influenced their views on home protection. Many emphasize the importance of proactive measures and comprehensive insurance coverage to mitigate risks. These experiences reinforce the belief that home protection involves both insurance and physical security measures.",
            "categories": [
                {
                    "name": "Feelings of Vulnerability",
                    "percentage": 80
                },
                {
                    "name": "Importance of Proactive Measures",
                    "percentage": 75
                },
                {
                    "name": "Influence on Home Protection Views",
                    "percentage": 70
                },
                {
                    "name": "Need for Comprehensive Coverage",
                    "percentage": 65
                },
                {
                    "name": "Physical Security Measures",
                    "percentage": 60
                }
            ],
            "verbatims": [
                {
                    "quote": "I felt an overwhelming sense of vulnerability.",
                    "tags": [
                        "Feelings of Vulnerability"
                    ]
                },
                {
                    "quote": "This experience reinforced my views on home protection.",
                    "tags": [
                        "Influence on Home Protection Views"
                    ]
                },
                {
                    "quote": "It made me realize that feeling secure is not just about having insurance.",
                    "tags": [
                        "Importance of Proactive Measures"
                    ]
                },
                {
                    "quote": "I became more committed to seeking out policies that not only protect against damages.",
                    "tags": [
                        "Need for Comprehensive Coverage"
                    ]
                },
                {
                    "quote": "Investing in preventative measures is just as crucial as having insurance.",
                    "tags": [
                        "Physical Security Measures"
                    ]
                }
            ]
        },
        {
            "question": "If you could design the perfect home insurance experience for yourself, what features or services would you include to make it feel more trustworthy and supportive?",
            "summary": "Participants envision an ideal home insurance experience that prioritizes transparency, user-friendly technology, and personalized support. Desired features include intuitive online platforms for managing policies, dedicated claims representatives, and educational resources about home safety. These elements are seen as essential for building trust and ensuring a supportive insurance experience.",
            "categories": [
                {
                    "name": "User-Friendly Technology",
                    "percentage": 85
                },
                {
                    "name": "Transparency in Policies",
                    "percentage": 80
                },
                {
                    "name": "Personalized Support",
                    "percentage": 75
                },
                {
                    "name": "Educational Resources",
                    "percentage": 70
                },
                {
                    "name": "Trust and Support",
                    "percentage": 65
                }
            ],
            "verbatims": [
                {
                    "quote": "I would prioritize a seamless and transparent claims process.",
                    "tags": [
                        "Transparency in Policies"
                    ]
                },
                {
                    "quote": "I’d want an intuitive online platform where I could easily access my policy.",
                    "tags": [
                        "User-Friendly Technology"
                    ]
                },
                {
                    "quote": "I would appreciate a dedicated personal claims representative.",
                    "tags": [
                        "Personalized Support"
                    ]
                },
                {
                    "quote": "Having a resource center with educational materials about home safety would be invaluable.",
                    "tags": [
                        "Educational Resources"
                    ]
                },
                {
                    "quote": "These elements combined would create a supportive, trustworthy experience.",
                    "tags": [
                        "Trust and Support"
                    ]
                }
            ]
        }
    ]
  }

  // Update brief text when project changes
  useEffect(() => {
    setBriefText(project.brief_text || '');
  }, [project.brief_text]);

  // Update media URLs when project changes
  useEffect(() => {
    setProjectMediaUrls(project.media_urls || []);
  }, [project.media_urls]);

  // Update active tab when project changes
  useEffect(() => {
    const newActiveTab = project.active_tab || 'brief';
    // If there's no brief_text and the active tab is not 'brief', force it to 'brief'
    if (!project.brief_text && newActiveTab !== 'brief') {
      setActiveTab('brief');
    } else {
      setActiveTab(newActiveTab);
    }
  }, [project.active_tab, project.brief_text]);

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

    const fetchSyntheticAnalysis = async () => {
      try {
        const response = await fetch(`/api/projects/${project.id}/analysis/synthetic`);
        if (response.status === 404) {
          // No analysis yet - normal, show empty state
          setSyntheticAnalysis(null);
        } else if (!response.ok) {
          // Actual server error - but don't show toast, just leave empty
          console.error('Server error fetching analysis:', response.status, response.statusText);
          setSyntheticAnalysis(null);
        } else {
          const data = await response.json();
          console.log('fetchSyntheticAnalysis', data);
          if (data?.analysis) {
            setSyntheticAnalysis(data.analysis.analysis || data.analysis);
          }
        }
      } catch (error) {
        // Network or other errors - silent fail, show empty state
        console.error('Error fetching synthetic analysis:', error);
        setSyntheticAnalysis(null);
      }
    };

    const fetchHumanAnalysis = async () => {
      try {
        const response = await fetch(`/api/projects/${project.id}/analysis/human`);
        if (response.status === 404) {
          // No analysis yet - normal, show empty state
          setHumanAnalysis(null);
        } else if (!response.ok) {
          // Actual server error - but don't show toast, just leave empty
          console.error('Server error fetching human analysis:', response.status, response.statusText);
          setHumanAnalysis(null);
        } else {
          const data = await response.json();
          if (data?.analysis) {
            setHumanAnalysis(data.analysis.analysis || data.analysis);
          }
        }
      } catch (error) {
        // Network or other errors - silent fail, show empty state
        console.error('Error fetching human analysis:', error);
        setHumanAnalysis(null);
      }
    };

    // Only fetch data if project.id exists
    if (project.id) {
      fetchProjectPersonas();
      fetchProjectSimulations();
      fetchRagDocuments();
      fetchSyntheticAnalysis();
      fetchHumanAnalysis();
    }
  }, [project.id, toast]);

  const handleShowTargetSegmentModal = async () => {
    if (!project.brief_text) {
      toast({
        title: "Error",
        description: "Please add a brief first to generate personas",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingSegments(true);
    setShowTargetSegmentModal(true);
    
    try {
      const prompt = createTargetSegmentGenerationPrompt(project.brief_text);
      const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: prompt }
      ];
      const result = await runSimulationAPI(messages, 'gpt-4o-mini', 'segment-generation');

      try {
        let responseText = result.reply || "";
        responseText = responseText
          .replace(/^```[\s\S]*?\n/, '')
          .replace(/```$/, '')
          .trim();

        const parsedResponse = JSON.parse(responseText);
        const generatedSegments = parsedResponse.segments || [];
        if (generatedSegments.length === 0) {
          toast({
            title: "Warning",
            description: "No target segments were generated. Generating personas directly...",
            variant: "destructive",
          });
          // Fallback to direct persona generation
          await handleGeneratePersonasFromBrief();
          setShowTargetSegmentModal(false);
        } else {
          setTargetSegments(generatedSegments);
        }
      } catch (parseError) {
        console.error('Failed to parse segment response:', parseError);
        toast({
          title: "Error",
          description: "Failed to parse target segments. Generating personas directly...",
          variant: "destructive",
        });
        // Fallback to direct persona generation
        await handleGeneratePersonasFromBrief();
        setShowTargetSegmentModal(false);
      }
    } catch (error) {
      console.error('Failed to generate target segments:', error);
      toast({
        title: "Error",
        description: "Failed to generate target segments. Generating personas directly...",
        variant: "destructive",
      });
      // Fallback to direct persona generation
      await handleGeneratePersonasFromBrief();
      setShowTargetSegmentModal(false);
    } finally {
      setIsGeneratingSegments(false);
    }
  };

  const handleGeneratePersonasFromBrief = async () => {
    if (!project.brief_text) {
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
        const generatedPersonas = Array.isArray(parsedResponse) ? parsedResponse : (parsedResponse.personas || []);

        console.log('generatedPersonas111', generatedPersonas)
        
        // Add editable field to each persona
        const personasWithEditable = generatedPersonas.map((persona: any) => ({
          ...persona,
          editable: true
        }));
        
        // Save the generated personas
        const response = await fetch(`/api/projects/${project.id}/personas`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ personas: personasWithEditable }),
        });

        if (!response.ok) {
          throw new Error('Failed to save personas');
        }

        const data = await response.json();
        setProjectPersonas(prev => [...prev, ...data.personas]);
        
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

  const handleGeneratePersonasWithSegments = async (selectedSegments: string[]) => {
    if (!project.brief_text) {
      toast({
        title: "Error",
        description: "Please add a brief first to generate personas",
        variant: "destructive",
      });
      return;
    }

    if (!selectedSegments || selectedSegments.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one target segment",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingPersonas(true);
    
    try {
      // Step 1 & 2: Run analysis with progress updates
      const { analysis, sources } = await runPersonaAnalysis(
        project.brief_text,
        selectedSegments,
        (progress: AnalysisProgress) => {
          console.log('ProjectView - Progress update:', progress);
          console.log('ProjectView - Setting analysisStep to:', progress.step);
          setAnalysisStep(progress.step);
          setAnalysisMessage(progress.message);
          if (progress.analysisResult) {
            console.log('ProjectView - Setting analysis data:', progress.analysisResult);
            setAnalysisData(progress.analysisResult);
          }
          if (progress.sourceResults) {
            console.log('ProjectView - Setting source data:', progress.sourceResults);
            setSourceData(progress.sourceResults);
          }
        }
      );
      console.log('analysis111', analysis, sources);

      // Step 4: Generate personas with enhanced data (minimum 2 seconds)
      setAnalysisStep('generating_personas');
      setAnalysisMessage('Generating Personas...');
      
      const personaStartTime = Date.now();
      
      const prompt = createBriefPersonaGenerationPrompt(project, selectedSegments);
      const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: prompt }
      ];
      const result = await runSimulationAPI(messages, 'groq', 'persona-generation');
      console.log('[generate personas with segments] result111', result);
      // Ensure persona generation shows for at least 2 seconds
      const personaElapsed = Date.now() - personaStartTime;
      const personaRemainingTime = Math.max(0, 2000 - personaElapsed);
      if (personaRemainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, personaRemainingTime));
      }

      try {
        let responseText = result.reply || "";
        responseText = responseText
          .replace(/^```[\s\S]*?\n/, '')
          .replace(/```$/, '')
          .trim();

        const parsedResponse = JSON.parse(responseText);
        const generatedPersonas = Array.isArray(parsedResponse) ? parsedResponse : (parsedResponse.personas || []);

        console.log('generatedPersonas with segments', generatedPersonas);
        console.log('Analysis results:', analysis);
        console.log('Source selections:', sources);
        
        // Add editable field to each persona
        const personasWithEditable = generatedPersonas.map((persona: any) => ({
          ...persona,
          editable: true
        }));
        
        // Save the generated personas
        const response = await fetch(`/api/projects/${project.id}/personas`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ personas: personasWithEditable }),
        });

        if (!response.ok) {
          throw new Error('Failed to save personas');
        }

        const data = await response.json();
        setProjectPersonas(prev => [...prev, ...data.personas]);
        
        // Close modal and reset states
        setShowTargetSegmentModal(false);
        setAnalysisStep('completed');
        
        toast({
          title: "Success",
          description: `Generated ${generatedPersonas.length} personas for selected segments: ${selectedSegments.join(', ')}`,
        });
      } catch (parseError) {
        console.error("Error parsing personas:", parseError);
        toast({
          title: "Error",
          description: "Failed to parse generated personas. Please try again.",
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
      setAnalysisStep('idle');
      setAnalysisMessage('');
    }
  };

  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isGeneratingSyntheticAnalysis, setIsGeneratingSyntheticAnalysis] = useState(false);
  const [syntheticAnalysis, setSyntheticAnalysis] = useState<any | null>(null);
  const [isGeneratingHumanAnalysis, setIsGeneratingHumanAnalysis] = useState(false);
  const [humanAnalysis, setHumanAnalysis] = useState<any | null>(null);

  const handleGenerateSyntheticAnalysis = async () => {
    if (isGeneratingSyntheticAnalysis) return;
    setIsGeneratingSyntheticAnalysis(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/analysis/synthetic/run`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate analysis');
      }
      const data = await response.json();
      if (data?.analysis) {
        setSyntheticAnalysis(data.analysis.analysis || data.analysis);
        toast({
          title: 'Analysis ready',
          description: 'Synthetic analysis generated and saved.',
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Error generating synthetic analysis:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate analysis',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingSyntheticAnalysis(false);
    }
  };

  const handleGenerateHumanAnalysis = async () => {
    if (isGeneratingHumanAnalysis) return;
    setIsGeneratingHumanAnalysis(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/analysis/human/run`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate human analysis');
      }
      const data = await response.json();
      console.log('=== Human Analysis Generated ===');
      console.log('Full response:', data);
      if (data?.analysis) {
        setHumanAnalysis(data.analysis.analysis || data.analysis);
        toast({
          title: 'Analysis ready',
          description: 'Human analysis generated and saved.',
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Error generating human analysis:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate human analysis',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingHumanAnalysis(false);
    }
  };

  const handleSaveBrief = async () => {
    setIsSavingBrief(true);
    try {
      console.log('briefText111', briefText, project, project.id);
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

      const responseData = await response.json();
      const updatedProject = responseData.project;
      setEditedProject(updatedProject);
      setBriefText(updatedProject.brief_text || '');
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

  const handleTabChange = async (newTab: string) => {
    // Don't allow switching to disabled tabs when brief_text is null
    if (!briefText && newTab !== 'brief') {
      return;
    }
    
    // Warm up PDF service when user clicks on RAG tab
    if (newTab === 'rag') {
      warmUpService();
    }
    
    setActiveTab(newTab);
    
    // Save the active tab to the database
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active_tab: newTab }),
      });

      if (!response.ok) {
        console.error('Failed to save active tab');
        // Don't show error toast for this as it's not critical
      } else {
        const responseData = await response.json();
        const updatedProject = responseData.project;
        setEditedProject(updatedProject);
        onUpdate?.(updatedProject);
      }
    } catch (error) {
      console.error('Error saving active tab:', error);
      // Don't show error toast for this as it's not critical
    }
  };


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-start mb-8">
        <div className="flex-1">
          <input
            type="text"
            value={editedProject.name || ''}
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
                  const responseData = await response.json();
                  const updatedProject = responseData.project;
                  setEditedProject(updatedProject);
                  onUpdate?.(updatedProject);
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

       {/* Navigation hint for users */}
       <div className="mb-4 flex items-center text-gray-600 text-sm">
        {/* <HelpCircle className="h-4 w-4 mr-2" /> */}
        <span>Click on the tabs below to navigate between different sections of your project</span>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="brief">Brief</TabsTrigger>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="discussion" disabled={!briefText}>Discussion Guide</TabsTrigger>
              </TooltipTrigger>
              {!briefText && (
                <TooltipContent>
                  <p>Add a brief first to access this feature</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="rag" disabled={!briefText}>RAG</TabsTrigger>
              </TooltipTrigger>
              {!briefText && (
                <TooltipContent>
                  <p>Add a brief first to access this feature</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="personas" disabled={!briefText}>Personas</TabsTrigger>
              </TooltipTrigger>
              {!briefText && (
                <TooltipContent>
                  <p>Add a brief first to access this feature</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="media" disabled={!briefText}>Media</TabsTrigger>
              </TooltipTrigger>
              {!briefText && (
                <TooltipContent>
                  <p>Add a brief first to access this feature</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="studies" disabled={!briefText}>Simulations</TabsTrigger>
              </TooltipTrigger>
              {!briefText && (
                <TooltipContent>
                  <p>Add a brief first to access this feature</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="interviews" disabled={!briefText}>Human Interviews</TabsTrigger>
              </TooltipTrigger>
              {!briefText && (
                <TooltipContent>
                  <p>Add a brief first to access this feature</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="analysis" disabled={!briefText}>Analysis</TabsTrigger>
              </TooltipTrigger>
              {!briefText && (
                <TooltipContent>
                  <p>Add a brief first to access this feature</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
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
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{briefText || ''}</p>
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
                    
                    // Update parent component with the new brief
                    const updatedProject = { ...project, brief_text: brief };
                    onUpdate?.(updatedProject);
                    
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

                  let generatedQuestions: string[] = [];

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
                    generatedQuestions = parsedResponse.questions || [];
                    
                  } catch (error) {
                    console.error("Error parsing discussion questions JSON:", error);
                    
                    // Fallback: try to parse as the old numbered list format
                    let questions = result.reply || "";
                    questions = questions.replace(/```[a-z]*[\s\S]*?```/gi, '');
                    let lines = questions.split(/\n|\r/).map(l => l.trim()).filter(Boolean);
                    lines = lines.map(l => l.replace(/^\d+\.?\s*/, ""));
                    console.log('lines111', lines);
                    generatedQuestions = lines;
                  }

                  // Update local state
                  setEditedProject(prev => ({
                    ...prev,
                    discussion_questions: generatedQuestions
                  }));

                  // Auto-save the generated questions
                  try {
                    const response = await fetch(`/api/projects/${project.id}`, {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        discussion_questions: generatedQuestions
                      }),
                    });

                    if (response.ok) {
                      const responseData = await response.json();
                      const updatedProject = responseData.project;
                      setEditedProject(updatedProject);
                      onUpdate?.(updatedProject);
                      toast({
                        title: "Discussion Guide Generated & Saved",
                        description: "Your discussion guide has been generated and saved automatically.",
                      });
                    } else {
                      throw new Error('Failed to save discussion guide');
                    }
                  } catch (saveError) {
                    console.error('Error auto-saving discussion guide:', saveError);
                    toast({
                      title: "Questions Generated",
                      description: "Questions were generated but failed to save automatically. You can save them manually.",
                      variant: "destructive",
                    });
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
                value={(editedProject.discussion_questions || []).join('\n')}
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
                        const responseData = await response.json();
                        const updatedProject = responseData.project;
                        setEditedProject(updatedProject);
                        onUpdate?.(updatedProject);
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
                onClick={handleShowTargetSegmentModal}
                disabled={isGeneratingPersonas || isGeneratingSegments || !project.brief_text}
                className="flex items-center gap-2"
              >
                {isGeneratingPersonas || isGeneratingSegments ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isGeneratingSegments ? "Analyzing brief..." : "Generating..."}
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
                      persona={{ ...persona }}
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

        <TabsContent value="analysis" className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-500">Analysis</label>
            <p className="text-sm text-gray-400 mt-1">
              View insights and analysis from your research data
            </p>
          </div>

          {/* Analysis Sub-tabs */}
          <Tabs defaultValue="synthetic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="synthetic" className="w-full">Synthetic</TabsTrigger>
              <TabsTrigger value="human" className="w-full">Human</TabsTrigger>
              {/* <TabsTrigger value="combined" className="w-full">Combined</TabsTrigger> */}
            </TabsList>

            <TabsContent value="synthetic" className="space-y-6 mt-6">
              <div className="space-y-6">
                <div className="bg-white border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Synthetic Analysis</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateSyntheticAnalysis}
                      disabled={isGeneratingSyntheticAnalysis}
                      className="flex items-center gap-2"
                    >
                      {isGeneratingSyntheticAnalysis ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Generate
                        </>
                      )}
                    </Button>
                  </div>
                  {/* Content */}
                  {isGeneratingSyntheticAnalysis ? (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin" /> Generating analysis...
                    </div>
                  ) : syntheticAnalysis && syntheticAnalysis.length > 0 ? (
                    <div className="space-y-8">
                      {syntheticAnalysis.map((question: any, questionIdx: number) => (
                        <div key={questionIdx} className="border-t pt-6 first:border-t-0 first:pt-0">
                          <h4 className="text-lg font-semibold text-gray-800 mb-4">
                            {questionIdx + 1}. {question.question || `Question ${questionIdx + 1}`}
                          </h4>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column - AI Summary and Chart */}
                            <div className="space-y-6">
                              <div>
                                <h4 className="font-medium text-gray-700 mb-3">AI SUMMARY:</h4>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                  {question.summary || ''}
                                </p>
                              </div>
                              
                              <div>
                                <h4 className="font-medium text-gray-700 mb-3">CATEGORIES (MULTI-SELECT) Bar Chart:</h4>
                                <div className="space-y-3">
                                  {(question.categories || [])
                                    .slice()
                                    .sort((a: any, b: any) => (b.percentage || 0) - (a.percentage || 0))
                                    .map((item: any, index: number) => {
                                      const colors = ["bg-blue-500","bg-green-500","bg-purple-500","bg-orange-500","bg-pink-500","bg-gray-500","bg-indigo-500","bg-red-500","bg-yellow-500","bg-teal-500"];
                                      const color = colors[index % colors.length];
                                      const pct = Math.max(0, Math.min(100, Number(item.percentage) || 0));
                                      return (
                                        <div key={index} className="flex items-center space-x-3">
                                          <div className="w-32 text-sm text-gray-600 truncate">{item.name}</div>
                                          <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                                            <div 
                                              className={`${color} h-6 rounded-full flex items-center justify-end pr-2`}
                                              style={{ width: `${pct}%` }}
                                            >
                                              <span className="text-xs text-white font-medium">{pct}</span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            </div>

                            {/* Right Column - Quotes */}
                            <div>
                              <h4 className="font-medium text-gray-700 mb-3">QUOTES</h4>
                              <div className="space-y-4">
                                {(question.verbatims || []).map((q: any, idx: number) => (
                                  <div key={idx} className="bg-gray-50 border rounded-lg p-4">
                                    <div className="flex flex-wrap gap-1 mb-2">
                                      {(q.tags || []).map((tag: string, tagIndex: number) => (
                                        <span key={tagIndex} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                    <p className="text-sm text-gray-700 italic">"{q.quote}"</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No analysis yet. Click Generate to analyze your simulations.</div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="human" className="space-y-6 mt-6">
              <div className="space-y-6">
                <div className="bg-white border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Human Analysis</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateHumanAnalysis}
                      disabled={isGeneratingHumanAnalysis}
                      className="flex items-center gap-2"
                    >
                      {isGeneratingHumanAnalysis ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Generate
                        </>
                      )}
                    </Button>
                  </div>
                  {/* Content */}
                  {isGeneratingHumanAnalysis ? (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin" /> Generating analysis...
                    </div>
                  ) : humanAnalysis && humanAnalysis.length > 0 ? (
                    <div className="space-y-8">
                      {humanAnalysis.map((question: any, questionIdx: number) => (
                        <div key={questionIdx} className="border-t pt-6 first:border-t-0 first:pt-0">
                          <h4 className="text-lg font-semibold text-gray-800 mb-4">
                            {questionIdx + 1}. {question.question || `Question ${questionIdx + 1}`}
                          </h4>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column - AI Summary and Chart */}
                            <div className="space-y-6">
                              <div>
                                <h4 className="font-medium text-gray-700 mb-3">AI SUMMARY:</h4>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                  {question.summary || ''}
                                </p>
                              </div>
                              
                              <div>
                                <h4 className="font-medium text-gray-700 mb-3">CATEGORIES (MULTI-SELECT) Bar Chart:</h4>
                                <div className="space-y-3">
                                  {(question.categories || [])
                                    .slice()
                                    .sort((a: any, b: any) => (b.percentage || 0) - (a.percentage || 0))
                                    .map((item: any, index: number) => {
                                      const colors = ["bg-blue-500","bg-green-500","bg-purple-500","bg-orange-500","bg-pink-500","bg-gray-500","bg-indigo-500","bg-red-500","bg-yellow-500","bg-teal-500"];
                                      const color = colors[index % colors.length];
                                      const pct = Math.max(0, Math.min(100, Number(item.percentage) || 0));
                                      return (
                                        <div key={index} className="flex items-center space-x-3">
                                          <div className="w-32 text-sm text-gray-600 truncate">{item.name}</div>
                                          <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                                            <div 
                                              className={`${color} h-6 rounded-full flex items-center justify-end pr-2`}
                                              style={{ width: `${pct}%` }}
                                            >
                                              <span className="text-xs text-white font-medium">{pct}</span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            </div>

                            {/* Right Column - Quotes */}
                            <div>
                              <h4 className="font-medium text-gray-700 mb-3">QUOTES</h4>
                              <div className="space-y-4">
                                {(question.verbatims || []).map((q: any, idx: number) => (
                                  <div key={idx} className="bg-gray-50 border rounded-lg p-4">
                                    <div className="flex flex-wrap gap-1 mb-2">
                                      {(q.tags || []).map((tag: string, tagIndex: number) => (
                                        <span key={tagIndex} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                    <p className="text-sm text-gray-700 italic">"{q.quote}"</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No analysis yet. Click Generate to analyze your human interviews.</div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Combined tab - commented out for now, will be implemented later */}
            {/* <TabsContent value="combined" className="space-y-6 mt-6">
              <div className="space-y-6">
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">QUESTION 1: What aspects of the new footwear line does the participant like most?</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-3">AI SUMMARY:</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Combined analysis reveals a balanced preference for both aesthetic and functional aspects. Design and style lead the preferences, closely followed by comfort and quality. Sustainability emerges as a significant factor, while practical considerations like fit and durability are also important. The data shows consumers want both style and substance.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-700 mb-3">CATEGORIES (MULTI-SELECT) Bar Chart:</h4>
                        <div className="space-y-3">
                          {[
                            { category: "Design and Style", value: 48, color: "bg-blue-500" },
                            { category: "Comfort", value: 44, color: "bg-green-500" },
                            { category: "Quality", value: 40, color: "bg-purple-500" },
                            { category: "Color and Pattern", value: 30, color: "bg-orange-500" },
                            { category: "Sustainability", value: 29, color: "bg-pink-500" },
                            { category: "Material and Texture", value: 18, color: "bg-gray-500" },
                            { category: "Fit", value: 16, color: "bg-indigo-500" },
                            { category: "Durability", value: 14, color: "bg-red-500" },
                            { category: "Visual Interest", value: 12, color: "bg-yellow-500" },
                            { category: "Unique Features", value: 10, color: "bg-teal-500" }
                          ].map((item, index) => (
                            <div key={index} className="flex items-center space-x-3">
                              <div className="w-32 text-sm text-gray-600 truncate">{item.category}</div>
                              <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                                <div 
                                  className={`${item.color} h-6 rounded-full flex items-center justify-end pr-2`}
                                  style={{ width: `${(item.value / 60) * 100}%` }}
                                >
                                  <span className="text-xs text-white font-medium">{item.value}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-3">QUOTES 5</h4>
                      <div className="space-y-4">
                        {[
                          {
                            tags: ["Design and Style", "Comfort"],
                            quote: "These shoes are the perfect combination of style and comfort. I can wear them all day and they still look amazing. The design is trendy but not too flashy."
                          },
                          {
                            tags: ["Quality", "Sustainability"],
                            quote: "I appreciate the quality craftsmanship and the fact that they're made sustainably. It's nice to have shoes that look good and align with my values."
                          },
                          {
                            tags: ["Color and Pattern", "Visual Interest"],
                            quote: "The color combinations are really eye-catching without being overwhelming. They add just the right amount of visual interest to my outfits."
                          },
                          {
                            tags: ["Comfort", "Fit"],
                            quote: "The fit is perfect and they're incredibly comfortable. I've worn them on long walks and my feet never hurt. Plus, they look great with everything."
                          },
                          {
                            tags: ["Material and Texture", "Durability"],
                            quote: "The materials feel premium and durable. I can tell these will last a long time, which makes the investment worthwhile."
                          }
                        ].map((quote, index) => (
                          <div key={index} className="bg-gray-50 border rounded-lg p-4">
                            <div className="flex flex-wrap gap-1 mb-2">
                              {quote.tags.map((tag, tagIndex) => (
                                <span key={tagIndex} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <p className="text-sm text-gray-700 italic">"{quote.quote}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent> */}
          </Tabs>
        </TabsContent>

        
      </Tabs>

      {/* Target Segment Selection Modal */}
      <TargetSegmentSelectionModal
        isOpen={showTargetSegmentModal}
        onClose={() => {
          setShowTargetSegmentModal(false);
          setAnalysisStep('idle');
          setAnalysisMessage('');
          setAnalysisData(null);
          setSourceData(null);
        }}
        segments={targetSegments}
        onGenerate={handleGeneratePersonasWithSegments}
        isLoading={isGeneratingPersonas}
        analysisStep={analysisStep}
        analysisMessage={analysisMessage}
        analysisData={analysisData}
        sourceData={sourceData}
      />
    </div>
  );
}
