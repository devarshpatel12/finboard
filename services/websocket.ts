import { StockData } from '@/types';

class WebSocketManager {
  private static instance: WebSocketManager;
  private finnhubWs: WebSocket | null = null;
  private binanceWs: WebSocket | null = null;
  private subscribers: Map<string, Set<(data: StockData) => void>> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private isConnecting: Map<string, boolean> = new Map();
  private connectionEnabled: Map<string, boolean> = new Map();

  private constructor() {
    this.connectionEnabled.set('finnhub', true);
    this.connectionEnabled.set('binance', true);
  }

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  // Subscribe to real-time updates for a symbol
  subscribe(symbol: string, marketType: string, callback: (data: StockData) => void) {
    const key = `${marketType}:${symbol}`;
    
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    
    this.subscribers.get(key)!.add(callback);

    // Connect to appropriate WebSocket only if enabled
    if (marketType === 'us' && this.connectionEnabled.get('finnhub') && !this.finnhubWs && !this.isConnecting.get('finnhub')) {
      this.connectFinnhub();
    } else if (marketType === 'crypto' && this.connectionEnabled.get('binance') && !this.binanceWs && !this.isConnecting.get('binance')) {
      this.connectBinance();
    }

    // Subscribe to symbol updates only if connection is ready
    if (marketType === 'us' && this.finnhubWs?.readyState === WebSocket.OPEN) {
      this.finnhubWs.send(JSON.stringify({ type: 'subscribe', symbol: symbol }));
    } else if (marketType === 'crypto' && this.binanceWs?.readyState === WebSocket.OPEN) {
      const binanceSymbol = `${symbol.toLowerCase()}usdt`;
      this.binanceWs.send(JSON.stringify({
        method: 'SUBSCRIBE',
        params: [`${binanceSymbol}@ticker`],
        id: Date.now(),
      }));
    }

    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(key);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(key);
          // Unsubscribe from WebSocket
          if (marketType === 'us' && this.finnhubWs?.readyState === WebSocket.OPEN) {
            this.finnhubWs.send(JSON.stringify({ type: 'unsubscribe', symbol: symbol }));
          }
        }
      }
    };
  }

  // Check if WebSocket is connected for a market type
  isConnected(marketType: string): boolean {
    if (marketType === 'us') {
      return this.finnhubWs?.readyState === WebSocket.OPEN && this.connectionEnabled.get('finnhub') === true;
    } else if (marketType === 'crypto') {
      return this.binanceWs?.readyState === WebSocket.OPEN && this.connectionEnabled.get('binance') === true;
    }
    return false;
  }

  private connectFinnhub() {
    if (this.isConnecting.get('finnhub') || !this.connectionEnabled.get('finnhub')) {
      return;
    }

    // Try to get API key from localStorage first, then environment
    let apiKey = '';
    try {
      const stored = localStorage.getItem('apiKeys');
      if (stored) {
        const keys = JSON.parse(stored);
        apiKey = keys.finnhub || '';
      }
    } catch (e) {
      console.warn('Failed to read Finnhub key from localStorage');
    }
    
    // Fallback to environment variable
    if (!apiKey) {
      apiKey = process.env.NEXT_PUBLIC_FINNHUB_KEY || '';
    }
    
    // Validate key format (should be at least 20 characters for Finnhub)
    if (!apiKey || apiKey === 'demo' || apiKey.length < 20) {
      console.info('ℹ️ Finnhub API key not configured or invalid. Real-time WebSocket disabled for US stocks. Using polling fallback.');
      this.connectionEnabled.set('finnhub', false);
      return;
    }

    this.isConnecting.set('finnhub', true);

    try {
      this.finnhubWs = new WebSocket(`wss://ws.finnhub.io?token=${apiKey}`);

      this.finnhubWs.onopen = () => {
        console.log('✅ Finnhub WebSocket connected');
        this.reconnectAttempts.set('finnhub', 0);
        this.isConnecting.set('finnhub', false);
        
        // Resubscribe to all US stock symbols
        this.subscribers.forEach((_, key) => {
          if (key.startsWith('us:')) {
            const symbol = key.split(':')[1];
            this.finnhubWs!.send(JSON.stringify({ type: 'subscribe', symbol: symbol }));
          }
        });
      };

      this.finnhubWs.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'trade' && message.data) {
            message.data.forEach((trade: any) => {
              const key = `us:${trade.s}`;
              const subscribers = this.subscribers.get(key);
              
              if (subscribers) {
                const stockData: StockData = {
                  symbol: trade.s,
                  name: trade.s,
                  price: trade.p,
                  change: 0, // WebSocket doesn't provide change
                  changePercent: 0,
                  volume: trade.v,
                  high: 0,
                  low: 0,
                  open: 0,
                  previousClose: 0,
                  marketType: 'us',
                  currency: 'USD',
                };
                
                subscribers.forEach(callback => callback(stockData));
              }
            });
          }
        } catch (error) {
          console.error('Error parsing Finnhub message:', error);
        }
      };

      this.finnhubWs.onerror = (error) => {
        console.warn('⚠️ Finnhub WebSocket connection failed. Using polling fallback for US stocks.');
        this.isConnecting.set('finnhub', false);
      };

      this.finnhubWs.onclose = () => {
        console.info('ℹ️ Finnhub WebSocket disconnected');
        this.isConnecting.set('finnhub', false);
        this.finnhubWs = null;
        this.attemptReconnect('finnhub');
      };
    } catch (error) {
      console.warn('Failed to establish Finnhub WebSocket connection. Using polling fallback.');
      this.isConnecting.set('finnhub', false);
      this.connectionEnabled.set('finnhub', false);
    }
  }

  private connectBinance() {
    if (this.isConnecting.get('binance') || !this.connectionEnabled.get('binance')) {
      return;
    }

    this.isConnecting.set('binance', true);

    try {
      this.binanceWs = new WebSocket('wss://stream.binance.com:9443/ws');

      this.binanceWs.onopen = () => {
        console.log('✅ Binance WebSocket connected');
        this.reconnectAttempts.set('binance', 0);
        this.isConnecting.set('binance', false);

        // Resubscribe to all crypto symbols
        const symbols: string[] = [];
        this.subscribers.forEach((_, key) => {
          if (key.startsWith('crypto:')) {
            const symbol = key.split(':')[1];
            symbols.push(`${symbol.toLowerCase()}usdt@ticker`);
          }
        });

        if (symbols.length > 0) {
          this.binanceWs!.send(JSON.stringify({
            method: 'SUBSCRIBE',
            params: symbols,
            id: Date.now(),
          }));
        }
      };

      this.binanceWs.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.e === '24hrTicker') {
            const symbol = message.s.replace('USDT', '').toUpperCase();
            const key = `crypto:${symbol}`;
            const subscribers = this.subscribers.get(key);

            if (subscribers) {
              const stockData: StockData = {
                symbol: symbol,
                name: symbol,
                price: parseFloat(message.c),
                change: parseFloat(message.p),
                changePercent: parseFloat(message.P),
                volume: parseFloat(message.v),
                high: parseFloat(message.h),
                low: parseFloat(message.l),
                open: parseFloat(message.o),
                previousClose: parseFloat(message.x),
                marketType: 'crypto',
                currency: 'USD',
              };

              subscribers.forEach(callback => callback(stockData));
            }
          }
        } catch (error) {
          console.error('Error parsing Binance message:', error);
        }
      };

      this.binanceWs.onerror = (error) => {
        console.warn('⚠️ Binance WebSocket connection issue. Using polling fallback for crypto.');
        this.isConnecting.set('binance', false);
      };

      this.binanceWs.onclose = () => {
        console.info('ℹ️ Binance WebSocket disconnected');
        this.isConnecting.set('binance', false);
        this.binanceWs = null;
        this.attemptReconnect('binance');
      };
    } catch (error) {
      console.warn('Failed to establish Binance WebSocket connection. Using polling fallback.');
      this.isConnecting.set('binance', false);
      this.connectionEnabled.set('binance', false);
    }
  }

  private attemptReconnect(type: 'finnhub' | 'binance') {
    const attempts = this.reconnectAttempts.get(type) || 0;
    
    if (attempts >= this.maxReconnectAttempts) {
      console.info(`⚠️ Max reconnection attempts reached for ${type}. Using polling fallback.`);
      this.connectionEnabled.set(type, false);
      return;
    }

    if (!this.connectionEnabled.get(type)) {
      return;
    }

    this.reconnectAttempts.set(type, attempts + 1);
    const delay = this.reconnectDelay * (attempts + 1);

    console.info(`🔄 Reconnecting ${type} in ${delay}ms (attempt ${attempts + 1}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (type === 'finnhub') {
        this.connectFinnhub();
      } else {
        this.connectBinance();
      }
    }, delay);
  }

  disconnect() {
    if (this.finnhubWs) {
      this.finnhubWs.close();
      this.finnhubWs = null;
    }
    if (this.binanceWs) {
      this.binanceWs.close();
      this.binanceWs = null;
    }
    this.subscribers.clear();
  }
}

export default WebSocketManager;
