/**
 * Wan Video 2.1 Adapter
 * Stage 3: Cinematic Video (Cinematographer Agent)
 *
 * Model: fal-ai/wan-video/2.1/image-to-video
 * Purpose: Turn static composite into 5-second cinematic video
 * Input: Composite image from Flux Fill
 * Output: MP4 video with camera motion and lighting
 */

import { fal } from '@/lib/fal/client';
import { ModelAdapter, AdapterInput, AdapterOutput } from './base';

interface WanVideoInput {
  image_url: string;
  prompt?: string;
  duration?: number;
  fps?: number;
  output_format?: string;
}

interface WanVideoOutput {
  video: {
    url: string;
    width: number;
    height: number;
    content_type: string;
  };
}

export class WanVideoAdapter implements ModelAdapter {
  agentType = 'cinematographer' as const;
  modelName = 'fal-ai/wan-video/2.1/image-to-video';

  async execute(input: AdapterInput): Promise<AdapterOutput> {
    console.log(`[WanVideo] Starting video generation for job ${input.jobId}`);

    try {
      const falInput: WanVideoInput = {
        image_url: input.inputUrl,
        prompt: input.prompt, // Camera movement and lighting instructions
        duration: input.config.duration || 5, // 5 seconds
        fps: input.config.fps || 24, // 24 FPS
        output_format: input.config.output_format || 'mp4',
      };

      console.log('[WanVideo] Calling fal.ai API with prompt:', input.prompt);

      const result = await fal.subscribe('fal-ai/wan-video/2.1/image-to-video', {
        input: falInput,
        logs: true,
      }) as { data: WanVideoOutput };

      console.log('[WanVideo] Successfully generated video:', result.data.video.url);

      return {
        outputUrl: result.data.video.url,
        metadata: {
          width: result.data.video.width,
          height: result.data.video.height,
          content_type: result.data.video.content_type,
          duration: input.config.duration || 5,
          fps: input.config.fps || 24,
        },
      };
    } catch (error) {
      console.error('[WanVideo] Error:', error);
      throw new Error(`Wan Video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
