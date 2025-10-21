"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { runSimulationAPI } from "@/utils/api";
import { 
  BriefAssistantState, 
  createBriefAssistantPrompt, 
  updateBriefAssistantState, 
  generateBriefFromState,
  createInitialBriefAssistantState,
  createBriefGenerationPrompt
} from "@/utils/briefAssistant";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIBriefAssistantProps {
  projectId: string;
  onBriefGenerated?: (brief: string) => void;
}

export default function AIBriefAssistant({ projectId, onBriefGenerated }: AIBriefAssistantProps) {
  const { toast } = useToast();
  const [assistantState, setAssistantState] = useState<BriefAssistantState>(createInitialBriefAssistantState());
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: assistantState.conversationHistory[0].content,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(true);
  const [generatedBrief, setGeneratedBrief] = useState<string>('');
  const [isEditingBrief, setIsEditingBrief] = useState(false);
  const [editedBrief, setEditedBrief] = useState<string>('');
  const [isSavingBrief, setIsSavingBrief] = useState(false);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation state from database on component mount
  useEffect(() => {
    const loadConversationState = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/brief-assistant`);
        if (response.ok) {
          const data = await response.json();
          if (data.conversation) {
            const conversation = data.conversation;
            const loadedState: BriefAssistantState = {
              conversationHistory: conversation.conversation_history || [],
              isReadyToGenerate: conversation.is_ready_to_generate || false,
              briefGenerated: conversation.brief_generated || false,
              requirementsMet: conversation.requirements_met || {
                primaryResearchQuestion: false,
                specificObjectives: false,
                targetAudienceBasics: false,
                howResultsWillBeUsed: false,
                geographicScope: false
              },
              goodToHaveInfo: conversation.good_to_have_info || {
                companyBrandOverview: false,
                productServiceDescription: false,
                researchPrompt: false,
                successCriteria: false,
                competitiveContext: false,
                specificSegments: false,
                previousResearch: false,
                stakeholderInfo: false
              }
            };
            
            setAssistantState(loadedState);
            
            // Convert conversation history to messages for display
            const loadedMessages: Message[] = loadedState.conversationHistory.map((msg, index) => ({
              id: (index + 1).toString(),
              role: msg.role,
              content: msg.content,
              timestamp: new Date() // We don't store timestamps in DB, so use current time
            }));
            
            setMessages(loadedMessages);
            
            if (conversation.generated_brief) {
              setGeneratedBrief(conversation.generated_brief);
            }
          }
        }
      } catch (error) {
        console.error('Error loading conversation state:', error);
        toast({
          title: "Warning",
          description: "Could not load previous conversation. Starting fresh.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingConversation(false);
      }
    };

    loadConversationState();
  }, [projectId, toast]);

  // Save conversation state to database
  const saveConversationState = async (state: BriefAssistantState, brief?: string) => {
    try {
      // First try to update existing conversation
      let response = await fetch(`/api/projects/${projectId}/brief-assistant`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationHistory: state.conversationHistory,
          isReadyToGenerate: state.isReadyToGenerate,
          briefGenerated: state.briefGenerated,
          requirementsMet: state.requirementsMet,
          goodToHaveInfo: state.goodToHaveInfo,
          generatedBrief: brief || generatedBrief
        }),
      });

      // If update fails (no existing conversation), create a new one
      if (!response.ok) {
        response = await fetch(`/api/projects/${projectId}/brief-assistant`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationHistory: state.conversationHistory,
            isReadyToGenerate: state.isReadyToGenerate,
            briefGenerated: state.briefGenerated,
            requirementsMet: state.requirementsMet,
            goodToHaveInfo: state.goodToHaveInfo,
            generatedBrief: brief || generatedBrief
          }),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to save conversation state');
      }
    } catch (error) {
      console.error('Error saving conversation state:', error);
      // Don't show error toast for save failures to avoid interrupting user flow
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    try {
      // Create AI prompt based on current state and user input
      const prompt = createBriefAssistantPrompt(userInput, assistantState);
      
      // Call OpenAI API
      console.log('prompt111', prompt);
      const result = await runSimulationAPI(prompt, 'gpt-4o-mini', 'brief-assistant');
      
      // Parse JSON response
      let assistantResponse = "I'm sorry, I didn't get a proper response. Could you please try again?";
      try {
        const parsedResponse = JSON.parse(result.reply || '{}');
        assistantResponse = parsedResponse.response || assistantResponse;
      } catch (error) {
        console.error('Error parsing assistant response:', error);
        assistantResponse = result.reply || assistantResponse;
      }
      
      // Update assistant state
      const newState = updateBriefAssistantState(assistantState, userInput, assistantResponse);
      console.log('newState11133', newState);
      setAssistantState(newState);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Save state after each interaction
      await saveConversationState(newState);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleGenerateBrief = async () => {
    setIsGeneratingBrief(true);
    try {
      const briefPrompt = createBriefGenerationPrompt(assistantState.conversationHistory);
      const briefResult = await runSimulationAPI(briefPrompt, 'gpt-4o-mini', 'brief-generation');
      
      // Parse JSON response for brief
      let aiGeneratedBrief = generateBriefFromState(assistantState);
      try {
        const parsedBrief = JSON.parse(briefResult.reply || '{}');
        aiGeneratedBrief = parsedBrief.brief || aiGeneratedBrief;
      } catch (error) {
        console.error('Error parsing brief response:', error);
        aiGeneratedBrief = briefResult.reply || aiGeneratedBrief;
      }
      
      const updatedState = { ...assistantState, briefGenerated: true };
      setAssistantState(updatedState);
      setGeneratedBrief(aiGeneratedBrief);
      onBriefGenerated?.(aiGeneratedBrief);
      
      // Save state with generated brief
      await saveConversationState(updatedState, aiGeneratedBrief);
      
      // Save brief to project
      await saveBriefToProject(aiGeneratedBrief);
      
      toast({
        title: "Brief Generated",
        description: "Your research brief has been generated. Please review and make any necessary adjustments.",
      });
    } catch (error) {
      console.error('Error generating brief:', error);
      // Fallback to simple brief generation
      const brief = generateBriefFromState(assistantState);
      const updatedState = { ...assistantState, briefGenerated: true };
      setAssistantState(updatedState);
      setGeneratedBrief(brief);
      onBriefGenerated?.(brief);
      await saveConversationState(updatedState, brief);
      
      // Save brief to project
      await saveBriefToProject(brief);
      
      toast({
        title: "Brief Generated",
        description: "Your research brief has been generated. Please review and make any necessary adjustments.",
      });
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  const saveBriefToProject = async (briefText: string) => {
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brief_text: briefText
        }),
      });
    } catch (error) {
      console.error('Error saving brief to project:', error);
      // Don't show error toast for this as it's not critical to user flow
    }
  };

  const handleSaveBrief = async () => {
    if (!editedBrief.trim()) return;
    
    setIsSavingBrief(true);
    try {
      await saveBriefToProject(editedBrief.trim());
      setGeneratedBrief(editedBrief.trim());
      setIsEditingBrief(false);
      toast({
        title: "Brief Saved",
        description: "Your research brief has been saved to the project.",
      });
    } catch (error) {
      console.error('Error saving brief:', error);
      toast({
        title: "Error",
        description: "Failed to save brief. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingBrief(false);
    }
  };

  const handleEditBrief = () => {
    setEditedBrief(generatedBrief);
    setIsEditingBrief(true);
  };

  const handleCancelEdit = () => {
    setIsEditingBrief(false);
    setEditedBrief('');
  };

  const handleStartNewConversation = async () => {
    try {
      // Reset the existing conversation by making a PATCH request
      const response = await fetch(`/api/projects/${projectId}/brief-assistant`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createInitialBriefAssistantState()),
      });

      if (response.ok) {
        // Reset local state
        const newState = createInitialBriefAssistantState();
        setAssistantState(newState);
        setMessages([{
          id: '1',
          role: 'assistant',
          content: newState.conversationHistory[0].content,
          timestamp: new Date()
        }]);
        setGeneratedBrief('');
        
        toast({
          title: "Conversation Reset",
          description: "Your conversation has been reset. You can now start fresh with the AI Brief Assistant.",
        });
      } else {
        throw new Error('Failed to reset conversation');
      }
    } catch (error) {
      console.error('Error resetting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to reset conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Show loading state while conversation is being loaded
  if (isLoadingConversation) {
    return (
      <div className="flex h-[600px] border rounded-lg overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading conversation...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden">
      {/* Chat Interface - Left Side */}
      <div className="flex-1 flex flex-col border-r">
        {/* Chat Header */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">AI Brief Assistant</h3>
            </div>
            <Button
              onClick={handleStartNewConversation}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Start New
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Experienced qualitative research consultant helping you create a comprehensive brief through natural conversation
          </p>
          {assistantState.isReadyToGenerate && !assistantState.briefGenerated && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              ✓ Ready to generate your research brief - click the "Generate Brief" button
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
              )}
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4 text-blue-600" />
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              className="flex-1 min-h-[60px] max-h-[120px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Brief Preview - Right Side */}
      <div className="flex-1 flex flex-col">
        {/* Brief Header */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Generated Brief</h3>
            <div className="flex gap-2">
              {!generatedBrief && (
                <Button
                  onClick={handleGenerateBrief}
                  variant="outline"
                  size="sm"
                  disabled={isGeneratingBrief}
                >
                  {isGeneratingBrief ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    "Generate Brief"
                  )}
                </Button>
              )}
              {generatedBrief && !isEditingBrief && (
                <Button
                  onClick={handleEditBrief}
                  variant="outline"
                  size="sm"
                >
                  Edit
                </Button>
              )}
              {isEditingBrief && (
                <>
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveBrief}
                    size="sm"
                    disabled={isSavingBrief}
                  >
                    {isSavingBrief ? "Saving..." : "Save"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Brief Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {generatedBrief ? (
            isEditingBrief ? (
              <Textarea
                value={editedBrief}
                onChange={(e) => setEditedBrief(e.target.value)}
                className="min-h-[400px] resize-none font-mono text-sm"
                placeholder="Edit your research brief here..."
              />
            ) : (
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-900 font-mono">
                  {generatedBrief}
                </pre>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">Brief Preview</p>
                <p className="text-sm">
                  Continue the conversation to generate your research brief
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
