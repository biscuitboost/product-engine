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
        prompt: `${input.prompt}. IMPORTANT: Preserve the product exactly as shown, do not modify, alter, or change the product in any way. Only generate the background scene around the product.`,
        negative_prompt: `${input.negativePrompt}, modifying the product, changing the product appearance, altering product details, product distortion, product color changes`,
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
   * Generate a proper mask from transparent PNG
   * Creates a mask where product areas are black (preserve) and transparent areas are white (generate)
   */
  private async generateMaskFromTransparent(imageUrl: string): Promise<string> {
    try {
      console.log('[FluxFill] Generating proper mask from transparent image');
      
      // Use fal-ai to create a proper mask by inverting the alpha channel
      // This ensures product areas are black (protected) and background areas are white (to be generated)
      const maskResult = await fal.subscribe('fal-ai/image-to-image', {
        input: {
          image_url: imageUrl,
          prompt: 'convert transparency to white mask, make opaque areas black',
          strength: 1.0,
          num_inference_steps: 10,
          guidance_scale: 1.0,
        },
      }) as any;

      console.log('[FluxFill] Successfully generated proper mask');
      return maskResult.images[0].url;
    } catch (error) {
      console.error('[FluxFill] Failed to generate mask, falling back to original:', error);
      // Fallback to original behavior if mask generation fails
      return imageUrl;
    }
  }
}
