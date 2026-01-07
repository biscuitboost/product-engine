/**
 * Base Model Adapter Interface
 * All AI model adapters must implement this interface
 * This enables the adapter pattern - swap models without changing code
 */

export type AgentType = 'extractor' | 'set_designer' | 'cinematographer';

/**
 * Input parameters for model execution
 */
export interface AdapterInput {
  jobId: string;
  inputUrl: string; // URL of the input image/video
  config: Record<string, any>; // Model-specific configuration from database
  prompt?: string; // For models that need prompts (set_designer, cinematographer)
  negativePrompt?: string; // What to avoid generating
}

/**
 * Output from model execution
 */
export interface AdapterOutput {
  outputUrl: string; // URL of generated output (from fal.ai)
  metadata?: Record<string, any>; // Additional metadata (dimensions, duration, etc.)
}

/**
 * Base adapter interface that all model adapters must implement
 */
export interface ModelAdapter {
  agentType: AgentType;
  modelName: string;

  /**
   * Execute the model with given input
   * @param input - Input parameters
   * @returns Output URL and metadata
   */
  execute(input: AdapterInput): Promise<AdapterOutput>;
}
