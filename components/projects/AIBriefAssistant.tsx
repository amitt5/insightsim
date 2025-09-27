"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIBriefAssistantProps {
  onBriefGenerated?: (brief: string) => void;
}

export default function AIBriefAssistant({ onBriefGenerated }: AIBriefAssistantProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI Brief Assistant, an experienced market researcher. I'm here to help you create a comprehensive research brief. Let's start by understanding your project. What is the main objective of your research?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedBrief, setGeneratedBrief] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Simulate AI response for now
      // TODO: Replace with actual AI API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Thank you for that information. That's very helpful! Can you tell me more about your target audience? Who are the people you want to understand better?",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
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

  const handleGenerateBrief = () => {
    // TODO: Implement brief generation logic
    const sampleBrief = `# Research Brief

## Project Overview
Based on our conversation, here's a comprehensive research brief for your project.

## Objectives
- [To be filled based on conversation]

## Target Audience
- [To be filled based on conversation]

## Research Questions
- [To be filled based on conversation]

## Methodology
- [To be filled based on conversation]

## Timeline
- [To be filled based on conversation]

## Success Metrics
- [To be filled based on conversation]`;

    setGeneratedBrief(sampleBrief);
    onBriefGenerated?.(sampleBrief);
    
    toast({
      title: "Brief Generated",
      description: "Your research brief has been generated. Please review and make any necessary adjustments.",
    });
  };

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden">
      {/* Chat Interface - Left Side */}
      <div className="flex-1 flex flex-col border-r">
        {/* Chat Header */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">AI Brief Assistant</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Experienced market researcher helping you create a comprehensive brief
          </p>
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
            {!generatedBrief && (
              <Button
                onClick={handleGenerateBrief}
                variant="outline"
                size="sm"
                disabled={messages.length < 3}
              >
                Generate Brief
              </Button>
            )}
          </div>
        </div>

        {/* Brief Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {generatedBrief ? (
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-900 font-mono">
                {generatedBrief}
              </pre>
            </div>
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
