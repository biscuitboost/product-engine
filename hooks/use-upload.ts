/**
 * Custom hook for uploading files to R2/S3
 * Handles presigned URL generation and direct upload with progress tracking
 */

import { useState } from 'react';

interface UploadResponse {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File): Promise<string> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Step 1: Request presigned URL from our API
      console.log('Requesting presigned URL for:', file.name, file.type, file.size);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        console.error('Failed to get presigned URL:', errorData);
        throw new Error(errorData.error || 'Failed to get upload URL');
      }

      const { uploadUrl, key, publicUrl } = (await uploadResponse.json()) as UploadResponse;
      console.log('Got presigned URL, uploading to R2...');

      // Step 2: Upload file directly to R2/S3 using presigned URL
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setProgress(percentComplete);
        }
      });

      // Upload promise
      await new Promise<void>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          console.log('Upload response status:', xhr.status);
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log('Upload successful!');
            resolve();
          } else {
            console.error('Upload failed:', xhr.status, xhr.responseText);
            reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
          }
        });

        xhr.addEventListener('error', (e) => {
          console.error('XHR error event:', e);
          reject(new Error('Upload failed - network error'));
        });

        xhr.addEventListener('abort', () => {
          console.error('Upload aborted');
          reject(new Error('Upload cancelled'));
        });

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      setProgress(100);
      setIsUploading(false);

      // Return the storage key (not public URL) for privacy
      return key;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      setIsUploading(false);
      throw err;
    }
  };

  const reset = () => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
  };

  return {
    uploadFile,
    isUploading,
    progress,
    error,
    reset,
  };
}
