import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/models';
import connectDB from '@/lib/db';
import { verifyWalletSignature, generateDefaultUserData } from '@/lib/wallet-auth';
import jwt from 'jsonwebtoken';
import { getChallenge, removeChallenge } from '../../wallet/challenge/route';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('🔍 Raw request body received:', body);

    const { address, signature, message, publicKey, walletType } = body;

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
    console.log('🔍 Challenge verification:');
    console.log('📝 Received message:', message);
    console.log('💾 Stored challenge:', storedChallenge);
    
    if (!storedChallenge || storedChallenge.challenge !== message) {
      console.log('❌ Challenge mismatch or not found');
      console.log('  - Has stored challenge:', !!storedChallenge);
      console.log('  - Challenges match:', storedChallenge?.challenge === message);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired challenge' },
        { status: 400 }
      );
    }
    
    console.log('✅ Challenge validation passed');

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

    // Check if user already exists with this wallet address
    const existingUserByWallet = await User.findOne({ walletAddress: address });
    if (existingUserByWallet) {
      return NextResponse.json(
        { success: false, error: 'This wallet is already registered' },
        { status: 400 }
      );
    }

    // Generate default user data
    const defaultData = generateDefaultUserData(address);

    // Check if email is already taken (only for real emails, not placeholders)
    if (!defaultData.email.includes('.placeholder')) {
      const existingUserByEmail = await User.findOne({ email: defaultData.email });
      if (existingUserByEmail) {
        return NextResponse.json(
          { success: false, error: 'Email is already registered' },
          { status: 400 }
        );
      }
    }

    // Create new user with wallet authentication
    const newUser = new User({
      email: defaultData.email,
      name: defaultData.name,
      authMethod: 'wallet',
      walletAddress: address,
      walletPublicKey: publicKey,
      walletType,
      isVerified: true, // Wallet signature serves as verification
      profileComplete: true, // Auto-complete profile for wallet users with defaults
    });

    await newUser.save();

    // Remove used challenge
    removeChallenge(address);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser._id, 
        email: newUser.email,
        authMethod: 'wallet',
        walletAddress: address 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: newUser._id, type: 'refresh' },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );

    console.log('✅ Wallet registration successful:', {
      userId: newUser._id,
      address,
      email: newUser.email,
      profileComplete: newUser.profileComplete
    });

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Wallet registration successful! Welcome to WalletMonitor.',
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        authMethod: newUser.authMethod,
        walletAddress: newUser.walletAddress,
        profileComplete: newUser.profileComplete,
        isVerified: newUser.isVerified,
        role: newUser.role,
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
    console.error('❌ Wallet registration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      },
      { status: 500 }
    );
  }
}