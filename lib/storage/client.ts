/**
 * Storage Client for Cloudflare R2 / AWS S3
 * Handles file uploads, downloads, and presigned URL generation
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

class StorageClient {
  private s3: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor() {
    // Initialize S3 client (works with both R2 and S3)
    this.s3 = new S3Client({
      region: 'auto', // R2 uses 'auto', S3 uses specific region
      endpoint: process.env.R2_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });

    this.bucket = process.env.R2_BUCKET_NAME!;
    this.publicUrl = process.env.R2_PUBLIC_URL!;
  }

  /**
   * Upload a file buffer to storage
   * @param file - File buffer
   * @param key - Storage key (path)
   * @param contentType - MIME type
   * @returns Public URL of uploaded file
   */
  async uploadFile(file: Buffer, key: string, contentType: string): Promise<string> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: contentType,
      })
    );

    return this.getPublicUrl(key);
  }

  /**
   * Copy a file from external URL to our storage
   * Used to copy fal.ai outputs (which expire) to permanent storage
   * @param sourceUrl - External URL to download from
   * @param destinationKey - Where to store in our bucket
   * @returns Public URL of copied file
   */
  async copyFromUrl(sourceUrl: string, destinationKey: string): Promise<string> {
    try {
      // Download from source
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        throw new Error(`Failed to download from ${sourceUrl}: ${response.statusText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || 'application/octet-stream';

      // Upload to our bucket
      return await this.uploadFile(buffer, destinationKey, contentType);
    } catch (error) {
      console.error('Error copying file from URL:', error);
      throw error;
    }
  }

  /**
   * Generate presigned URL for uploading (client-side direct upload)
   * @param key - Storage key
   * @param contentType - MIME type
   * @param expiresIn - URL expiry in seconds (default: 1 hour)
   * @returns Presigned URL for PUT request
   */
  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3, command, { expiresIn });
  }

  /**
   * Generate presigned URL for downloading (private files)
   * @param key - Storage key
   * @param expiresIn - URL expiry in seconds (default: 1 hour)
   * @returns Presigned URL for GET request
   */
  async getPresignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3, command, { expiresIn });
  }

  /**
   * Get public URL for a file (if bucket has public access)
   * @param key - Storage key
   * @returns Public URL
   */
  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }

  /**
   * Generate a unique key for user uploads
   * @param userId - User ID
   * @param filename - Original filename
   * @returns Unique storage key
   */
  generateUploadKey(userId: string, filename: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = filename.split('.').pop();
    return `uploads/${userId}/${timestamp}-${randomId}.${extension}`;
  }

  /**
   * Generate a key for job outputs
   * @param jobId - Job ID
   * @param stage - Pipeline stage (extractor, set_designer, cinematographer)
   * @param extension - File extension
   * @returns Storage key
   */
  generateJobOutputKey(
    jobId: string,
    stage: 'extractor' | 'set_designer' | 'cinematographer',
    extension: string
  ): string {
    return `jobs/${jobId}/${stage}.${extension}`;
  }
}

// Singleton instance
export const storageClient = new StorageClient();
