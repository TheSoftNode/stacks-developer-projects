import cron from 'node-cron';
import connectDB from './db';
import { User } from '../models/User';
import { Wallet } from '../models/Wallet';
import { BalanceHistory } from '../models/BalanceHistory';
import { sendBalanceUpdateEmail } from './email';
import { decrypt } from './encryption';

interface BalanceUpdate {
  address: string;
  balance: {
    available: number;
    locked: number;
    total: number;
  };
}

// Fetch balance from Stacks API
const fetchWalletBalance = async (address: string): Promise<BalanceUpdate['balance'] | null> => {
  try {
    const response = await fetch(`https://api.hiro.so/extended/v1/address/${address}/balances`);
    if (!response.ok) {
      console.error(`Failed to fetch balance for ${address}:`, response.statusText);
      return null;
    }

    const data = await response.json();
    return {
      available: parseFloat(data.stx.balance) / 1000000, // Convert from microSTX
      locked: parseFloat(data.stx.locked) / 1000000,
      total: (parseFloat(data.stx.balance) + parseFloat(data.stx.locked)) / 1000000,
    };
  } catch (error) {
    console.error(`Error fetching balance for ${address}:`, error);
    return null;
  }
};

// Update balances for all wallets
const updateAllWalletBalances = async (): Promise<void> => {
  try {
    await connectDB();
    
    const users = await User.find({ emailNotifications: true }).select('_id email name');
    
    for (const user of users) {
      const wallets = await Wallet.find({ userId: user._id });
      const updatedWallets = [];

      for (const wallet of wallets) {
        const decryptedAddress = decrypt(wallet.address);
        const newBalance = await fetchWalletBalance(decryptedAddress);
        
        if (newBalance) {
          // Get previous balance for comparison
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
            userId: user._id,
            walletId: wallet._id,
            balance: newBalance,
            previousBalance,
            change: {
              available: newBalance.available - previousBalance.available,
              locked: newBalance.locked - previousBalance.locked,
              total: newBalance.total - previousBalance.total,
            },
            updateType: 'manual',
          });
          await balanceHistory.save();

          // Use the same change calculation for email
          const change = balanceHistory.change;

          updatedWallets.push({
            email: decrypt(wallet.email),
            address: decryptedAddress,
            balance: newBalance,
            previousBalance,
            change,
          });

          console.log(`Updated balance for wallet ${decryptedAddress}: ${newBalance.total} STX`);
        }
      }

      // Send email notification if there are updated wallets
      if (updatedWallets.length > 0) {
        await sendBalanceUpdateEmail({
          to: user.email,
          userName: user.name,
          wallets: updatedWallets,
          updateType: 'scheduled',
        });
      }
    }

    console.log('✅ Scheduled balance update completed');
  } catch (error) {
    console.error('❌ Error during scheduled balance update:', error);
  }
};

// Monthly balance report (12th-16th of each month)
const sendMonthlyReports = async (): Promise<void> => {
  try {
    await connectDB();
    
    const users = await User.find({ emailNotifications: true }).select('_id email name');
    
    for (const user of users) {
      const wallets = await Wallet.find({ userId: user._id });
      const walletData = [];

      for (const wallet of wallets) {
        const decryptedAddress = decrypt(wallet.address);
        
        // Get balance history from 30 days ago for comparison
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const previousBalanceRecord = await BalanceHistory.findOne({
          walletId: wallet._id,
          createdAt: { $gte: thirtyDaysAgo }
        }).sort({ createdAt: 1 });

        const previousBalance = previousBalanceRecord ? previousBalanceRecord.balance : {
          available: 0,
          locked: 0,
          total: 0,
        };

        const change = {
          available: wallet.balance.available - previousBalance.available,
          locked: wallet.balance.locked - previousBalance.locked,
          total: wallet.balance.total - previousBalance.total,
        };

        walletData.push({
          email: decrypt(wallet.email),
          address: decryptedAddress,
          balance: wallet.balance,
          previousBalance,
          change,
        });
      }

      // Send monthly report email
      if (walletData.length > 0) {
        await sendBalanceUpdateEmail({
          to: user.email,
          userName: user.name,
          wallets: walletData,
          updateType: 'monthly',
        });
      }
    }

    console.log('✅ Monthly balance reports sent');
  } catch (error) {
    console.error('❌ Error sending monthly reports:', error);
  }
};

// Initialize cron jobs
export const initializeScheduler = () => {
  // Every 5 days at 9:00 AM
  cron.schedule('0 9 */5 * *', updateAllWalletBalances, {
    timezone: 'UTC'
  });

  // Monthly reports: 14th of each month at 10:00 AM (middle of 12th-16th range)
  cron.schedule('0 10 14 * *', sendMonthlyReports, {
    timezone: 'UTC'
  });

  console.log('📅 Scheduler initialized:');
  console.log('   - Balance updates: Every 5 days at 9:00 AM UTC');
  console.log('   - Monthly reports: 14th of each month at 10:00 AM UTC');
};

// Manual functions for testing/immediate execution
export const triggerBalanceUpdate = updateAllWalletBalances;
export const triggerMonthlyReport = sendMonthlyReports;