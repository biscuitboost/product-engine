/**
 * Model Switchboard
 * Routes to the correct model adapter based on database configuration
 * Enables dynamic model swapping without code changes
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ModelAdapter, AgentType } from './adapters/base';
import { BiRefNetAdapter } from './adapters/birefnet';
import { FluxFillAdapter } from './adapters/flux-fill';
import { WanVideoAdapter } from './adapters/wan-video';
import { ModelConfig } from '@/types/jobs';

export class ModelSwitchboard {
  private adapters: Map<string, ModelAdapter> = new Map();

  constructor() {
    // Register all available adapters
    this.registerAdapter(new BiRefNetAdapter());
    this.registerAdapter(new FluxFillAdapter());
    this.registerAdapter(new WanVideoAdapter());
  }

  /**
   * Register a model adapter
   */
  private registerAdapter(adapter: ModelAdapter) {
    this.adapters.set(adapter.modelName, adapter);
    console.log(`[Switchboard] Registered adapter: ${adapter.modelName}`);
  }

  /**
   * Get the active adapter for a specific agent type
   * Queries database for the active model configuration
   */
  async getAdapter(agentType: AgentType): Promise<ModelAdapter> {
    const supabase = createServerSupabaseClient();

    // Query database for active model configuration
    const { data: modelConfig, error } = await supabase
      .from('model_configs')
      .select('*')
      .eq('agent_type', agentType)
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(1)
      .single();

    if (error || !modelConfig) {
      throw new Error(`No active model found for agent type: ${agentType}`);
    }

    // Get the adapter for this model
    const adapter = this.adapters.get(modelConfig.model_name);
    if (!adapter) {
      throw new Error(`No adapter registered for model: ${modelConfig.model_name}`);
    }

    console.log(`[Switchboard] Selected ${adapter.modelName} for ${agentType} (priority: ${modelConfig.priority})`);

    return adapter;
  }

  /**
   * Get the model configuration from database
   */
  async getModelConfig(agentType: AgentType): Promise<ModelConfig> {
    const supabase = createServerSupabaseClient();

    const { data: modelConfig, error } = await supabase
      .from('model_configs')
      .select('*')
      .eq('agent_type', agentType)
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(1)
      .single();

    if (error || !modelConfig) {
      throw new Error(`No active model found for agent type: ${agentType}`);
    }

    return modelConfig as ModelConfig;
  }

  /**
   * Get all available adapters (for debugging/admin)
   */
  getAvailableAdapters(): string[] {
    return Array.from(this.adapters.keys());
  }
}

// Singleton instance
export const switchboard = new ModelSwitchboard();
