'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { useUpload } from '@/hooks/use-upload';
import Image from 'next/image';

interface UploadZoneProps {
  onUploadComplete: (imageKey: string) => void;
}

export function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const { uploadFile, isUploading, progress } = useUpload();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setError(null);

      const file = acceptedFiles[0];
      if (!file) return;

      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        setError('File must be under 20MB');
        return;
      }

      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Only JPG, PNG, and WebP images are supported');
        return;
      }

      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      try {
        // Upload file
        const imageKey = await uploadFile(file);
        onUploadComplete(imageKey);
      } catch (err) {
        setError('Upload failed. Please try again.');
        setPreview(null);
        console.error('Upload error:', err);
      }
    },
    [uploadFile, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all
          ${
            isDragActive
              ? 'border-blue-500 bg-blue-500/10 scale-105'
              : 'border-gray-700 hover:border-gray-600 hover:bg-gray-900/50'
          }
          ${isUploading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />

        {preview && !isUploading ? (
          // Show preview after successful upload
          <div className="space-y-4">
            <div className="relative w-full max-w-md mx-auto aspect-square rounded-lg overflow-hidden">
              <Image src={preview} alt="Preview" fill className="object-contain" />
            </div>
            <div className="flex items-center justify-center gap-2 text-green-500">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Upload complete!</span>
            </div>
          </div>
        ) : isUploading ? (
          // Show upload progress
          <div className="space-y-4">
            <Upload className="w-16 h-16 mx-auto text-blue-500 animate-pulse" />
            <div className="space-y-2">
              <p className="text-lg font-semibold">Uploading... {progress}%</p>
              <div className="w-full max-w-md mx-auto h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          // Show upload prompt
          <div className="space-y-4">
            <Upload className="w-16 h-16 mx-auto text-gray-400" />
            <div className="space-y-2">
              <p className="text-lg font-semibold">
                {isDragActive ? 'Drop your product image here' : 'Drag & drop your product image'}
              </p>
              <p className="text-sm text-gray-400">or click to browse</p>
              <p className="text-xs text-gray-500">JPG, PNG, or WebP • Max 20MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 flex items-center justify-center gap-2 text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Upload info */}
      {!preview && !isUploading && !error && (
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Upload a clear product photo with minimal background clutter for best results.
          </p>
        </div>
      )}
    </div>
  );
}
