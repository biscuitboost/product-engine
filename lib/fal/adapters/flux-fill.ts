/**
 * Flux Pro Fill Adapter
 * Stage 2: Set Design (Set Designer Agent)
 *
 * Model: fal-ai/flux-pro/v1/fill
 * Purpose: Generate photorealistic background based on vibe prompt
 * Input: Transparent PNG from BiRefNet
 * Output: Composite image with new background
 */

import { fal } from '@/lib/fal/client';
import { ModelAdapter, AdapterInput, AdapterOutput } from './base';

interface FluxFillInput {
  image_url: string;
  mask_url: string;
  prompt: string;
  negative_prompt?: string;
  num_inference_steps?: number;
  guidance_scale?: number;
  output_format?: string;
}

interface FluxFillOutput {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
}

export class FluxFillAdapter implements ModelAdapter {
  agentType = 'set_designer' as const;
  modelName = 'fal-ai/flux-pro/v1/fill';

  async execute(input: AdapterInput): Promise<AdapterOutput> {
    console.log(`[FluxFill] Starting background generation for job ${input.jobId}`);

    try {
      if (!input.prompt) {
        throw new Error('Prompt is required for Flux Fill');
      }

      // Generate a mask from the transparent PNG
      // For Flux Fill, the mask indicates where to generate the background
      // We use the same image as mask since BiRefNet already isolated the product
      const maskUrl = await this.generateMaskFromTransparent(input.inputUrl);

      const falInput: FluxFillInput = {
        image_url: input.inputUrl,
        mask_url: maskUrl,
        prompt: input.prompt,
        negative_prompt: input.negativePrompt,
        num_inference_steps: input.config.num_inference_steps || 30,
        guidance_scale: input.config.guidance_scale || 7.5,
        output_format: input.config.output_format || 'png',
      };

      console.log('[FluxFill] Calling fal.ai API with prompt:', input.prompt);

      // Note: @fal-ai/serverless-client returns the result directly, not wrapped in { data }
      const result = await fal.subscribe('fal-ai/flux-pro/v1/fill', {
        input: falInput,
        logs: true,
      }) as FluxFillOutput;

      const outputImage = result.images[0];
      console.log('[FluxFill] Successfully generated background:', outputImage.url);

      return {
        outputUrl: outputImage.url,
        metadata: {
          width: outputImage.width,
          height: outputImage.height,
          content_type: outputImage.content_type,
        },
      };
    } catch (error) {
      console.error('[FluxFill] Error:', error);
      throw new Error(`Flux Fill background generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a mask from transparent PNG
   * For BiRefNet output, we can use the same image as mask
   * or invert the alpha channel to create a proper mask
   */
  private async generateMaskFromTransparent(imageUrl: string): Promise<string> {
    // For MVP, we use the same transparent image as mask
    // Flux Fill will understand the alpha channel
    // In production, you might want to create an inverted mask for better control
    return imageUrl;
  }
}
