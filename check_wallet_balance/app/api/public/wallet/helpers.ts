// Shared helper functions for wallet API routes

export function isValidStacksAddress(address: string): boolean {
  // SP/SM = Mainnet, ST = Testnet
  return /^(SP|SM|ST)[0-9A-HJKMNP-TV-Z]{39}$/.test(address);
}

export function isTestnetAddress(address: string): boolean {
  return address.startsWith('ST');
}

export function getApiBaseUrl(address: string): string {
  return isTestnetAddress(address) 
    ? 'https://api.testnet.hiro.so' 
    : 'https://api.hiro.so';
}

interface StacksBalance {
  stx: {
    balance: string;
    locked: string;
    total_sent: string;
    total_received: string;
    total_fees_sent: string;
    total_miner_rewards_received: string;
  };
}

export interface WalletBalance {
  available: number;
  locked: number;
  total: number;
  totalSent: number;
  totalReceived: number;
  totalFees: number;
}

export async function fetchWalletBalance(address: string): Promise<WalletBalance> {
  try {
    const baseUrl = getApiBaseUrl(address);
    const response = await fetch(`${baseUrl}/extended/v1/address/${address}/balances`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch balance: ${response.status}`);
    }

    const data: StacksBalance = await response.json();
    return {
      available: parseFloat(data.stx.balance) / 1000000,
      locked: parseFloat(data.stx.locked) / 1000000,
      total: (parseFloat(data.stx.balance) + parseFloat(data.stx.locked)) / 1000000,
      totalSent: parseFloat(data.stx.total_sent) / 1000000,
      totalReceived: parseFloat(data.stx.total_received) / 1000000,
      totalFees: parseFloat(data.stx.total_fees_sent) / 1000000,
    };
  } catch (error) {
    console.error(`Error fetching balance for ${address}:`, error);
    throw error;
  }
}
