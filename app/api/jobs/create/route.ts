/**
 * Job Creation API Endpoint
 * Creates a new job and adds it to the processing queue
 *
 * POST /api/jobs/create
 * Body: { input_image_key: string, vibe: string }
 * Returns: { job_id: string, estimated_duration_seconds: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { creditManager } from '@/lib/credits/manager';
import { jobQueue } from '@/lib/queue/manager';
import { storageClient } from '@/lib/storage/client';
import { z } from 'zod';

// Validation schema
const createJobSchema = z.object({
  input_image_key: z.string().min(1),
  vibe: z.enum(['minimalist', 'eco_friendly', 'high_energy', 'luxury_noir']),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate request
    const body = await req.json();
    const validation = createJobSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { input_image_key, vibe } = validation.data;

    // 3. Get user from database
    const supabase = createServerSupabaseClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 4. Check credit balance
    const creditsRequired = 1;
    if (user.credits < creditsRequired) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          credits_required: creditsRequired,
          credits_available: user.credits,
        },
        { status: 402 }
      );
    }

    // 5. Construct full R2/S3 URL for input image
    const inputImageUrl = storageClient.getPublicUrl(input_image_key);

    // 6. Create job record in database
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        input_image_url: inputImageUrl,
        vibe,
        status: 'pending',
        credits_used: creditsRequired,
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('Failed to create job:', jobError);
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
    }

    console.log(`[API] Created job ${job.id} for user ${user.id}`);

    // 7. Deduct credit (atomic operation)
    try {
      await creditManager.deduct(user.id, creditsRequired, job.id);
    } catch (creditError) {
      console.error('Failed to deduct credits:', creditError);

      // Rollback: Delete job
      await supabase.from('jobs').delete().eq('id', job.id);

      return NextResponse.json(
        { error: 'Failed to process credit deduction' },
        { status: 500 }
      );
    }

    // 8. Add job to processing queue (async, don't wait)
    jobQueue.addJob(job.id).catch((error) => {
      console.error('Failed to add job to queue:', error);
    });

    // 9. Return response immediately (job will process in background)
    return NextResponse.json(
      {
        job_id: job.id,
        estimated_duration_seconds: 60,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Job creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
