import { DashboardState, WidgetConfig, LayoutItem } from '@/types';

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  widgets: WidgetConfig[];
  layout: LayoutItem[];
}

export const dashboardTemplates: DashboardTemplate[] = [
  {
    id: 'us-stocks-trader',
    name: '🇺🇸 US Stocks Trader',
    description: 'Focus on US tech stocks with comprehensive charts and watchlist',
    icon: '📈',
    widgets: [
      {
        id: 'widget-1',
        type: 'chart',
        title: 'GOOGL Stock Chart',
        marketType: 'us',
        refreshInterval: 120,
        chartConfig: {
          interval: 'daily',
          chartType: 'line',
          symbol: 'GOOGL',
          marketType: 'us',
        },
      },
      {
        id: 'widget-2',
        type: 'watchlist',
        title: 'My Watchlist',
        marketType: 'us',
        refreshInterval: 120,
        cardConfig: {
          symbols: ['GOOGL', 'AAPL', 'MSFT', 'AMZN', 'TSLA'],
          limit: 5,
          marketType: 'us',
        },
      },
      {
        id: 'widget-3',
        type: 'gainers',
        title: 'Top Gainers',
        marketType: 'us',
        refreshInterval: 120,
        cardConfig: {
          symbols: ['NVDA', 'META', 'NFLX'],
          limit: 5,
          marketType: 'us',
        },
      },
      {
        id: 'widget-4',
        type: 'table',
        title: 'Stock Portfolio',
        marketType: 'us',
        refreshInterval: 120,
        tableConfig: {
          searchEnabled: true,
          filterEnabled: true,
          pageSize: 10,
          marketType: 'us',
        },
      },
    ],
    layout: [
      { i: 'widget-1', x: 0, y: 0, w: 8, h: 5, minW: 6, minH: 4 },
      { i: 'widget-2', x: 8, y: 0, w: 4, h: 5, minW: 3, minH: 3 },
      { i: 'widget-3', x: 0, y: 5, w: 4, h: 4, minW: 3, minH: 3 },
      { i: 'widget-4', x: 4, y: 5, w: 8, h: 4, minW: 6, minH: 3 },
    ],
  },
  {
    id: 'indian-investor',
    name: '🇮🇳 Indian Investor',
    description: 'Track Indian stocks and mutual funds with NSE/BSE data',
    icon: '💹',
    widgets: [
      {
        id: 'widget-1',
        type: 'chart',
        title: 'RELIANCE Chart',
        marketType: 'india',
        refreshInterval: 120,
        chartConfig: {
          interval: 'daily',
          chartType: 'line',
          symbol: 'RELIANCE',
          marketType: 'india',
        },
      },
      {
        id: 'widget-2',
        type: 'card',
        title: 'Indian Stocks',
        marketType: 'india',
        refreshInterval: 120,
        cardConfig: {
          symbols: ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK'],
          limit: 5,
          marketType: 'india',
        },
      },
      {
        id: 'widget-3',
        type: 'card',
        title: 'Mutual Funds',
        marketType: 'india-mf',
        refreshInterval: 300,
        cardConfig: {
          symbols: ['119551', '120503', '119597'],
          limit: 5,
          marketType: 'india-mf',
        },
      },
      {
        id: 'widget-4',
        type: 'gainers',
        title: 'Market Gainers',
        marketType: 'india',
        refreshInterval: 120,
        cardConfig: {
          symbols: ['TATAMOTORS', 'WIPRO', 'ITC', 'AXISBANK'],
          limit: 5,
          marketType: 'india',
        },
      },
    ],
    layout: [
      { i: 'widget-1', x: 0, y: 0, w: 8, h: 5, minW: 6, minH: 4 },
      { i: 'widget-2', x: 8, y: 0, w: 4, h: 5, minW: 3, minH: 3 },
      { i: 'widget-3', x: 0, y: 5, w: 6, h: 4, minW: 4, minH: 3 },
      { i: 'widget-4', x: 6, y: 5, w: 6, h: 4, minW: 4, minH: 3 },
    ],
  },
  {
    id: 'crypto-enthusiast',
    name: '₿ Crypto Enthusiast',
    description: 'Monitor cryptocurrency markets with real-time price tracking',
    icon: '🚀',
    widgets: [
      {
        id: 'widget-1',
        type: 'chart',
        title: 'Bitcoin Price Chart',
        marketType: 'crypto',
        refreshInterval: 60,
        chartConfig: {
          interval: 'daily',
          chartType: 'line',
          symbol: 'BTC',
          marketType: 'crypto',
        },
      },
      {
        id: 'widget-2',
        type: 'chart',
        title: 'Ethereum Chart',
        marketType: 'crypto',
        refreshInterval: 60,
        chartConfig: {
          interval: 'daily',
          chartType: 'line',
          symbol: 'ETH',
          marketType: 'crypto',
        },
      },
      {
        id: 'widget-3',
        type: 'watchlist',
        title: 'Crypto Portfolio',
        marketType: 'crypto',
        refreshInterval: 60,
        cardConfig: {
          symbols: ['BTC', 'ETH', 'BNB', 'SOL', 'XRP'],
          limit: 5,
          marketType: 'crypto',
        },
      },
      {
        id: 'widget-4',
        type: 'gainers',
        title: 'Top Crypto',
        marketType: 'crypto',
        refreshInterval: 60,
        cardConfig: {
          symbols: ['ADA', 'DOGE', 'MATIC'],
          limit: 5,
          marketType: 'crypto',
        },
      },
    ],
    layout: [
      { i: 'widget-1', x: 0, y: 0, w: 6, h: 5, minW: 5, minH: 4 },
      { i: 'widget-2', x: 6, y: 0, w: 6, h: 5, minW: 5, minH: 4 },
      { i: 'widget-3', x: 0, y: 5, w: 6, h: 4, minW: 4, minH: 3 },
      { i: 'widget-4', x: 6, y: 5, w: 6, h: 4, minW: 4, minH: 3 },
    ],
  },
  {
    id: 'mutual-fund-investor',
    name: '🏦 Mutual Fund Investor',
    description: 'Track US and Indian mutual funds for long-term investment',
    icon: '💼',
    widgets: [
      {
        id: 'widget-1',
        type: 'card',
        title: 'US Mutual Funds',
        marketType: 'us-mf',
        refreshInterval: 300,
        cardConfig: {
          symbols: ['VFIAX', 'VTSAX', 'FXAIX'],
          limit: 5,
          marketType: 'us-mf',
        },
      },
      {
        id: 'widget-2',
        type: 'card',
        title: 'Indian Mutual Funds',
        marketType: 'india-mf',
        refreshInterval: 300,
        cardConfig: {
          symbols: ['119551', '120503', '119597'],
          limit: 5,
          marketType: 'india-mf',
        },
      },
      {
        id: 'widget-3',
        type: 'chart',
        title: 'VFIAX Performance',
        marketType: 'us-mf',
        refreshInterval: 300,
        chartConfig: {
          interval: 'weekly',
          chartType: 'line',
          symbol: 'VFIAX',
          marketType: 'us-mf',
        },
      },
    ],
    layout: [
      { i: 'widget-1', x: 0, y: 0, w: 4, h: 5, minW: 3, minH: 4 },
      { i: 'widget-2', x: 4, y: 0, w: 4, h: 5, minW: 3, minH: 4 },
      { i: 'widget-3', x: 8, y: 0, w: 4, h: 5, minW: 3, minH: 4 },
    ],
  },
  {
    id: 'global-diversified',
    name: '🌍 Global Diversified',
    description: 'Diversified portfolio across US, India, Crypto, and Mutual Funds',
    icon: '🌐',
    widgets: [
      {
        id: 'widget-1',
        type: 'card',
        title: 'US Tech Stocks',
        marketType: 'us',
        refreshInterval: 120,
        cardConfig: {
          symbols: ['GOOGL', 'MSFT', 'AAPL'],
          limit: 5,
          marketType: 'us',
        },
      },
      {
        id: 'widget-2',
        type: 'card',
        title: 'Indian Stocks',
        marketType: 'india',
        refreshInterval: 120,
        cardConfig: {
          symbols: ['RELIANCE', 'TCS', 'INFY'],
          limit: 5,
          marketType: 'india',
        },
      },
      {
        id: 'widget-3',
        type: 'card',
        title: 'Crypto',
        marketType: 'crypto',
        refreshInterval: 60,
        cardConfig: {
          symbols: ['BTC', 'ETH', 'BNB'],
          limit: 5,
          marketType: 'crypto',
        },
      },
      {
        id: 'widget-4',
        type: 'card',
        title: 'Mutual Funds',
        marketType: 'us-mf',
        refreshInterval: 300,
        cardConfig: {
          symbols: ['VFIAX', 'VTSAX'],
          limit: 5,
          marketType: 'us-mf',
        },
      },
      {
        id: 'widget-5',
        type: 'chart',
        title: 'BTC Chart',
        marketType: 'crypto',
        refreshInterval: 120,
        chartConfig: {
          interval: 'daily',
          chartType: 'line',
          symbol: 'BTC',
          marketType: 'crypto',
        },
      },
      {
        id: 'widget-6',
        type: 'table',
        title: 'All Stocks',
        marketType: 'us',
        refreshInterval: 120,
        tableConfig: {
          searchEnabled: true,
          filterEnabled: true,
          pageSize: 10,
          marketType: 'us',
        },
      },
    ],
    layout: [
      { i: 'widget-1', x: 0, y: 0, w: 3, h: 4, minW: 3, minH: 3 },
      { i: 'widget-2', x: 3, y: 0, w: 3, h: 4, minW: 3, minH: 3 },
      { i: 'widget-3', x: 6, y: 0, w: 3, h: 4, minW: 3, minH: 3 },
      { i: 'widget-4', x: 9, y: 0, w: 3, h: 4, minW: 3, minH: 3 },
      { i: 'widget-5', x: 0, y: 4, w: 6, h: 5, minW: 5, minH: 4 },
      { i: 'widget-6', x: 6, y: 4, w: 6, h: 5, minW: 5, minH: 4 },
    ],
  },
];

export const applyTemplate = (template: DashboardTemplate): DashboardState => {
  return {
    widgets: template.widgets.reduce((acc, widget) => {
      acc[widget.id] = widget;
      return acc;
    }, {} as Record<string, WidgetConfig>),
    layout: template.layout,
    theme: 'light',
  };
};
