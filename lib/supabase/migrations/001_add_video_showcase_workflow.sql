-- Migration: Add Video Showcase Workflow
-- Date: 2026-01-08
-- Description: Updates workflow from 3-stage (BiRefNet V2 → Flux Fill → Wan Video)
--              to new 3-stage (Florence-2 → BiRefNet → Kling Video)
--
-- Changes:
-- 1. Add 'analyzer' agent type for Florence-2 Caption
-- 2. Add analyzer stage tracking to jobs table
-- 3. Add product_description field to store Florence-2 output
-- 4. Update model configs with new models
-- 5. Deprecate old set_designer stage (keep for backwards compatibility)

BEGIN;

-- =====================================================
-- STEP 1: Update model_configs table to support 'analyzer'
-- =====================================================

-- Drop existing CHECK constraint
ALTER TABLE model_configs DROP CONSTRAINT IF EXISTS model_configs_agent_type_check;

-- Add new CHECK constraint with 'analyzer' type
ALTER TABLE model_configs ADD CONSTRAINT model_configs_agent_type_check
  CHECK (agent_type IN ('analyzer', 'extractor', 'set_designer', 'cinematographer'));

-- =====================================================
-- STEP 2: Add analyzer stage tracking to jobs table
-- =====================================================

-- Add analyzer stage fields
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS analyzer_status TEXT DEFAULT 'pending' CHECK (
    analyzer_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')
);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS analyzer_output_url TEXT; -- Will be same as input (passthrough)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS analyzer_error TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS analyzer_model_id UUID REFERENCES model_configs(id);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS analyzer_started_at TIMESTAMPTZ;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS analyzer_completed_at TIMESTAMPTZ;

-- Add product description field (stores Florence-2 output)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS product_description TEXT;

-- Note: We keep set_designer fields for backwards compatibility with existing jobs
-- New jobs will skip the set_designer stage

-- =====================================================
-- STEP 3: Update model configurations
-- =====================================================

-- Mark old models as inactive
UPDATE model_configs SET is_active = false WHERE model_name = 'fal-ai/birefnet/v2';
UPDATE model_configs SET is_active = false WHERE model_name = 'fal-ai/flux-pro/v1.1/fill';
UPDATE model_configs SET is_active = false WHERE model_name = 'fal-ai/flux-pro/v1/fill';
UPDATE model_configs SET is_active = false WHERE model_name = 'fal-ai/wan-video/2.1/image-to-video';
UPDATE model_configs SET is_active = false WHERE model_name = 'fal-ai/wan-i2v';

-- Insert new model configurations
-- Model 1: Florence-2 Large Caption (Analyzer)
INSERT INTO model_configs (agent_type, model_name, is_active, priority, config) VALUES
(
    'analyzer',
    'fal-ai/florence-2-large/caption',
    true,
    100,
    '{}'::jsonb
)
ON CONFLICT DO NOTHING;

-- Model 2: BiRefNet (Extractor) - Updated config
INSERT INTO model_configs (agent_type, model_name, is_active, priority, config) VALUES
(
    'extractor',
    'fal-ai/birefnet',
    true,
    100,
    '{
      "model": "General Use (Heavy)",
      "operating_resolution": "1024x1024",
      "refine_foreground": true,
      "output_format": "png"
    }'::jsonb
)
ON CONFLICT DO NOTHING;

-- Model 3: Kling Video v2.6 Pro (Cinematographer)
INSERT INTO model_configs (agent_type, model_name, is_active, priority, config) VALUES
(
    'cinematographer',
    'fal-ai/kling-video/v2.6/pro/image-to-video',
    true,
    100,
    '{
      "duration": "5",
      "aspect_ratio": "16:9"
    }'::jsonb
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 4: Update existing jobs (optional)
-- =====================================================

-- Set analyzer_status to 'skipped' for all existing jobs
-- This prevents them from being reprocessed through the new workflow
UPDATE jobs
SET analyzer_status = 'skipped'
WHERE analyzer_status IS NULL OR analyzer_status = 'pending';

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check active models per agent type
-- SELECT agent_type, model_name, priority, config
-- FROM model_configs
-- WHERE is_active = true
-- ORDER BY agent_type, priority DESC;

-- Check jobs table columns
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'jobs'
-- AND column_name LIKE '%analyzer%';
