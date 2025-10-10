import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Transaction, Wallet } from '@/models';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { CONFIG, logConfig, validateConfig } from '@/lib/config';

// Function to fetch ALL transactions from Stacks API with pagination
async function fetchAllTransactionsFromAPI(address: string, maxTransactions: number = CONFIG.TRANSACTION_SYNC.MAX_TRANSACTIONS_PER_WALLET) {
  try {
    // Validate configuration on first use
    validateConfig();
    
    console.log(`🔄 === STARTING COMPLETE FETCH FOR ${address} ===`);
    console.log(`🔍 Fetching all transactions for address: ${address} (max: ${maxTransactions})`);
    
    let allTransactions: any[] = [];
    let offset = 0;
    const limit = CONFIG.TRANSACTION_SYNC.API_BATCH_SIZE;
    let totalFetched = 0;
    
    while (totalFetched < maxTransactions) {
      const currentLimit = Math.min(limit, maxTransactions - totalFetched);
      const response = await fetch(
        `https://api.hiro.so/extended/v1/address/${address}/transactions?limit=${currentLimit}&offset=${offset}&unanchored=true`
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error: ${response.status} - ${errorText}`);
        
        // If we got some transactions before the error, return what we have
        if (allTransactions.length > 0) {
          console.log(`⚠️ API error occurred, but returning ${allTransactions.length} transactions fetched so far`);
          break;
        }
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      const transactions = data.results || [];
      
      if (transactions.length === 0) {
        console.log(`✅ No more transactions found. Total fetched: ${allTransactions.length}`);
        break;
      }
      
      allTransactions.push(...transactions);
      totalFetched += transactions.length;
      offset += transactions.length;
      
      console.log(`📊 Batch ${Math.floor(offset / limit)}: fetched ${transactions.length} transactions (total: ${allTransactions.length})`);
      
      // If we got fewer results than requested, we've reached the end
      if (transactions.length < currentLimit) {
        console.log(`✅ Reached end of transactions. Total fetched: ${allTransactions.length}`);
        break;
      }
      
      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, CONFIG.TRANSACTION_SYNC.API_REQUEST_DELAY));
    }

    console.log(`📈 FINAL COUNT for ${address}: ${allTransactions.length} total transactions`);
    
    // Log sample transactions for debugging
    if (allTransactions.length > 0) {
      console.log("=== SAMPLE TRANSACTIONS ===");
      allTransactions.slice(0, 2).forEach((tx: any, index: number) => {
        console.log(`Transaction ${index + 1}:`);
        console.log(`  tx_id: ${tx.tx_id}`);
        console.log(`  tx_type: ${tx.tx_type}`);
        console.log(`  tx_status: ${tx.tx_status}`);
        console.log(`  sender_address: ${tx.sender_address}`);
        
        if (tx.token_transfer) {
          console.log(`  token_transfer:`, JSON.stringify(tx.token_transfer, null, 4));
        }
        
        console.log("  ---");
      });
      console.log("=== END SAMPLE TRANSACTIONS ===");
    }
    
    // Debug: Log transaction types using corrected logic
    const sentCount = allTransactions.filter((tx: any) => {
      if (tx.tx_type === 'token_transfer') {
        const senderAddress = tx.token_transfer?.sender_address || tx.sender_address;
        return senderAddress === address;
      }
      return false;
    }).length;
    
    const receivedCount = allTransactions.filter((tx: any) => {
      if (tx.tx_type === 'token_transfer') {
        const recipientAddress = tx.token_transfer?.recipient_address;
        return recipientAddress === address;
      } else if (tx.tx_type === 'contract_call') {
        if (tx.events && Array.isArray(tx.events)) {
          const hasStxTransfer = tx.events.some((event: any) => 
            event.event_type === 'stx_transfer_event' && 
            event.stx_transfer_event?.recipient === address
          );
          return hasStxTransfer;
        }
        return false;
      }
      return false;
    }).length;
    
    console.log(`🔢 FINAL BREAKDOWN for ${address}: ${sentCount} sent, ${receivedCount} received (including contract calls)`);
    
    return allTransactions;
  } catch (error) {
    console.error(`❌ Error fetching transactions for ${address}:`, error);
    return [];
  }
}


// GET: Fetch transactions for user's wallets
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const walletId = searchParams.get('walletId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');

    await connectDB();

    // First, get all active wallets for this user
    const activeWallets = await Wallet.find({
      userId: payload.userId,
      isActive: true
    }).select('_id');

    const activeWalletIds = activeWallets.map(w => w._id.toString());

    // Build query - only include transactions from active wallets
    const query: any = {
      userId: payload.userId,
      walletId: { $in: activeWalletIds }
    };
    if (walletId) query.walletId = walletId;
    if (type && type !== 'all') query.type = type;

    // Get transactions from database
    const transactions = await Transaction.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('walletId', 'address email');

    const total = await Transaction.countDocuments(query);

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Sync transactions from Stacks API
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();

    // First, clean up any duplicate transactions for this user
    console.log('🧹 Cleaning up duplicate transactions...');
    const duplicates = await Transaction.aggregate([
      { $match: { userId: payload.userId } },
      { $group: { 
          _id: { txId: "$txId", walletId: "$walletId" }, 
          docs: { $push: "$_id" }, 
          count: { $sum: 1 } 
        } 
      },
      { $match: { count: { $gt: 1 } } }
    ]);

    let duplicatesRemoved = 0;
    for (const duplicate of duplicates) {
      // Keep the first one, remove the rest
      const idsToRemove = duplicate.docs.slice(1);
      await Transaction.deleteMany({ _id: { $in: idsToRemove } });
      duplicatesRemoved += idsToRemove.length;
    }
    
    if (duplicatesRemoved > 0) {
      console.log(`🗑️ Removed ${duplicatesRemoved} duplicate transactions`);
    }

    // Get user's wallets
    const wallets = await Wallet.find({ 
      userId: payload.userId, 
      isActive: true 
    });

    console.log(`📋 Found ${wallets.length} active wallets for user ${payload.userId}`);
    
    // Log configuration for debugging
    logConfig();

    let totalSynced = 0;
    const syncResults = [];

    for (const wallet of wallets) {
      try {
        console.log(`🔄 Processing wallet: ${wallet.address}`);
        
        // Fetch ALL transactions for this wallet using configured limits
        const apiTransactions = await fetchAllTransactionsFromAPI(wallet.address, CONFIG.TRANSACTION_SYNC.MAX_TRANSACTIONS_PER_WALLET);
        let syncedCount = 0;

        console.log(`📥 Processing ${apiTransactions.length} transactions for wallet ${wallet.address}`);

        for (const apiTx of apiTransactions) {
          // Check if transaction already exists for this specific user and wallet combination
          const existingTx = await Transaction.findOne({ 
            txId: apiTx.tx_id,
            userId: payload.userId,
            walletId: wallet._id
          });
          
          if (CONFIG.FEATURES.DEBUG_TRANSACTIONS) {
            console.log(`🔍 Checking transaction ${apiTx.tx_id} for wallet ${wallet._id}: ${existingTx ? 'EXISTS' : 'NEW'}`);
          }
          
          if (!existingTx) {
            // Determine transaction type
            let type: 'sent' | 'received' | 'stacking' | 'mining' = 'received';
            let amount = 0;
            
            console.log(`🔍 PROCESSING TRANSACTION ${apiTx.tx_id}:`);
            console.log(`   Type: ${apiTx.tx_type}`);
            console.log(`   Wallet Address: ${wallet.address}`);
            console.log(`   Sender: ${apiTx.sender_address}`);
            
            if (apiTx.tx_type === 'token_transfer') {
              const transfer = apiTx.token_transfer;
              
              console.log(`🔍 DEBUGGING TRANSACTION ${apiTx.tx_id}:`);
              console.log(`   Wallet Address: ${wallet.address}`);
              console.log(`   Full transfer object:`, JSON.stringify(transfer, null, 2));
              console.log(`   Transaction sender_address: ${apiTx.sender_address}`);
              console.log(`   Transfer sender_address: ${transfer?.sender_address}`);
              console.log(`   Transfer recipient_address: ${transfer?.recipient_address}`);
              
              // Use transaction-level sender_address if transfer.sender_address is undefined
              const senderAddress = transfer?.sender_address || apiTx.sender_address;
              const recipientAddress = transfer?.recipient_address;
              
              console.log(`   Final Sender Address: ${senderAddress}`);
              console.log(`   Final Recipient Address: ${recipientAddress}`);
              console.log(`   Sender === Wallet? ${senderAddress === wallet.address}`);
              console.log(`   Recipient === Wallet? ${recipientAddress === wallet.address}`);
              
              if (senderAddress === wallet.address) {
                type = 'sent';
                amount = -parseInt(transfer.amount) / 1000000; // Negative for sent transactions
                console.log(`💸 SENT transaction: ${apiTx.tx_id} - Amount: ${amount} STX (negative)`);
              } else if (recipientAddress === wallet.address) {
                type = 'received';
                amount = parseInt(transfer.amount) / 1000000; // Positive for received
                console.log(`💰 RECEIVED transaction: ${apiTx.tx_id} - Amount: ${amount} STX (positive)`);
              } else {
                // If the transaction appears for this wallet but wallet is neither sender nor recipient,
                // it might be a multi-sig or contract interaction - treat as received for now
                type = 'received';
                amount = parseInt(transfer.amount) / 1000000;
                console.log(`🤔 UNCLEAR transaction: ${apiTx.tx_id} - Amount: ${amount} STX (treating as received)`);
              }
            } else if (apiTx.tx_type === 'contract_call') {
              // Enhanced contract call processing for better accuracy
              let contractAmount = 0;
              let hasStxTransfer = false;
              let contractType = 'received'; // default assumption
              
              if (CONFIG.FEATURES.DEBUG_TRANSACTIONS) {
                console.log(`🔍 DEBUGGING CONTRACT_CALL ${apiTx.tx_id}:`);
                console.log(`   Wallet Address: ${wallet.address}`);
                console.log(`   Events available: ${apiTx.events ? apiTx.events.length : 0}`);
                console.log(`   Contract ID: ${apiTx.contract_call?.contract_id}`);
                console.log(`   Function Name: ${apiTx.contract_call?.function_name}`);
              }
              
              if (apiTx.events && Array.isArray(apiTx.events) && apiTx.events.length > 0) {
                if (CONFIG.FEATURES.DEBUG_TRANSACTIONS) {
                  console.log(`   All events:`, JSON.stringify(apiTx.events, null, 2));
                }
                
                // Enhanced event processing to detect both sent and received STX transfers
                const stxEvents = apiTx.events.filter((event: any) => 
                  event.event_type === 'stx_transfer_event'
                );
                
                for (const event of stxEvents) {
                  const stxTransfer = event.stx_transfer_event;
                  if (!stxTransfer) continue;
                  
                  const eventAmount = parseInt(stxTransfer.amount) / 1000000;
                  
                  if (stxTransfer.recipient === wallet.address) {
                    // This wallet received STX
                    contractAmount += eventAmount;
                    hasStxTransfer = true;
                    contractType = 'received';
                    if (CONFIG.FEATURES.DEBUG_TRANSACTIONS) {
                      console.log(`📜 CONTRACT_CALL STX received: ${apiTx.tx_id} - Amount: ${eventAmount} STX`);
                    }
                  } else if (stxTransfer.sender === wallet.address) {
                    // This wallet sent STX
                    contractAmount += eventAmount;
                    hasStxTransfer = true;
                    contractType = 'sent';
                    if (CONFIG.FEATURES.DEBUG_TRANSACTIONS) {
                      console.log(`📜 CONTRACT_CALL STX sent: ${apiTx.tx_id} - Amount: ${eventAmount} STX`);
                    }
                  }
                }
              } else if (CONFIG.FEATURES.ENHANCED_CONTRACT_PARSING) {
                // If no events, try to parse function args for send-many contract
                if (CONFIG.FEATURES.DEBUG_TRANSACTIONS) {
                  console.log(`   No events found, checking function args...`);
                }
                if (apiTx.contract_call?.contract_id?.includes('send-many') && 
                    apiTx.contract_call?.function_name === 'send-many' &&
                    apiTx.contract_call?.function_args) {
                  
                  try {
                    // Parse the function args to find transfers to this wallet
                    const functionArgs = apiTx.contract_call.function_args;
                    console.log(`   Function args:`, JSON.stringify(functionArgs, null, 2));
                    
                    // Look for our wallet address in the function arguments
                    const argsStr = JSON.stringify(functionArgs);
                    if (argsStr.includes(wallet.address)) {
                      console.log(`   ✅ Found wallet address in function args!`);
                      
                      // Enhanced parsing to extract the amount for this specific wallet
                      // Parse the repr field which contains human-readable format
                      const reprMatch = functionArgs.find((arg: any) => arg.repr && arg.repr.includes(wallet.address));
                      if (reprMatch && reprMatch.repr) {
                        console.log(`   📜 Found repr with wallet address: ${reprMatch.repr.substring(0, 200)}...`);
                        
                        // Extract the amount using improved regex that looks for (ustx u[amount])
                        // Pattern: find our wallet address followed by (ustx u[digits])
                        const amountRegex = new RegExp(`${wallet.address.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^)]*\\(ustx u(\\d+)\\)`, 'g');
                        const amountMatch = amountRegex.exec(reprMatch.repr);
                        
                        if (amountMatch && amountMatch[1]) {
                          contractAmount = parseInt(amountMatch[1]) / 1000000;
                          hasStxTransfer = true;
                          console.log(`   💰 Extracted amount: ${contractAmount} STX for wallet ${wallet.address}`);
                        } else {
                          // Try alternative regex patterns to extract the amount
                          console.log(`   🔍 Trying alternative patterns to extract amount...`);
                          
                          const walletEscaped = wallet.address.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                          
                          // Pattern 1: Look for wallet address followed by ustx amount anywhere in the string
                          let match = reprMatch.repr.match(new RegExp(`'${walletEscaped}'[\\s\\S]*?u(\\d+)`, 'gi'));
                          if (match && match[0]) {
                            const amountMatch = match[0].match(/u(\d+)/);
                            if (amountMatch && amountMatch[1]) {
                              contractAmount = parseInt(amountMatch[1]) / 1000000;
                              hasStxTransfer = true;
                              console.log(`   💰 Pattern 1 - Extracted amount: ${contractAmount} STX`);
                            }
                          }
                          
                          // Pattern 2: If still not found, look for any ustx amount near our wallet
                          if (!hasStxTransfer) {
                            const walletIndex = reprMatch.repr.indexOf(wallet.address);
                            if (walletIndex !== -1) {
                              // Look for ustx u[number] within 200 characters after wallet address
                              const nearbyText = reprMatch.repr.substring(walletIndex, walletIndex + 200);
                              const ustxMatch = nearbyText.match(/ustx\s+u(\d+)/);
                              if (ustxMatch && ustxMatch[1]) {
                                contractAmount = parseInt(ustxMatch[1]) / 1000000;
                                hasStxTransfer = true;
                                console.log(`   💰 Pattern 2 - Extracted amount: ${contractAmount} STX`);
                              }
                            }
                          }
                          
                          if (!hasStxTransfer) {
                            console.log(`   ❌ Could not extract amount - skipping transaction`);
                            console.log(`   Debug repr: ${reprMatch.repr.substring(0, 300)}...`);
                          }
                        }
                      }
                    }
                  } catch (error) {
                    console.log(`   Error parsing function args:`, error);
                  }
                }
              }
              
              if (!hasStxTransfer) {
                if (CONFIG.FEATURES.DEBUG_TRANSACTIONS) {
                  console.log(`⏭️ Skipping CONTRACT_CALL transaction: ${apiTx.tx_id} - No STX transfer to this wallet`);
                }
                continue; // Skip this transaction entirely
              }
              
              type = contractType as 'sent' | 'received';
              amount = contractType === 'sent' ? -contractAmount : contractAmount;
            } else if (apiTx.tx_type === 'coinbase') {
              type = 'mining';
              amount = parseInt(apiTx.coinbase_payload?.alt_recipient?.amount || '0') / 1000000;
              console.log(`⛏️ MINING transaction: ${apiTx.tx_id} - Amount: ${amount} STX`);
            } else {
              // Log unknown transaction types
              console.log(`❓ UNKNOWN transaction type: ${apiTx.tx_type} for ${apiTx.tx_id}`);
              console.log(`   Full transaction:`, JSON.stringify(apiTx, null, 2));
              
              // Skip unknown transaction types for now
              continue;
            }

            console.log(`📝 Creating transaction: ${type} - ${amount} STX - ${apiTx.tx_id} for wallet ${wallet._id}`);

            try {
              // Create transaction record
              await Transaction.create({
                userId: payload.userId,
                walletId: wallet._id,
                walletAddress: wallet.address,
                txId: apiTx.tx_id,
                type,
                amount: amount, // Store negative for sent, positive for received
                fee: apiTx.fee_rate ? parseInt(apiTx.fee_rate) / 1000000 : 0,
                fromAddress: apiTx.sender_address,
                toAddress: apiTx.token_transfer?.recipient_address || wallet.address,
                blockHeight: apiTx.block_height,
                blockHash: apiTx.block_hash,
                status: apiTx.tx_status === 'success' ? 'confirmed' : 'pending',
                timestamp: new Date(apiTx.burn_block_time_iso),
                memo: apiTx.token_transfer?.memo || '',
              });

              syncedCount++;
              console.log(`✅ Successfully saved transaction ${apiTx.tx_id} for wallet ${wallet._id}`);
              
            } catch (error) {
              // Type guard for MongoDB duplicate key error
              if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
                console.log(`⚠️ Transaction ${apiTx.tx_id} already exists for wallet ${wallet._id} - skipping`);
                // This is fine, the transaction was already processed for this wallet
              } else {
                console.error(`❌ Error saving transaction ${apiTx.tx_id} for wallet ${wallet._id}:`, error);
                // Don't throw, continue with next transaction
              }
            }
          }
        }

        syncResults.push({
          walletId: wallet._id,
          address: wallet.address,
          synced: syncedCount,
          total: apiTransactions.length,
        });

        totalSynced += syncedCount;

        // Delay between wallet processing to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, CONFIG.TRANSACTION_SYNC.WALLET_PROCESSING_DELAY));
      } catch (error) {
        console.error(`Error syncing transactions for wallet ${wallet._id}:`, error);
        syncResults.push({
          walletId: wallet._id,
          address: wallet.address,
          error: 'Sync failed',
        });
      }
    }

    return NextResponse.json({
      message: 'Transaction sync completed',
      totalSynced,
      duplicatesRemoved,
      results: syncResults,
    }, { status: 200 });
  } catch (error) {
    console.error('Sync transactions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}