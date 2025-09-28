import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Wallet } from '@/models';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

// DELETE: Remove wallet
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Find and verify wallet ownership
    const wallet = await Wallet.findOne({
      _id: params.id,
      userId: payload.userId,
      isActive: true
    });

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    // Soft delete - mark as inactive
    wallet.isActive = false;
    await wallet.save();

    return NextResponse.json({ message: 'Wallet removed successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete wallet error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update wallet
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Find and verify wallet ownership
    const wallet = await Wallet.findOne({
      _id: params.id,
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