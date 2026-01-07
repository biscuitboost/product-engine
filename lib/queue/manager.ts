/**
 * Job Queue Manager
 * Manages job queue using p-queue for concurrency control
 * Ensures rate limiting and prevents overwhelming fal.ai API
 */

import PQueue from 'p-queue';
import { jobProcessor } from './job-processor';

class JobQueue {
  private queue: PQueue;

  constructor() {
    this.queue = new PQueue({
      concurrency: 3, // Process up to 3 jobs simultaneously
      interval: 1000, // Per second
      intervalCap: 5, // Max 5 jobs started per second (rate limiting)
    });

    // Log queue events
    this.queue.on('active', () => {
      console.log(`[Queue] Working on job. Size: ${this.queue.size}, Pending: ${this.queue.pending}`);
    });

    this.queue.on('idle', () => {
      console.log('[Queue] Queue is idle');
    });

    this.queue.on('error', (error) => {
      console.error('[Queue] Queue error:', error);
    });
  }

  /**
   * Add a new job to the queue
   * @param jobId - Job ID to process
   * @returns Promise that resolves when job is added to queue (not when completed)
   */
  async addJob(jobId: string): Promise<void> {
    console.log(`[Queue] Adding job ${jobId} to queue (current size: ${this.queue.size})`);

    return this.queue.add(async () => {
      try {
        await jobProcessor.processJob(jobId);
      } catch (error) {
        console.error(`[Queue] Job ${jobId} failed in queue:`, error);
        // Error is already handled in jobProcessor (job marked as failed, credits refunded)
        // We don't re-throw here to avoid crashing the queue
      }
    });
  }

  /**
   * Get current queue statistics
   */
  getStats() {
    return {
      size: this.queue.size, // Jobs waiting in queue
      pending: this.queue.pending, // Jobs currently processing
      isPaused: this.queue.isPaused,
    };
  }

  /**
   * Pause the queue (for maintenance)
   */
  pause() {
    console.log('[Queue] Pausing queue');
    this.queue.pause();
  }

  /**
   * Resume the queue
   */
  resume() {
    console.log('[Queue] Resuming queue');
    this.queue.start();
  }

  /**
   * Clear all pending jobs (emergency use only)
   */
  clear() {
    console.log('[Queue] Clearing all pending jobs');
    this.queue.clear();
  }

  /**
   * Wait for all jobs to complete (useful for testing/shutdown)
   */
  async waitForIdle(): Promise<void> {
    await this.queue.onIdle();
  }
}

// Singleton instance
export const jobQueue = new JobQueue();
