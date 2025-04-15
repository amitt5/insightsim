import { useState, useEffect, useCallback } from "react";

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
      setPersonas(data);
      return data;
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