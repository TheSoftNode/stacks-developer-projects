import { NextRequest, NextResponse } from 'next/server';
import { isValidStacksAddress, getApiBaseUrl, fetchWalletBalance } from '../../helpers';

// Extended transaction types based on Stacks blockchain
interface BaseTransaction {
  tx_id: string;
  nonce: number;
  sender_address: string;
  sponsored: boolean;
  post_condition_mode: string;
  block_hash: string;
  block_height: number;
  burn_block_time: number;
  burn_block_time_iso: string;
  canonical: boolean;
  tx_index: number;
  tx_status: string;
  tx_result: {
    hex: string;
    repr: string;
  };
  fee_rate: string;
  is_unanchored: boolean;
  microblock_hash: string;
  microblock_sequence: number;
  microblock_canonical: boolean;
  event_count: number;
  events: any[];
  execution_cost_read_count: number;
  execution_cost_read_length: number;
  execution_cost_runtime: number;
  execution_cost_write_count: number;
  execution_cost_write_length: number;
  tx_type: 'coinbase' | 'token_transfer' | 'smart_contract' | 'contract_call' | 'poison_microblock';
}

interface TokenTransferTransaction extends BaseTransaction {
  tx_type: 'token_transfer';
  token_transfer: {
    recipient_address: string;
    amount: string;
    memo: string;
  };
}

interface SmartContractTransaction extends BaseTransaction {
  tx_type: 'smart_contract';
  smart_contract: {
    clarity_version: number;
    contract_id: string;
    source_code: string;
  };
}

interface ContractCallTransaction extends BaseTransaction {
  tx_type: 'contract_call';
  contract_call: {
    contract_id: string;
    function_name: string;
    function_signature: string;
    function_args: Array<{
      hex: string;
      repr: string;
      name: string;
      type: string;
    }>;
  };
}

interface CoinbaseTransaction extends BaseTransaction {
  tx_type: 'coinbase';
  coinbase_payload: {
    data: string;
    alt_recipient?: {
      type: string;
      address: string;
      amount: string;
    };
  };
}

interface PoisonMicroblockTransaction extends BaseTransaction {
  tx_type: 'poison_microblock';
  poison_microblock: {
    microblock_header_1: string;
    microblock_header_2: string;
  };
}

type StacksTransaction = 
  | TokenTransferTransaction 
  | SmartContractTransaction 
  | ContractCallTransaction 
  | CoinbaseTransaction 
  | PoisonMicroblockTransaction;

interface TransactionResponse {
  limit: number;
  offset: number;
  total: number;
  results: StacksTransaction[];
}

// Full transaction details for public wallet checker
export interface FullTransaction {
  txId: string;
  type: 'sent' | 'received' | 'contract_call' | 'contract_deployment' | 'mining' | 'microblock';
  amount: number;
  fee: number;
  fromAddress: string;
  toAddress: string;
  blockHeight: number;
  blockHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  memo: string;
  nonce: number;
  // Extended fields for contract interactions
  contractId?: string;
  functionName?: string;
  functionArgs?: Array<{
    name: string;
    type: string;
    repr: string;
  }>;
  sourceCode?: string;
  clarityVersion?: number;
}

async function fetchFullTransactions(address: string, limit = 50, offset = 0) {
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
      const baseTx: Partial<FullTransaction> = {
        txId: apiTx.tx_id,
        fee: apiTx.fee_rate ? parseInt(apiTx.fee_rate) / 1000000 : 0,
        fromAddress: apiTx.sender_address,
        blockHeight: apiTx.block_height,
        blockHash: apiTx.block_hash,
        status: apiTx.tx_status === 'success' ? 'confirmed' as const : 'pending' as const,
        timestamp: apiTx.burn_block_time_iso,
        nonce: apiTx.nonce,
        toAddress: '',
        amount: 0,
        memo: '',
      };

      // Handle different transaction types
      if (apiTx.tx_type === 'token_transfer') {
        const tx = apiTx as TokenTransferTransaction;
        baseTx.toAddress = tx.token_transfer.recipient_address;
        baseTx.memo = tx.token_transfer.memo;
        
        if (tx.sender_address === address) {
          baseTx.type = 'sent';
          baseTx.amount = -parseInt(tx.token_transfer.amount) / 1000000;
        } else {
          baseTx.type = 'received';
          baseTx.amount = parseInt(tx.token_transfer.amount) / 1000000;
        }
      } 
      else if (apiTx.tx_type === 'smart_contract') {
        const tx = apiTx as SmartContractTransaction;
        baseTx.type = 'contract_deployment';
        baseTx.contractId = tx.smart_contract.contract_id;
        baseTx.clarityVersion = tx.smart_contract.clarity_version;
        baseTx.sourceCode = tx.smart_contract.source_code;
        baseTx.toAddress = tx.smart_contract.contract_id;
      }
      else if (apiTx.tx_type === 'contract_call') {
        const tx = apiTx as ContractCallTransaction;
        baseTx.type = 'contract_call';
        baseTx.contractId = tx.contract_call.contract_id;
        baseTx.functionName = tx.contract_call.function_name;
        baseTx.functionArgs = tx.contract_call.function_args?.map(arg => ({
          name: arg.name,
          type: arg.type,
          repr: arg.repr,
        }));
        baseTx.toAddress = tx.contract_call.contract_id;

        // Check for STX transfer events in contract call
        let stxAmount = 0;
        let hasStxTransfer = false;
        
        if (apiTx.events && Array.isArray(apiTx.events) && apiTx.events.length > 0) {
          for (const event of apiTx.events) {
            if (event.event_type === 'stx_transfer_event' && event.stx_transfer_event) {
              const stxTransfer = event.stx_transfer_event;
              const eventAmount = parseInt(stxTransfer.amount) / 1000000;
              
              if (stxTransfer.recipient === address) {
                stxAmount += eventAmount;
                hasStxTransfer = true;
              } else if (stxTransfer.sender === address) {
                stxAmount -= eventAmount;
                hasStxTransfer = true;
              }
            }
          }
        }
        
        // If no STX transfer found in events, try parsing function args for send-many
        if (!hasStxTransfer && 
            tx.contract_call.contract_id?.includes('send-many') && 
            tx.contract_call.function_name === 'send-many' &&
            tx.contract_call.function_args) {
          // If no events, try to parse function args for send-many contract
          console.log(`📝 Parsing send-many function args for ${apiTx.tx_id}`);
          console.log(`  Sender: ${apiTx.sender_address}, Wallet: ${address}`);
          try {
            const functionArgs = tx.contract_call.function_args;
            const argsStr = JSON.stringify(functionArgs);
            
            if (argsStr.includes(address)) {
              console.log(`  ✅ Found wallet address in function args`);
              // Find the argument that contains our wallet address
              const reprMatch = functionArgs.find((arg: any) => 
                arg.repr && arg.repr.includes(address)
              );
              
              if (reprMatch && reprMatch.repr) {
                console.log(`  📄 Found repr:`, reprMatch.repr.substring(0, 300));
                const addressEscaped = address.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                
                // Pattern 1: wallet address followed by (ustx u[amount])
                const amountRegex = new RegExp(
                  `${addressEscaped}[^)]*\\(ustx u(\\d+)\\)`, 
                  'g'
                );
                const amountMatch = amountRegex.exec(reprMatch.repr);
                
                if (amountMatch && amountMatch[1]) {
                  stxAmount = parseInt(amountMatch[1]) / 1000000;
                  hasStxTransfer = true;
                  console.log(`  💰 Pattern 1 - Extracted amount: ${stxAmount} STX`);
                } else {
                  // Pattern 2: Look for wallet address followed by ustx amount
                  const match = reprMatch.repr.match(
                    new RegExp(`'${addressEscaped}'[\\s\\S]*?u(\\d+)`, 'gi')
                  );
                  if (match && match[0]) {
                    const ustxMatch = match[0].match(/u(\d+)/);
                    if (ustxMatch && ustxMatch[1]) {
                      stxAmount = parseInt(ustxMatch[1]) / 1000000;
                      hasStxTransfer = true;
                      console.log(`  💰 Pattern 2 - Extracted amount: ${stxAmount} STX`);
                    }
                  }
                  
                  // Pattern 3: Look for ustx near wallet address
                  if (!hasStxTransfer) {
                    const walletIndex = reprMatch.repr.indexOf(address);
                    if (walletIndex !== -1) {
                      const nearbyText = reprMatch.repr.substring(walletIndex, walletIndex + 200);
                      const ustxMatch = nearbyText.match(/ustx\s+u(\d+)/);
                      if (ustxMatch && ustxMatch[1]) {
                        stxAmount = parseInt(ustxMatch[1]) / 1000000;
                        hasStxTransfer = true;
                        console.log(`  💰 Pattern 3 - Extracted amount: ${stxAmount} STX`);
                      }
                    }
                  }
                  
                  if (!hasStxTransfer) {
                    console.log(`  ❌ Could not extract amount from repr`);
                  }
                }
              }
            } else {
              console.log(`  ⏭️ Wallet address not found in function args`);
            }
          } catch (error) {
            console.error('Error parsing contract call function args:', error);
          }
        }
        
        if (hasStxTransfer) {
          console.log(`✅ Contract call ${apiTx.tx_id} has STX transfer: ${stxAmount} STX`);
        }
        
        baseTx.amount = stxAmount;
      }
      else if (apiTx.tx_type === 'coinbase') {
        const tx = apiTx as CoinbaseTransaction;
        baseTx.type = 'mining';
        baseTx.amount = parseInt(tx.coinbase_payload?.alt_recipient?.amount || '0') / 1000000;
        baseTx.toAddress = address;
      }
      else if (apiTx.tx_type === 'poison_microblock') {
        baseTx.type = 'microblock';
        baseTx.toAddress = address;
      }

      return baseTx as FullTransaction;
    });

    return {
      transactions: processedTransactions,
      total: data.total,
      limit: data.limit,
      offset: data.offset,
    };
  } catch (error) {
    console.error(`Error fetching full transactions for ${address}:`, error);
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
        { error: 'Invalid Stacks address format. Use SP, SM (mainnet) or ST (testnet) addresses.' },
        { status: 400 }
      );
    }

    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);
    const includeTransactions = searchParams.get('transactions') !== 'false';

    const [balance, transactions] = await Promise.all([
      fetchWalletBalance(address),
      includeTransactions ? fetchFullTransactions(address, limit, offset) : null,
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
