/**
 * Florence-2 Large Caption Adapter
 * Stage 1: Product Analysis (Analyzer Agent)
 *
 * Model: fal-ai/florence-2-large/caption
 * Purpose: Analyze product image and generate detailed description
 * Output: JSON with product description/caption
 */

import { fal } from '@/lib/fal/client';
import { ModelAdapter, AdapterInput, AdapterOutput } from './base';

interface Florence2Input {
  image_url: string;
}

interface Florence2Output {
  results: string; // Product description text
}

export class Florence2Adapter implements ModelAdapter {
  agentType = 'analyzer' as const;
  modelName = 'fal-ai/florence-2-large/caption';

  async execute(input: AdapterInput): Promise<AdapterOutput> {
    console.log(`[Florence2] Starting product analysis for job ${input.jobId}`);

    try {
      const falInput: Florence2Input = {
        image_url: input.inputUrl,
      };

      console.log('[Florence2] Calling fal.ai API for product captioning');

      // Note: @fal-ai/serverless-client returns the result directly
      const result = await fal.subscribe('fal-ai/florence-2-large/caption', {
        input: falInput,
        logs: true,
      }) as Florence2Output;

      const productDescription = result.results;

      console.log(`[Florence2] ✅ Product detected: ${productDescription}`);

      // Store description as metadata - will be used for smart prompt generation
      return {
        outputUrl: input.inputUrl, // Pass through original image URL (no visual output from this model)
        metadata: {
          product_description: productDescription,
        },
      };
    } catch (error) {
      console.error('[Florence2] Error:', error);
      throw new Error(`Florence-2 product analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
