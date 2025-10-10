import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Wallet, Transaction, BalanceHistory } from '@/models';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

// DELETE: Remove wallet
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Await params in Next.js 15
    const { id } = await params;

    // Find and verify wallet ownership
    const wallet = await Wallet.findOne({
      _id: id,
      userId: payload.userId,
      isActive: true
    });

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    // Delete associated data
    // 1. Delete all transactions associated with this wallet
    const deletedTransactions = await Transaction.deleteMany({ walletId: id });
    console.log(`Deleted ${deletedTransactions.deletedCount} transactions for wallet ${id}`);

    // 2. Delete all balance history records associated with this wallet
    const deletedHistory = await BalanceHistory.deleteMany({ walletId: id });
    console.log(`Deleted ${deletedHistory.deletedCount} balance history records for wallet ${id}`);

    // 3. Soft delete the wallet - mark as inactive
    wallet.isActive = false;
    await wallet.save();

    return NextResponse.json({
      message: 'Wallet removed successfully',
      deletedTransactions: deletedTransactions.deletedCount,
      deletedHistory: deletedHistory.deletedCount
    }, { status: 200 });
  } catch (error) {
    console.error('Delete wallet error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update wallet
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await connectDB();

    // Await params in Next.js 15
    const { id } = await params;

    // Find and verify wallet ownership
    const wallet = await Wallet.findOne({
      _id: id,
      userId: payload.userId,
      isActive: true
    });

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    // Update wallet
    wallet.email = email;
    await wallet.save();

    return NextResponse.json({ 
      message: 'Wallet updated successfully',
      wallet 
    }, { status: 200 });
  } catch (error) {
    console.error('Update wallet error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}