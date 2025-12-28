import { NextResponse } from 'next/server';

// Cache for the full mutual fund list
let cachedMFList: any[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || '';

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Fetch all mutual funds from MFAPI if not cached or cache expired
    if (!cachedMFList || Date.now() - cacheTimestamp > CACHE_DURATION) {
      const response = await fetch('https://api.mfapi.in/mf');
      const data = await response.json();
      cachedMFList = data;
      cacheTimestamp = Date.now();
    }

    // Search through the cached list
    const searchQuery = query.toLowerCase();
    const results = cachedMFList!
      .filter((fund: any) => {
        const schemeName = (fund.schemeName || '').toLowerCase();
        const schemeCode = (fund.schemeCode || '').toString();
        return schemeName.includes(searchQuery) || schemeCode.includes(searchQuery);
      })
      .slice(0, 50) // Limit to 50 results
      .map((fund: any) => ({
        symbol: fund.schemeCode.toString(),
        name: fund.schemeName,
        type: 'Mutual Fund',
        marketType: 'india-mf',
        currency: 'INR',
        schemeCode: fund.schemeCode,
      }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error searching Indian mutual funds:', error);
    return NextResponse.json(
      { error: 'Failed to search mutual funds', results: [] },
      { status: 500 }
    );
  }
}
