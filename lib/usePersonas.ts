import { useState, useEffect, useCallback } from "react";

const processTraits = (traits: string | string[]) => {
  let processedTraits: string[] = [];
  if (Array.isArray(traits)) {
    processedTraits = traits;
  } else if (typeof traits === 'string') {
    if (traits.trim().startsWith('[')) {
      try {
        processedTraits = JSON.parse(traits);
      } catch {
        processedTraits = traits.split(',').map((t: string) => t.trim());
      }
    } else {
      processedTraits = traits.split(',').map((t: string) => t.trim());
    }
  }
  return processedTraits;
};

export function usePersonas() {
  const [personas, setPersonas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPersonas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/personas");
      if (!res.ok) throw new Error("Failed to fetch personas");
      const data = await res.json();
      // Process traits for each persona
      const processedData = data.map((persona: any) => ({
        ...persona,
        traits: processTraits(persona.traits)
      }));
      setPersonas(processedData);
      console.log('processedData', processedData)
      return processedData;
    } catch (err: any) {
      setError(err.message || "Unknown error");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  

  // Mutate function to refresh data
  const mutate = useCallback(() => {
    return fetchPersonas();
  }, [fetchPersonas]);

  useEffect(() => {
    fetchPersonas();
  }, [fetchPersonas]);

  return { personas, loading, error, mutate };
} 