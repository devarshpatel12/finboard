import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Use Yahoo Finance search/autocomplete API
    const response = await fetch(
      `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=15&newsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query&region=IN&lang=en`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Yahoo Finance search returned ${response.status}`);
    }

    const data = await response.json();
    const quotes = data?.quotes || [];

    // Filter for Indian NSE stocks (ending with .NS)
    const indianStocks = quotes
      .filter((quote: any) => 
        quote.symbol && 
        quote.symbol.endsWith('.NS') &&
        quote.quoteType === 'EQUITY'
      )
      .map((quote: any) => ({
        symbol: quote.symbol.replace('.NS', ''), // Remove .NS suffix
        name: quote.longname || quote.shortname || quote.symbol,
      }));

    return NextResponse.json({ results: indianStocks });
  } catch (error: any) {
    console.error('Yahoo Finance search error:', error.message);
    return NextResponse.json(
      { results: [], error: error.message },
      { status: 500 }
    );
  }
}
