// Configuration for wallet monitoring and transaction sync

export const CONFIG = {
  // Transaction fetching configuration
  TRANSACTION_SYNC: {
    // Maximum transactions to fetch per wallet in a single sync
    MAX_TRANSACTIONS_PER_WALLET: parseInt(process.env.MAX_TRANSACTIONS_PER_WALLET || '2000'),
    
    // Batch size for API requests (Hiro API supports up to 50 per request)
    API_BATCH_SIZE: 50,
    
    // Delay between API requests to respect rate limits (milliseconds)
    API_REQUEST_DELAY: parseInt(process.env.API_REQUEST_DELAY || '100'),
    
    // Delay between wallet processing to avoid overwhelming the API
    WALLET_PROCESSING_DELAY: parseInt(process.env.WALLET_PROCESSING_DELAY || '500'),
    
    // Auto-sync interval (milliseconds) - default 30 minutes
    AUTO_SYNC_INTERVAL: parseInt(process.env.AUTO_SYNC_INTERVAL || '1800000'),
  },

  // Analytics configuration
  ANALYTICS: {
    // Default number of transactions to fetch for analytics
    DEFAULT_TRANSACTION_LIMIT: parseInt(process.env.ANALYTICS_TRANSACTION_LIMIT || '5000'),
    
    // Maximum number of transactions to display at once
    MAX_DISPLAY_TRANSACTIONS: parseInt(process.env.MAX_DISPLAY_TRANSACTIONS || '1000'),
    
    // Default timeframe for balance history (days)
    DEFAULT_BALANCE_HISTORY_DAYS: parseInt(process.env.DEFAULT_BALANCE_HISTORY_DAYS || '30'),
  },

  // API endpoints
  STACKS_API: {
    MAINNET: 'https://api.hiro.so',
    TESTNET: 'https://api.testnet.hiro.so',
    
    // API rate limits
    REQUESTS_PER_MINUTE: parseInt(process.env.STACKS_API_RATE_LIMIT || '60'),
  },

  // Database configuration
  DATABASE: {
    // Connection timeout
    CONNECTION_TIMEOUT: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
    
    // Query timeout
    QUERY_TIMEOUT: parseInt(process.env.DB_QUERY_TIMEOUT || '5000'),
  },

  // Security configuration
  SECURITY: {
    // JWT token expiration
    JWT_EXPIRATION: process.env.JWT_EXPIRATION || '24h',
    
    // Refresh token expiration
    REFRESH_TOKEN_EXPIRATION: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
    
    // Maximum login attempts
    MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
  },

  // Feature flags
  FEATURES: {
    // Enable automatic transaction syncing
    AUTO_SYNC_ENABLED: process.env.AUTO_SYNC_ENABLED === 'true',
    
    // Enable debug logging for transactions
    DEBUG_TRANSACTIONS: process.env.DEBUG_TRANSACTIONS === 'true',
    
    // Enable enhanced contract call parsing
    ENHANCED_CONTRACT_PARSING: process.env.ENHANCED_CONTRACT_PARSING !== 'false',
    
    // Enable balance history tracking
    BALANCE_HISTORY_ENABLED: process.env.BALANCE_HISTORY_ENABLED !== 'false',
  },
};

// Helper function to get network-specific API URL
export function getStacksApiUrl(network: 'mainnet' | 'testnet' = 'mainnet'): string {
  return network === 'mainnet' ? CONFIG.STACKS_API.MAINNET : CONFIG.STACKS_API.TESTNET;
}

// Helper function to validate configuration
export function validateConfig(): void {
  const errors: string[] = [];

  if (CONFIG.TRANSACTION_SYNC.MAX_TRANSACTIONS_PER_WALLET < 1) {
    errors.push('MAX_TRANSACTIONS_PER_WALLET must be at least 1');
  }

  if (CONFIG.TRANSACTION_SYNC.API_BATCH_SIZE > 50) {
    errors.push('API_BATCH_SIZE cannot exceed 50 (Hiro API limit)');
  }

  if (CONFIG.TRANSACTION_SYNC.API_REQUEST_DELAY < 50) {
    errors.push('API_REQUEST_DELAY should be at least 50ms to respect rate limits');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
}

// Log current configuration (without sensitive data)
export function logConfig(): void {
  if (CONFIG.FEATURES.DEBUG_TRANSACTIONS) {
    console.log('📋 Wallet Monitor Configuration:');
    console.log(`  Max transactions per wallet: ${CONFIG.TRANSACTION_SYNC.MAX_TRANSACTIONS_PER_WALLET}`);
    console.log(`  API batch size: ${CONFIG.TRANSACTION_SYNC.API_BATCH_SIZE}`);
    console.log(`  API request delay: ${CONFIG.TRANSACTION_SYNC.API_REQUEST_DELAY}ms`);
    console.log(`  Wallet processing delay: ${CONFIG.TRANSACTION_SYNC.WALLET_PROCESSING_DELAY}ms`);
    console.log(`  Auto-sync enabled: ${CONFIG.FEATURES.AUTO_SYNC_ENABLED}`);
    console.log(`  Enhanced contract parsing: ${CONFIG.FEATURES.ENHANCED_CONTRACT_PARSING}`);
  }
}