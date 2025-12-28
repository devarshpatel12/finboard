import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    // Use MFAPI.in for Indian Mutual Funds (free, no key required)
    // symbol is the scheme code
    const response = await fetch(`https://api.mfapi.in/mf/${symbol}`);
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Mutual fund not found' }, { status: 404 });
    }

    const data = await response.json();

    if (data.status === 'ERROR' || !data.data || data.data.length === 0) {
      return NextResponse.json({ error: 'No data available' }, { status: 404 });
    }

    const latestData = data.data[0];
    const previousData = data.data[1] || latestData;
    
    const currentNAV = parseFloat(latestData.nav);
    const previousNAV = parseFloat(previousData.nav);
    const change = currentNAV - previousNAV;
    const changePercent = previousNAV !== 0 ? (change / previousNAV) * 100 : 0;

    const mutualFundData = {
      symbol: symbol,
      name: data.meta?.scheme_name || symbol,
      price: parseFloat(currentNAV.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: 0, // Mutual funds don't have volume
      high: currentNAV,
      low: currentNAV,
      open: currentNAV,
      previousClose: parseFloat(previousNAV.toFixed(2)),
      marketType: 'india-mf',
      currency: 'INR',
    };

    return NextResponse.json(mutualFundData);
  } catch (error) {
    console.error('Error fetching Indian mutual fund data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mutual fund data' },
      { status: 500 }
    );
  }
}
