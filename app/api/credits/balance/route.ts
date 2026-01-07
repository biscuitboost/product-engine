/**
 * Credits Balance API Endpoint
 * Get the current user's credit balance
 *
 * GET /api/credits/balance
 * Returns: { credits: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    // 2. Get user's credit balance
    const { data: user, error } = await supabase
      .from('users')
      .select('credits')
      .eq('clerk_id', clerkId)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 3. Return balance
    return NextResponse.json({
      credits: user.credits,
    });
  } catch (error) {
    console.error('Credits balance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
