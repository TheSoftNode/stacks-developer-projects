import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Transaction, Wallet } from '@/models';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

// POST: Cleanup orphaned transactions (transactions belonging to deleted/inactive wallets)
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

    // Get all active wallet IDs for this user
    const activeWallets = await Wallet.find({
      userId: payload.userId,
      isActive: true
    }).select('_id');

    const activeWalletIds = activeWallets.map(w => w._id.toString());

    // Find transactions that don't belong to any active wallet
    const orphanedTransactions = await Transaction.find({
      userId: payload.userId,
      walletId: { $nin: activeWalletIds }
    });

    const orphanedCount = orphanedTransactions.length;

    // Delete orphaned transactions
    const result = await Transaction.deleteMany({
      userId: payload.userId,
      walletId: { $nin: activeWalletIds }
    });

    console.log(`🧹 Cleaned up ${result.deletedCount} orphaned transactions for user ${payload.userId}`);

    return NextResponse.json({
      success: true,
      message: 'Orphaned transactions cleaned up successfully',
      deletedCount: result.deletedCount,
      orphanedTransactions: orphanedTransactions.map(tx => ({
        txId: tx.txId,
        walletId: tx.walletId,
        type: tx.type,
        amount: tx.amount
      }))
    }, { status: 200 });
  } catch (error) {
    console.error('Cleanup transactions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
