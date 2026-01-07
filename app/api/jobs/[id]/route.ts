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
import { creditManager } from '@/lib/credits/manager';
import { storageClient } from '@/lib/storage/client';
import { Job, JobStatusResponse, AgentType } from '@/types/jobs';

export const dynamic = 'force-dynamic';

/**
 * Clean up all storage files associated with a job
 */
async function cleanupJobStorage(jobId: string, job: any): Promise<void> {
  try {
    const result = await storageClient.deleteJobFiles(jobId, job);
    console.log(`[Cleanup] Storage cleanup: ${result.deleted.length} deleted, ${result.failed.length} failed`);
    
    if (result.failed.length > 0) {
      console.warn(`[Cleanup] Failed to delete storage files:`, result.failed);
    }
  } catch (error) {
    console.error(`[Cleanup] Storage cleanup failed for job ${jobId}:`, error);
  }
}

/**
 * Clean up database records related to a job
 */
async function cleanupJobDatabase(supabase: any, jobId: string): Promise<void> {
  // Delete related credit transactions
  const { error: transactionError } = await supabase
    .from('credit_transactions')
    .delete()
    .eq('related_job_id', jobId);

  if (transactionError) {
    console.warn(`[Cleanup] Failed to delete credit transactions:`, transactionError);
  }

  console.log(`[Cleanup] Cleaned up database records for job ${jobId}`);
}

/**
 * DELETE /api/jobs/[id]
 * Delete a job and clean up all associated data
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get job (ensure user owns it)
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    console.log(`[Cleanup] Starting comprehensive cleanup for job ${params.id}`);

    // 1. Clean up storage files
    await cleanupJobStorage(params.id, job);

    // 2. Clean up database records
    await cleanupJobDatabase(supabase, params.id);

    // 3. Refund credits if job was not completed successfully
    let refunded = false;
    if (job.status !== 'completed' && job.credits_used > 0) {
      try {
        await creditManager.refund(user.id, job.credits_used, job.id);
        refunded = true;
      } catch (refundError) {
        console.error('Failed to refund credits:', refundError);
      }
    }

    // 4. Delete the job record (this should be last due to foreign key constraints)
    const { error: deleteError } = await supabase
      .from('jobs')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Failed to delete job:', deleteError);
      return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
    }

    console.log(`[Cleanup] Successfully deleted job ${params.id} and all associated data`);

    return NextResponse.json({ 
      success: true, 
      refunded,
      message: 'Job and all associated files have been permanently deleted'
    });
  } catch (error) {
    console.error('Job delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
