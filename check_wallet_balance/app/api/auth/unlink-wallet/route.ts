import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/models';
import connectDB from '@/lib/db';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify user is authenticated
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    // 2. Get the current user
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 3. Check if user has a wallet linked
    if (!currentUser.walletAddress) {
      return NextResponse.json(
        { success: false, error: 'No wallet is currently linked to this account' },
        { status: 400 }
      );
    }

    // 4. Check if user has email authentication method
    if (currentUser.authMethod === 'wallet') {
      return NextResponse.json(
        { success: false, error: 'Cannot unlink wallet from wallet-only account. This would prevent you from accessing your account.' },
        { status: 400 }
      );
    }

    // 5. Unlink the wallet
    const walletAddress = currentUser.walletAddress; // Store for logging
    currentUser.walletAddress = undefined;
    currentUser.walletPublicKey = undefined;
    currentUser.walletType = undefined;
    currentUser.walletLinkedAt = undefined;
    currentUser.authMethod = 'email'; // Revert to email-only authentication
    
    await currentUser.save();

    console.log('✅ Wallet unlinked successfully:', {
      userId: currentUser._id,
      unlinkedAddress: walletAddress,
      email: currentUser.email,
      authMethod: currentUser.authMethod
    });

    return NextResponse.json({
      success: true,
      message: 'Wallet unlinked successfully. You can now only login with your email and password.',
      user: {
        id: currentUser._id,
        email: currentUser.email,
        name: currentUser.name,
        authMethod: currentUser.authMethod,
        walletAddress: null,
        walletLinkedAt: null,
        profileComplete: currentUser.profileComplete,
        isVerified: currentUser.isVerified,
        role: currentUser.role,
      },
    });

  } catch (error) {
    console.error('❌ Wallet unlinking error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to unlink wallet' 
      },
      { status: 500 }
    );
  }
}