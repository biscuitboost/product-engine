# Product Ad Engine

> AI-powered platform that converts product photos into cinematic 5-second video ads in under 60 seconds.

## Overview

The Product Ad Engine uses a 3-stage AI pipeline to transform static product images into broadcast-quality video ads:

1. **Background Removal** (BiRefNet V2) - Pixel-perfect product isolation
2. **Set Design** (Flux Pro Fill) - Photorealistic background generation
3. **Video Animation** (Wan Video 2.1) - Cinematic camera motion

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Authentication:** Clerk
- **Database:** Supabase (PostgreSQL)
- **Storage:** Cloudflare R2 / AWS S3
- **AI Models:** fal.ai
- **Queue:** p-queue (in-memory for MVP)

## Project Status

**✅ MVP COMPLETE!** All 5 phases implemented and ready to test!

**Phase 1: Foundation** ✅
- Next.js 14+ with TypeScript, Tailwind CSS, dark mode
- Clerk authentication with webhooks
- Supabase database with comprehensive schema
- Project structure and environment setup

**Phase 2: Upload & Storage** ✅
- Cloudflare R2/S3 integration
- Presigned URL generation
- Drag-drop upload with progress tracking
- File validation (20MB max, JPG/PNG/WebP)

**Phase 3: Model Integration** ✅
- Model adapter pattern (swappable AI models)
- BiRefNet V2 adapter (background removal)
- Flux Pro Fill adapter (scene generation)
- Wan Video 2.1 adapter (video animation)
- Switchboard for dynamic model selection

**Phase 4: Job Pipeline** ✅
- Credit management system with atomic operations
- 3-stage job processor with retry logic
- p-queue for concurrency control (3 concurrent, 5/sec rate limit)
- Job creation and status polling APIs
- Automatic credit refunds on failure

**Phase 5: Studio UI** ✅
- Complete studio interface with upload + vibe selection
- 4 vibe chips (Minimalist, Eco-Friendly, High Energy, Luxury Noir)
- Real-time progress tracking with 2-second polling
- Horizontal scrolling canvas with 4 stages
- Video player and download functionality
- Projects gallery page

**Ready for Testing!** See [TESTING.md](./TESTING.md) for complete testing guide.

## Getting Started

### Prerequisites

You need accounts and API keys for:

1. **Clerk** - Authentication ([dashboard.clerk.com](https://dashboard.clerk.com))
2. **Supabase** - Database ([app.supabase.com](https://app.supabase.com))
3. **fal.ai** - AI Models ([fal.ai/dashboard](https://fal.ai/dashboard))
4. **Cloudflare R2 or AWS S3** - File storage

### Setup Instructions

1. **Install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

Create `.env.local` and fill in your credentials (use `.env.example` as template):

```bash
cp .env.example .env.local
```

3. **Configure Supabase:**

- Create a new project in Supabase
- Go to SQL Editor and run `/lib/supabase/schema.sql`
- This will create all tables, seed vibe prompts, and model configs
- Copy your URL and keys to `.env.local`

4. **Configure Clerk:**

- Create a new application in Clerk
- Enable Email/Password authentication
- Copy your publishable and secret keys to `.env.local`
- Set redirect URLs:
  - Sign-in URL: `/sign-in`
  - Sign-up URL: `/sign-up`
  - After sign-in: `/studio`
  - After sign-up: `/studio`

5. **Configure Storage (Cloudflare R2):**

- Create a new R2 bucket called `product-ad-engine`
- Generate API token with read/write permissions
- Enable public access for the bucket
- Copy credentials to `.env.local`

6. **Configure fal.ai:**

- Create account and generate API key
- Add to `.env.local` as `FAL_KEY`

7. **Run the development server:**

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
product-engine/
├── app/                           # Next.js App Router
│   ├── (auth)/                    # Auth routes (sign-in, sign-up)
│   ├── (dashboard)/               # Protected routes (studio, projects, billing)
│   ├── api/                       # API routes
│   ├── layout.tsx                 # Root layout with Clerk provider
│   ├── page.tsx                   # Landing page
│   └── globals.css                # Tailwind + dark mode styles
│
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── studio/                    # Studio-specific components
│   └── shared/                    # Shared components
│
├── lib/
│   ├── supabase/
│   │   ├── schema.sql             # Database schema (run in Supabase)
│   │   ├── client.ts              # Browser client
│   │   └── server.ts              # Server client (service_role)
│   ├── fal/
│   │   ├── adapters/              # Model adapters (BiRefNet, Flux, Wan)
│   │   └── switchboard.ts         # Model selection router
│   ├── queue/
│   │   ├── manager.ts             # p-queue wrapper
│   │   └── job-processor.ts      # Pipeline orchestration
│   ├── storage/
│   │   └── client.ts              # R2/S3 client
│   └── credits/
│       ├── manager.ts             # Credit operations
│       └── plans.ts               # Pricing tiers
│
├── hooks/                         # React hooks
├── types/                         # TypeScript type definitions
└── public/                        # Static assets
```

## Database Schema

The database uses PostgreSQL (via Supabase) with the following key tables:

- **users** - User accounts synced from Clerk
- **jobs** - Tracks 3-stage pipeline (extractor → set_designer → cinematographer)
- **model_configs** - Enables model swapping via database (adapter pattern)
- **vibe_prompts** - Maps vibe chips to AI prompts
- **credit_transactions** - Audit log for credit operations

Run the schema: Copy `/lib/supabase/schema.sql` into Supabase SQL Editor and execute.

## Architecture Patterns

### Model Adapter Pattern

Models can be swapped without code changes via database configuration:

```sql
-- Active model for each agent type is stored in model_configs table
SELECT * FROM model_configs WHERE is_active = true;
```

The Switchboard queries the database and returns the appropriate adapter:

```typescript
const adapter = await switchboard.getAdapter('extractor');
const result = await adapter.execute({ inputUrl, config });
```

### Job State Machine

Each job tracks 3 stages independently:

```
pending → processing → completed
                    ↓
                  failed
```

Overall job status depends on all stages completing successfully.

## Environment Variables

See `.env.example` for the complete list. Critical variables:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
- `FAL_KEY` - fal.ai API key
- `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` - Storage credentials

## Pricing Tiers

- **Free:** 3 video credits
- **Starter:** $29/month - 50 credits
- **Pro:** $99/month - 250 credits

## Development Roadmap

**Phase 1: Foundation** ✅ (Complete)
- Basic infrastructure, auth, database

**Phase 2: Upload & Storage** (Next)
- Image upload to R2/S3
- Presigned URL generation
- File validation

**Phase 3: Model Integration**
- fal.ai adapters
- Switchboard implementation
- Vibe prompt system

**Phase 4: Job Pipeline**
- Queue manager
- Job processor
- Credit system
- API endpoints

**Phase 5: Studio UI**
- Canvas interface
- Vibe selector
- Progress indicators
- Video player

**Phase 6: Projects & Billing**
- Gallery view
- Stripe integration
- Webhooks

## Testing

Before launch, ensure:

- [ ] Upload 20MB image successfully
- [ ] Process job through all 3 stages
- [ ] Credit deduction and refund works
- [ ] Job status polling updates in real-time
- [ ] Video plays and downloads correctly
- [ ] All 4 vibes generate different backgrounds
- [ ] Mobile responsive UI
- [ ] Error handling for network failures

## Deployment

Recommended: **Vercel**

1. Push code to GitHub
2. Connect repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

Ensure:
- Supabase database is migrated
- Clerk production app is configured
- R2 bucket is set up with public access
- fal.ai production API key is added

## Contributing

This is a PRD implementation project. Future enhancements (V1.1+):

- Batch processing
- Brand kits
- A/B variant generation
- Audio layer
- Text overlays (price tags, CTAs)
- 1080p export
- Job cancellation
- Email notifications

## License

Proprietary - All rights reserved

## Support

For issues or questions, refer to:
- Implementation plan: `.claude/plans/snappy-wandering-balloon.md`
- Database schema: `lib/supabase/schema.sql`
- PRD: Original requirements document

---

**Built with ❤️ and AI**
