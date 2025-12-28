import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || '';

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const apiKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || 'demo';
    
    // Use Alpha Vantage SYMBOL_SEARCH endpoint
    const response = await fetch(
      `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${apiKey}`
    );

    const data = await response.json();

    if (data['Note'] || data['Information']) {
      return NextResponse.json({ 
        error: 'API rate limit reached',
        results: [] 
      });
    }

    const matches = data.bestMatches || [];
    
    // Filter for mutual funds and ETFs
    const mutualFunds = matches
      .filter((match: any) => {
        const type = match['3. type'] || '';
        const symbol = match['1. symbol'] || '';
        // Look for mutual funds (typically 5 characters ending in X) and popular fund families
        return type.includes('Mutual Fund') || 
               symbol.match(/^[A-Z]{5}$/) || 
               symbol.startsWith('VFI') || 
               symbol.startsWith('VTS') || 
               symbol.startsWith('VTI') ||
               symbol.startsWith('VOO') ||
               symbol.startsWith('FXAIX') ||
               symbol.startsWith('SPAXX');
      })
      .slice(0, 20)
      .map((match: any) => ({
        symbol: match['1. symbol'],
        name: match['2. name'],
        type: match['3. type'] || 'Mutual Fund',
        region: match['4. region'],
        marketType: 'us-mf',
        currency: 'USD',
      }));

    return NextResponse.json({ results: mutualFunds });
  } catch (error) {
    console.error('Error searching US mutual funds:', error);
    return NextResponse.json(
      { error: 'Failed to search mutual funds', results: [] },
      { status: 500 }
    );
  }
}
