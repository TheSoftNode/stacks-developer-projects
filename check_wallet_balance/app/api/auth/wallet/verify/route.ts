import { NextRequest, NextResponse } from 'next/server';
import { verifyWalletSignature } from '@/lib/wallet-auth';
import { getChallenge, removeChallenge } from '@/lib/challenge-helpers';

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

    // Verify the challenge (optional - for strict verification)
    const storedChallenge = getChallenge(address);
    if (storedChallenge && storedChallenge.challenge !== message) {
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

    if (isValidSignature && storedChallenge) {
      // Remove used challenge only if it was used for verification
      removeChallenge(address);
    }

    console.log('🔍 Wallet signature verification:', {
      address,
      verified: isValidSignature,
      message: message.substring(0, 50) + '...',
    });

    return NextResponse.json({
      success: true,
      verified: isValidSignature,
      address,
      message: isValidSignature ? 'Signature verified successfully' : 'Invalid signature',
    });

  } catch (error) {
    console.error('❌ Wallet verification error:', error);
    return NextResponse.json(
      { 
        success: false, 
        verified: false,
        error: error instanceof Error ? error.message : 'Verification failed' 
      },
      { status: 500 }
    );
  }
}