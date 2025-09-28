import { ClarityValue } from "@stacks/transactions";

export interface WalletAuthRequest {
  address: string;
  signature: string;
  message: string;
  publicKey: string;
  walletType: 'stacks' | 'bitcoin';
  paymentId?: string;
  amount?: number;
}

export interface MultiWalletAuthResponse {
  success: boolean;
  verified: boolean;
  walletType: 'stacks' | 'bitcoin';
  address?: string;
  paymentMethod?: 'bitcoin' | 'stx' | 'sbtc';
  error?: string;
}


export interface WalletAuthResponse {
  success: boolean;
  verified: boolean;
  address?: string;
  error?: string;
}

export interface WalletInfo {
  address: string;
  publicKey: string;
  profile?: any;
  isConnected: boolean;
}

export interface ContractCallOptions {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  network?: 'mainnet' | 'testnet';
}

export interface StxBalanceResponse {
  balance: string;
  estimated_balance: string;
  pending_balance_inbound: string;
  pending_balance_outbound: string;
  total_sent: string;
  total_received: string;
  total_fees_sent: string;
  total_miner_rewards_received: string;
  lock_tx_id: string;
  locked: string;
  lock_height: number;
  burnchain_lock_height: number;
  burnchain_unlock_height: number;
}

export interface BitcoinTransactionStatus {
  confirmed: boolean;
  block_height?: number;
  block_hash?: string;
  block_time?: number;
}

export interface BitcoinTransactionResponse {
  txid: string;
  version: number;
  locktime: number;
  size: number;
  weight: number;
  fee: number;
  vin: any[];
  vout: any[];
  status: BitcoinTransactionStatus;
}

export interface CoinGeckoPriceResponse {
  stacks?: {
    btc: number;
    usd?: number;
  };
  bitcoin?: {
    usd: number;
  };
  ethereum?: {
    usd: number;
  };
  'usd-coin'?: {
    usd: number;
  };
  tether?: {
    usd: number;
  };
}
