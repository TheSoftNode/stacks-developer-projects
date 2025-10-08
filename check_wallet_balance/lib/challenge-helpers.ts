import challengeStore from './challenge-store';

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
