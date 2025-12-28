import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    const apiKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || 'demo';
    
    // Use Alpha Vantage Global Quote endpoint for mutual funds
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
    );

    const data = await response.json();

    if (data['Error Message']) {
      return NextResponse.json({ error: 'Invalid mutual fund symbol' }, { status: 404 });
    }

    if (data['Note'] || data['Information']) {
      return NextResponse.json({ 
        error: 'API rate limit reached. Please try again later.' 
      }, { status: 429 });
    }

    const quote = data['Global Quote'];
    
    if (!quote || Object.keys(quote).length === 0) {
      return NextResponse.json({ error: 'No data available for this symbol' }, { status: 404 });
    }

    const mutualFundData = {
      symbol: quote['01. symbol'] || symbol,
      name: symbol, // Alpha Vantage doesn't provide name in GLOBAL_QUOTE
      price: parseFloat(quote['05. price'] || '0'),
      change: parseFloat(quote['09. change'] || '0'),
      changePercent: parseFloat((quote['10. change percent'] || '0').replace('%', '')),
      volume: parseInt(quote['06. volume'] || '0'),
      high: parseFloat(quote['03. high'] || '0'),
      low: parseFloat(quote['04. low'] || '0'),
      open: parseFloat(quote['02. open'] || '0'),
      previousClose: parseFloat(quote['08. previous close'] || '0'),
      marketType: 'us-mf',
      currency: 'USD',
    };

    return NextResponse.json(mutualFundData);
  } catch (error) {
    console.error('Error fetching US mutual fund data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mutual fund data' },
      { status: 500 }
    );
  }
}
