# Quick Deployment Guide - Video Showcase Workflow

## Prerequisites

- Access to Supabase database (SQL Editor or psql)
- fal.ai API key with access to:
  - `fal-ai/florence-2-large/caption`
  - `fal-ai/birefnet`
  - `fal-ai/kling-video/v2.6/pro/image-to-video`

---

## Deployment Steps

### 1. Deploy Code Changes

All code changes are already complete. Just deploy to your environment:

```bash
# Install dependencies (if needed)
npm install

# Build the project
npm run build

# Deploy (adjust for your platform)
# For Vercel:
vercel --prod

# For other platforms, follow your deployment process
```

### 2. Run Database Migration

**Option A: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the entire contents of:
   `/home/robert/repos/product-engine/lib/supabase/migrations/001_add_video_showcase_workflow.sql`
5. Click "Run" to execute

**Option B: Using psql**
```bash
# Set your database URL
export DATABASE_URL="postgresql://postgres:[password]@[host]:[port]/postgres"

# Run migration
psql $DATABASE_URL -f lib/supabase/migrations/001_add_video_showcase_workflow.sql
```

### 3. Verify Migration

Run this query in Supabase SQL Editor:

```sql
-- Check that analyzer agent type exists
SELECT DISTINCT agent_type FROM model_configs;
-- Should return: analyzer, extractor, set_designer, cinematographer

-- Check active models
SELECT agent_type, model_name, is_active, priority
FROM model_configs
WHERE is_active = true
ORDER BY agent_type;
-- Should show:
-- analyzer     | fal-ai/florence-2-large/caption
-- extractor    | fal-ai/birefnet
-- cinematographer | fal-ai/kling-video/v2.6/pro/image-to-video

-- Check jobs table has new columns
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'jobs'
AND column_name LIKE '%analyzer%';
-- Should return: analyzer_status, analyzer_output_url, etc.
```

### 4. Test the New Workflow

**Create a test job:**

1. Upload a product image via your UI
2. Create a new job
3. Monitor the logs

**Expected log output:**
```
[JobProcessor] Starting job <uuid>
[Florence2] Starting product analysis for job <uuid>
[Florence2] ✅ Product detected: <description>
[JobProcessor] 📝 Stored product description: <description>
[BiRefNet] Starting background removal for job <uuid>
[BiRefNet] Successfully removed background
[JobProcessor] 🎯 Generated smart prompt: <smart-prompt>
[KlingVideo] Starting video generation for job <uuid>
[KlingVideo] Progress: Processing...
[KlingVideo] ✅ Video generation complete
[JobProcessor] ✅ Job <uuid> completed successfully!
```

### 5. Verify Database Records

```sql
-- Check a recent job
SELECT
  id,
  status,
  analyzer_status,
  extractor_status,
  cinematographer_status,
  product_description,
  created_at
FROM jobs
ORDER BY created_at DESC
LIMIT 1;

-- All statuses should be 'completed'
-- product_description should have a value
```

---

## Rollback Plan (If Needed)

If you encounter issues and need to rollback:

### 1. Revert Model Configs
```sql
BEGIN;

-- Deactivate new models
UPDATE model_configs SET is_active = false
WHERE model_name IN (
  'fal-ai/florence-2-large/caption',
  'fal-ai/birefnet',
  'fal-ai/kling-video/v2.6/pro/image-to-video'
);

-- Reactivate old models
UPDATE model_configs SET is_active = true
WHERE model_name IN (
  'fal-ai/birefnet/v2',
  'fal-ai/flux-pro/v1.1/fill',
  'fal-ai/wan-i2v'
);

COMMIT;
```

### 2. Revert Code
```bash
# If using git
git revert <commit-hash>

# Or redeploy previous version
vercel rollback
```

### 3. Database Cleanup (Optional)
```sql
-- Remove analyzer columns (if desired)
ALTER TABLE jobs DROP COLUMN IF EXISTS analyzer_status;
ALTER TABLE jobs DROP COLUMN IF EXISTS analyzer_output_url;
-- ... etc

-- Or just leave them - they won't hurt
```

---

## Post-Deployment Monitoring

### Monitor Job Success Rate
```sql
-- Check job completion rate over last 24 hours
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM jobs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;
```

### Monitor Stage Failure Points
```sql
-- Find which stage is failing most
SELECT
  CASE
    WHEN analyzer_status = 'failed' THEN 'analyzer'
    WHEN extractor_status = 'failed' THEN 'extractor'
    WHEN cinematographer_status = 'failed' THEN 'cinematographer'
    ELSE 'none'
  END as failed_stage,
  COUNT(*) as count
FROM jobs
WHERE status = 'failed'
AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY failed_stage;
```

### Monitor Processing Times
```sql
-- Average duration by stage
SELECT
  AVG(EXTRACT(EPOCH FROM (analyzer_completed_at - analyzer_started_at))) as analyzer_seconds,
  AVG(EXTRACT(EPOCH FROM (extractor_completed_at - extractor_started_at))) as extractor_seconds,
  AVG(EXTRACT(EPOCH FROM (cinematographer_completed_at - cinematographer_started_at))) as cinematographer_seconds
FROM jobs
WHERE status = 'completed'
AND created_at > NOW() - INTERVAL '24 hours';
```

---

## Common Issues & Solutions

### ❌ "No adapter registered for model: fal-ai/florence-2-large/caption"
**Cause**: Code not deployed or Node process needs restart

**Solution**:
```bash
# Restart your application server
pm2 restart all
# OR
systemctl restart your-app-service
```

### ❌ Jobs stuck in "processing" status
**Cause**: Job queue not processing

**Solution**:
1. Check application logs for errors
2. Verify FAL_KEY environment variable is set
3. Check fal.ai API status
4. Restart application

### ❌ Florence-2 returns empty description
**Cause**: Image URL not accessible or invalid image

**Solution**:
1. Verify image URL is publicly accessible
2. Check image format (should be JPG/PNG/WebP)
3. Ensure image is under 20MB

### ❌ Kling Video generation timeout
**Cause**: Video generation takes 1-3 minutes normally

**Solution**:
1. This is expected behavior - Kling Video is slower but better quality
2. Increase timeout if needed in your deployment configuration
3. Consider reducing duration from "10" to "5" seconds

---

## Performance Tuning

### Speed Up Workflow
```sql
-- Reduce video duration to 5 seconds
UPDATE model_configs
SET config = jsonb_set(config, '{duration}', '"5"')
WHERE model_name = 'fal-ai/kling-video/v2.6/pro/image-to-video';
```

### Improve Quality
```sql
-- Increase to 10 second videos
UPDATE model_configs
SET config = jsonb_set(config, '{duration}', '"10"')
WHERE model_name = 'fal-ai/kling-video/v2.6/pro/image-to-video';
```

### Change Aspect Ratio for Mobile
```sql
-- Switch to vertical 9:16 for mobile-first
UPDATE model_configs
SET config = jsonb_set(config, '{aspect_ratio}', '"9:16"')
WHERE model_name = 'fal-ai/kling-video/v2.6/pro/image-to-video';
```

---

## Success Criteria

✅ Database migration completed without errors
✅ 3 active model configs (analyzer, extractor, cinematographer)
✅ New jobs complete all 3 stages successfully
✅ Product descriptions are being stored
✅ Smart prompts are being generated
✅ Videos are higher quality than before
✅ No errors in application logs
✅ Credit system working correctly

---

## Support

If you encounter issues:

1. Check `INTEGRATION_SUMMARY.md` for detailed technical information
2. Review application logs for specific error messages
3. Verify all environment variables are set correctly
4. Confirm fal.ai API key has access to all required models
5. Test each model independently using fal.ai playground

---

## Next Steps After Successful Deployment

1. **Monitor Performance**: Watch job completion rates and durations
2. **Gather Feedback**: Test with various product types
3. **Tune Prompts**: Adjust `smart-generator.ts` based on results
4. **Optimize Costs**: Analyze credit usage per job
5. **Add Categories**: Extend smart prompt generator with more product types
6. **A/B Testing**: Compare new vs. old workflow quality (if running both)

---

**Deployment Date**: 2026-01-08
**Version**: 2.0.0 - Video Showcase Workflow
**Status**: Ready for Production ✅
