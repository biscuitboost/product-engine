/**
 * Custom hook for polling job status
 * Automatically fetches job status at regular intervals until completion
 */

import { useState, useEffect, useCallback } from 'react';
import { JobStatusResponse } from '@/types/jobs';

export function useJobStatus(jobId: string | null, pollInterval: number = 2000) {
  const [job, setJob] = useState<JobStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobStatus = useCallback(async () => {
    if (!jobId) return;

    try {
      const response = await fetch(`/api/jobs/${jobId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch job status');
      }

      const data = await response.json();
      setJob(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching job status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch job status');
    }
  }, [jobId]);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Fetch immediately
    fetchJobStatus();

    // Set up polling interval
    const interval = setInterval(() => {
      fetchJobStatus();
    }, pollInterval);

    // Stop polling when job is completed or failed
    if (job?.status === 'completed' || job?.status === 'failed') {
      clearInterval(interval);
      setIsLoading(false);
    }

    return () => clearInterval(interval);
  }, [jobId, pollInterval, fetchJobStatus, job?.status]);

  return {
    job,
    isLoading,
    error,
    refetch: fetchJobStatus,
  };
}
