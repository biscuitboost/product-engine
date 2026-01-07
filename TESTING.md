# Testing Guide - Product Ad Engine MVP

## 🎉 MVP Complete!

Your Product Ad Engine is fully functional! This guide will help you test the complete end-to-end workflow.

## ✅ Prerequisites

Before testing, ensure you have:

1. **Environment variables set** (`.env.local`):
   - Clerk credentials
   - Supabase credentials
   - fal.ai API key
   - Cloudflare R2 credentials

2. **Database migrated**:
   - Run `lib/supabase/schema.sql` in Supabase SQL Editor
   - This creates all tables and seeds initial data

3. **Clerk webhook configured**:
   - Add webhook endpoint: `https://your-domain.com/api/webhooks/clerk`
   - Subscribe to: `user.created`, `user.updated`, `user.deleted`
   - For local testing, use [ngrok](https://ngrok.com) to expose localhost

4. **R2 CORS configured**:
   - Allow origin: `http://localhost:3000`
   - Allow methods: `GET`, `PUT`, `HEAD`

## 🧪 Complete End-to-End Test

### Step 1: Start the Dev Server

```bash
npm run dev
```

Visit: http://localhost:3000

### Step 2: Sign Up / Sign In

1. Click **"Sign In"** or **"Get Started Free"**
2. Create a new account or sign in
3. ✅ **Expected**: After sign-in, you're redirected to `/studio`
4. ✅ **Expected**: You see **3 credits** in the top right (free tier)

**What's happening behind the scenes:**
- Clerk authenticates you
- Webhook fires to `/api/webhooks/clerk`
- User created in Supabase with 3 free credits

### Step 3: Upload Product Image

1. On the Studio page, drag & drop a product image (or click to browse)
2. ✅ **Expected**: Upload progress bar appears
3. ✅ **Expected**: Image preview shows after upload
4. ✅ **Expected**: Vibe selector appears below

**What's happening:**
- Image uploaded to R2/S3 via presigned URL
- Storage key returned to frontend

### Step 4: Select Vibe

Choose one of the 4 vibes:
- ✨ **Minimalist** - Clean white studio
- 🌿 **Eco-Friendly** - Natural forest
- 🔥 **High Energy** - Neon cityscape
- 🌑 **Luxury Noir** - Dark dramatic

✅ **Expected**: Vibe chip highlights with blue ring

### Step 5: Generate Ad

1. Click **"Generate Ad (1 Credit)"**
2. ✅ **Expected**: Button shows "Starting..."
3. ✅ **Expected**: Pipeline canvas appears with 4 stages

**What's happening:**
- POST request to `/api/jobs/create`
- Credit deducted (you now have 2 credits)
- Job record created in database
- Job added to processing queue

### Step 6: Watch the Pipeline

The canvas will show 4 stages from left to right:

**Stage 0: Original Image**
- Shows your uploaded image
- Status: ✓ Completed (already uploaded)

**Stage 1: Background Removal (BiRefNet)**
- Status changes: Pending → Processing → Completed
- ✅ **Expected**: Takes ~5-15 seconds
- ✅ **Expected**: Shows product with transparent background

**Stage 2: Scene Design (Flux Fill)**
- Status changes: Pending → Processing → Completed
- ✅ **Expected**: Takes ~15-30 seconds
- ✅ **Expected**: Shows product in new background matching vibe

**Stage 3: Cinematic Video (Wan Video)**
- Status changes: Pending → Processing → Completed
- ✅ **Expected**: Takes ~20-40 seconds
- ✅ **Expected**: Shows 5-second video with camera motion

**Total Time:** ~45-90 seconds (depending on fal.ai queue)

**What's happening:**
- Job processor executing each stage sequentially
- Each stage:
  1. Gets model config from database
  2. Calls fal.ai API via adapter
  3. Copies output to R2 for permanence
  4. Updates job status in database
- Frontend polls `/api/jobs/{id}` every 2 seconds
- Progress bar updates: 0% → 33% → 67% → 100%

### Step 7: Download Video

1. When pipeline completes, **"Download Video"** button appears
2. Click to download the MP4 file
3. ✅ **Expected**: 5-second video downloads
4. ✅ **Expected**: Video shows your product in the styled scene with camera motion

### Step 8: View Projects

1. Click **"New Project"** in header
2. Or navigate to `/projects` from landing page
3. ✅ **Expected**: See your completed project in gallery
4. ✅ **Expected**: Can download video again

### Step 9: Check Credits

1. Top right shows **2 credits** remaining (started with 3, used 1)
2. ✅ **Expected**: Credit balance updated after job creation

---

## 🔍 Testing Edge Cases

### Test: Insufficient Credits

1. Use all 3 free credits (generate 3 videos)
2. Try to generate a 4th video
3. ✅ **Expected**: Button says "Insufficient Credits"
4. ✅ **Expected**: Link appears to purchase more

### Test: Failed Job (Credit Refund)

To simulate a failure (for testing):

1. Temporarily set invalid `FAL_KEY` in `.env.local`
2. Try to generate a video
3. ✅ **Expected**: Job fails at Stage 1
4. ✅ **Expected**: Credit is automatically refunded
5. ✅ **Expected**: Check `credit_transactions` table shows refund

**Restore your valid FAL_KEY after testing!**

### Test: Concurrent Jobs

1. Open Studio in 2 browser tabs
2. Start 2 jobs simultaneously
3. ✅ **Expected**: Both process (queue handles concurrency)
4. ✅ **Expected**: Rate limiting prevents overload (5 jobs/sec max)

### Test: Real-time Progress

1. Start a job
2. Watch progress bar update
3. ✅ **Expected**: Updates every 2 seconds (polling interval)
4. ✅ **Expected**: Stage status changes in real-time
5. ✅ **Expected**: Canvas auto-scrolls to active stage

---

## 📊 Database Verification

### Check User Creation

```sql
-- In Supabase SQL Editor
SELECT * FROM users ORDER BY created_at DESC LIMIT 5;
```

✅ **Expected:**
- Your user exists
- `clerk_id` matches your Clerk user ID
- `credits` = 2 (after 1 generation)

### Check Job Records

```sql
SELECT id, status, vibe,
       extractor_status,
       set_designer_status,
       cinematographer_status,
       total_duration_ms
FROM jobs
ORDER BY created_at DESC
LIMIT 5;
```

✅ **Expected:**
- Job status = 'completed' (when done)
- All stage statuses = 'completed'
- Output URLs populated
- Duration recorded in milliseconds

### Check Credit Transactions

```sql
SELECT * FROM credit_transactions
ORDER BY created_at DESC
LIMIT 10;
```

✅ **Expected:**
- `usage` transaction (amount = -1) when job created
- `refund` transaction (amount = +1) if job failed

---

## 🐛 Troubleshooting

### Issue: Upload fails

**Check:**
- R2 CORS policy allows `http://localhost:3000`
- R2 credentials are correct in `.env.local`
- R2 bucket has public access enabled

**Debug:**
- Open browser console (F12)
- Look for CORS errors
- Check Network tab for failed requests

### Issue: Job stays "processing" forever

**Check:**
- `FAL_KEY` is valid and has credits
- Check server console for errors
- Job might be in fal.ai queue (can take a while)

**Debug:**
```bash
# Check server logs
npm run dev

# Watch for:
# [JobProcessor] Starting job ...
# [BiRefNet] Starting background removal ...
# [FluxFill] Starting background generation ...
# [WanVideo] Starting video generation ...
```

### Issue: No credits after sign-up

**Check:**
- Clerk webhook is configured and firing
- Webhook secret matches in `.env.local`
- Check Supabase logs for user creation

**Fix:**
Manually add credits in Supabase:
```sql
UPDATE users
SET credits = 3
WHERE clerk_id = 'your_clerk_id';
```

### Issue: Stage fails

**Check server console for specific error:**

- **BiRefNet fails:** Check input image URL is accessible
- **Flux Fill fails:** Check vibe prompts exist in database
- **Wan Video fails:** Check fal.ai rate limits

---

## 📈 Performance Expectations

### Typical Processing Times

| Stage | Time | Notes |
|-------|------|-------|
| Background Removal | 5-15s | BiRefNet V2 |
| Scene Design | 15-30s | Flux Pro Fill |
| Video Generation | 20-40s | Wan Video 2.1 |
| **Total** | **45-90s** | Plus queue time |

### Queue Behavior

- **Concurrency:** 3 jobs max simultaneously
- **Rate limit:** 5 jobs started per second
- **Retries:** Up to 3 attempts per stage
- **Timeout:** None (fal.ai handles this)

---

## ✨ What to Test with Different Vibes

Try each vibe to see different backgrounds:

### Minimalist
- White studio background
- Soft shadows
- Clean professional look
- Camera: Slow orbit

### Eco-Friendly
- Forest environment
- Natural lighting
- Wood textures, plants
- Camera: Gentle push forward

### High Energy
- Neon city lights
- Motion blur effects
- Electric colors
- Camera: Fast dynamic movement

### Luxury Noir
- Dark moody atmosphere
- Gold accents
- Dramatic lighting
- Camera: Slow reveal

---

## 🎯 Success Criteria

Your MVP is working correctly if:

- ✅ Users can sign up and get 3 free credits
- ✅ Image upload works (to R2/S3)
- ✅ All 4 vibes are selectable
- ✅ Job creation deducts 1 credit
- ✅ Pipeline processes all 3 stages
- ✅ Real-time progress updates work
- ✅ Final video downloads successfully
- ✅ Projects gallery shows past generations
- ✅ Failed jobs refund credits automatically
- ✅ Credit balance updates correctly

---

## 🚀 Next Steps

Once testing is complete, you can:

1. **Deploy to production** (Vercel)
2. **Add Stripe integration** (Phase 6 - Billing)
3. **Build analytics dashboard**
4. **Add more vibes**
5. **Implement batch processing**
6. **Add custom prompts** (Pro feature)

---

## 💡 Tips for Best Results

### Product Images
- Use high-quality photos (>1024px)
- Clear subject, minimal background
- Good lighting
- Centered product

### Vibes
- Choose based on brand aesthetic
- Minimalist: Tech, modern products
- Eco-Friendly: Organic, natural products
- High Energy: Youth, sports products
- Luxury Noir: Premium, high-end products

---

## 📝 Test Checklist

Print this checklist and check off as you test:

- [ ] Sign up / Sign in works
- [ ] Received 3 free credits
- [ ] Image upload successful
- [ ] All 4 vibes selectable
- [ ] "Generate Ad" creates job
- [ ] Credit deducted (3 → 2)
- [ ] Stage 1 (BiRefNet) completes
- [ ] Stage 2 (Flux Fill) completes
- [ ] Stage 3 (Wan Video) completes
- [ ] Progress bar reaches 100%
- [ ] Video downloads successfully
- [ ] Video plays correctly
- [ ] Projects page shows job
- [ ] "New Project" button works
- [ ] Can generate multiple videos
- [ ] Credit balance accurate
- [ ] Insufficient credits prevented
- [ ] Mobile responsive works

---

**Happy Testing! 🎬**

If you encounter any issues, check the server console logs and browser console for detailed error messages.
