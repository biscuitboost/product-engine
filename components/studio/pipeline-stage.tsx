'use client';

import { StageStatus } from '@/types/jobs';
import { CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';
import Image from 'next/image';

interface PipelineStageProps {
  title: string;
  status: StageStatus | 'completed';
  imageUrl: string | null;
  error?: string | null;
  isVideo?: boolean;
  description?: string; // For analyzer stage: shows detected product description
}

export function PipelineStage({ title, status, imageUrl, error, isVideo = false, description }: PipelineStageProps) {
  return (
    <div className="inline-block w-[400px] flex-shrink-0" style={{ scrollSnapAlign: 'start' }}>
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <StatusBadge status={status} />
        </div>

        {/* Content */}
        <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden relative">
          {status === 'completed' && imageUrl ? (
            isVideo ? (
              <video
                src={imageUrl}
                controls
                className="w-full h-full object-contain"
                autoPlay
                loop
                muted
              />
            ) : (
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-contain"
                unoptimized
              />
            )
          ) : status === 'processing' ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-3" />
              <p className="text-sm text-gray-400">Processing...</p>
            </div>
          ) : status === 'failed' ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-red-500 p-4">
              <XCircle className="w-12 h-12 mb-3" />
              <p className="text-sm text-center">{error || 'Processing failed'}</p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Clock className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-sm text-gray-500">Waiting...</p>
            </div>
          )}
        </div>

        {/* Product Description (for analyzer stage) */}
        {description && status === 'completed' && (
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-xs font-semibold text-blue-400 mb-1">Detected Product:</p>
            <p className="text-sm text-gray-300">{description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: StageStatus | 'completed' }) {
  const configs = {
    pending: { icon: Clock, label: 'Pending', color: 'text-gray-400', bgColor: 'bg-gray-400/10', animate: false },
    processing: { icon: Loader2, label: 'Processing', color: 'text-blue-500', bgColor: 'bg-blue-500/10', animate: true },
    completed: { icon: CheckCircle, label: 'Completed', color: 'text-green-500', bgColor: 'bg-green-500/10', animate: false },
    failed: { icon: XCircle, label: 'Failed', color: 'text-red-500', bgColor: 'bg-red-500/10', animate: false },
    skipped: { icon: XCircle, label: 'Skipped', color: 'text-gray-500', bgColor: 'bg-gray-500/10', animate: false },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor}`}>
      <Icon className={`w-4 h-4 ${config.color} ${config.animate ? 'animate-spin' : ''}`} />
      <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
    </div>
  );
}
