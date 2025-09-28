import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/db';
import { BalanceHistory } from '../../../../models/BalanceHistory';
import { getTokenFromRequest, verifyToken } from '../../../../lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch balance history for the user within the date range
    const history = await BalanceHistory.find({
      userId: payload.userId,
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    })
    .sort({ createdAt: 1 }) // Sort chronologically
    .limit(100); // Limit to prevent too much data

    // If no history found, return empty array
    if (history.length === 0) {
      return NextResponse.json({ 
        history: [],
        message: 'No balance history found for the specified period'
      });
    }

    // Group by date and sum balances for each day
    const dailyBalances = new Map();
    
    history.forEach(record => {
      const dateKey = record.createdAt.toISOString().split('T')[0]; // Get YYYY-MM-DD format
      
      if (!dailyBalances.has(dateKey)) {
        dailyBalances.set(dateKey, {
          timestamp: record.createdAt,
          balance: { available: 0, locked: 0, total: 0 }
        });
      }
      
      const existing = dailyBalances.get(dateKey);
      existing.balance.available += record.balance.available;
      existing.balance.locked += record.balance.locked;
      existing.balance.total += record.balance.total;
    });

    // Convert map to array and sort by date
    const aggregatedHistory = Array.from(dailyBalances.values())
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return NextResponse.json({ 
      history: aggregatedHistory,
      count: aggregatedHistory.length,
      period: `${days} days`
    });

  } catch (error) {
    console.error('Balance history fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch balance history' 
    }, { status: 500 });
  }
}