/**
 * Admin API for storage cleanup and maintenance
 * These endpoints should be protected by admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { cleanupOrphanedFiles, getStorageStats } from '@/lib/storage/cleanup';

export const dynamic = 'force-dynamic';

/**
 * Helper function to check if user is admin
 * In production, implement proper admin role checking
 */
async function isAdmin(userId: string): Promise<boolean> {
  // For now, you can implement this by:
  // 1. Checking against a list of admin user IDs
  // 2. Querying an admin roles table
  // 3. Using Clerk's organization roles or metadata
  
  // Example: Check against environment variable
  const adminUsers = process.env.ADMIN_USER_IDS?.split(',') || [];
  return adminUsers.includes(userId);
}

/**
 * GET /api/admin/cleanup/stats
 * Get storage usage statistics
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId || !(await isAdmin(userId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await getStorageStats();
    
    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Storage stats error:', error);
    return NextResponse.json({ 
      error: 'Failed to get storage stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/admin/cleanup/orphaned
 * Clean up orphaned files
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId || !(await isAdmin(userId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await cleanupOrphanedFiles();
    
    return NextResponse.json({
      success: true,
      data: {
        ...result,
        message: `Cleaned up ${result.cleanedFiles.length} orphaned files out of ${result.totalFiles} total files`,
      },
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ 
      error: 'Failed to cleanup storage',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
