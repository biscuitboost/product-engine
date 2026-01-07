/**
 * fal.ai Client Configuration
 * Configures the fal.ai SDK with API credentials
 */

import * as fal from '@fal-ai/serverless-client';

// Configure fal.ai client with API key
fal.config({
  credentials: process.env.FAL_KEY!,
});

export { fal };
