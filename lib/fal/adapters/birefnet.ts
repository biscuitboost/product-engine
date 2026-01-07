/**
 * BiRefNet V2 Adapter
 * Stage 1: Background Removal (Extractor Agent)
 *
 * Model: fal-ai/birefnet/v2
 * Purpose: Isolate product from background with pixel-perfect precision
 * Output: Transparent PNG
 */

import { fal } from '@/lib/fal/client';
import { ModelAdapter, AdapterInput, AdapterOutput } from './base';

interface BiRefNetInput {
  image_url: string;
  operating_resolution?: string;
  output_format?: string;
}

interface BiRefNetOutput {
  image: {
    url: string;
    width: number;
    height: number;
    content_type: string;
  };
}

export class BiRefNetAdapter implements ModelAdapter {
  agentType = 'extractor' as const;
  modelName = 'fal-ai/birefnet/v2';

  async execute(input: AdapterInput): Promise<AdapterOutput> {
    console.log(`[BiRefNet] Starting background removal for job ${input.jobId}`);

    try {
      const falInput: BiRefNetInput = {
        image_url: input.inputUrl,
        operating_resolution: input.config.operating_resolution || '1024x1024',
        output_format: input.config.output_format || 'png',
      };

      console.log('[BiRefNet] Calling fal.ai API with input:', falInput);

      // Use subscribe() for automatic polling
      // Note: @fal-ai/serverless-client returns the result directly, not wrapped in { data }
      const result = await fal.subscribe('fal-ai/birefnet/v2', {
        input: falInput,
        logs: true,
      }) as BiRefNetOutput;

      console.log('[BiRefNet] Successfully removed background, output:', result.image.url);

      return {
        outputUrl: result.image.url,
        metadata: {
          width: result.image.width,
          height: result.image.height,
          content_type: result.image.content_type,
        },
      };
    } catch (error) {
      console.error('[BiRefNet] Error:', error);
      throw new Error(`BiRefNet background removal failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
