import { CREDIT_RATES } from '@/utils/openai';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";

interface ModelSelectorWithCreditsProps {
  modelInUse: string;
  setModelInUse: (model: string) => void;
}

export const ModelSelectorWithCredits: React.FC<ModelSelectorWithCreditsProps> = ({ modelInUse, setModelInUse, availableCredits }) => (
  <div className="flex items-center gap-4 p-3 rounded-md bg-muted/50 border border-muted">
    <Select
      value={modelInUse}
      onValueChange={(value: string) => setModelInUse(value)}
    >
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(CREDIT_RATES).map(([model, rates]) => (
          <SelectItem key={model} value={model}>
            {model} 
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
); 