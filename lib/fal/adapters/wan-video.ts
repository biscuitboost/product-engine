/**
 * Wan Video 2.1 Adapter
 * Stage 3: Cinematic Video (Cinematographer Agent)
 *
 * Model: fal-ai/wan-i2v
 * Purpose: Turn static composite into 5-second cinematic video
 * Input: Composite image from Flux Fill
 * Output: MP4 video with camera motion and lighting
 */

import { fal } from '@/lib/fal/client';
import { ModelAdapter, AdapterInput, AdapterOutput } from './base';

interface WanVideoInput {
  image_url: string;
  prompt: string;
  negative_prompt?: string;
  num_frames?: number;
  frames_per_second?: number;
  resolution?: '480p' | '720p';
  num_inference_steps?: number;
  guide_scale?: number;
  aspect_ratio?: 'auto' | '16:9' | '9:16' | '1:1';
}

interface WanVideoOutput {
  video: {
    url: string;
    content_type?: string;
    file_size?: number;
  };
  seed: number;
}

export class WanVideoAdapter implements ModelAdapter {
  agentType = 'cinematographer' as const;
  modelName = 'fal-ai/wan-i2v';

  async execute(input: AdapterInput): Promise<AdapterOutput> {
    console.log(`[WanVideo] Starting video generation for job ${input.jobId}`);

    try {
      const falInput: WanVideoInput = {
        image_url: input.inputUrl,
        prompt: input.prompt || 'Subtle camera movement, cinematic lighting',
        negative_prompt: input.negativePrompt,
        num_frames: input.config.num_frames || 81, // ~5 seconds at 16fps
        frames_per_second: input.config.frames_per_second || 16,
        resolution: input.config.resolution || '720p',
        num_inference_steps: input.config.num_inference_steps || 30,
        guide_scale: input.config.guide_scale || 5,
        aspect_ratio: 'auto',
      };

      console.log('[WanVideo] Calling fal.ai API with prompt:', falInput.prompt);

      // Note: @fal-ai/serverless-client returns the result directly, not wrapped in { data }
      const result = await fal.subscribe('fal-ai/wan-i2v', {
        input: falInput,
        logs: true,
      }) as WanVideoOutput;

      console.log('[WanVideo] Successfully generated video:', result.video.url);

      return {
        outputUrl: result.video.url,
        metadata: {
          content_type: result.video.content_type || 'video/mp4',
          file_size: result.video.file_size,
          seed: result.seed,
          num_frames: falInput.num_frames,
          frames_per_second: falInput.frames_per_second,
        },
      };
    } catch (error) {
      console.error('[WanVideo] Error:', error);
      throw new Error(`Wan Video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
