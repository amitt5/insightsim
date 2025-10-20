"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { AnalysisProgress } from "@/utils/personaAnalysis";

type AnalysisStep = 'idle' | 'analyzing_requirements' | 'source_selection' | 'generating_personas' | 'completed';

interface TargetSegmentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  segments: string[];
  onGenerate: (selectedSegments: string[]) => void;
  isLoading?: boolean;
  analysisStep?: AnalysisStep;
  analysisMessage?: string;
}

export function TargetSegmentSelectionModal({
  isOpen,
  onClose,
  segments,
  onGenerate,
  isLoading = false,
  analysisStep: externalAnalysisStep,
  analysisMessage: externalAnalysisMessage,
}: TargetSegmentSelectionModalProps) {
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [internalAnalysisStep, setInternalAnalysisStep] = useState<AnalysisStep>('idle');
  const [internalAnalysisMessage, setInternalAnalysisMessage] = useState<string>('');
  
  // Use external props if provided, otherwise use internal state
  const analysisStep = externalAnalysisStep ?? internalAnalysisStep;
  const analysisMessage = externalAnalysisMessage ?? internalAnalysisMessage;

  const handleSegmentToggle = (segment: string, checked: boolean) => {
    if (checked) {
      setSelectedSegments((prev) => [...prev, segment]);
    } else {
      setSelectedSegments((prev) => prev.filter((s) => s !== segment));
    }
  };

  const handleGenerate = () => {
    if (selectedSegments.length > 0) {
      setInternalAnalysisStep('analyzing_requirements');
      setInternalAnalysisMessage('System Analyzing Requirements...');
      onGenerate(selectedSegments);
    }
  };

  const handleClose = () => {
    setSelectedSegments([]);
    setInternalAnalysisStep('idle');
    setInternalAnalysisMessage('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Select Target Segments</DialogTitle>
          <DialogDescription>
            Choose the target audience segments you'd like to generate personas for. 
            You can select one or more segments.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {segments.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">
                Generating target segments...
              </span>
            </div>
          ) : analysisStep === 'idle' ? (
            <div className="space-y-3">
              {segments.map((segment, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`segment-${index}`}
                    checked={selectedSegments.includes(segment)}
                    onCheckedChange={(checked) =>
                      handleSegmentToggle(segment, checked as boolean)
                    }
                    disabled={isLoading}
                  />
                  <label
                    htmlFor={`segment-${index}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {segment}
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <span className="ml-2 text-sm text-gray-700">
                {analysisMessage}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          {analysisStep === 'idle' ? (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={selectedSegments.length === 0 || isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  `Generate Personas (${selectedSegments.length})`
                )}
              </Button>
            </>
          ) : (
            <div className="w-full text-center">
              <div className="text-sm text-gray-500">
                Analysis in progress... This may take a few moments.
              </div>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
