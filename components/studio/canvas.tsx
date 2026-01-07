'use client';

import { useRef, useEffect } from 'react';
import { JobStatusResponse } from '@/types/jobs';
import { PipelineStage } from './pipeline-stage';
import { ArrowRight } from 'lucide-react';

interface CanvasProps {
  job: JobStatusResponse | null;
  isLoading: boolean;
}

export function Canvas({ job, isLoading }: CanvasProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active stage
  useEffect(() => {
    if (!job || !scrollContainerRef.current) return;

    let scrollToIndex = 0;
    if (job.extractor_status === 'completed') scrollToIndex = 1;
    if (job.set_designer_status === 'completed') scrollToIndex = 2;
    if (job.cinematographer_status === 'completed') scrollToIndex = 3;

    const container = scrollContainerRef.current;
    const targetX = scrollToIndex * 432; // 400px width + 32px gap

    container.scrollTo({
      left: targetX,
      behavior: 'smooth',
    });
  }, [job?.extractor_status, job?.set_designer_status, job?.cinematographer_status]);

  if (!job && isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-400">Loading job...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Job not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">Generating Your Ad</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Progress:</span>
            <span className="text-lg font-bold text-blue-400">{job.progress_percentage}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${job.progress_percentage}%` }}
          />
        </div>

        {/* Status Message */}
        <div className="mt-3 text-sm text-gray-400">
          {job.status === 'completed' ? (
            <span className="text-green-400 font-semibold">✓ Complete! Your video is ready.</span>
          ) : job.status === 'failed' ? (
            <span className="text-red-400 font-semibold">✗ Failed: {job.error_message}</span>
          ) : job.current_stage ? (
            <span>
              Currently processing:{' '}
              <span className="font-semibold text-white">
                {job.current_stage === 'extractor' && 'Removing background'}
                {job.current_stage === 'set_designer' && 'Generating scene'}
                {job.current_stage === 'cinematographer' && 'Creating video'}
              </span>
            </span>
          ) : (
            <span>Starting pipeline...</span>
          )}
        </div>
      </div>

      {/* Horizontal Scrollable Canvas */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto pb-8 smooth-scroll"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        <div className="inline-flex gap-8 px-8 min-w-max">
          {/* Stage 0: Original Upload */}
          <PipelineStage
            title="Original Image"
            status="completed"
            imageUrl={job.input_image_url}
          />

          <ArrowRight className="w-8 h-8 text-gray-600 self-center flex-shrink-0" />

          {/* Stage 1: Background Removed */}
          <PipelineStage
            title="1. Background Removal"
            status={job.extractor_status}
            imageUrl={job.extractor_output_url}
            error={job.extractor_error}
          />

          <ArrowRight className="w-8 h-8 text-gray-600 self-center flex-shrink-0" />

          {/* Stage 2: Set Design */}
          <PipelineStage
            title="2. Scene Design"
            status={job.set_designer_status}
            imageUrl={job.set_designer_output_url}
            error={job.set_designer_error}
          />

          <ArrowRight className="w-8 h-8 text-gray-600 self-center flex-shrink-0" />

          {/* Stage 3: Cinematic Video */}
          <PipelineStage
            title="3. Cinematic Video"
            status={job.cinematographer_status}
            imageUrl={job.cinematographer_output_url}
            error={job.cinematographer_error}
            isVideo
          />
        </div>
      </div>

      {/* Download Button (when complete) */}
      {job.status === 'completed' && job.cinematographer_output_url && (
        <div className="max-w-6xl mx-auto flex justify-center">
          <a
            href={job.cinematographer_output_url}
            download
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-lg transition inline-flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download Video
          </a>
        </div>
      )}
    </div>
  );
}
