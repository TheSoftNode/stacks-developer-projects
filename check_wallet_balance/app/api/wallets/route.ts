import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Wallet, BalanceHistory } from '@/models';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

// Function to fetch STX balance from Stacks API
async function getSTXBalance(address: string) {
  try {
    const response = await fetch(`https://api.hiro.so/extended/v1/address/${address}/balances`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Convert microSTX to STX (1 STX = 1,000,000 microSTX)
    const available = parseInt(data.stx.balance) / 1000000;
    const locked = parseInt(data.stx.locked) / 1000000;
    const total = available + locked;

    return { available, locked, total };
  } catch (error) {
    console.error(`Error fetching balance for ${address}:`, error);
    return null;
  }
}

// GET: Fetch all wallets for authenticated user
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

    // Fetch user's wallets
    const wallets = await Wallet.find({ 
      userId: payload.userId, 
      isActive: true 
    }).sort({ createdAt: -1 });

    return NextResponse.json({ wallets }, { status: 200 });
  } catch (error) {
    console.error('Get wallets error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Add new wallet
export async function POST(request: NextRequest) {
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

    const { email, address } = await request.json();

    // Validate input
    if (!email || !address) {
      return NextResponse.json(
        { error: 'Email and address are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if wallet already exists for this user
    const existingWallet = await Wallet.findOne({
      userId: payload.userId,
      address: address, // This will be encrypted during comparison
      isActive: true
    });

    if (existingWallet) {
      return NextResponse.json(
        { error: 'Wallet already exists' },
        { status: 409 }
      );
    }

    // Fetch initial balance
    const balance = await getSTXBalance(address);
    if (!balance) {
      return NextResponse.json(
        { error: 'Unable to fetch balance for this address. Please check if the address is valid.' },
        { status: 400 }
      );
    }

    // Create wallet
    const wallet = new Wallet({
      userId: payload.userId,
      email,
      address,
      balance,
      lastUpdated: new Date(),
    });

    await wallet.save();

    // Create initial balance history record
    const balanceHistory = new BalanceHistory({
      userId: payload.userId,
      walletId: wallet._id,
      balance,
      previousBalance: { available: 0, locked: 0, total: 0 },
      change: balance,
      updateType: 'initial',
    });

    await balanceHistory.save();

    return NextResponse.json(
      { 
        message: 'Wallet added successfully',
        wallet 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add wallet error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}