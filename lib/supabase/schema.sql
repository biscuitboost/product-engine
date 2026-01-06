-- Dynamic Product Ad Engine Database Schema
-- This schema supports the 3-stage AI pipeline with model adapter pattern

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
-- Synced from Clerk via webhook
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    credits INTEGER NOT NULL DEFAULT 3, -- Free tier starts with 3 credits
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);

-- =====================================================
-- CREDIT TRANSACTIONS TABLE
-- =====================================================
-- Audit log for all credit operations
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Positive for purchases, negative for usage
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund')),
    related_job_id UUID, -- Link to jobs table
    stripe_payment_id TEXT, -- For purchases via Stripe
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- =====================================================
-- MODEL CONFIGURATIONS TABLE
-- =====================================================
-- Enables adapter pattern - swap models via database config
CREATE TABLE model_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_type TEXT NOT NULL CHECK (agent_type IN ('extractor', 'set_designer', 'cinematographer')),
    model_name TEXT NOT NULL, -- e.g., 'fal-ai/birefnet/v2'
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 0, -- Higher priority = preferred model
    config JSONB NOT NULL DEFAULT '{}', -- Model-specific parameters
    fallback_model_id UUID REFERENCES model_configs(id), -- Fallback on failure
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_model_configs_agent_type ON model_configs(agent_type);
CREATE INDEX idx_model_configs_active ON model_configs(is_active);

-- =====================================================
-- JOBS TABLE
-- =====================================================
-- Tracks entire 3-stage pipeline with per-stage status
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Input
    input_image_url TEXT NOT NULL, -- R2/S3 URL of uploaded product image
    vibe TEXT NOT NULL CHECK (vibe IN ('minimalist', 'eco_friendly', 'high_energy', 'luxury_noir')),

    -- Overall pipeline status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')
    ),

    -- Stage 1: Extractor (Background Removal)
    extractor_status TEXT DEFAULT 'pending' CHECK (
        extractor_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')
    ),
    extractor_output_url TEXT, -- Transparent PNG
    extractor_error TEXT,
    extractor_model_id UUID REFERENCES model_configs(id),
    extractor_started_at TIMESTAMPTZ,
    extractor_completed_at TIMESTAMPTZ,

    -- Stage 2: Set Designer (Background Generation)
    set_designer_status TEXT DEFAULT 'pending' CHECK (
        set_designer_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')
    ),
    set_designer_output_url TEXT, -- Composite image with new background
    set_designer_error TEXT,
    set_designer_model_id UUID REFERENCES model_configs(id),
    set_designer_started_at TIMESTAMPTZ,
    set_designer_completed_at TIMESTAMPTZ,

    -- Stage 3: Cinematographer (Video Generation)
    cinematographer_status TEXT DEFAULT 'pending' CHECK (
        cinematographer_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')
    ),
    cinematographer_output_url TEXT, -- Final 5-second MP4 video
    cinematographer_error TEXT,
    cinematographer_model_id UUID REFERENCES model_configs(id),
    cinematographer_started_at TIMESTAMPTZ,
    cinematographer_completed_at TIMESTAMPTZ,

    -- Metadata
    credits_used INTEGER DEFAULT 1,
    total_duration_ms INTEGER, -- Total processing time in milliseconds
    error_message TEXT, -- Overall error message if job failed

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

-- =====================================================
-- VIBE PROMPTS TABLE
-- =====================================================
-- Maps vibe chips to AI model prompts
CREATE TABLE vibe_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vibe TEXT UNIQUE NOT NULL CHECK (vibe IN ('minimalist', 'eco_friendly', 'high_energy', 'luxury_noir')),
    display_name TEXT NOT NULL,
    description TEXT NOT NULL,
    prompt_template TEXT NOT NULL, -- For Flux Fill (set designer)
    negative_prompt TEXT, -- What to avoid
    cinematographer_prompt TEXT, -- For Wan Video (camera movement, lighting)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- SEED DATA: Vibe Prompts
-- =====================================================
INSERT INTO vibe_prompts (vibe, display_name, description, prompt_template, negative_prompt, cinematographer_prompt) VALUES
(
    'minimalist',
    'Minimalist',
    'Clean white studio with soft shadows',
    'product on minimal white studio background, soft diffused lighting, clean shadows, professional photography, 8k, high detail',
    'cluttered, busy, colorful, patterns, noise',
    'slow smooth camera orbit, subtle lighting changes, elegant motion'
),
(
    'eco_friendly',
    'Eco-Friendly',
    'Natural forest setting with organic elements',
    'product in lush forest environment, natural wood surfaces, green plants, sunlight filtering through leaves, organic aesthetic, earth tones, nature photography',
    'artificial, plastic, synthetic, urban, industrial',
    'gentle camera push, natural light rays, organic movement, environmental atmosphere'
),
(
    'high_energy',
    'High Energy',
    'Dynamic neon cityscape with motion blur',
    'product in vibrant neon city environment, motion blur, dynamic lighting, electric colors, cyberpunk aesthetic, energetic atmosphere, bokeh lights',
    'dull, static, muted, calm, boring',
    'fast dynamic camera movement, pulsing lights, energetic motion, dramatic transitions'
),
(
    'luxury_noir',
    'Luxury Noir',
    'Dramatic dark studio with golden accents',
    'product in luxurious dark studio, dramatic side lighting, gold accents, velvet textures, moody atmosphere, high contrast, cinematic lighting',
    'bright, cheap, plastic, casual, flat lighting',
    'slow dramatic reveal, emphasize shadows and highlights, cinematic motion, luxury feel'
);

-- =====================================================
-- SEED DATA: Model Configurations
-- =====================================================
INSERT INTO model_configs (agent_type, model_name, is_active, priority, config) VALUES
-- Extractor: Background Removal
(
    'extractor',
    'fal-ai/birefnet/v2',
    true,
    100,
    '{"operating_resolution": "1024x1024", "output_format": "png"}'::jsonb
),
-- Set Designer: Background Generation
(
    'set_designer',
    'fal-ai/flux-pro/v1.1/fill',
    true,
    100,
    '{"num_inference_steps": 30, "guidance_scale": 7.5, "output_format": "png"}'::jsonb
),
-- Cinematographer: Video Animation
(
    'cinematographer',
    'fal-ai/wan-video/2.1/image-to-video',
    true,
    100,
    '{"duration": 5, "fps": 24, "output_format": "mp4"}'::jsonb
);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_model_configs_updated_at BEFORE UPDATE ON model_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER FUNCTIONS FOR CREDIT MANAGEMENT
-- =====================================================

-- Deduct credits (atomic operation)
CREATE OR REPLACE FUNCTION deduct_credits(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET credits = credits - p_amount
    WHERE id = p_user_id AND credits >= p_amount;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient credits or user not found';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Add credits (atomic operation)
CREATE OR REPLACE FUNCTION add_credits(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET credits = credits + p_amount
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Enable RLS on all tables (configure policies based on your auth setup)

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Example policy: Users can only see their own data
-- Note: Adjust these policies based on your Clerk + Supabase integration

-- Users can read their own record
CREATE POLICY "Users can view own record" ON users
    FOR SELECT USING (auth.uid()::text = clerk_id);

-- Users can view their own jobs
CREATE POLICY "Users can view own jobs" ON jobs
    FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

-- Users can view their own credit transactions
CREATE POLICY "Users can view own transactions" ON credit_transactions
    FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

-- Service role can do everything (bypass RLS)
-- This is automatically handled by Supabase service_role key

-- =====================================================
-- NOTES
-- =====================================================
--
-- 1. Run this schema in your Supabase SQL Editor
-- 2. Model configs are seeded with default fal.ai models
-- 3. Vibe prompts are pre-populated with 4 styles
-- 4. RLS policies need adjustment based on auth flow
-- 5. Use service_role key for server-side operations
-- 6. Use anon key for client-side reads (with RLS)
--
