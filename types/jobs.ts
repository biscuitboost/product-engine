/**
 * Type definitions for jobs and related entities
 */

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type StageStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
export type AgentType = 'extractor' | 'set_designer' | 'cinematographer';
export type Vibe = 'minimalist' | 'eco_friendly' | 'high_energy' | 'luxury_noir';

export interface Job {
    id: string;
    user_id: string;
    input_image_url: string;
    vibe: Vibe;
    status: JobStatus;

    // Stage 1: Extractor
    extractor_status: StageStatus;
    extractor_output_url: string | null;
    extractor_error: string | null;
    extractor_model_id: string | null;
    extractor_started_at: string | null;
    extractor_completed_at: string | null;

    // Stage 2: Set Designer
    set_designer_status: StageStatus;
    set_designer_output_url: string | null;
    set_designer_error: string | null;
    set_designer_model_id: string | null;
    set_designer_started_at: string | null;
    set_designer_completed_at: string | null;

    // Stage 3: Cinematographer
    cinematographer_status: StageStatus;
    cinematographer_output_url: string | null;
    cinematographer_error: string | null;
    cinematographer_model_id: string | null;
    cinematographer_started_at: string | null;
    cinematographer_completed_at: string | null;

    // Metadata
    credits_used: number;
    total_duration_ms: number | null;
    error_message: string | null;

    created_at: string;
    updated_at: string;
}

export interface CreateJobRequest {
    input_image_key: string; // R2/S3 key
    vibe: Vibe;
}

export interface CreateJobResponse {
    job_id: string;
    estimated_duration_seconds: number;
}

export interface JobStatusResponse extends Job {
    progress_percentage: number; // 0-100
    current_stage: AgentType | null;
}

export interface VibePrompt {
    id: string;
    vibe: Vibe;
    display_name: string;
    description: string;
    prompt_template: string;
    negative_prompt: string | null;
    cinematographer_prompt: string | null;
    created_at: string;
}

export interface ModelConfig {
    id: string;
    agent_type: AgentType;
    model_name: string;
    is_active: boolean;
    priority: number;
    config: Record<string, any>;
    fallback_model_id: string | null;
    created_at: string;
    updated_at: string;
}
