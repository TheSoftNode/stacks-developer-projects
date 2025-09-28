import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/models';
import connectDB from '@/lib/db';
import { verifyWalletSignature } from '@/lib/wallet-auth';
import jwt from 'jsonwebtoken';
import { getChallenge, removeChallenge } from '../../wallet/challenge/route';

export async function POST(request: NextRequest) {
  try {
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

    // Verify the challenge
    const storedChallenge = getChallenge(address);
    if (!storedChallenge || storedChallenge.challenge !== message) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired challenge' },
        { status: 400 }
      );
    }

    // Verify wallet signature
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

    // Find user by wallet address (including both wallet-only and linked accounts)
    const user = await User.findOne({ 
      walletAddress: address,
      $or: [
        { authMethod: 'wallet' },
        { authMethod: 'both' }
      ]
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No account found for this wallet. Please register first or link this wallet to an existing account.' },
        { status: 404 }
      );
    }

    // Verify the public key matches (additional security)
    if (user.walletPublicKey && user.walletPublicKey !== publicKey) {
      return NextResponse.json(
        { success: false, error: 'Wallet public key mismatch' },
        { status: 400 }
      );
    }

    // Update public key if not set
    if (!user.walletPublicKey) {
      user.walletPublicKey = publicKey;
      await user.save();
    }

    // Remove used challenge
    removeChallenge(address);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        authMethod: user.authMethod,
        walletAddress: address 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: user._id, type: 'refresh' },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );

    console.log('✅ Wallet login successful:', {
      userId: user._id,
      address,
      email: user.email,
      profileComplete: user.profileComplete
    });

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Wallet login successful!',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        authMethod: user.authMethod,
        walletAddress: user.walletAddress,
        profileComplete: user.profileComplete,
        isVerified: user.isVerified,
        role: user.role,
      },
      token,
      refreshToken,
    });

    // Set auth cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;

  } catch (error) {
    console.error('❌ Wallet login error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      },
      { status: 500 }
    );
  }
}