'use client';

import { useState } from 'react';
import { Job } from '@/types/jobs';
import { Trash2, Video, Image, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JobHistoryProps {
  jobs: Job[];
  onDelete: (jobId: string) => Promise<boolean>;
  onSelect: (job: Job) => void;
  isLoading: boolean;
}

export function JobHistory({ jobs, onDelete, onSelect, isLoading }: JobHistoryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    setDeletingId(jobId);
    await onDelete(jobId);
    setDeletingId(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading job history...
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No previous jobs. Create your first ad above!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <div
          key={job.id}
          onClick={() => onSelect(job)}
          className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-gray-700 cursor-pointer transition group"
        >
          <div className="flex items-center gap-4">
            {/* Thumbnail */}
            <div className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
              {job.cinematographer_output_url ? (
                <Video className="w-full h-full p-4 text-gray-600" />
              ) : job.extractor_output_url ? (
                <img
                  src={job.extractor_output_url}
                  alt="Output"
                  className="w-full h-full object-cover"
                />
              ) : job.input_image_url ? (
                <img
                  src={job.input_image_url}
                  alt="Input"
                  className="w-full h-full object-cover opacity-50"
                />
              ) : (
                <Image className="w-full h-full p-4 text-gray-600" />
              )}
            </div>

            {/* Info */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {getStatusIcon(job.status)}
                <span className="font-medium capitalize">{job.status}</span>
                <span className="text-gray-500 text-sm">• {job.vibe.replace('_', ' ')}</span>
              </div>
              <div className="text-sm text-gray-500">
                {formatDate(job.created_at)}
              </div>
              {job.error_message && (
                <div className="text-xs text-red-400 truncate max-w-xs">
                  {job.error_message}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleDelete(e, job.id)}
              disabled={deletingId === job.id}
              className="opacity-0 group-hover:opacity-100 transition text-red-400 hover:text-red-300 hover:bg-red-900/20"
            >
              {deletingId === job.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
