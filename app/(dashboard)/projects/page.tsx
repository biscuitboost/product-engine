'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowLeft, Play } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Job } from '@/types/jobs';
import Image from 'next/image';

export default function ProjectsPage() {
  const { user } = useUser();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      if (!user) return;

      const supabase = createClient();

      // Get user ID from Supabase
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .single();

      if (!userData) return;

      // Fetch user's jobs
      const { data: jobsData, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && jobsData) {
        setJobs(jobsData as Job[]);
      }

      setIsLoading(false);
    }

    fetchJobs();
  }, [user]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </Link>
            <h1 className="text-2xl font-bold">My Projects</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-400">Loading projects...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📹</div>
            <h2 className="text-2xl font-bold mb-2">No projects yet</h2>
            <p className="text-gray-400 mb-6">
              Create your first product ad to see it here!
            </p>
            <Link
              href="/studio"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
            >
              Create Your First Ad
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-gray-700 transition"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gray-800 relative group">
                  {job.cinematographer_output_url ? (
                    <>
                      <video
                        src={job.cinematographer_output_url}
                        className="w-full h-full object-cover"
                        muted
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                    </>
                  ) : job.extractor_output_url ? (
                    <Image
                      src={job.extractor_output_url}
                      alt="Project"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : job.set_designer_output_url ? (
                    <Image
                      src={job.set_designer_output_url}
                      alt="Project"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <Image
                      src={job.input_image_url}
                      alt="Project"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    {job.status === 'completed' && (
                      <span className="px-2 py-1 bg-green-500/90 text-xs font-semibold rounded">
                        Complete
                      </span>
                    )}
                    {job.status === 'processing' && (
                      <span className="px-2 py-1 bg-blue-500/90 text-xs font-semibold rounded">
                        Processing
                      </span>
                    )}
                    {job.status === 'failed' && (
                      <span className="px-2 py-1 bg-red-500/90 text-xs font-semibold rounded">
                        Failed
                      </span>
                    )}
                    {job.status === 'pending' && (
                      <span className="px-2 py-1 bg-gray-500/90 text-xs font-semibold rounded">
                        Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400 capitalize">
                      {job.vibe.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(job.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {job.status === 'completed' && job.cinematographer_output_url && (
                    <a
                      href={job.cinematographer_output_url}
                      download
                      className="block w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-center text-sm font-semibold transition"
                    >
                      Download Video
                    </a>
                  )}

                  {job.status === 'processing' && (
                    <Link
                      href={`/studio`}
                      className="block w-full py-2 bg-gray-800 hover:bg-gray-700 rounded text-center text-sm font-semibold transition"
                    >
                      View Progress
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
