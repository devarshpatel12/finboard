'use client';

import { useState, useEffect } from 'react';
import { StockData, MarketType } from '@/types';
import { fetchMultipleQuotes } from '@/services/api';
import WebSocketManager from '@/services/websocket';
import { TrendingUp, TrendingDown, RefreshCw, Wifi } from 'lucide-react';

interface StockCardWidgetProps {
  symbols: string[];
  title: string;
  refreshInterval?: number;
  marketType?: MarketType;
}

export default function StockCardWidget({ 
  symbols, 
  title, 
  refreshInterval = 30, // 30 seconds for more frequent updates
  marketType = 'us'
}: StockCardWidgetProps) {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveUpdates, setLiveUpdates] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      const data = await fetchMultipleQuotes(symbols, marketType);
      setStocks(data);
    } catch (err: any) {
      console.error('StockCardWidget error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Setup WebSocket for real-time updates (US stocks and Crypto only)
    const wsManager = WebSocketManager.getInstance();
    const unsubscribers: (() => void)[] = [];

    if (marketType === 'us' || marketType === 'crypto') {
      try {
        symbols.forEach(symbol => {
          const unsubscribe = wsManager.subscribe(symbol, marketType, (data) => {
            setStocks(prevStocks => {
              const index = prevStocks.findIndex(s => s.symbol === data.symbol);
              if (index !== -1) {
                const newStocks = [...prevStocks];
                // Merge WebSocket data with existing data
                newStocks[index] = {
                  ...newStocks[index],
                  price: data.price,
                  volume: data.volume || newStocks[index].volume,
                };
                return newStocks;
              }
              return prevStocks;
            });
          });
          
          unsubscribers.push(unsubscribe);
        });
        
        // Check connection status after a short delay to allow WebSocket to connect
        setTimeout(() => {
          const isConnected = wsManager.isConnected(marketType);
          setLiveUpdates(isConnected);
          if (!isConnected) {
            console.info(`ℹ️ WebSocket not connected for ${marketType}. Using polling fallback.`);
          }
        }, 1000);
        
        // Also check periodically in case connection changes
        const statusCheckInterval = setInterval(() => {
          const isConnected = wsManager.isConnected(marketType);
          setLiveUpdates(isConnected);
        }, 5000);
        
        unsubscribers.push(() => clearInterval(statusCheckInterval));
      } catch (error) {
        console.warn('WebSocket subscription failed, using polling fallback:', error);
        setLiveUpdates(false);
      }
    }

    // Polling for all market types (as fallback or primary for non-WebSocket markets)
    const interval = setInterval(fetchData, refreshInterval * 1000);

    return () => {
      clearInterval(interval);
      unsubscribers.forEach(unsub => {
        try {
          unsub();
        } catch (error) {
          console.warn('Failed to unsubscribe from WebSocket:', error);
        }
      });
    };
  }, [symbols, refreshInterval, marketType]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading data</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
          <button
            onClick={fetchData}
            className="mt-2 text-blue-500 hover:text-blue-600 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 overflow-y-auto h-full">
      {/* Live indicator */}
      {liveUpdates && (
        <div className="flex items-center gap-2 px-2 pb-2 border-b border-gray-200 dark:border-gray-700">
          <Wifi className="w-4 h-4 text-green-500 animate-pulse" />
          <span className="text-xs font-medium text-green-600 dark:text-green-400">Live Updates</span>
        </div>
      )}
      
      {stocks.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 dark:text-gray-400">No stocks to display</p>
        </div>
      )}
      {stocks.map((stock) => {
        console.log('Rendering stock:', stock);
        return (
        <div
          key={stock.symbol}
          className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                {stock.symbol || 'N/A'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{stock.name || 'Unknown'}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {stock.currency === 'INR' && '₹'}
                {stock.currency === 'USD' && '$'}
                {!stock.currency && '$'}
                {stock.price.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {stock.changePercent >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span
              className={`text-sm font-medium ${
                stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {stock.change >= 0 ? '+' : ''}
              {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
            </span>
          </div>
          {stock.volume > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Volume: {stock.volume.toLocaleString()}
            </p>
          )}
        </div>
      );
      })}
    </div>
  );
}
