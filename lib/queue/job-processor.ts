/**
 * Job Processor
 * Core orchestration logic for the 3-stage AI pipeline
 * Processes jobs sequentially through: Extractor → Set Designer → Cinematographer
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { switchboard } from '@/lib/fal/switchboard';
import { storageClient } from '@/lib/storage/client';
import { creditManager } from '@/lib/credits/manager';
import { AgentType } from '@/lib/fal/adapters/base';
import pRetry from 'p-retry';

class JobProcessor {
  /**
   * Process a complete job through all 3 stages
   */
  async processJob(jobId: string): Promise<void> {
    console.log(`\n========================================`);
    console.log(`[JobProcessor] Starting job ${jobId}`);
    console.log(`========================================\n`);

    const supabase = createServerSupabaseClient();

    try {
      // Mark job as processing
      await supabase
        .from('jobs')
        .update({ status: 'processing' })
        .eq('id', jobId);

      // Stage 1: Background Removal (Extractor)
      await this.processStage(jobId, 'extractor');

      // Stage 2: Set Design (Set Designer)
      await this.processStage(jobId, 'set_designer');

      // Stage 3: Video Generation (Cinematographer)
      await this.processStage(jobId, 'cinematographer');

      // Mark job as completed
      await this.markJobComplete(jobId);

      console.log(`\n[JobProcessor] ✅ Job ${jobId} completed successfully!\n`);
    } catch (error) {
      console.error(`\n[JobProcessor] ❌ Job ${jobId} failed:`, error);
      await this.markJobFailed(jobId, error);
    }
  }

  /**
   * Process a single stage of the pipeline
   */
  async processStage(jobId: string, agentType: AgentType): Promise<void> {
    console.log(`\n[JobProcessor] 🎬 Starting stage: ${agentType} for job ${jobId}`);

    const supabase = createServerSupabaseClient();

    // Get job details
    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (!job) {
      throw new Error('Job not found');
    }

    // Get input URL for this stage
    const inputUrl = this.getStageInputUrl(job, agentType);
    if (!inputUrl) {
      throw new Error(`No input URL for stage: ${agentType}`);
    }

    // Get model adapter and config from database
    const adapter = await switchboard.getAdapter(agentType);
    const modelConfig = await switchboard.getModelConfig(agentType);

    // Get prompt (for set_designer and cinematographer)
    const { prompt, negativePrompt } = await this.getPrompts(job, agentType);

    // Mark stage as processing
    await supabase
      .from('jobs')
      .update({
        [`${agentType}_status`]: 'processing',
        [`${agentType}_started_at`]: new Date().toISOString(),
        [`${agentType}_model_id`]: modelConfig.id,
      })
      .eq('id', jobId);

    // Execute model with retries (up to 2 retries = 3 total attempts)
    const output = await pRetry(
      () =>
        adapter.execute({
          jobId,
          inputUrl,
          config: modelConfig.config,
          prompt,
          negativePrompt,
        }),
      {
        retries: 2,
        onFailedAttempt: (error) => {
          console.warn(
            `[JobProcessor] ⚠️  Attempt ${error.attemptNumber} failed for ${agentType}:`,
            error.message
          );
          console.warn(`[JobProcessor] Retrying... (${error.retriesLeft} retries left)`);
        },
      }
    );

    console.log(`[JobProcessor] 📦 Model output URL: ${output.outputUrl}`);

    // Copy output to permanent storage (R2/S3)
    // fal.ai URLs expire after 24 hours, so we need to copy them
    const fileExtension = this.getFileExtension(agentType);
    const storageKey = storageClient.generateJobOutputKey(jobId, agentType, fileExtension);

    console.log(`[JobProcessor] 💾 Copying to permanent storage: ${storageKey}`);

    const permanentUrl = await storageClient.copyFromUrl(output.outputUrl, storageKey);

    console.log(`[JobProcessor] ✅ Permanent URL: ${permanentUrl}`);

    // Update job with stage output
    await supabase
      .from('jobs')
      .update({
        [`${agentType}_status`]: 'completed',
        [`${agentType}_output_url`]: permanentUrl,
        [`${agentType}_completed_at`]: new Date().toISOString(),
      })
      .eq('id', jobId);

    console.log(`[JobProcessor] ✅ Stage ${agentType} completed for job ${jobId}\n`);
  }

  /**
   * Get input URL for a specific stage
   */
  private getStageInputUrl(job: any, agentType: AgentType): string | null {
    switch (agentType) {
      case 'extractor':
        return job.input_image_url; // Original uploaded image
      case 'set_designer':
        return job.extractor_output_url; // Transparent PNG from BiRefNet
      case 'cinematographer':
        return job.set_designer_output_url; // Composite image from Flux Fill
      default:
        return null;
    }
  }

  /**
   * Get prompts for models that need them
   */
  private async getPrompts(
    job: any,
    agentType: AgentType
  ): Promise<{ prompt?: string; negativePrompt?: string }> {
    if (agentType === 'extractor') {
      // BiRefNet doesn't need prompts
      return {};
    }

    const supabase = createServerSupabaseClient();

    // Get vibe prompt from database
    const { data: vibePrompt } = await supabase
      .from('vibe_prompts')
      .select('*')
      .eq('vibe', job.vibe)
      .single();

    if (!vibePrompt) {
      console.warn(`[JobProcessor] ⚠️  No vibe prompt found for vibe: ${job.vibe}`);
      return {};
    }

    if (agentType === 'set_designer') {
      return {
        prompt: vibePrompt.prompt_template,
        negativePrompt: vibePrompt.negative_prompt,
      };
    }

    if (agentType === 'cinematographer') {
      return {
        prompt: vibePrompt.cinematographer_prompt,
      };
    }

    return {};
  }

  /**
   * Get file extension for stage output
   */
  private getFileExtension(agentType: AgentType): string {
    return agentType === 'cinematographer' ? 'mp4' : 'png';
  }

  /**
   * Mark job as completed
   */
  async markJobComplete(jobId: string): Promise<void> {
    const supabase = createServerSupabaseClient();

    // Get job creation time to calculate duration
    const { data: job } = await supabase
      .from('jobs')
      .select('created_at')
      .eq('id', jobId)
      .single();

    const durationMs = job ? Date.now() - new Date(job.created_at).getTime() : null;

    await supabase
      .from('jobs')
      .update({
        status: 'completed',
        total_duration_ms: durationMs,
      })
      .eq('id', jobId);

    console.log(`[JobProcessor] ✅ Job ${jobId} marked as completed (duration: ${durationMs}ms)`);
  }

  /**
   * Mark job as failed and refund credits
   */
  async markJobFailed(jobId: string, error: any): Promise<void> {
    const supabase = createServerSupabaseClient();

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await supabase
      .from('jobs')
      .update({
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', jobId);

    // Refund credits to user
    const { data: job } = await supabase
      .from('jobs')
      .select('user_id, credits_used')
      .eq('id', jobId)
      .single();

    if (job) {
      try {
        await creditManager.refund(job.user_id, job.credits_used, jobId);
        console.log(`[JobProcessor] 💰 Refunded ${job.credits_used} credit(s) to user ${job.user_id}`);
      } catch (refundError) {
        console.error('[JobProcessor] ❌ Failed to refund credits:', refundError);
      }
    }

    console.log(`[JobProcessor] ❌ Job ${jobId} marked as failed: ${errorMessage}`);
  }
}

// Singleton instance
export const jobProcessor = new JobProcessor();
