'use client';

import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

export default function ApiLimitBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
            API Rate Limits (Free Tier)
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
            Alpha Vantage free tier allows <strong>25 API calls per day</strong>. 
            To avoid hitting limits:
          </p>
          <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1 ml-4">
            <li>• Charts are cached for 30 minutes</li>
            <li>• Use demo data when API limit is reached</li>
            <li>• Consider upgrading to premium for unlimited calls</li>
            <li>• Crypto & Indian markets use free APIs (no limits)</li>
          </ul>
          <a
            href="https://www.alphavantage.co/premium/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-amber-900 dark:text-amber-100 underline hover:no-underline mt-2 inline-block"
          >
            Upgrade to Premium →
          </a>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
