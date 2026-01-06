import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Product Ad Engine
          </h1>
          <div>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-5xl md:text-6xl font-bold leading-tight">
            Turn Product Photos into
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Cinematic Video Ads
            </span>
          </h2>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            AI-powered 3-stage pipeline: Background removal → Set design → Video animation.
            Broadcast-quality ads in under 60 seconds.
          </p>

          <div className="flex gap-4 justify-center">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-lg transition">
                  Get Started Free
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/studio"
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-lg transition inline-block"
              >
                Go to Studio
              </Link>
            </SignedIn>
            <a
              href="#features"
              className="px-8 py-4 border border-gray-700 hover:border-gray-600 rounded-lg font-semibold text-lg transition"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Stage 1 */}
            <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
              <div className="text-4xl mb-4">🎯</div>
              <h4 className="text-xl font-semibold mb-3">1. Background Removal</h4>
              <p className="text-gray-400">
                Pixel-perfect product isolation using BiRefNet V2. Handles complex edges, transparent objects, and fine details.
              </p>
            </div>

            {/* Stage 2 */}
            <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
              <div className="text-4xl mb-4">🎨</div>
              <h4 className="text-xl font-semibold mb-3">2. Set Design</h4>
              <p className="text-gray-400">
                Choose from 4 vibes: Minimalist, Eco-Friendly, High Energy, or Luxury Noir. Flux Pro creates photorealistic scenes.
              </p>
            </div>

            {/* Stage 3 */}
            <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
              <div className="text-4xl mb-4">🎬</div>
              <h4 className="text-xl font-semibold mb-3">3. Cinematic Video</h4>
              <p className="text-gray-400">
                5-second video with smooth camera motion and dynamic lighting. Ready for TikTok, Instagram, and YouTube.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Simple Pricing</h3>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Free */}
            <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
              <h4 className="text-2xl font-bold mb-2">Free</h4>
              <div className="text-4xl font-bold mb-6">$0</div>
              <ul className="space-y-3 text-gray-400 mb-6">
                <li>✓ 3 video credits</li>
                <li>✓ All 4 vibes</li>
                <li>✓ 720p export</li>
                <li>✓ Full pipeline access</li>
              </ul>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition">
                    Start Free
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/studio"
                  className="block w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition text-center"
                >
                  Go to Studio
                </Link>
              </SignedIn>
            </div>

            {/* Starter */}
            <div className="bg-gradient-to-b from-blue-900/50 to-gray-900 rounded-lg p-8 border border-blue-500 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 rounded-full text-sm font-semibold">
                Popular
              </div>
              <h4 className="text-2xl font-bold mb-2">Starter</h4>
              <div className="text-4xl font-bold mb-1">$29</div>
              <div className="text-gray-400 mb-6">per month</div>
              <ul className="space-y-3 text-gray-400 mb-6">
                <li>✓ 50 video credits</li>
                <li>✓ $0.58 per video</li>
                <li>✓ Priority processing</li>
                <li>✓ Email support</li>
              </ul>
              <Link
                href="/billing"
                className="block w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition text-center"
              >
                Subscribe
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
              <h4 className="text-2xl font-bold mb-2">Pro</h4>
              <div className="text-4xl font-bold mb-1">$99</div>
              <div className="text-gray-400 mb-6">per month</div>
              <ul className="space-y-3 text-gray-400 mb-6">
                <li>✓ 250 video credits</li>
                <li>✓ $0.40 per video</li>
                <li>✓ Custom prompts</li>
                <li>✓ Batch processing</li>
              </ul>
              <Link
                href="/billing"
                className="block w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition text-center"
              >
                Subscribe
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-500">
          <p>&copy; 2026 Product Ad Engine. Built with AI.</p>
        </div>
      </footer>
    </main>
  );
}
