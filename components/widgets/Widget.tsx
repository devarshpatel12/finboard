'use client';

import { WidgetConfig } from '@/types';
import StockCardWidget from './StockCardWidget';
import ChartWidget from './ChartWidget';
import StockTableWidget from './StockTableWidget';
import { X, Settings } from 'lucide-react';
import { useAppDispatch } from '@/hooks/redux';
import { removeWidget } from '@/store/dashboardSlice';

interface WidgetProps {
  config: WidgetConfig;
}

export default function Widget({ config }: WidgetProps) {
  const dispatch = useAppDispatch();

  const handleRemove = () => {
    if (confirm('Are you sure you want to remove this widget?')) {
      dispatch(removeWidget(config.id));
    }
  };

  const renderWidget = () => {
    const marketType = config.marketType || config.cardConfig?.marketType || config.chartConfig?.marketType || 'us';
    
    switch (config.type) {
      case 'card':
      case 'watchlist':
        return (
          <StockCardWidget
            symbols={config.cardConfig?.symbols || ['GOOGL', 'AMZN']}
            title={config.title}
            refreshInterval={config.refreshInterval}
            marketType={marketType}
          />
        );

      case 'gainers':
        const getGainersSymbols = () => {
          if (marketType === 'india') return ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK'];
          if (marketType === 'crypto') return ['BTC', 'ETH', 'BNB', 'SOL', 'XRP'];
          if (marketType === 'us-mf') return ['VFIAX', 'VTSAX', 'FXAIX'];
          if (marketType === 'india-mf') return ['AXISELIQUID', 'ICICIPRULIFE', 'HDFCTOP100'];
          return ['GOOGL', 'TSLA', 'AMZN', 'META', 'NVDA'];
        };
        
        return (
          <StockCardWidget
            symbols={getGainersSymbols()}
            title={config.title}
            refreshInterval={config.refreshInterval}
            marketType={marketType}
          />
        );

      case 'chart':
        return (
          <ChartWidget
            symbol={config.chartConfig?.symbol || 'GOOGL'}
            interval={config.chartConfig?.interval || 'daily'}
            chartType={config.chartConfig?.chartType || 'line'}
            refreshInterval={config.refreshInterval}
            marketType={marketType}
          />
        );

      case 'table':
        return (
          <StockTableWidget
            searchEnabled={config.tableConfig?.searchEnabled !== false}
            filterEnabled={config.tableConfig?.filterEnabled !== false}
            pageSize={config.tableConfig?.pageSize || 10}
            refreshInterval={config.refreshInterval}
            marketType={marketType}
          />
        );

      default:
        return <div>Unknown widget type</div>;
    }
  };

  return (
    <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-blue-500 to-blue-600 flex-shrink-0">
        <h3 className="font-semibold text-white">{config.title}</h3>
        <div className="flex gap-1">
          <button
            onClick={handleRemove}
            className="p-1 hover:bg-blue-700 rounded transition-colors"
            aria-label="Remove widget"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
      <div className="flex-1 p-4 min-h-0">
        {renderWidget()}
      </div>
    </div>
  );
}
