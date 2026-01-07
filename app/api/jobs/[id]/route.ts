/**
 * Job Status API Endpoint
 * Get the current status of a job
 *
 * GET /api/jobs/[id]
 * Returns: Job details with progress percentage and current stage
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Job, JobStatusResponse, AgentType } from '@/types/jobs';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate user
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    // 2. Get user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 3. Get job (ensure user owns it)
    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // 4. Calculate progress and current stage
    const progress = calculateProgress(job);
    const currentStage = getCurrentStage(job);

    // 5. Return job status
    const response: JobStatusResponse = {
      ...job,
      progress_percentage: progress,
      current_stage: currentStage,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Job status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Calculate overall progress percentage (0-100)
 */
function calculateProgress(job: Job): number {
  let completed = 0;
  const total = 3;

  if (job.extractor_status === 'completed') completed++;
  if (job.set_designer_status === 'completed') completed++;
  if (job.cinematographer_status === 'completed') completed++;

  return Math.round((completed / total) * 100);
}

/**
 * Get the currently processing stage
 */
function getCurrentStage(job: Job): AgentType | null {
  // If job is completed or failed, no current stage
  if (job.status === 'completed' || job.status === 'failed') {
    return null;
  }

  // Check which stage is currently processing
  if (job.extractor_status === 'processing') return 'extractor';
  if (job.set_designer_status === 'processing') return 'set_designer';
  if (job.cinematographer_status === 'processing') return 'cinematographer';

  // If nothing is processing but job status is "processing",
  // next stage is about to start
  if (job.extractor_status === 'pending') return 'extractor';
  if (job.set_designer_status === 'pending') return 'set_designer';
  if (job.cinematographer_status === 'pending') return 'cinematographer';

  return null;
}
