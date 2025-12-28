import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    // Yahoo Finance format: SYMBOL.NS for NSE stocks
    const yahooSymbol = `${symbol}.NS`;
    
    // Use Yahoo Finance v8 chart API (more reliable)
    const response = await fetch(
      `https://query2.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Yahoo Finance returned ${response.status}`);
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    
    if (!result || !result.meta) {
      return NextResponse.json({ error: 'No data available' }, { status: 404 });
    }

    const meta = result.meta;
    const price = meta.regularMarketPrice || 0;
    const previousClose = meta.chartPreviousClose || meta.previousClose || price;
    const change = price - previousClose;
    const changePercent = (change / previousClose) * 100;

    const stockData = {
      symbol: symbol,
      name: meta.longName || meta.shortName || symbol,
      price: price,
      change: change,
      changePercent: changePercent,
      volume: meta.regularMarketVolume || 0,
      high: meta.regularMarketDayHigh || price,
      low: meta.regularMarketDayLow || price,
      open: meta.regularMarketOpen || price,
      previousClose: previousClose,
      marketType: 'india',
      currency: 'INR',
    };

    return NextResponse.json(stockData);
  } catch (error: any) {
    console.error('Yahoo Finance API error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
