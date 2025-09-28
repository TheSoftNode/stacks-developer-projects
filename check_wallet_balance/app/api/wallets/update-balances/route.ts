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

// POST: Update balances for all user wallets
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

    await connectDB();

    // Get user's active wallets
    const wallets = await Wallet.find({ 
      userId: payload.userId, 
      isActive: true 
    });

    const updateResults = [];

    for (const wallet of wallets) {
      try {
        // Fetch new balance
        const newBalance = await getSTXBalance(wallet.address);
        
        if (newBalance) {
          const previousBalance = { ...wallet.balance };
          
          // Calculate changes
          const change = {
            available: newBalance.available - previousBalance.available,
            locked: newBalance.locked - previousBalance.locked,
            total: newBalance.total - previousBalance.total,
          };

          // Update wallet
          wallet.balance = newBalance;
          wallet.lastUpdated = new Date();
          await wallet.save();

          // Create balance history record
          const balanceHistory = new BalanceHistory({
            userId: payload.userId,
            walletId: wallet._id,
            balance: newBalance,
            previousBalance,
            change,
            updateType: 'manual',
          });

          await balanceHistory.save();

          updateResults.push({
            walletId: wallet._id,
            address: wallet.address,
            success: true,
            previousBalance,
            newBalance,
            change,
          });
        } else {
          updateResults.push({
            walletId: wallet._id,
            address: wallet.address,
            success: false,
            error: 'Failed to fetch balance',
          });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error updating wallet ${wallet._id}:`, error);
        updateResults.push({
          walletId: wallet._id,
          address: wallet.address,
          success: false,
          error: 'Update failed',
        });
      }
    }

    return NextResponse.json({ 
      message: 'Balance update completed',
      results: updateResults 
    }, { status: 200 });
  } catch (error) {
    console.error('Update balances error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}