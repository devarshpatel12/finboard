// Widget Types
export type WidgetType = 'table' | 'card' | 'chart' | 'watchlist' | 'gainers';

export type ChartInterval = 'daily' | 'weekly' | 'monthly';
export type ChartType = 'line' | 'candlestick';

// Market Types
export type MarketType = 'us' | 'india' | 'crypto' | 'us-mf' | 'india-mf';
export type AssetType = 'stock' | 'crypto' | 'forex' | 'mutual-fund';

// Widget Configuration
export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  marketType?: MarketType; // Market type: US, India, Crypto
  apiEndpoint?: string;
  refreshInterval?: number; // in seconds
  fields?: string[];
  chartConfig?: {
    interval: ChartInterval;
    chartType: ChartType;
    symbol: string;
    marketType?: MarketType;
  };
  tableConfig?: {
    searchEnabled: boolean;
    filterEnabled: boolean;
    pageSize: number;
    marketType?: MarketType;
  };
  cardConfig?: {
    symbols?: string[];
    limit?: number;
    marketType?: MarketType;
  };
}

// Layout Configuration
export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

// API Data Types
export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
  marketType?: MarketType;
  assetType?: AssetType;
  currency?: string; // USD, INR, BTC, etc.
}

export interface ChartDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ApiResponse<T = any> {
  data: T;
  timestamp: number;
  error?: string;
}

// Dashboard State
export interface DashboardState {
  widgets: Record<string, WidgetConfig>;
  layout: LayoutItem[];
  theme: 'light' | 'dark';
}

// API Cache
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresIn: number;
}
