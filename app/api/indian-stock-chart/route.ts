import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const interval = searchParams.get('interval') || '1d';
  const range = searchParams.get('range') || '3mo';

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    // Yahoo Finance format: SYMBOL.NS for NSE stocks
    const yahooSymbol = `${symbol}.NS`;
    
    // Use Yahoo Finance chart API
    const response = await fetch(
      `https://query2.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=${interval}&range=${range}`,
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
    
    if (!result || !result.timestamp) {
      return NextResponse.json({ error: 'No chart data available' }, { status: 404 });
    }

    const timestamps = result.timestamp;
    const quote = result.indicators?.quote?.[0];
    
    if (!quote) {
      return NextResponse.json({ error: 'No price data available' }, { status: 404 });
    }

    // Convert to chart data points
    const chartData = timestamps.map((timestamp: number, index: number) => {
      const date = new Date(timestamp * 1000);
      return {
        date: date.toISOString().split('T')[0],
        open: quote.open?.[index] || 0,
        high: quote.high?.[index] || 0,
        low: quote.low?.[index] || 0,
        close: quote.close?.[index] || 0,
        volume: quote.volume?.[index] || 0,
      };
    }).filter((point: any) => point.close > 0); // Filter out invalid data points

    return NextResponse.json({ chartData });
  } catch (error: any) {
    console.error('Yahoo Finance chart API error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}
