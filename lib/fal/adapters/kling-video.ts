/**
 * Kling Video v2.6 Pro Adapter
 * Stage 3: Cinematic Video (Cinematographer Agent)
 *
 * Model: fal-ai/kling-video/v2.6/pro/image-to-video
 * Purpose: Generate high-quality product showcase video from static image
 * Input: Clean product image (transparent background)
 * Output: MP4 video with cinematic camera motion
 */

import { fal } from '@/lib/fal/client';
import { ModelAdapter, AdapterInput, AdapterOutput } from './base';

interface KlingVideoInput {
  image_url: string;
  prompt: string;
  duration?: string; // "5" or "10" seconds
  aspect_ratio?: '16:9' | '9:16' | '1:1';
  negative_prompt?: string;
}

interface KlingVideoOutput {
  video: {
    url: string;
    content_type?: string;
    file_size?: number;
  };
}

export class KlingVideoAdapter implements ModelAdapter {
  agentType = 'cinematographer' as const;
  modelName = 'fal-ai/kling-video/v2.6/pro/image-to-video';

  async execute(input: AdapterInput): Promise<AdapterOutput> {
    console.log(`[KlingVideo] Starting video generation for job ${input.jobId}`);
    console.log(`[KlingVideo] Using prompt: ${input.prompt}`);

    try {
      const falInput: KlingVideoInput = {
        image_url: input.inputUrl,
        prompt: input.prompt || 'Product showcase, slowly rotating 360 degrees, professional studio lighting with soft shadows, clean white background, premium commercial photography style, smooth cinematic motion',
        duration: input.config.duration || '5',
        aspect_ratio: input.config.aspect_ratio || '16:9',
        negative_prompt: input.negativePrompt || 'blur, distort, low quality, pixelated, shaky, text overlay',
      };

      console.log('[KlingVideo] Calling fal.ai API (this may take 1-3 minutes)...');

      // Note: @fal-ai/serverless-client returns the result directly
      const result = await fal.subscribe('fal-ai/kling-video/v2.6/pro/image-to-video', {
        input: falInput,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS' && update.logs) {
            const latestLog = update.logs.slice(-1)[0];
            if (latestLog?.message) {
              console.log(`[KlingVideo] Progress: ${latestLog.message}`);
            }
          }
        },
      }) as KlingVideoOutput;

      console.log('[KlingVideo] ✅ Video generation complete:', result.video.url);

      return {
        outputUrl: result.video.url,
        metadata: {
          content_type: result.video.content_type || 'video/mp4',
          file_size: result.video.file_size,
          duration: falInput.duration,
          aspect_ratio: falInput.aspect_ratio,
        },
      };
    } catch (error) {
      console.error('[KlingVideo] Error:', error);
      throw new Error(`Kling Video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
