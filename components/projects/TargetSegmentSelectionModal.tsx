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
import { AnalysisProgress, AnalysisResult, SourceSelection } from "@/utils/personaAnalysis";

type AnalysisStep = 'idle' | 'analyzing_requirements' | 'source_selection' | 'generating_personas' | 'completed';

// Scrolling Analysis Display Component
function AnalysisScrollingDisplay({ 
  analysisData, 
  sourceData, 
  step 
}: { 
  analysisData?: AnalysisResult; 
  sourceData?: SourceSelection[]; 
  step?: AnalysisStep;
}) {
  const getDisplayText = () => {
    console.log('AnalysisScrollingDisplay - step:', step);
    console.log('AnalysisScrollingDisplay - analysisData:', analysisData);
    console.log('AnalysisScrollingDisplay - sourceData:', sourceData);
    
    // Show data whenever it's available, regardless of exact step
    if (sourceData && sourceData.length > 0) {
      console.log('AnalysisScrollingDisplay - Showing sourceData');
      return JSON.stringify(sourceData, null, 2);
    }
    if (analysisData) {
      console.log('AnalysisScrollingDisplay - Showing analysisData');
      return JSON.stringify(analysisData, null, 2);
    }
    
    console.log('AnalysisScrollingDisplay - No data available');
    return '';
  };

  const displayText = getDisplayText();
  
  console.log('AnalysisScrollingDisplay - displayText:', displayText);
  //later for amit111
//   if (!displayText) {
//     return (
//       <div className="bg-gray-50 rounded-lg p-4 border">
//         <div className="text-sm text-gray-600">
//           No analysis data available yet...
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-gray-50 rounded-lg p-4 border max-h-48 overflow-y-auto">
//       <div className="text-sm text-gray-800 font-mono whitespace-pre-wrap">
//         {displayText}
//       </div>
//     </div>
//   );
}

interface TargetSegmentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  segments: string[];
  onGenerate: (selectedSegments: string[]) => void;
  isLoading?: boolean;
  analysisStep?: AnalysisStep;
  analysisMessage?: string;
  analysisData?: AnalysisResult;
  sourceData?: SourceSelection[];
}

export function TargetSegmentSelectionModal({
  isOpen,
  onClose,
  segments,
  onGenerate,
  isLoading = false,
  analysisStep: externalAnalysisStep,
  analysisMessage: externalAnalysisMessage,
  analysisData,
  sourceData,
}: TargetSegmentSelectionModalProps) {
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [internalAnalysisStep, setInternalAnalysisStep] = useState<AnalysisStep>('idle');
  const [internalAnalysisMessage, setInternalAnalysisMessage] = useState<string>('');
  
  // Use external props if provided, otherwise use internal state
  const analysisStep = externalAnalysisStep ?? internalAnalysisStep;
  const analysisMessage = externalAnalysisMessage ?? internalAnalysisMessage;
  
  // Debug logging
  console.log('TargetSegmentSelectionModal - Props:', {
    analysisStep,
    analysisMessage,
    analysisData,
    sourceData,
    externalAnalysisStep,
    externalAnalysisMessage
  });

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
            <div className="py-4">
              <div className="text-center mb-4">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-2" />
                <span className="text-sm text-gray-700 font-medium">
                  {analysisMessage}
                </span>
              </div>
              
              {/* Scrolling Analysis Display */}
              <div className="mt-4">
                <AnalysisScrollingDisplay 
                  analysisData={analysisData}
                  sourceData={sourceData}
                  step={analysisStep}
                />
              </div>
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
