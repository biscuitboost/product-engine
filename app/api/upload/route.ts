/**
 * Upload API Endpoint
 * Generates presigned URLs for client-side direct uploads to R2/S3
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { storageClient } from '@/lib/storage/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Validation schema
const uploadRequestSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().regex(/^image\/(jpeg|png|webp)$/),
  fileSize: z.number().min(1).max(20 * 1024 * 1024), // Max 20MB
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate request
    const body = await req.json();
    const validation = uploadRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { filename, contentType, fileSize } = validation.data;

    // 3. Generate unique storage key
    const key = storageClient.generateUploadKey(clerkId, filename);

    // 4. Generate presigned URL (valid for 1 hour)
    const presignedUrl = await storageClient.getPresignedUploadUrl(key, contentType, 3600);

    // 5. Return presigned URL and key
    return NextResponse.json({
      uploadUrl: presignedUrl,
      key,
      publicUrl: storageClient.getPublicUrl(key),
    });
  } catch (error) {
    console.error('Upload URL generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
