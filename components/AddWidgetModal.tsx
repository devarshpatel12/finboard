'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppDispatch } from '@/hooks/redux';
import { addWidget } from '@/store/dashboardSlice';
import { WidgetType, WidgetConfig, StockData, MarketType } from '@/types';
import { searchStocks } from '@/services/api';
import JSONFieldSelector from './JSONFieldSelector';
import { X, Plus, Search, Database, Sparkles } from 'lucide-react';

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddWidgetModal({ isOpen, onClose }: AddWidgetModalProps) {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<'quick' | 'api-test'>('quick');
  const [widgetType, setWidgetType] = useState<WidgetType>('card');
  const [marketType, setMarketType] = useState<MarketType>('us');
  const [title, setTitle] = useState('');
  const [symbol, setSymbol] = useState('');
  const [symbols, setSymbols] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockData[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [apiTestUrl, setApiTestUrl] = useState('');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [isFetchingApi, setIsFetchingApi] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Search for stocks as user types
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchStocks(searchQuery, marketType);
        setSearchResults(results);
        setShowDropdown(results.length > 0);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, marketType]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectStock = (selectedSymbol: string, name: string) => {
    if (widgetType === 'chart') {
      setSymbol(selectedSymbol);
      setSearchQuery('');
    } else {
      // For multiple symbols, append to the list
      const currentSymbols = symbols ? symbols.split(',').map(s => s.trim()) : [];
      if (!currentSymbols.includes(selectedSymbol)) {
        setSymbols(currentSymbols.concat(selectedSymbol).join(', '));
      }
      setSearchQuery('');
    }
    setShowDropdown(false);
    setSearchResults([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const widgetConfig: WidgetConfig = {
      id: `widget-${Date.now()}`,
      type: widgetType,
      title: title || `New ${widgetType}`,
      refreshInterval: 120, // 2 minutes to reduce API calls
      marketType: marketType,
    };

    if (widgetType === 'chart') {
      const getDefaultSymbol = () => {
        if (marketType === 'us') return 'GOOGL';
        if (marketType === 'india') return 'RELIANCE';
        if (marketType === 'crypto') return 'BTC';
        if (marketType === 'us-mf') return 'VFIAX';
        if (marketType === 'india-mf') return 'AXISELIQUID';
        return 'GOOGL';
      };
      
      widgetConfig.chartConfig = {
        interval: 'daily',
        chartType: 'line',
        symbol: symbol || getDefaultSymbol(),
        marketType: marketType,
      };
    } else if (widgetType === 'table') {
      widgetConfig.tableConfig = {
        searchEnabled: true,
        filterEnabled: true,
        pageSize: 10,
        marketType: marketType,
      };
    } else if (widgetType === 'card' || widgetType === 'watchlist' || widgetType === 'gainers') {
      const getDefaultSymbols = () => {
        if (marketType === 'us') return ['GOOGL', 'AMZN', 'TSLA'];
        if (marketType === 'india') return ['RELIANCE', 'TCS', 'INFY'];
        if (marketType === 'crypto') return ['BTC', 'ETH', 'BNB'];
        if (marketType === 'us-mf') return ['VFIAX', 'VTSAX', 'FXAIX'];
        if (marketType === 'india-mf') return ['AXISELIQUID', 'ICICIPRULIFE', 'HDFCTOP100'];
        return ['GOOGL', 'AMZN', 'TSLA'];
      };
      
      widgetConfig.cardConfig = {
        symbols: symbols ? symbols.split(',').map(s => s.trim()) : getDefaultSymbols(),
        limit: 5,
        marketType: marketType,
      };
    }

    dispatch(addWidget(widgetConfig));
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setSymbol('');
    setSymbols('');
    setWidgetType('card');
    setMarketType('us');
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    setApiTestUrl('');
    setApiResponse(null);
    setSelectedFields([]);
    setActiveTab('quick');
  };

  const handleTestApi = async () => {
    if (!apiTestUrl) return;
    
    setIsFetchingApi(true);
    try {
      const response = await fetch(apiTestUrl);
      const data = await response.json();
      setApiResponse(data);
    } catch (error) {
      console.error('API test failed:', error);
      alert('Failed to fetch API data. Check the URL and try again.');
    } finally {
      setIsFetchingApi(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Widget</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          <button
            onClick={() => setActiveTab('quick')}
            className={`px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === 'quick'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Quick Add
            </div>
          </button>
          <button
            onClick={() => setActiveTab('api-test')}
            className={`px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === 'api-test'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              API Explorer
            </div>
          </button>
        </div>

        {activeTab === 'quick' && (
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Market Type
            </label>
            <select
              value={marketType}
              onChange={(e) => setMarketType(e.target.value as MarketType)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="us">🇺🇸 US Stocks</option>
              <option value="india">🇮🇳 Indian Stocks (NSE/BSE)</option>
              <option value="crypto">₿ Cryptocurrency</option>
              <option value="us-mf">🏦 US Mutual Funds</option>
              <option value="india-mf">🏛️ Indian Mutual Funds</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Widget Type
            </label>
            <select
              value={widgetType}
              onChange={(e) => setWidgetType(e.target.value as WidgetType)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="card">Finance Card</option>
              <option value="watchlist">Watchlist</option>
              <option value="gainers">Market Gainers</option>
              <option value="chart">Chart</option>
              <option value="table">Stock Table</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Widget Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Widget"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {widgetType === 'chart' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stock Symbol
              </label>
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery || symbol}
                    onChange={(e) => {
                      setSearchQuery(e.target.value.toUpperCase());
                      if (!searchQuery) setSymbol(e.target.value.toUpperCase());
                    }}
                    onFocus={() => {
                      if (searchResults.length > 0) setShowDropdown(true);
                    }}
                    placeholder="Search for stocks... (e.g., AAPL, Tesla)"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
                
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((stock) => (
                      <button
                        key={stock.symbol}
                        type="button"
                        onClick={() => handleSelectStock(stock.symbol, stock.name)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {stock.symbol}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              {stock.name}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {symbol && !searchQuery && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Selected:</span>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded text-sm font-medium">
                      {symbol}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {(widgetType === 'card' || widgetType === 'watchlist') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stock Symbols
              </label>
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                    onFocus={() => {
                      if (searchResults.length > 0) setShowDropdown(true);
                    }}
                    placeholder="Search to add stocks... (e.g., AAPL)"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
                
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((stock) => (
                      <button
                        key={stock.symbol}
                        type="button"
                        onClick={() => handleSelectStock(stock.symbol, stock.name)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {stock.symbol}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              {stock.name}
                            </div>
                          </div>
                          <Plus className="w-4 h-4 text-gray-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {symbols && (
                  <div className="mt-2">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Selected symbols:</div>
                    <div className="flex flex-wrap gap-2">
                      {symbols.split(',').map((sym) => {
                        const trimmedSym = sym.trim();
                        return trimmedSym ? (
                          <span
                            key={trimmedSym}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded text-sm font-medium flex items-center gap-1"
                          >
                            {trimmedSym}
                            <button
                              type="button"
                              onClick={() => {
                                const updatedSymbols = symbols
                                  .split(',')
                                  .map(s => s.trim())
                                  .filter(s => s !== trimmedSym)
                                  .join(', ');
                                setSymbols(updatedSymbols);
                              }}
                              className="hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
                
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Search and click to add stocks, or type comma-separated symbols
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Widget
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded-md"
            >
              Cancel
            </button>
          </div>
        </form>
        )}

        {activeTab === 'api-test' && (
          <div className="p-6 space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>API Explorer:</strong> Test any financial API endpoint and select which fields to display.
                This helps you understand API response structures and customize your widgets.
              </p>
            </div>

            {/* API URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Endpoint URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={apiTestUrl}
                  onChange={(e) => setApiTestUrl(e.target.value)}
                  placeholder="https://api.example.com/stock/AAPL"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  onClick={handleTestApi}
                  disabled={!apiTestUrl || isFetchingApi}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md flex items-center gap-2"
                >
                  {isFetchingApi ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4" />
                      Test API
                    </>
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Example: https://api.coincap.io/v2/assets/bitcoin
              </p>
            </div>

            {/* JSON Field Selector */}
            {apiResponse && (
              <div>
                <JSONFieldSelector
                  jsonData={apiResponse}
                  selectedFields={selectedFields}
                  onFieldsSelected={setSelectedFields}
                />
              </div>
            )}

            {!apiResponse && (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Enter an API URL and click "Test API" to explore the response structure
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
