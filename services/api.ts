import axios from 'axios';
import { CacheEntry, StockData, ChartDataPoint, MarketType } from '@/types';

// Helper to get API keys from localStorage or environment
const getApiKey = (provider: 'alphaVantage' | 'finnhub'): string => {
  if (typeof window === 'undefined') {
    // Server-side: use environment variables
    if (provider === 'alphaVantage') {
      return process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || '';
    }
    if (provider === 'finnhub') {
      return process.env.NEXT_PUBLIC_FINNHUB_KEY || '';
    }
  }
  
  // Client-side: try localStorage first, then environment
  try {
    const stored = localStorage.getItem('apiKeys');
    if (stored) {
      const keys = JSON.parse(stored);
      if (keys[provider]) {
        return keys[provider];
      }
    }
  } catch (e) {
    console.warn('Failed to read API keys from localStorage');
  }
  
  // Fallback to environment variables
  if (provider === 'alphaVantage') {
    return process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || '';
  }
  if (provider === 'finnhub') {
    return process.env.NEXT_PUBLIC_FINNHUB_KEY || '';
  }
  
  return '';
};

// Cache implementation
class ApiCache {
  private cache: Map<string, CacheEntry> = new Map();

  set<T>(key: string, data: T, expiresIn: number = 60000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.expiresIn;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear() {
    this.cache.clear();
  }
}

const cache = new ApiCache();

// API Configuration - Keys loaded from localStorage or environment
const getApiConfig = () => ({
  ALPHA_VANTAGE_KEY: getApiKey('alphaVantage') || 'demo',
  FINNHUB_KEY: getApiKey('finnhub') || '',
  COINGECKO_KEY: process.env.NEXT_PUBLIC_COINGECKO_KEY || 'demo',
  TWELVE_DATA_KEY: process.env.NEXT_PUBLIC_TWELVE_DATA_KEY || 'demo',
});

// Request Queue System
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private readonly minDelay = 12000; // 12 seconds between requests (5 per minute)

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.minDelay) {
        await new Promise(resolve => setTimeout(resolve, this.minDelay - timeSinceLastRequest));
      }
      
      const request = this.queue.shift();
      if (request) {
        this.lastRequestTime = Date.now();
        await request();
      }
    }
    
    this.processing = false;
  }
}

const requestQueue = new RequestQueue();

// Rate limiting
let requestCount = 0;
let requestResetTime = Date.now();
const MAX_REQUESTS_PER_MINUTE = 5;

// Demo/Fallback data
const DEMO_DATA: Record<string, StockData> = {
  // US Stocks
  'AAPL': { symbol: 'AAPL', name: 'Apple Inc.', price: 195.71, change: 2.35, changePercent: 1.21, volume: 45678900, high: 196.50, low: 193.20, open: 194.10, previousClose: 193.36, marketType: 'us', currency: 'USD' },
  'GOOGL': { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 140.93, change: -1.23, changePercent: -0.87, volume: 23456789, high: 142.10, low: 140.20, open: 141.50, previousClose: 142.16, marketType: 'us', currency: 'USD' },
  'MSFT': { symbol: 'MSFT', name: 'Microsoft Corporation', price: 374.58, change: 3.42, changePercent: 0.92, volume: 34567890, high: 375.80, low: 371.20, open: 372.00, previousClose: 371.16, marketType: 'us', currency: 'USD' },
  'AMZN': { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 178.25, change: -0.85, changePercent: -0.47, volume: 28901234, high: 179.50, low: 177.10, open: 178.90, previousClose: 179.10, marketType: 'us', currency: 'USD' },
  'TSLA': { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.42, change: 5.67, changePercent: 2.34, volume: 56789012, high: 250.00, low: 242.80, open: 243.50, previousClose: 242.75, marketType: 'us', currency: 'USD' },
  'META': { symbol: 'META', name: 'Meta Platforms Inc.', price: 474.99, change: 4.20, changePercent: 0.89, volume: 18901234, high: 476.50, low: 470.30, open: 471.20, previousClose: 470.79, marketType: 'us', currency: 'USD' },
  'NVDA': { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 495.22, change: 8.15, changePercent: 1.67, volume: 41234567, high: 497.80, low: 487.50, open: 488.90, previousClose: 487.07, marketType: 'us', currency: 'USD' },
  'NFLX': { symbol: 'NFLX', name: 'Netflix Inc.', price: 638.33, change: -3.21, changePercent: -0.50, volume: 12345678, high: 642.00, low: 635.20, open: 640.50, previousClose: 641.54, marketType: 'us', currency: 'USD' },
  
  // Indian Stocks (NSE)
  'RELIANCE': { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', price: 2845.50, change: 32.75, changePercent: 1.16, volume: 8765432, high: 2860.00, low: 2810.20, open: 2820.00, previousClose: 2812.75, marketType: 'india', currency: 'INR' },
  'TCS': { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', price: 3678.90, change: -15.40, changePercent: -0.42, volume: 2345678, high: 3695.00, low: 3670.20, open: 3685.00, previousClose: 3694.30, marketType: 'india', currency: 'INR' },
  'INFY': { symbol: 'INFY', name: 'Infosys Ltd.', price: 1456.75, change: 12.30, changePercent: 0.85, volume: 5432109, high: 1462.00, low: 1445.50, open: 1448.20, previousClose: 1444.45, marketType: 'india', currency: 'INR' },
  'HDFCBANK': { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', price: 1689.25, change: 8.90, changePercent: 0.53, volume: 7654321, high: 1695.00, low: 1678.40, open: 1682.00, previousClose: 1680.35, marketType: 'india', currency: 'INR' },
  'ICICIBANK': { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', price: 1089.60, change: -5.20, changePercent: -0.47, volume: 6543210, high: 1096.80, low: 1085.30, open: 1092.50, previousClose: 1094.80, marketType: 'india', currency: 'INR' },
  'SBIN': { symbol: 'SBIN', name: 'State Bank of India', price: 625.40, change: 7.65, changePercent: 1.24, volume: 12345678, high: 628.90, low: 618.20, open: 620.50, previousClose: 617.75, marketType: 'india', currency: 'INR' },
  'BHARTIARTL': { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.', price: 1523.80, change: 18.45, changePercent: 1.22, volume: 4567890, high: 1530.00, low: 1508.60, open: 1512.00, previousClose: 1505.35, marketType: 'india', currency: 'INR' },
  'WIPRO': { symbol: 'WIPRO', name: 'Wipro Ltd.', price: 432.15, change: -3.25, changePercent: -0.75, volume: 3456789, high: 436.50, low: 430.20, open: 434.80, previousClose: 435.40, marketType: 'india', currency: 'INR' },
  'ITC': { symbol: 'ITC', name: 'ITC Ltd.', price: 456.80, change: 5.45, changePercent: 1.21, volume: 9876543, high: 459.00, low: 450.20, open: 451.50, previousClose: 451.35, marketType: 'india', currency: 'INR' },
  'AXISBANK': { symbol: 'AXISBANK', name: 'Axis Bank Ltd.', price: 1098.75, change: -8.25, changePercent: -0.74, volume: 5678901, high: 1108.50, low: 1095.20, open: 1105.00, previousClose: 1107.00, marketType: 'india', currency: 'INR' },
  'LT': { symbol: 'LT', name: 'Larsen & Toubro Ltd.', price: 3456.90, change: 42.30, changePercent: 1.24, volume: 3456789, high: 3475.00, low: 3420.50, open: 3430.00, previousClose: 3414.60, marketType: 'india', currency: 'INR' },
  'SUNPHARMA': { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Ltd.', price: 1678.45, change: -12.55, changePercent: -0.74, volume: 2345678, high: 1695.00, low: 1672.30, open: 1688.00, previousClose: 1691.00, marketType: 'india', currency: 'INR' },
  'KOTAKBANK': { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd.', price: 1823.60, change: 15.80, changePercent: 0.87, volume: 4567890, high: 1835.00, low: 1810.20, open: 1815.00, previousClose: 1807.80, marketType: 'india', currency: 'INR' },
  'HINDUNILVR': { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd.', price: 2567.90, change: 18.90, changePercent: 0.74, volume: 1234567, high: 2580.00, low: 2545.20, open: 2555.00, previousClose: 2549.00, marketType: 'india', currency: 'INR' },
  'MARUTI': { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd.', price: 12456.75, change: -85.25, changePercent: -0.68, volume: 876543, high: 12580.00, low: 12420.50, open: 12525.00, previousClose: 12542.00, marketType: 'india', currency: 'INR' },
  'TATAMOTORS': { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.', price: 789.45, change: 12.65, changePercent: 1.63, volume: 15678901, high: 795.00, low: 775.20, open: 780.00, previousClose: 776.80, marketType: 'india', currency: 'INR' },
  'ASIANPAINT': { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd.', price: 2987.60, change: -22.40, changePercent: -0.74, volume: 987654, high: 3015.00, low: 2975.20, open: 3005.00, previousClose: 3010.00, marketType: 'india', currency: 'INR' },
  'ULTRACEMCO': { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd.', price: 9876.45, change: 125.55, changePercent: 1.29, volume: 567890, high: 9920.00, low: 9750.20, open: 9800.00, previousClose: 9750.90, marketType: 'india', currency: 'INR' },
  'BAJFINANCE': { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd.', price: 6789.30, change: -45.70, changePercent: -0.67, volume: 1234567, high: 6850.00, low: 6765.20, open: 6820.00, previousClose: 6835.00, marketType: 'india', currency: 'INR' },
  'ONGC': { symbol: 'ONGC', name: 'Oil and Natural Gas Corporation Ltd.', price: 245.80, change: 3.45, changePercent: 1.42, volume: 23456789, high: 248.00, low: 241.50, open: 243.00, previousClose: 242.35, marketType: 'india', currency: 'INR' },
  
  // Cryptocurrencies
  'BTC': { symbol: 'BTC', name: 'Bitcoin', price: 95847.32, change: 1245.67, changePercent: 1.32, volume: 28901234567, high: 96500.00, low: 94200.50, open: 94601.65, previousClose: 94601.65, marketType: 'crypto', currency: 'USD' },
  'ETH': { symbol: 'ETH', name: 'Ethereum', price: 3524.89, change: -45.23, changePercent: -1.27, volume: 15678901234, high: 3580.00, low: 3510.20, open: 3570.12, previousClose: 3570.12, marketType: 'crypto', currency: 'USD' },
  'BNB': { symbol: 'BNB', name: 'Binance Coin', price: 689.42, change: 12.35, changePercent: 1.82, volume: 2345678901, high: 695.00, low: 675.50, open: 677.07, previousClose: 677.07, marketType: 'crypto', currency: 'USD' },
  'SOL': { symbol: 'SOL', name: 'Solana', price: 198.76, change: 8.92, changePercent: 4.70, volume: 5678901234, high: 202.50, low: 188.30, open: 189.84, previousClose: 189.84, marketType: 'crypto', currency: 'USD' },
  'XRP': { symbol: 'XRP', name: 'Ripple', price: 2.35, change: 0.08, changePercent: 3.52, volume: 8901234567, high: 2.42, low: 2.25, open: 2.27, previousClose: 2.27, marketType: 'crypto', currency: 'USD' },
  'ADA': { symbol: 'ADA', name: 'Cardano', price: 1.02, change: -0.03, changePercent: -2.86, volume: 3456789012, high: 1.06, low: 1.00, open: 1.05, previousClose: 1.05, marketType: 'crypto', currency: 'USD' },
  'DOGE': { symbol: 'DOGE', name: 'Dogecoin', price: 0.32, change: 0.02, changePercent: 6.67, volume: 9012345678, high: 0.33, low: 0.29, open: 0.30, previousClose: 0.30, marketType: 'crypto', currency: 'USD' },
  'MATIC': { symbol: 'MATIC', name: 'Polygon', price: 1.15, change: 0.05, changePercent: 4.55, volume: 2345678901, high: 1.18, low: 1.08, open: 1.10, previousClose: 1.10, marketType: 'crypto', currency: 'USD' },
  
  // US Mutual Funds
  'VFIAX': { symbol: 'VFIAX', name: 'Vanguard 500 Index Fund Admiral', price: 412.50, change: 3.25, changePercent: 0.79, volume: 1234567, high: 413.20, low: 410.80, open: 411.00, previousClose: 409.25, marketType: 'us-mf', currency: 'USD' },
  'VTSAX': { symbol: 'VTSAX', name: 'Vanguard Total Stock Market Index Admiral', price: 115.75, change: 0.85, changePercent: 0.74, volume: 987654, high: 116.00, low: 115.20, open: 115.40, previousClose: 114.90, marketType: 'us-mf', currency: 'USD' },
  'FXAIX': { symbol: 'FXAIX', name: 'Fidelity 500 Index Fund', price: 178.90, change: 1.40, changePercent: 0.79, volume: 876543, high: 179.20, low: 178.10, open: 178.30, previousClose: 177.50, marketType: 'us-mf', currency: 'USD' },
  
  // Indian Mutual Funds
  'AXISELIQUID': { symbol: 'AXISELIQUID', name: 'Axis Liquid Fund - Direct Growth', price: 2456.78, change: 1.23, changePercent: 0.05, volume: 234567, high: 2457.00, low: 2456.50, open: 2456.60, previousClose: 2455.55, marketType: 'india-mf', currency: 'INR' },
  'ICICIPRULIFE': { symbol: 'ICICIPRULIFE', name: 'ICICI Prudential Equity & Debt Fund', price: 189.45, change: 2.15, changePercent: 1.15, volume: 345678, high: 190.00, low: 188.50, open: 188.80, previousClose: 187.30, marketType: 'india-mf', currency: 'INR' },
  'HDFCTOP100': { symbol: 'HDFCTOP100', name: 'HDFC Top 100 Fund - Direct Growth', price: 678.90, change: 5.45, changePercent: 0.81, volume: 456789, high: 680.00, low: 675.20, open: 676.50, previousClose: 673.45, marketType: 'india-mf', currency: 'INR' },
};

const checkRateLimit = () => {
  // Reset per-minute counter
  if (Date.now() - requestResetTime > 60000) {
    requestCount = 0;
    requestResetTime = Date.now();
  }

  // Check per-minute limit
  if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
    const waitTime = Math.ceil((60000 - (Date.now() - requestResetTime)) / 1000);
    throw new Error(`Rate limit: Please wait ${waitTime} seconds before making more requests.`);
  }

  requestCount++;
};

// Fetch stock quote
export const fetchStockQuote = async (symbol: string, bypassCache: boolean = false): Promise<StockData> => {
  const cacheKey = `quote-${symbol}`;
  const cached = cache.get<StockData>(cacheKey);
  if (cached && !bypassCache) return cached;

  try {
    // Use request queue to respect rate limits
    return await requestQueue.add(async () => {
      checkRateLimit();

      try {
        // Using Alpha Vantage API
        const response = await axios.get(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${getApiConfig().ALPHA_VANTAGE_KEY}`
        );

        // Check for API error messages
        if (response.data['Error Message']) {
          throw new Error(`Invalid symbol: ${symbol}`);
        }

        if (response.data['Note']) {
          throw new Error('API rate limit reached. Please wait a moment and try again.');
        }

        if (response.data['Information']) {
          throw new Error('API limit reached. Please check your API key or try again later.');
        }

        const quote = response.data['Global Quote'];
        if (!quote || Object.keys(quote).length === 0) {
          // Check if we're using demo key
          if (getApiConfig().ALPHA_VANTAGE_KEY === 'demo') {
            throw new Error('Demo API key has limited functionality. Please add your own API key to .env.local');
          }
          throw new Error(`No data available for symbol: ${symbol}. Please verify the symbol is correct.`);
        }

        const stockData: StockData = {
          symbol: quote['01. symbol'] || symbol,
          name: symbol,
          price: parseFloat(quote['05. price'] || '0'),
          change: parseFloat(quote['09. change'] || '0'),
          changePercent: parseFloat(quote['10. change percent']?.replace('%', '') || '0'),
          volume: parseInt(quote['06. volume'] || '0'),
          high: parseFloat(quote['03. high'] || '0'),
          low: parseFloat(quote['04. low'] || '0'),
          open: parseFloat(quote['02. open'] || '0'),
          previousClose: parseFloat(quote['08. previous close'] || '0'),
        };

        cache.set(cacheKey, stockData, 30000); // Cache for 30 seconds for more frequent updates
        return stockData;
      } catch (error: any) {
        // If API fails and we have demo data, use it as fallback
        if (DEMO_DATA[symbol]) {
          console.warn(`⚠️ Using demo data for ${symbol} due to API error:`, error.message);
          cache.set(cacheKey, DEMO_DATA[symbol], 60000); // Cache demo data for 1 minute
          return DEMO_DATA[symbol];
        }
        throw error;
      }
    });
  } catch (error: any) {
    // Final fallback to demo data if available
    if (DEMO_DATA[symbol]) {
      console.warn(`⚠️ Using demo data for ${symbol} as final fallback`);
      return DEMO_DATA[symbol];
    }
    console.error(`Error fetching ${symbol}:`, error.message);
    throw new Error(error.message || 'Failed to fetch stock data');
  }
};

// Fetch multiple stocks
export const fetchMultipleStocks = async (symbols: string[]): Promise<StockData[]> => {
  const promises = symbols.map(symbol => 
    fetchStockQuote(symbol).catch(err => {
      console.error(`Error fetching ${symbol}:`, err);
      return null;
    })
  );

  const results = await Promise.all(promises);
  return results.filter((data): data is StockData => data !== null);
};

// Fetch chart data
export const fetchChartData = async (
  symbol: string,
  interval: 'daily' | 'weekly' | 'monthly' = 'daily',
  marketType?: MarketType
): Promise<ChartDataPoint[]> => {
  const cacheKey = `chart-${symbol}-${interval}-${marketType}`;
  const cached = cache.get<ChartDataPoint[]>(cacheKey);
  if (cached) {
    console.log(`📦 Using cached data for ${symbol} (${interval})`);
    return cached;
  }

  // Handle Crypto - generate demo data (crypto historical data requires paid APIs)
  if (marketType === 'crypto') {
    const demoChartData = generateDemoChartData(symbol);
    cache.set(cacheKey, demoChartData, 1800000); // 30 minutes cache for crypto
    return demoChartData;
  }

  // Handle US Mutual Funds via Alpha Vantage
  if (marketType === 'us-mf') {
    try {
      return await requestQueue.add(async () => {
        checkRateLimit();

        const functionMap = {
          daily: 'TIME_SERIES_DAILY',
          weekly: 'TIME_SERIES_WEEKLY',
          monthly: 'TIME_SERIES_MONTHLY',
        };

        const response = await axios.get(
          `https://www.alphavantage.co/query?function=${functionMap[interval]}&symbol=${symbol}&outputsize=compact&apikey=${getApiConfig().ALPHA_VANTAGE_KEY}`
        );

        if (response.data['Error Message'] || response.data['Note'] || response.data['Information']) {
          throw new Error('API error');
        }

        const timeSeriesKey = Object.keys(response.data).find(key => key.includes('Time Series'));
        if (!timeSeriesKey) {
          throw new Error('No data available');
        }

        const timeSeries = response.data[timeSeriesKey];
        const chartData: ChartDataPoint[] = Object.entries(timeSeries)
          .map(([date, data]: [string, any]) => ({
            date,
            open: parseFloat(data['1. open']),
            high: parseFloat(data['2. high']),
            low: parseFloat(data['3. low']),
            close: parseFloat(data['4. close']),
            volume: parseInt(data['5. volume'] || '0'),
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        cache.set(cacheKey, chartData, 1800000); // 30 minutes cache
        return chartData;
      });
    } catch (error: any) {
      console.warn(`⚠️ Using demo chart data for US MF ${symbol}`);
      const demoChartData = generateDemoChartData(symbol);
      cache.set(cacheKey, demoChartData, 1800000); // 30 minutes cache
      return demoChartData;
    }
  }

  // Handle Indian Mutual Funds - use demo data (MFAPI doesn't provide historical charts)
  if (marketType === 'india-mf') {
    const demoChartData = generateDemoChartData(symbol);
    cache.set(cacheKey, demoChartData, 1800000); // 30 minutes cache
    return demoChartData;
  }

  // Handle Indian stocks via Yahoo Finance API
  if (marketType === 'india') {
    try {
      const rangeMap = {
        daily: '1y',   // Get 1 year of daily data
        weekly: '5y',  // Get 5 years of weekly data
        monthly: 'max', // Get all available monthly data
      };
      
      const response = await axios.get(
        `/api/indian-stock-chart?symbol=${symbol}&interval=1d&range=${rangeMap[interval]}`
      );
      
      const chartData = response.data?.chartData || [];
      
      if (chartData.length === 0) {
        throw new Error('No chart data available');
      }
      
      cache.set(cacheKey, chartData, 1800000); // Cache for 30 minutes
      return chartData;
    } catch (error: any) {
      console.error(`Chart data error for ${symbol}:`, error.message);
      // Return demo chart data as fallback
      if (DEMO_DATA[symbol]) {
        const demoChartData = generateDemoChartData(symbol);
        cache.set(cacheKey, demoChartData, 1800000); // Cache for 30 minutes
        return demoChartData;
      }
      throw new Error(`No chart data available for ${symbol}`);
    }
  }

  // Handle US stocks via Alpha Vantage
  try {
    // Use request queue to respect rate limits
    return await requestQueue.add(async () => {
      checkRateLimit();

      try {
        const functionMap = {
          daily: 'TIME_SERIES_DAILY',
          weekly: 'TIME_SERIES_WEEKLY',
          monthly: 'TIME_SERIES_MONTHLY',
        };

        const response = await axios.get(
          `https://www.alphavantage.co/query?function=${functionMap[interval]}&symbol=${symbol}&outputsize=compact&apikey=${getApiConfig().ALPHA_VANTAGE_KEY}`
        );

        console.log(`📡 API Response for ${symbol}:`, {
          hasErrorMessage: !!response.data['Error Message'],
          hasNote: !!response.data['Note'],
          hasInformation: !!response.data['Information'],
          keys: Object.keys(response.data).slice(0, 5)
        });

        // Check for API error messages
        if (response.data['Error Message']) {
          console.error(`❌ Alpha Vantage Error: Invalid symbol ${symbol}`);
          throw new Error(`Invalid symbol: ${symbol}`);
        }

        if (response.data['Note']) {
          console.error(`❌ Alpha Vantage Rate Limit: ${response.data['Note']}`);
          throw new Error('API rate limit reached. Please wait a moment and try again.');
        }

        if (response.data['Information']) {
          console.error(`❌ Alpha Vantage Info: ${response.data['Information']}`);
          throw new Error('API limit reached. Please check your API key or try again later.');
        }

        const timeSeriesKey = Object.keys(response.data).find(key => key.includes('Time Series'));
        if (!timeSeriesKey) {
          if (getApiConfig().ALPHA_VANTAGE_KEY === 'demo') {
            throw new Error('Demo API key has limited functionality. Please add your own API key to .env.local');
          }
          throw new Error(`No chart data available for symbol: ${symbol}`);
        }

        const timeSeries = response.data[timeSeriesKey];
        const chartData: ChartDataPoint[] = Object.entries(timeSeries)
          .map(([date, data]: [string, any]) => ({
            date,
            open: parseFloat(data['1. open']),
            high: parseFloat(data['2. high']),
            low: parseFloat(data['3. low']),
            close: parseFloat(data['4. close']),
            volume: parseInt(data['5. volume']),
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        cache.set(cacheKey, chartData, 300000); // Cache for 5 minutes to get fresher data
        console.log(`✅ Real API data loaded for ${symbol}: ${chartData.length} points`);
        return chartData;
      } catch (error: any) {
        // Generate demo chart data as fallback (silently, as this is expected with free tier)
        console.warn(`⚠️ API error for ${symbol}, using demo data:`, error.message);
        const demoChartData = generateDemoChartData(symbol);
        cache.set(cacheKey, demoChartData, 300000); // Cache for 5 minutes
        return demoChartData;
      }
    });
  } catch (error: any) {
    // Final fallback to demo chart data (silently, as this is expected with free tier)
    console.warn(`⚠️ Request queue error for ${symbol}, using demo data:`, error.message);
    const demoChartData = generateDemoChartData(symbol);
    cache.set(cacheKey, demoChartData, 300000); // Cache for 5 minutes
    return demoChartData;
  }
};

// Generate demo chart data for fallback
const generateDemoChartData = (symbol: string, basePrice?: number): ChartDataPoint[] => {
  const data = DEMO_DATA[symbol];
  const price = data?.price || basePrice || 100; // Use provided price or default to 100
  
  const chartData: ChartDataPoint[] = [];
  const today = new Date();

  // Generate 365 days of demo data (1 year) to support all time ranges
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Simulate price variation (±3%)
    const variation = (Math.random() - 0.5) * 0.06;
    const dayPrice = price * (1 + variation);
    const dayHigh = dayPrice * 1.02;
    const dayLow = dayPrice * 0.98;
    
    chartData.push({
      date: date.toISOString().split('T')[0],
      open: parseFloat((dayPrice * 0.995).toFixed(2)),
      high: parseFloat(dayHigh.toFixed(2)),
      low: parseFloat(dayLow.toFixed(2)),
      close: parseFloat(dayPrice.toFixed(2)),
      volume: Math.floor((data?.volume || 10000000) * (0.8 + Math.random() * 0.4)),
    });
  }

  return chartData;
};

// Get market gainers (mock data for demo)
export const fetchMarketGainers = async (): Promise<StockData[]> => {
  const cacheKey = 'market-gainers';
  const cached = cache.get<StockData[]>(cacheKey);
  if (cached) return cached;

  // Using popular stock symbols
  const symbols = ['GOOGL', 'TSLA', 'AMZN', 'META', 'NVDA'];
  const data = await fetchMultipleStocks(symbols);
  
  // Sort by change percent
  const gainers = data.sort((a, b) => b.changePercent - a.changePercent);
  
  cache.set(cacheKey, gainers, 60000); // Cache for 1 minute
  return gainers;
};

// Search stocks (with dynamic API for Indian stocks)
export const searchStocks = async (query: string, marketType: MarketType = 'us'): Promise<StockData[]> => {
  if (!query || query.length < 2) return [];

  // For US Mutual Funds, use the mutual fund search API
  if (marketType === 'us-mf') {
    try {
      const response = await axios.get(`/api/search-us-mutual-fund?query=${encodeURIComponent(query)}`);
      const results = response.data?.results || [];
      
      return results.map((fund: any) => ({
        symbol: fund.symbol,
        name: fund.name,
        price: 0,
        change: 0,
        changePercent: 0,
        volume: 0,
        marketType: 'us-mf' as MarketType,
        currency: 'USD',
      }));
    } catch (error) {
      console.warn('US mutual fund search API failed');
      return [];
    }
  }

  // For Indian Mutual Funds, use the MFAPI search
  if (marketType === 'india-mf') {
    try {
      const response = await axios.get(`/api/search-indian-mutual-fund?query=${encodeURIComponent(query)}`);
      const results = response.data?.results || [];
      
      return results.map((fund: any) => ({
        symbol: fund.symbol,
        name: fund.name,
        price: 0,
        change: 0,
        changePercent: 0,
        volume: 0,
        marketType: 'india-mf' as MarketType,
        currency: 'INR',
        schemeCode: fund.schemeCode,
      }));
    } catch (error) {
      console.warn('Indian mutual fund search API failed');
      return [];
    }
  }

  // Filter demo data by market type and query
  const filteredDemo = Object.values(DEMO_DATA)
    .filter(stock => 
      stock.marketType === marketType &&
      (stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
       stock.name.toLowerCase().includes(query.toLowerCase()))
    )
    .slice(0, 10);

  // For Indian stocks, use dynamic Yahoo Finance search API
  if (marketType === 'india') {
    try {
      const response = await axios.get(`/api/search-indian-stock?query=${encodeURIComponent(query)}`);
      const results = response.data?.results || [];
      
      if (results.length > 0) {
        return results.map((stock: any) => ({
          symbol: stock.symbol,
          name: stock.name,
          price: 0,
          change: 0,
          changePercent: 0,
          volume: 0,
          marketType: 'india' as MarketType,
          currency: 'INR',
        }));
      }
    } catch (error) {
      console.warn('Indian stock search API failed, using demo data');
    }
    
    // Fallback to demo data if API fails
    if (filteredDemo.length > 0) {
      return filteredDemo;
    }
    
    return [];
  }

  if (filteredDemo.length > 0) {
    return filteredDemo;
  }

  // Only make API call for US stocks
  if (marketType !== 'us') {
    return [];
  }

  checkRateLimit();

  try {
    const response = await axios.get(
      `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${query}&apikey=${getApiConfig().ALPHA_VANTAGE_KEY}`
    );

    const matches = response.data.bestMatches || [];
    return matches.slice(0, 10).map((match: any) => ({
      symbol: match['1. symbol'],
      name: match['2. name'],
      price: 0,
      change: 0,
      changePercent: 0,
      volume: 0,
      marketType: 'us' as MarketType,
      currency: 'USD',
    }));
  } catch (error) {
    console.error('Error searching stocks:', error);
    return filteredDemo;
  }
};

// Fetch cryptocurrency data from CoinCap API (Primary) with Binance fallback
export const fetchCryptoQuote = async (symbol: string): Promise<StockData> => {
  const cacheKey = `crypto-${symbol}`;
  const cached = cache.get<StockData>(cacheKey);
  if (cached) return cached;

  // Map common symbols to CoinCap IDs
  const cryptoIdMap: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'BNB': 'binance-coin',
    'SOL': 'solana',
    'XRP': 'xrp',
    'ADA': 'cardano',
    'DOGE': 'dogecoin',
    'MATIC': 'polygon',
  };

  const cryptoId = cryptoIdMap[symbol.toUpperCase()];
  
  if (!cryptoId) {
    // Return demo data if available
    if (DEMO_DATA[symbol]) {
      return DEMO_DATA[symbol];
    }
    throw new Error(`Cryptocurrency ${symbol} not supported`);
  }

  try {
    // Use Binance API (reliable, free, no key needed)
    const binanceSymbol = symbol.toUpperCase() + 'USDT';
    const [tickerResponse, priceResponse] = await Promise.all([
      axios.get(`https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`),
      axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`)
    ]);

    const ticker = tickerResponse.data;
    const price = parseFloat(priceResponse.data.price);
    const changePercent = parseFloat(ticker.priceChangePercent);

    const stockData: StockData = {
      symbol: symbol.toUpperCase(),
      name: symbol.toUpperCase(),
      price: price,
      change: parseFloat(ticker.priceChange),
      changePercent: changePercent,
      volume: parseFloat(ticker.volume),
      marketType: 'crypto',
      currency: 'USD',
    };

    cache.set(cacheKey, stockData, 60000);
    return stockData;
  } catch (binanceError: any) {
    console.warn(`⚠️ Binance API failed for ${symbol}, using demo data`);
    if (DEMO_DATA[symbol]) {
      return DEMO_DATA[symbol];
    }
    throw new Error(`Failed to fetch crypto data for ${symbol}`);
  }
};

// Fetch Indian stock data (using demo data primarily)
// Fetch Indian stock data (using Yahoo Finance via Next.js API proxy)
// Yahoo Finance supports NSE stocks with .NS suffix (e.g., RELIANCE.NS)
export const fetchIndianStockQuote = async (symbol: string): Promise<StockData> => {
  const cacheKey = `india-${symbol}`;
  const cached = cache.get<StockData>(cacheKey);
  if (cached) return cached;

  try {
    return await requestQueue.add(async () => {
      // Call our Next.js API route that proxies to Yahoo Finance
      const response = await axios.get(`/api/indian-stock?symbol=${symbol}`);

      const stockData: StockData = response.data;

      cache.set(cacheKey, stockData, 120000); // Cache for 2 minutes
      return stockData;
    });
  } catch (error: any) {
    console.warn(`⚠️ Yahoo Finance API failed for ${symbol}, using demo data:`, error.message);
    
    // Fallback to demo data
    if (DEMO_DATA[symbol] && DEMO_DATA[symbol].marketType === 'india') {
      cache.set(cacheKey, DEMO_DATA[symbol], 120000);
      return DEMO_DATA[symbol];
    }

    throw new Error(`Indian stock ${symbol} not found. Try symbols like: RELIANCE, TCS, INFY, HDFCBANK`);
  }
};

// Fetch US Mutual Fund quote
export const fetchUSMutualFundQuote = async (symbol: string): Promise<StockData> => {
  const cacheKey = `us-mf-${symbol}`;
  const cached = cache.get<StockData>(cacheKey);
  if (cached) return cached;

  try {
    return await requestQueue.add(async () => {
      // Call our Next.js API route for US mutual funds
      const response = await axios.get(`/api/us-mutual-fund?symbol=${symbol}`);

      const mfData: StockData = response.data;

      cache.set(cacheKey, mfData, 300000); // Cache for 5 minutes (MF prices update less frequently)
      return mfData;
    });
  } catch (error: any) {
    console.warn(`⚠️ US Mutual Fund API failed for ${symbol}, using demo data:`, error.message);
    
    // Fallback to demo data
    if (DEMO_DATA[symbol] && DEMO_DATA[symbol].marketType === 'us-mf') {
      cache.set(cacheKey, DEMO_DATA[symbol], 300000);
      return DEMO_DATA[symbol];
    }

    throw new Error(`US Mutual Fund ${symbol} not found. Try symbols like: VFIAX, VTSAX, FXAIX`);
  }
};

// Fetch Indian Mutual Fund quote
export const fetchIndianMutualFundQuote = async (symbol: string): Promise<StockData> => {
  const cacheKey = `india-mf-${symbol}`;
  const cached = cache.get<StockData>(cacheKey);
  if (cached) return cached;

  try {
    return await requestQueue.add(async () => {
      // Call our Next.js API route for Indian mutual funds
      const response = await axios.get(`/api/indian-mutual-fund?symbol=${symbol}`);

      const mfData: StockData = response.data;

      cache.set(cacheKey, mfData, 300000); // Cache for 5 minutes
      return mfData;
    });
  } catch (error: any) {
    console.warn(`⚠️ Indian Mutual Fund API failed for ${symbol}, using demo data:`, error.message);
    
    // Fallback to demo data
    if (DEMO_DATA[symbol] && DEMO_DATA[symbol].marketType === 'india-mf') {
      cache.set(cacheKey, DEMO_DATA[symbol], 300000);
      return DEMO_DATA[symbol];
    }

    throw new Error(`Indian Mutual Fund ${symbol} not found. Try symbols like: AXISELIQUID, ICICIPRULIFE, HDFCTOP100`);
  }
};

// Universal fetch function that routes to appropriate API
export const fetchQuote = async (symbol: string, marketType: MarketType = 'us'): Promise<StockData> => {
  switch (marketType) {
    case 'crypto':
      return fetchCryptoQuote(symbol);
    case 'india':
      return fetchIndianStockQuote(symbol);
    case 'us-mf':
      return fetchUSMutualFundQuote(symbol);
    case 'india-mf':
      return fetchIndianMutualFundQuote(symbol);
    case 'us':
    default:
      return fetchStockQuote(symbol);
  }
};

// Fetch multiple quotes with market type support
export const fetchMultipleQuotes = async (
  symbols: string[], 
  marketType: MarketType = 'us'
): Promise<StockData[]> => {
  const promises = symbols.map(symbol => 
    fetchQuote(symbol, marketType).catch(err => {
      console.error(`Error fetching ${symbol}:`, err);
      return null;
    })
  );

  const results = await Promise.all(promises);
  return results.filter((data): data is StockData => data !== null);
};

export { cache };
