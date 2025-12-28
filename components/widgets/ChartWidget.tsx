'use client';

import { useState, useEffect } from 'react';
import { ChartDataPoint, ChartInterval, ChartType, MarketType } from '@/types';
import { fetchChartData } from '@/services/api';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCw } from 'lucide-react';

interface ChartWidgetProps {
  symbol: string;
  interval: ChartInterval;
  chartType: ChartType;
  refreshInterval?: number;
  marketType?: MarketType;
}

type TimeRange = '1M' | '3M' | '6M' | '1Y' | 'YTD' | 'ALL';

export default function ChartWidget({
  symbol,
  interval,
  chartType,
  refreshInterval = 600, // 10 minutes default to reduce API calls
  marketType = 'us',
}: ChartWidgetProps) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1M');
  
  // Determine currency symbol based on market type
  const getCurrencySymbol = () => {
    if (marketType === 'india' || marketType === 'india-mf') return '₹';
    return '$';
  };
  const currencySymbol = getCurrencySymbol();

  const getIntervalForRange = (range: TimeRange): ChartInterval => {
    switch (range) {
      case '1M':
      case '3M':
        return 'daily';   // 100 days with compact = ~3 months
      case '6M':
      case '1Y':
      case 'YTD':
        return 'weekly';  // 100 weeks with compact = ~2 years
      case 'ALL':
        return 'monthly'; // 100 months with compact = ~8 years
      default:
        return 'daily';
    }
  };

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);
      const chartInterval = getIntervalForRange(selectedRange);
      const chartData = await fetchChartData(symbol, chartInterval, marketType);
      
      // Filter data based on selected range
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Set to midnight for accurate day comparison
      let filteredData = chartData;
      
      switch (selectedRange) {
        case '1M':
          const oneMonthAgo = new Date(now);
          oneMonthAgo.setMonth(now.getMonth() - 1);
          filteredData = chartData.filter(d => {
            const dataDate = new Date(d.date + 'T00:00:00');
            return dataDate >= oneMonthAgo;
          });
          break;
        case '3M':
          const threeMonthsAgo = new Date(now);
          threeMonthsAgo.setMonth(now.getMonth() - 3);
          filteredData = chartData.filter(d => {
            const dataDate = new Date(d.date + 'T00:00:00');
            return dataDate >= threeMonthsAgo;
          });
          break;
        case '6M':
          const sixMonthsAgo = new Date(now);
          sixMonthsAgo.setMonth(now.getMonth() - 6);
          filteredData = chartData.filter(d => {
            const dataDate = new Date(d.date + 'T00:00:00');
            return dataDate >= sixMonthsAgo;
          });
          break;
        case '1Y':
          const oneYearAgo = new Date(now);
          oneYearAgo.setFullYear(now.getFullYear() - 1);
          filteredData = chartData.filter(d => {
            const dataDate = new Date(d.date + 'T00:00:00');
            return dataDate >= oneYearAgo;
          });
          break;
        case 'YTD':
          const yearStart = new Date(now.getFullYear(), 0, 1);
          filteredData = chartData.filter(d => {
            const dataDate = new Date(d.date + 'T00:00:00');
            return dataDate >= yearStart;
          });
          break;
        case 'ALL':
          filteredData = chartData;
          break;
      }
      
      setData(filteredData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, refreshInterval * 1000);
    return () => clearInterval(intervalId);
  }, [symbol, selectedRange, refreshInterval]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading chart</p>
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

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <p className="text-gray-500 dark:text-gray-400">No chart data available</p>
      </div>
    );
  }

  const timeRanges: TimeRange[] = ['1M', '3M', '6M', '1Y', 'YTD', 'ALL'];

  return (
    <div className="w-full h-full flex flex-col">
      {/* Time Range Selector */}
      <div className="flex gap-1 mb-3 flex-shrink-0">
        {timeRanges.map((range) => (
          <button
            key={range}
            onClick={() => setSelectedRange(range)}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              selectedRange === range
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      <div className="flex-1 w-full chart-container">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
              domain={['auto', 'auto']}
              tickFormatter={(value) => `${currencySymbol}${value.toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value: any) => [`${currencySymbol}${value.toFixed(2)}`, 'Price']}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorPrice)"
            />
          </AreaChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
              domain={['auto', 'auto']}
              tickFormatter={(value) => `${currencySymbol}${value.toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value: any, name?: string) => [`${currencySymbol}${value.toFixed(2)}`, name || 'Price']}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Line type="monotone" dataKey="open" stroke="#8b5cf6" dot={false} />
            <Line type="monotone" dataKey="high" stroke="#10b981" dot={false} />
            <Line type="monotone" dataKey="low" stroke="#ef4444" dot={false} />
            <Line type="monotone" dataKey="close" stroke="#3b82f6" dot={false} strokeWidth={2} />
          </LineChart>
        )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
