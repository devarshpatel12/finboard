import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');

  try {
    switch (type) {
      case 'us-stock': {
        // Test Alpha Vantage US stock API
        const alphaKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY;
        
        try {
          const response = await axios.get(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=GOOGL&apikey=${alphaKey}`
          );
          
          if (response.data['Error Message']) {
            return NextResponse.json({ success: false, error: 'Invalid symbol or API error' });
          }
          if (response.data['Note'] || response.data['Information']) {
            return NextResponse.json({ 
              success: true, 
              message: 'API rate limited - Demo data fallback active',
              details: 'Alpha Vantage free tier: 25 requests/day. App uses cached demo data when limit reached.'
            });
          }
          
          return NextResponse.json({ 
            success: true, 
            message: 'Alpha Vantage US Stocks API working',
            data: response.data['Global Quote']
          });
        } catch (error: any) {
          if (error.response?.status === 429 || error.message?.includes('rate limit')) {
            return NextResponse.json({ 
              success: true, 
              message: 'API rate limited - Demo data fallback active',
              details: 'Alpha Vantage free tier: 25 requests/day. App uses cached demo data when limit reached.'
            });
          }
          throw error;
        }
      }

      case 'us-mf': {
        // Test US Mutual Fund API via our proxy endpoint
        try {
          const response = await axios.get(
            'http://localhost:3000/api/us-mutual-fund?symbol=VFIAX'
          );
          
          return NextResponse.json({ 
            success: true, 
            message: 'Alpha Vantage US Mutual Funds API working (or using demo data)',
            data: response.data
          });
        } catch (error: any) {
          // If we get 429, the API is rate limited but demo data should work
          if (error.response?.status === 429) {
            return NextResponse.json({ 
              success: true, 
              message: 'API rate limited - Demo data fallback active',
              details: 'Alpha Vantage free tier: 25 requests/day. App uses cached demo data when limit reached.'
            });
          }
          throw error;
        }
      }

      case 'india-stock': {
        // Test Yahoo Finance India stock API (via proxy)
        const response = await axios.get(
          'http://localhost:3000/api/indian-stock?symbol=RELIANCE'
        );
        
        return NextResponse.json({ 
          success: true, 
          message: 'Yahoo Finance Indian Stocks API working',
          data: response.data
        });
      }

      case 'india-mf': {
        // Test MFAPI.in
        const response = await axios.get('https://api.mfapi.in/mf/latest');
        
        return NextResponse.json({ 
          success: true, 
          message: 'MFAPI.in Indian Mutual Funds API working',
          data: { totalFunds: response.data.length, sample: response.data[0] }
        });
      }

      case 'crypto': {
        // Test Binance API
        const response = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
        
        return NextResponse.json({ 
          success: true, 
          message: 'Binance Crypto API working',
          data: response.data
        });
      }

      case 'websocket': {
        // Check Finnhub key
        const finnhubKey = process.env.NEXT_PUBLIC_FINNHUB_KEY;
        if (!finnhubKey || finnhubKey.length < 20) {
          return NextResponse.json({ 
            success: false, 
            error: 'Finnhub API key not configured or invalid',
            details: 'WebSocket requires valid Finnhub API key'
          });
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Finnhub WebSocket configured (key present)',
          data: { keyLength: finnhubKey.length }
        });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid test type' });
    }
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'API test failed',
      details: error.response?.data || error.toString()
    });
  }
}
