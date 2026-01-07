'use client';

import { useState } from 'react';
import { UploadZone } from '@/components/studio/upload-zone';
import { VibeChipSelector } from '@/components/studio/vibe-chip-selector';
import { Canvas } from '@/components/studio/canvas';
import { JobHistory } from '@/components/studio/job-history';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, History } from 'lucide-react';
import Link from 'next/link';
import { Vibe, Job } from '@/types/jobs';
import { useCredits } from '@/hooks/use-credits';
import { useJobStatus } from '@/hooks/use-job-status';
import { useJobs } from '@/hooks/use-jobs';

export default function StudioPage() {
  const [uploadedImageKey, setUploadedImageKey] = useState<string | null>(null);
  const [selectedVibe, setSelectedVibe] = useState<Vibe>('minimalist');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [isCreatingJob, setIsCreatingJob] = useState(false);

  const { credits, refetch: refetchCredits } = useCredits();
  const { job, isLoading: isLoadingJob } = useJobStatus(currentJobId);
  const { jobs, isLoading: isLoadingJobs, deleteJob, refetch: refetchJobs } = useJobs();
  const [showHistory, setShowHistory] = useState(false);

  const handleUploadComplete = (imageKey: string) => {
    setUploadedImageKey(imageKey);
  };

  const handleStartGeneration = async () => {
    if (!uploadedImageKey) return;

    setIsCreatingJob(true);

    try {
      const response = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_image_key: uploadedImageKey,
          vibe: selectedVibe,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create job');
      }

      setCurrentJobId(data.job_id);
      refetchCredits(); // Update credit balance
    } catch (error) {
      console.error('Failed to create job:', error);
      alert(error instanceof Error ? error.message : 'Failed to start generation');
    } finally {
      setIsCreatingJob(false);
    }
  };

  const handleReset = () => {
    setUploadedImageKey(null);
    setCurrentJobId(null);
    setSelectedVibe('minimalist');
    refetchJobs();
  };

  const handleSelectJob = (selectedJob: Job) => {
    setCurrentJobId(selectedJob.id);
    setShowHistory(false);
  };

  const handleDeleteJob = async (jobId: string) => {
    const success = await deleteJob(jobId);
    if (success) {
      refetchCredits();
    }
    return success;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 sticky top-0 bg-black z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </Link>
              <h1 className="text-2xl font-bold">Product Ad Studio</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setShowHistory(!showHistory)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
              {currentJobId && (
                <Button onClick={handleReset} variant="outline" size="sm">
                  New Project
                </Button>
              )}
              <div className="text-sm px-4 py-2 bg-gray-900 rounded-lg border border-gray-800">
                Credits: <span className="font-semibold text-blue-400">{credits}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {showHistory ? (
          // Job History View
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Job History</h2>
              <Button
                onClick={() => setShowHistory(false)}
                variant="outline"
                size="sm"
              >
                Back to Studio
              </Button>
            </div>
            <JobHistory
              jobs={jobs}
              onDelete={handleDeleteJob}
              onSelect={handleSelectJob}
              isLoading={isLoadingJobs}
            />
          </div>
        ) : !currentJobId ? (
          // Setup Phase: Upload + Vibe Selection
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Step 1: Upload */}
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">Create Your Product Ad</h2>
                <p className="text-gray-400">
                  Upload your product image, choose a vibe, and let AI create a cinematic video ad
                </p>
              </div>
              <UploadZone onUploadComplete={handleUploadComplete} />
            </div>

            {/* Step 2: Vibe Selection (shown after upload) */}
            {uploadedImageKey && (
              <>
                <div className="border-t border-gray-800 pt-8">
                  <VibeChipSelector selected={selectedVibe} onChange={setSelectedVibe} />
                </div>

                {/* Generate Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={handleStartGeneration}
                    disabled={isCreatingJob || credits < 1}
                    size="lg"
                    className="px-12 py-6 text-lg"
                  >
                    {isCreatingJob ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Starting...
                      </>
                    ) : credits < 1 ? (
                      'Insufficient Credits'
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Generate Ad (1 Credit)
                      </>
                    )}
                  </Button>
                </div>

                {credits < 1 && (
                  <p className="text-center text-sm text-yellow-500">
                    You need at least 1 credit to generate an ad.{' '}
                    <Link href="/billing" className="underline hover:text-yellow-400">
                      Purchase credits
                    </Link>
                  </p>
                )}
              </>
            )}
          </div>
        ) : (
          // Processing Phase: Show Pipeline
          <div className="w-full">
            <Canvas job={job} isLoading={isLoadingJob} />
          </div>
        )}
      </main>
    </div>
  );
}
