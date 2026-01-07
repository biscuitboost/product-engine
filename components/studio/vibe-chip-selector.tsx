'use client';

import { Vibe } from '@/types/jobs';

interface VibeChipSelectorProps {
  selected: Vibe;
  onChange: (vibe: Vibe) => void;
}

interface VibeOption {
  value: Vibe;
  label: string;
  emoji: string;
  description: string;
  gradient: string;
}

const vibes: VibeOption[] = [
  {
    value: 'minimalist',
    label: 'Minimalist',
    emoji: '✨',
    description: 'Clean white studio with soft shadows',
    gradient: 'from-gray-100 to-white',
  },
  {
    value: 'eco_friendly',
    label: 'Eco-Friendly',
    emoji: '🌿',
    description: 'Natural forest setting with organic elements',
    gradient: 'from-green-600 to-emerald-400',
  },
  {
    value: 'high_energy',
    label: 'High Energy',
    emoji: '🔥',
    description: 'Dynamic neon cityscape with motion blur',
    gradient: 'from-purple-600 to-pink-500',
  },
  {
    value: 'luxury_noir',
    label: 'Luxury Noir',
    emoji: '🌑',
    description: 'Dramatic dark studio with golden accents',
    gradient: 'from-amber-600 to-yellow-400',
  },
];

export function VibeChipSelector({ selected, onChange }: VibeChipSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1">Choose Your Vibe</h3>
        <p className="text-sm text-gray-400">
          Select the aesthetic for your product video background
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {vibes.map((vibe) => (
          <button
            key={vibe.value}
            onClick={() => onChange(vibe.value)}
            className={`
              relative overflow-hidden rounded-lg p-5 text-left transition-all
              ${
                selected === vibe.value
                  ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-black scale-105'
                  : 'hover:scale-102 border border-gray-800 hover:border-gray-700'
              }
            `}
          >
            {/* Gradient background */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${vibe.gradient} opacity-10`}
            />

            {/* Content */}
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{vibe.emoji}</span>
                <div>
                  <div className="font-semibold text-white">{vibe.label}</div>
                  <div className="text-xs text-gray-400">{vibe.description}</div>
                </div>
              </div>

              {/* Selected indicator */}
              {selected === vibe.value && (
                <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Selected
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
