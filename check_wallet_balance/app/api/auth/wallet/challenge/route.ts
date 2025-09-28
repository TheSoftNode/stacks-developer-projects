import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import challengeStore from '@/lib/challenge-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const type = searchParams.get('type') || 'connection';
    const paymentId = searchParams.get('paymentId');
    const amount = searchParams.get('amount');

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address is required' },
        { status: 400 }
      );
    }

    // Clean up expired challenges first
    challengeStore.cleanup();

    // Generate a unique challenge
    const challenge = `WalletMonitor-${type}-${Date.now()}-${crypto.randomBytes(16).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store challenge with address as key
    challengeStore.set(address, {
      challenge,
      expiresAt,
      type,
      ...(paymentId && { paymentId }),
      ...(amount && { amount: parseFloat(amount) }),
    });

    console.log('🔑 Generated challenge for address:', address);
    console.log('📝 Challenge type:', type);
    console.log('⏰ Expires at:', expiresAt.toISOString());

    return NextResponse.json({
      success: true,
      challenge,
      expiresAt: expiresAt.toISOString(),
      type,
    });

  } catch (error) {
    console.error('❌ Error generating challenge:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate challenge' },
      { status: 500 }
    );
  }
}

// Helper function to get and validate challenge
export function getChallenge(address: string): { challenge: string; type: string } | null {
  const stored = challengeStore.get(address);
  
  console.log('🔍 Getting challenge for address:', address);
  console.log('📦 Stored challenge data:', stored);
  
  if (!stored) {
    console.log('❌ No challenge found for address');
    return null;
  }

  console.log('✅ Challenge is valid, returning');
  return {
    challenge: stored.challenge,
    type: stored.type,
  };
}

// Helper function to remove used challenge
export function removeChallenge(address: string): void {
  challengeStore.delete(address);
}