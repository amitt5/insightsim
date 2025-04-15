import { useState, useEffect } from "react";

export function usePersonas() {
  const [personas, setPersonas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchPersonas() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/personas");
        if (!res.ok) throw new Error("Failed to fetch personas");
        const data = await res.json();
        if (isMounted) setPersonas(data);
      } catch (err: any) {
        if (isMounted) setError(err.message || "Unknown error");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchPersonas();
    return () => { isMounted = false; };
  }, []);

  return { personas, loading, error };
} 