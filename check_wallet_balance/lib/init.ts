import { initializeDynamicScheduler } from '../lib/dynamicScheduler';

// Initialize the dynamic scheduler when the app starts
if (typeof window === 'undefined') {
  // Only run on server-side
  try {
    initializeDynamicScheduler();
    console.log('🚀 WalletCheck dynamic scheduler initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize dynamic scheduler:', error);
  }
}

export {};