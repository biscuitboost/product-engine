/**
 * Storage Cleanup Utilities
 * For administrative cleanup of orphaned files and maintenance
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { storageClient } from '@/lib/storage/client';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

/**
 * Clean up orphaned storage files (files not referenced in database)
 * This is an admin utility for maintenance purposes
 */
export async function cleanupOrphanedFiles(): Promise<{
  totalFiles: number;
  orphanedFiles: string[];
  cleanedFiles: string[];
  errors: string[];
}> {
  const supabase = createServerSupabaseClient();
  const errors: string[] = [];
  
  try {
    // Get all jobs and their file URLs
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('input_image_url, extractor_output_url, set_designer_output_url, cinematographer_output_url');

    if (jobsError) {
      throw new Error(`Failed to fetch jobs: ${jobsError.message}`);
    }

    // Collect all referenced URLs
    const referencedUrls = new Set<string>();
    jobs?.forEach(job => {
      if (job.input_image_url) referencedUrls.add(job.input_image_url);
      if (job.extractor_output_url) referencedUrls.add(job.extractor_output_url);
      if (job.set_designer_output_url) referencedUrls.add(job.set_designer_output_url);
      if (job.cinematographer_output_url) referencedUrls.add(job.cinematographer_output_url);
    });

    // Get all files from storage (this requires S3 listing capability)
    const storageFiles = await listStorageFiles();
    
    // Find orphaned files (in storage but not in database)
    const orphanedFiles = storageFiles.filter(fileUrl => !referencedUrls.has(fileUrl));
    
    // Clean up orphaned files
    const cleanedFiles: string[] = [];
    for (const fileUrl of orphanedFiles) {
      try {
        const key = fileUrl.replace(`${process.env.R2_PUBLIC_URL!}/`, '');
        const result = await storageClient.deleteFiles([key]);
        if (result.deleted.length > 0) {
          cleanedFiles.push(fileUrl);
        }
      } catch (error) {
        errors.push(`Failed to delete ${fileUrl}: ${error}`);
      }
    }

    return {
      totalFiles: storageFiles.length,
      orphanedFiles,
      cleanedFiles,
      errors,
    };
  } catch (error) {
    errors.push(`Cleanup failed: ${error}`);
    return {
      totalFiles: 0,
      orphanedFiles: [],
      cleanedFiles: [],
      errors,
    };
  }
}

/**
 * List all files in the storage bucket
 * Note: This requires S3 listing permissions
 */
async function listStorageFiles(): Promise<string[]> {
  const s3 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  const files: string[] = [];
  let continuationToken: string | undefined;

  do {
    try {
      const result = await s3.send(new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET_NAME!,
        ContinuationToken: continuationToken,
      }));

      result.Contents?.forEach(obj => {
        if (obj.Key) {
          files.push(`${process.env.R2_PUBLIC_URL!}/${obj.Key}`);
        }
      });

      continuationToken = result.NextContinuationToken;
    } catch (error) {
      console.error('Failed to list storage files:', error);
      break;
    }
  } while (continuationToken);

  return files;
}

/**
 * Get storage usage statistics
 */
export async function getStorageStats(): Promise<{
  totalJobs: number;
  totalFiles: number;
  estimatedSize: string;
  averageFilesPerJob: number;
}> {
  const supabase = createServerSupabaseClient();
  
  try {
    // Get job count
    const { count: totalJobs, error: countError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Failed to count jobs: ${countError.message}`);
    }

    // Get file count and estimate size
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('input_image_url, extractor_output_url, set_designer_output_url, cinematographer_output_url');

    if (jobsError) {
      throw new Error(`Failed to fetch jobs: ${jobsError.message}`);
    }

    let totalFiles = 0;
    jobs?.forEach(job => {
      if (job.input_image_url) totalFiles++;
      if (job.extractor_output_url) totalFiles++;
      if (job.set_designer_output_url) totalFiles++;
      if (job.cinematographer_output_url) totalFiles++;
    });

    // Rough size estimation (average: 1MB for images, 10MB for videos)
    const estimatedSizeBytes = totalFiles * 2000000; // 2MB average
    const estimatedSizeMB = Math.round(estimatedSizeBytes / (1024 * 1024));
    const estimatedSize = estimatedSizeMB > 1024 
      ? `${Math.round(estimatedSizeMB / 1024)}GB` 
      : `${estimatedSizeMB}MB`;

    return {
      totalJobs: totalJobs || 0,
      totalFiles,
      estimatedSize,
      averageFilesPerJob: totalJobs ? Math.round(totalFiles / totalJobs * 10) / 10 : 0,
    };
  } catch (error) {
    console.error('Failed to get storage stats:', error);
    return {
      totalJobs: 0,
      totalFiles: 0,
      estimatedSize: 'Unknown',
      averageFilesPerJob: 0,
    };
  }
}
