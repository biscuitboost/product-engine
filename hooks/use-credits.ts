/**
 * Custom hook for fetching user's credit balance
 */

import { useState, useEffect } from 'react';

export function useCredits() {
  const [credits, setCredits] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/credits/balance');

      if (!response.ok) {
        throw new Error('Failed to fetch credits');
      }

      const data = await response.json();
      setCredits(data.credits);
      setError(null);
    } catch (err) {
      console.error('Error fetching credits:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch credits');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  return {
    credits,
    isLoading,
    error,
    refetch: fetchCredits,
  };
}
