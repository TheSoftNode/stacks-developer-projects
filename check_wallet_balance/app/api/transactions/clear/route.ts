import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Transaction, Wallet } from '@/models';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

// POST: Clear all transactions for a specific wallet
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

    const { walletId, walletAddress } = await request.json();

    // Validate input
    if (!walletId && !walletAddress) {
      return NextResponse.json(
        { error: 'Either walletId or walletAddress is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the wallet and verify ownership
    let wallet;
    if (walletId) {
      wallet = await Wallet.findOne({
        _id: walletId,
        userId: payload.userId,
        isActive: true
      });
    } else if (walletAddress) {
      wallet = await Wallet.findOne({
        address: walletAddress, // This will be encrypted, but Mongoose will handle the comparison
        userId: payload.userId,
        isActive: true
      });
    }

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found or you do not have permission to modify it' },
        { status: 404 }
      );
    }

    // Count transactions before deletion
    const countBefore = await Transaction.countDocuments({ walletId: wallet._id });

    // Delete all transactions for this wallet
    const result = await Transaction.deleteMany({ walletId: wallet._id });

    console.log(`🗑️ Cleared ${result.deletedCount} transactions for wallet ${wallet._id} (${wallet.address})`);

    return NextResponse.json({
      success: true,
      message: 'All transactions cleared successfully',
      deletedCount: result.deletedCount,
      walletId: wallet._id,
      walletAddress: wallet.address
    }, { status: 200 });
  } catch (error) {
    console.error('Clear transactions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
