'use client';

import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Check, AlertCircle, Key, Settings } from 'lucide-react';

interface APIKey {
  name: string;
  key: string;
  description: string;
  link: string;
  required: boolean;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    alphaVantage: '',
    finnhub: '',
  });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({
    alphaVantage: false,
    finnhub: false,
  });
  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});

  const apiKeyConfig: Record<string, APIKey> = {
    alphaVantage: {
      name: 'Alpha Vantage',
      key: 'alphaVantage',
      description: 'Used for US stocks and US mutual funds data',
      link: 'https://www.alphavantage.co/support/#api-key',
      required: true,
    },
    finnhub: {
      name: 'Finnhub',
      key: 'finnhub',
      description: 'Used for real-time WebSocket updates for US stocks',
      link: 'https://finnhub.io/register',
      required: false,
    },
  };

  useEffect(() => {
    if (isOpen) {
      // Force reload keys from environment on every open
      const envKeys = {
        alphaVantage: process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || '',
        finnhub: process.env.NEXT_PUBLIC_FINNHUB_KEY || '',
      };
      
      // Check if localStorage has different keys than environment
      const stored = localStorage.getItem('apiKeys');
      let storedKeys: any = {};
      
      if (stored) {
        try {
          storedKeys = JSON.parse(stored);
        } catch (e) {
          console.error('Failed to parse stored API keys');
        }
      }
      
      // Use environment keys as the source of truth, but allow localStorage overrides if they exist and are different
      const finalKeys = {
        alphaVantage: storedKeys.alphaVantage || envKeys.alphaVantage,
        finnhub: storedKeys.finnhub || envKeys.finnhub,
      };
      
      setApiKeys(finalKeys);
      
      // Update localStorage if env keys are newer/different
      if (envKeys.alphaVantage || envKeys.finnhub) {
        localStorage.setItem('apiKeys', JSON.stringify(finalKeys));
      }
    }
  }, [isOpen]);

  const handleSave = (keyName: string) => {
    const currentKeys = { ...apiKeys };
    const keysToSave = { ...currentKeys };
    
    localStorage.setItem('apiKeys', JSON.stringify(keysToSave));
    
    // Update environment variables (for next API calls)
    if (keyName === 'alphaVantage') {
      (window as any).ALPHA_VANTAGE_KEY = apiKeys.alphaVantage;
    } else if (keyName === 'finnhub') {
      (window as any).FINNHUB_KEY = apiKeys.finnhub;
    }

    setSavedStatus({ ...savedStatus, [keyName]: true });
    setTimeout(() => {
      setSavedStatus({ ...savedStatus, [keyName]: false });
    }, 2000);
  };

  const handleKeyChange = (keyName: string, value: string) => {
    setApiKeys({ ...apiKeys, [keyName]: value });
  };

  const toggleShowKey = (keyName: string) => {
    setShowKeys({ ...showKeys, [keyName]: !showKeys[keyName] });
  };

  const maskKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '••••••••';
    return key.slice(0, 4) + '••••••••' + key.slice(-4);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              API Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-semibold mb-1">API Keys Auto-Loaded ✓</p>
                <p>
                  Your API keys from environment variables are automatically loaded and saved.
                  The dashboard will continue using these keys across sessions. You can update them below if needed.
                </p>
              </div>
            </div>
          </div>

          {Object.entries(apiKeyConfig).map(([key, config]) => (
            <div
              key={key}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Key className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {config.name}
                    </h3>
                    {config.required && (
                      <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {config.description}
                  </p>
                </div>
                <a
                  href={config.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline ml-4"
                >
                  Get API Key →
                </a>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <input
                    type={showKeys[key] ? 'text' : 'password'}
                    value={apiKeys[key]}
                    onChange={(e) => handleKeyChange(key, e.target.value)}
                    placeholder={`Enter your ${config.name} API key`}
                    className="w-full px-4 py-2 pr-24 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {apiKeys[key] && (
                      <div className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-medium">
                        ✓ Active
                      </div>
                    )}
                    <button
                      onClick={() => toggleShowKey(key)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                      title={showKeys[key] ? 'Hide key' : 'Show key'}
                    >
                      {showKeys[key] ? (
                        <EyeOff className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => handleSave(key)}
                      disabled={!apiKeys[key]}
                      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                        savedStatus[key]
                          ? 'bg-green-500 text-white'
                          : apiKeys[key]
                          ? 'bg-blue-500 hover:bg-blue-600 text-white'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {savedStatus[key] ? (
                        <span className="flex items-center gap-1">
                          <Check className="w-4 h-4" /> Saved
                        </span>
                      ) : (
                        'Save'
                      )}
                    </button>
                  </div>
                </div>
                {apiKeys[key] && !showKeys[key] && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Current: {maskKey(apiKeys[key])}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Additional Info */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Free APIs (No Key Required)
            </h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>• <strong>Indian Stocks:</strong> Yahoo Finance (via proxy)</p>
              <p>• <strong>Indian Mutual Funds:</strong> MFAPI.in (40,000+ funds)</p>
              <p>• <strong>Crypto:</strong> CoinCap & Binance WebSocket</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex justify-between items-center gap-3">
            <a
              href="/clear-cache.html"
              target="_blank"
              className="text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              🔧 Clear Cache & Reset Keys
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
