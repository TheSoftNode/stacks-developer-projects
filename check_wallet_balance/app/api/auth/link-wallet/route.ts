import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/models';
import connectDB from '@/lib/db';
import { verifyWalletSignature } from '@/lib/wallet-auth';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { getChallenge, removeChallenge } from '../wallet/challenge/route';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify user is authenticated via email/password
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

    const body = await request.json();
    const { address, signature, message, publicKey, walletType = 'stacks' } = body;

    // Validate required fields
    if (!address || !signature || !message || !publicKey) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: address, signature, message, or publicKey' },
        { status: 400 }
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

    // 3. Check if user already has a wallet linked
    if (currentUser.walletAddress) {
      return NextResponse.json(
        { success: false, error: 'You already have a wallet linked to this account. Unlink the current wallet first.' },
        { status: 400 }
      );
    }

    // 4. Verify the challenge
    const storedChallenge = getChallenge(address);
    if (!storedChallenge || storedChallenge.challenge !== message) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired challenge' },
        { status: 400 }
      );
    }

    // 5. Verify wallet signature
    const isValidSignature = verifyWalletSignature({
      address,
      signature,
      message,
      publicKey,
      walletType,
    });

    if (!isValidSignature) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet signature' },
        { status: 400 }
      );
    }

    // 6. Check if this wallet is already linked to another account
    const existingWalletUser = await User.findOne({ 
      walletAddress: address,
      _id: { $ne: currentUser._id } // Exclude current user
    });
    
    if (existingWalletUser) {
      return NextResponse.json(
        { success: false, error: 'This wallet is already linked to another account' },
        { status: 400 }
      );
    }

    // 7. Link the wallet to the current user
    currentUser.walletAddress = address;
    currentUser.walletPublicKey = publicKey;
    currentUser.walletType = walletType;
    currentUser.walletLinkedAt = new Date();
    currentUser.authMethod = 'both'; // Now user can login with email OR wallet
    
    await currentUser.save();

    // 8. Remove used challenge
    removeChallenge(address);

    console.log('✅ Wallet linked successfully:', {
      userId: currentUser._id,
      address,
      email: currentUser.email,
      authMethod: currentUser.authMethod
    });

    return NextResponse.json({
      success: true,
      message: 'Wallet linked successfully! You can now login with either your email or wallet.',
      user: {
        id: currentUser._id,
        email: currentUser.email,
        name: currentUser.name,
        authMethod: currentUser.authMethod,
        walletAddress: currentUser.walletAddress,
        walletLinkedAt: currentUser.walletLinkedAt,
        profileComplete: currentUser.profileComplete,
        isVerified: currentUser.isVerified,
        role: currentUser.role,
      },
    });

  } catch (error) {
    console.error('❌ Wallet linking error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to link wallet' 
      },
      { status: 500 }
    );
  }
}