import { NextRequest, NextResponse } from 'next/server';

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

interface StacksTransaction {
  tx_id: string;
  tx_type: string;
  tx_status: string;
  block_height: number;
  block_hash: string;
  burn_block_time_iso: string;
  sender_address: string;
  fee_rate: string;
  token_transfer?: {
    recipient_address: string;
    amount: string;
    memo: string;
  };
  coinbase_payload?: {
    alt_recipient?: {
      amount: string;
    };
  };
  events?: Array<{
    event_type: string;
    stx_transfer_event?: {
      sender: string;
      recipient: string;
      amount: string;
    };
  }>;
}

interface TransactionResponse {
  limit: number;
  offset: number;
  total: number;
  results: StacksTransaction[];
}

function isValidStacksAddress(address: string): boolean {
  // SP/SM = Mainnet, ST = Testnet
  return /^(SP|SM|ST)[0-9A-HJKMNP-TV-Z]{39}$/.test(address);
}

function isTestnetAddress(address: string): boolean {
  return address.startsWith('ST');
}

function getApiBaseUrl(address: string): string {
  return isTestnetAddress(address) 
    ? 'https://api.testnet.hiro.so' 
    : 'https://api.hiro.so';
}

async function fetchWalletBalance(address: string) {
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

async function fetchWalletTransactions(address: string, limit = 50, offset = 0) {
  try {
    const baseUrl = getApiBaseUrl(address);
    const response = await fetch(
      `${baseUrl}/extended/v1/address/${address}/transactions?limit=${limit}&offset=${offset}&unanchored=true`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.status}`);
    }

    const data: TransactionResponse = await response.json();
    
    const processedTransactions = data.results.map(apiTx => {
      let type: 'sent' | 'received' | 'staking' | 'mining' = 'received';
      let amount = 0;
      let toAddress = '';
      let fromAddress = apiTx.sender_address;

      if (apiTx.tx_type === 'token_transfer' && apiTx.token_transfer) {
        const transfer = apiTx.token_transfer;
        toAddress = transfer.recipient_address;
        
        if (apiTx.sender_address === address) {
          type = 'sent';
          amount = -parseInt(transfer.amount) / 1000000;
        } else if (transfer.recipient_address === address) {
          type = 'received';
          amount = parseInt(transfer.amount) / 1000000;
        }
      } else if (apiTx.tx_type === 'contract_call') {
        // Check for STX transfer events
        let hasStxTransfer = false;
        let contractAmount = 0;
        
        if (apiTx.events && Array.isArray(apiTx.events)) {
          for (const event of apiTx.events) {
            if (event.event_type === 'stx_transfer_event' && event.stx_transfer_event) {
              const stxTransfer = event.stx_transfer_event;
              const eventAmount = parseInt(stxTransfer.amount) / 1000000;
              
              if (stxTransfer.recipient === address) {
                contractAmount += eventAmount;
                hasStxTransfer = true;
                type = 'received';
                toAddress = address;
                fromAddress = stxTransfer.sender;
              } else if (stxTransfer.sender === address) {
                contractAmount += eventAmount;
                hasStxTransfer = true;
                type = 'sent';
                toAddress = stxTransfer.recipient;
              }
            }
          }
        }
        
        if (hasStxTransfer) {
          amount = type === 'sent' ? -contractAmount : contractAmount;
        }
      } else if (apiTx.tx_type === 'coinbase') {
        type = 'mining';
        amount = parseInt(apiTx.coinbase_payload?.alt_recipient?.amount || '0') / 1000000;
        toAddress = address;
      }

      return {
        txId: apiTx.tx_id,
        type,
        amount,
        fee: apiTx.fee_rate ? parseInt(apiTx.fee_rate) / 1000000 : 0,
        fromAddress,
        toAddress,
        blockHeight: apiTx.block_height,
        blockHash: apiTx.block_hash,
        status: apiTx.tx_status === 'success' ? 'confirmed' : 'pending',
        timestamp: apiTx.burn_block_time_iso,
        memo: apiTx.token_transfer?.memo || '',
      };
    });

    return {
      transactions: processedTransactions,
      total: data.total,
      limit: data.limit,
      offset: data.offset,
    };
  } catch (error) {
    console.error(`Error fetching transactions for ${address}:`, error);
    throw error;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const { searchParams } = new URL(request.url);
    
    if (!isValidStacksAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid Stacks address format. Must start with SP, SM (mainnet), or ST (testnet)' },
        { status: 400 }
      );
    }

    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);
    const includeTransactions = searchParams.get('transactions') !== 'false';

    const [balance, transactions] = await Promise.all([
      fetchWalletBalance(address),
      includeTransactions ? fetchWalletTransactions(address, limit, offset) : null,
    ]);

    const response = {
      address,
      balance,
      ...(transactions && { 
        transactions: transactions.transactions,
        pagination: {
          total: transactions.total,
          limit: transactions.limit,
          offset: transactions.offset,
          hasMore: transactions.offset + transactions.limit < transactions.total,
        }
      }),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet data' },
      { status: 500 }
    );
  }
}