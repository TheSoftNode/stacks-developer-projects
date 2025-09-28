import * as cron from 'node-cron';
import connectDB from './db';
import { User } from '../models/User';
import { Wallet } from '../models/Wallet';
import { BalanceHistory } from '../models/BalanceHistory';
import { Transaction } from '../models/Transaction';
import { sendBalanceUpdateEmail } from './email';

interface ScheduledTask {
  id: string;
  task: cron.ScheduledTask;
  userId: string;
  frequency: string;
}

class DynamicScheduler {
  private tasks: Map<string, ScheduledTask> = new Map();

  // Convert user preference to cron expression
  private getCronExpression(frequency: string, monthlyDay?: number): string {
    switch (frequency) {
      case 'daily':
        return '0 9 * * *'; // Every day at 9 AM
      case 'every-3-days':
        return '0 9 */3 * *'; // Every 3 days at 9 AM
      case 'every-5-days':
        return '0 9 */5 * *'; // Every 5 days at 9 AM
      case 'weekly':
        return '0 9 * * 0'; // Every Sunday at 9 AM
      case 'bi-weekly':
        return '0 9 * * 0/2'; // Every other Sunday at 9 AM
      case 'monthly':
        const day = monthlyDay || 15;
        return `0 9 ${day} * *`; // Specific day of month at 9 AM
      default:
        return '0 9 */5 * *'; // Default to every 5 days
    }
  }

  // Create balance update function for a specific user
  private createUpdateFunction(userId: string, updateType: 'scheduled' | 'manual' = 'scheduled') {
    return async () => {
      try {
        await connectDB();
        
        const user = await User.findById(userId);
        if (!user || !user.autoUpdate) {
          console.log(`Skipping update for user ${userId} - auto update disabled`);
          return;
        }

        const wallets = await Wallet.find({ userId, isActive: true });
        const updatedWallets = [];

        for (const wallet of wallets) {
          try {
            const decryptedAddress = wallet.address;
            const newBalance = await this.fetchWalletBalance(decryptedAddress);
            
            if (newBalance) {
              const previousBalance = {
                available: wallet.balance.available,
                locked: wallet.balance.locked,
                total: wallet.balance.total,
              };

              // Update wallet balance
              wallet.balance = newBalance;
              wallet.lastUpdated = new Date();
              await wallet.save();

              // Save balance history
              const balanceHistory = new BalanceHistory({
                userId,
                walletId: wallet._id,
                balance: newBalance,
                previousBalance,
                change: {
                  available: newBalance.available - previousBalance.available,
                  locked: newBalance.locked - previousBalance.locked,
                  total: newBalance.total - previousBalance.total,
                },
                updateType,
              });
              await balanceHistory.save();

              updatedWallets.push({
                email: wallet.email,
                address: decryptedAddress,
                balance: newBalance,
                previousBalance,
                change: {
                  available: newBalance.available - previousBalance.available,
                  locked: newBalance.locked - previousBalance.locked,
                  total: newBalance.total - previousBalance.total,
                },
              });

              console.log(`Updated wallet ${decryptedAddress} for user ${userId}`);
              
              // Also sync transactions for this wallet
              try {
                await this.syncWalletTransactions(userId, wallet._id, decryptedAddress);
              } catch (transactionError) {
                console.error(`Failed to sync transactions for wallet ${decryptedAddress}:`, transactionError);
              }
            }
          } catch (error) {
            console.error(`Error updating wallet ${wallet._id}:`, error);
          }
        }

        // Send email notification if user has email notifications enabled
        if (user.emailNotifications && updatedWallets.length > 0) {
          await sendBalanceUpdateEmail({
            to: user.email,
            userName: user.name,
            wallets: updatedWallets,
            updateType,
          });
        }

        console.log(`✅ Scheduled update completed for user ${userId}`);
      } catch (error) {
        console.error(`❌ Error during scheduled update for user ${userId}:`, error);
      }
    };
  }

  // Fetch balance from Stacks API
  private async fetchWalletBalance(address: string) {
    try {
      const response = await fetch(`https://api.hiro.so/extended/v1/address/${address}/balances`);
      if (!response.ok) {
        console.error(`Failed to fetch balance for ${address}:`, response.statusText);
        return null;
      }

      const data = await response.json();
      return {
        available: parseFloat(data.stx.balance) / 1000000,
        locked: parseFloat(data.stx.locked) / 1000000,
        total: (parseFloat(data.stx.balance) + parseFloat(data.stx.locked)) / 1000000,
      };
    } catch (error) {
      console.error(`Error fetching balance for ${address}:`, error);
      return null;
    }
  }

  // Sync transactions for a specific wallet
  private async syncWalletTransactions(userId: string, walletId: string, address: string): Promise<number> {
    try {
      console.log(`🔄 Syncing transactions for wallet ${address}`);
      
      let allTransactions: any[] = [];
      let offset = 0;
      const limit = 50;
      let totalFetched = 0;
      const maxTransactions = 500; // Limit for scheduled updates
      
      while (totalFetched < maxTransactions) {
        const currentLimit = Math.min(limit, maxTransactions - totalFetched);
        const response = await fetch(
          `https://api.hiro.so/extended/v1/address/${address}/transactions?limit=${currentLimit}&offset=${offset}&unanchored=true`
        );
        
        if (!response.ok) {
          console.error(`❌ API Error for ${address}: ${response.status}`);
          break;
        }
        
        const data = await response.json();
        const transactions = data.results || [];
        
        if (transactions.length === 0) {
          break;
        }
        
        allTransactions.push(...transactions);
        totalFetched += transactions.length;
        offset += transactions.length;
        
        if (transactions.length < currentLimit) {
          break;
        }
        
        // Delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      let syncedCount = 0;
      
      for (const apiTx of allTransactions) {
        // Check if transaction already exists
        const existingTx = await Transaction.findOne({ 
          txId: apiTx.tx_id,
          userId,
          walletId
        });
        
        if (!existingTx) {
          // Determine transaction type and amount
          let type: 'sent' | 'received' | 'stacking' | 'mining' = 'received';
          let amount = 0;
          
          if (apiTx.tx_type === 'token_transfer') {
            const transfer = apiTx.token_transfer;
            const senderAddress = transfer?.sender_address || apiTx.sender_address;
            const recipientAddress = transfer?.recipient_address;
            
            if (senderAddress === address) {
              type = 'sent';
              amount = -parseInt(transfer.amount) / 1000000;
            } else if (recipientAddress === address) {
              type = 'received';
              amount = parseInt(transfer.amount) / 1000000;
            } else {
              continue; // Skip if wallet not involved
            }
          } else if (apiTx.tx_type === 'contract_call') {
            // Check for STX transfer events
            let hasStxTransfer = false;
            let contractAmount = 0;
            
            if (apiTx.events && Array.isArray(apiTx.events)) {
              for (const event of apiTx.events) {
                if (event.event_type === 'stx_transfer_event') {
                  const stxTransfer = event.stx_transfer_event;
                  if (stxTransfer) {
                    const eventAmount = parseInt(stxTransfer.amount) / 1000000;
                    
                    if (stxTransfer.recipient === address) {
                      contractAmount += eventAmount;
                      hasStxTransfer = true;
                      type = 'received';
                    } else if (stxTransfer.sender === address) {
                      contractAmount += eventAmount;
                      hasStxTransfer = true;
                      type = 'sent';
                    }
                  }
                }
              }
            }
            
            if (!hasStxTransfer) {
              continue; // Skip if no STX transfer found
            }
            
            amount = type === 'sent' ? -contractAmount : contractAmount;
          } else if (apiTx.tx_type === 'coinbase') {
            type = 'mining';
            amount = parseInt(apiTx.coinbase_payload?.alt_recipient?.amount || '0') / 1000000;
          } else {
            continue; // Skip unknown transaction types
          }

          try {
            await Transaction.create({
              userId,
              walletId,
              walletAddress: address,
              txId: apiTx.tx_id,
              type,
              amount,
              fee: apiTx.fee_rate ? parseInt(apiTx.fee_rate) / 1000000 : 0,
              fromAddress: apiTx.sender_address,
              toAddress: apiTx.token_transfer?.recipient_address || address,
              blockHeight: apiTx.block_height,
              blockHash: apiTx.block_hash,
              status: apiTx.tx_status === 'success' ? 'confirmed' : 'pending',
              timestamp: new Date(apiTx.burn_block_time_iso),
              memo: apiTx.token_transfer?.memo || '',
            });

            syncedCount++;
          } catch (error: any) {
            if (error.code === 11000) {
              // Duplicate key error - transaction already exists
              continue;
            } else {
              console.error(`Error saving transaction ${apiTx.tx_id}:`, error);
            }
          }
        }
      }

      console.log(`✅ Synced ${syncedCount} new transactions for wallet ${address}`);
      return syncedCount;
    } catch (error) {
      console.error(`❌ Error syncing transactions for wallet ${address}:`, error);
      return 0;
    }
  }

  // Schedule a task for a user
  public scheduleUserTask(userId: string, frequency: string, monthlyDay?: number): void {
    // Remove existing task if any
    this.removeUserTask(userId);

    const cronExpression = this.getCronExpression(frequency, monthlyDay);
    const updateFunction = this.createUpdateFunction(userId);

    try {
      const task = cron.schedule(cronExpression, updateFunction, {
        timezone: 'UTC',
      });

      const scheduledTask: ScheduledTask = {
        id: `user_${userId}`,
        task,
        userId,
        frequency,
      };

      this.tasks.set(userId, scheduledTask);
      console.log(`📅 Scheduled ${frequency} updates for user ${userId} with cron: ${cronExpression}`);
    } catch (error) {
      console.error(`Failed to schedule task for user ${userId}:`, error);
    }
  }

  // Remove a user's scheduled task
  public removeUserTask(userId: string): void {
    const scheduledTask = this.tasks.get(userId);
    if (scheduledTask) {
      scheduledTask.task.destroy();
      this.tasks.delete(userId);
      console.log(`🗑️ Removed scheduled task for user ${userId}`);
    }
  }

  // Initialize scheduler for all users
  public async initializeAllUserSchedules(): Promise<void> {
    try {
      await connectDB();
      
      const users = await User.find({ 
        autoUpdate: true
      }).select('_id updateFrequency monthlyUpdateDay');

      console.log(`🔄 Initializing schedules for ${users.length} users`);

      for (const user of users) {
        this.scheduleUserTask(
          user._id.toString(),
          user.updateFrequency || 'every-5-days',
          user.monthlyUpdateDay
        );
      }

      console.log('✅ All user schedules initialized');
    } catch (error) {
      console.error('❌ Error initializing user schedules:', error);
    }
  }

  // Update a user's schedule (call this when user changes settings)
  public async updateUserSchedule(userId: string): Promise<void> {
    try {
      await connectDB();
      
      const user = await User.findById(userId).select('autoUpdate emailNotifications updateFrequency monthlyUpdateDay');
      if (!user) {
        console.error(`User ${userId} not found`);
        return;
      }

      if (user.autoUpdate) {
        this.scheduleUserTask(
          userId,
          user.updateFrequency || 'every-5-days',
          user.monthlyUpdateDay
        );
      } else {
        this.removeUserTask(userId);
      }
    } catch (error) {
      console.error(`Error updating schedule for user ${userId}:`, error);
    }
  }

  // Get current task info for debugging
  public getTaskInfo(): Array<{ userId: string; frequency: string; isActive: boolean }> {
    return Array.from(this.tasks.values()).map(task => ({
      userId: task.userId,
      frequency: task.frequency,
      isActive: task.task.getStatus() === 'scheduled',
    }));
  }

  // Manual trigger for a specific user
  public async triggerManualUpdate(userId: string): Promise<void> {
    const updateFunction = this.createUpdateFunction(userId, 'manual');
    await updateFunction();
  }
}

// Create singleton instance
export const dynamicScheduler = new DynamicScheduler();

// Initialize all schedules on startup
export const initializeDynamicScheduler = async () => {
  await dynamicScheduler.initializeAllUserSchedules();
};

// Update specific user schedule (call after settings change)
export const updateUserSchedule = async (userId: string) => {
  await dynamicScheduler.updateUserSchedule(userId);
};

// Manual trigger for a specific user (for manual update button)
export const triggerManualUserUpdate = async (userId: string) => {
  await dynamicScheduler.triggerManualUpdate(userId);
};

export default dynamicScheduler;