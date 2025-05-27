import { useState, useCallback } from "react";
import { TiktokenModel } from "@dqbd/tiktoken";

export function useCredits(initialCredits: number | null = null) {
  const [availableCredits, setAvailableCredits] = useState<number | null>(initialCredits);

  const fetchUserCredits = useCallback(async () => {
    try {
      const response = await fetch(`/api/deduct-credits`);
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const data = await response.json();
      setAvailableCredits(data.available_credits);
      return data.available_credits;
    } catch (err) {
      console.error("Failed to fetch user credits:", err);
      throw err;
    }
  }, []);

  const deductCredits = useCallback(
    async (inputTokens: number, outputTokens: number, model: TiktokenModel) => {
      try {
        const deductResponse = await fetch('/api/deduct-credits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input_tokens: inputTokens, output_tokens: outputTokens, model }),
        });
        if (!deductResponse.ok) throw new Error(`Error deducting credits: ${deductResponse.status}`);
        const deductData = await deductResponse.json();
        setAvailableCredits(deductData.remaining_credits);
        return deductData;
      } catch (error) {
        console.error("Error deducting credits:", error);
        throw error;
      }
    },
    []
  );

  return { availableCredits, setAvailableCredits, fetchUserCredits, deductCredits };
}