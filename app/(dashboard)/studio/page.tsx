'use client';

import { useState } from 'react';
import { UploadZone } from '@/components/studio/upload-zone';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function StudioPage() {
  const [uploadedImageKey, setUploadedImageKey] = useState<string | null>(null);

  const handleUploadComplete = (imageKey: string) => {
    setUploadedImageKey(imageKey);
    console.log('Upload complete! Image key:', imageKey);
  };

  const handleReset = () => {
    setUploadedImageKey(null);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition">
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </Link>
              <h1 className="text-2xl font-bold">Product Ad Studio</h1>
            </div>
            <div className="text-sm text-gray-400">
              Credits: <span className="font-semibold text-white">3</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {!uploadedImageKey ? (
            // Step 1: Upload
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">Upload Your Product Image</h2>
                <p className="text-gray-400">
                  Start by uploading a clear photo of your product. Our AI will handle the rest.
                </p>
              </div>
              <UploadZone onUploadComplete={handleUploadComplete} />
            </div>
          ) : (
            // Step 2: Next steps (vibe selection, etc.)
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Image Uploaded Successfully!</h2>
                <Button onClick={handleReset} variant="outline">
                  Upload Different Image
                </Button>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
                <p className="text-gray-400 mb-4">Image key: {uploadedImageKey}</p>
                <p className="text-sm text-gray-500">
                  Vibe selection and pipeline execution coming in Phase 3-5...
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
