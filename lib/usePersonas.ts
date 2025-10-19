"use client"
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

export function usePersonas(projectId?: string | null, fetchAll: boolean = false) {
  const [personas, setPersonas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPersonas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      let data;
      
      if (projectId) {
        // Fetch personas specific to the project
        res = await fetch(`/api/projects/${projectId}/personas`);
        if (!res.ok) throw new Error("Failed to fetch project personas");
        const responseData = await res.json();
        data = responseData.personas; // Project personas API returns { personas: [...] }
      } else if (fetchAll) {
        // Fetch all personas when explicitly requested
        res = await fetch("/api/personas");
        if (!res.ok) throw new Error("Failed to fetch personas");
        data = await res.json();
      } else {
        // Don't fetch anything if no projectId is provided and fetchAll is false
        setPersonas([]);
        setLoading(false);
        return [];
      }
      
      // Process traits for each persona
      const processedData = data.map((persona: any) => {
        console.log('Raw persona from API:', persona);
        const processed = {
          ...persona,
          traits: processTraits(persona.traits)
        };
        console.log('Processed persona:', processed);
        return processed;
      });
      // sort personas by user_id
      // handle case if user_id is null
      processedData.sort((a: any, b: any) => {
        if (a.user_id === null) return 1;
        if (b.user_id === null) return -1;
        return a.user_id.localeCompare(b.user_id);
      });
      // sort personas by created_at date
      processedData.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setPersonas(processedData);
      return processedData;
    } catch (err: any) {
      setError(err.message || "Unknown error");
      return [];
    } finally {
      setLoading(false);
    }
  }, [projectId, fetchAll]);

  

  // Mutate function to refresh data
  const mutate = useCallback(() => {
    return fetchPersonas();
  }, [fetchPersonas]);

  useEffect(() => {
    if (projectId || fetchAll) {
      fetchPersonas();
    } else {
      // If no projectId and fetchAll is false, set loading to false and clear personas
      setLoading(false);
      setPersonas([]);
    }
  }, [fetchPersonas, projectId, fetchAll]);

  return { personas, loading, error, mutate };
} 