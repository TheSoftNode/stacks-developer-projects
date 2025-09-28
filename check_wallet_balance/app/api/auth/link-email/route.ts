import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/models';
import { Wallet } from '@/models';
import { BalanceHistory } from '@/models';
import { Transaction } from '@/models';
import connectDB from '@/lib/db';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { comparePassword } from '@/lib/encryption';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify user is authenticated via wallet
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // 2. Get the current wallet user
    const walletUser = await User.findById(decoded.userId);
    if (!walletUser) {
      return NextResponse.json(
        { success: false, error: 'Current user not found' },
        { status: 404 }
      );
    }

    console.log('🔍 Current wallet user:', {
      id: walletUser._id,
      email: walletUser.email,
      authMethod: walletUser.authMethod,
      walletAddress: walletUser.walletAddress
    });

    // 3. Verify this is a wallet-only user
    if (walletUser.authMethod !== 'wallet') {
      return NextResponse.json(
        { success: false, error: 'This feature is only for wallet-only accounts. Your account already has email authentication.' },
        { status: 400 }
      );
    }

    // 4. Find the target email account
    const searchEmail = email.toLowerCase().trim();
    console.log('🔍 Searching for email user:', searchEmail);
    
    // First, let's see what users exist in the database
    const allUsers = await User.find({}).select('email authMethod walletAddress');
    console.log('🔍 All users in database:', allUsers.map(u => ({
      email: u.email,
      authMethod: u.authMethod,
      hasWallet: !!u.walletAddress
    })));
    
    const emailUser = await User.findOne({ 
      email: searchEmail,
      $or: [
        { authMethod: 'email' },
        { authMethod: 'both' }, // Include already-linked accounts
        { authMethod: { $exists: false } }, // Handle cases where authMethod wasn't set
        { authMethod: null }
      ]
    });
    
    if (!emailUser) {
      console.log('❌ No email user found for:', searchEmail);
      console.log('❌ Query used:', {
        email: searchEmail,
        $or: [
          { authMethod: 'email' },
          { authMethod: { $exists: false } },
          { authMethod: null }
        ]
      });
      return NextResponse.json(
        { success: false, error: 'No account found with this email address.' },
        { status: 404 }
      );
    }

    console.log('🔍 Found email user:', {
      id: emailUser._id,
      email: emailUser.email,
      authMethod: emailUser.authMethod,
      walletAddress: emailUser.walletAddress
    });

    // Verify this is not a wallet-only account
    if (emailUser.authMethod === 'wallet') {
      return NextResponse.json(
        { success: false, error: 'Cannot link to a wallet-only account. The target account must have email/password authentication.' },
        { status: 400 }
      );
    }

    // 5. Verify password for the email account
    const isValidPassword = await comparePassword(password, emailUser.password!);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid password for the email account' },
        { status: 401 }
      );
    }

    // 6. Check if email account already has a wallet linked
    if (emailUser.walletAddress && emailUser.walletAddress !== walletUser.walletAddress) {
      console.log('❌ Wallet address mismatch:');
      console.log('  Email account wallet:', emailUser.walletAddress);
      console.log('  Current wallet user:', walletUser.walletAddress);
      
      // Special case: If wallet user has a temporary address from failed merge, just clean it up
      if (walletUser.walletAddress && walletUser.walletAddress.startsWith('temp_merging_')) {
        console.log('🧹 Cleaning up failed merge - wallet user has temporary address');
        
        // Delete the wallet account with temporary address
        await User.findByIdAndDelete(walletUser._id);
        
        return NextResponse.json({
          success: true,
          message: 'Cleanup completed. Your accounts are already properly linked!',
          user: {
            id: emailUser._id,
            email: emailUser.email,
            name: emailUser.name,
            authMethod: emailUser.authMethod,
            walletAddress: emailUser.walletAddress,
            walletLinkedAt: emailUser.walletLinkedAt,
            profileComplete: emailUser.profileComplete,
            isVerified: emailUser.isVerified,
            role: emailUser.role,
          },
          redirectToLogin: true,
        });
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: `The email account is already linked to wallet ${emailUser.walletAddress}. Cannot merge with different wallet ${walletUser.walletAddress}.` 
        },
        { status: 400 }
      );
    }
    
    // Special case: If the email account already has the SAME wallet linked,
    // this might be a cleanup operation from a previous incomplete merge
    if (emailUser.walletAddress === walletUser.walletAddress) {
      console.log('⚠️ Email account already linked to same wallet - performing cleanup');
      // Just delete the duplicate wallet account and return success
      await User.findByIdAndDelete(walletUser._id);
      
      return NextResponse.json({
        success: true,
        message: 'Accounts were already linked. Duplicate wallet account has been cleaned up.',
        user: {
          id: emailUser._id,
          email: emailUser.email,
          name: emailUser.name,
          authMethod: emailUser.authMethod,
          walletAddress: emailUser.walletAddress,
          walletLinkedAt: emailUser.walletLinkedAt,
          profileComplete: emailUser.profileComplete,
          isVerified: emailUser.isVerified,
          role: emailUser.role,
        },
        redirectToLogin: true,
      });
    }

    // 7. Merge the accounts in the correct sequence to avoid duplicate key error
    
    // First, save wallet data and remove from wallet user to avoid unique constraint conflict
    const walletData = {
      walletAddress: walletUser.walletAddress,
      walletPublicKey: walletUser.walletPublicKey,
      walletType: walletUser.walletType
    };
    
    // Store for rollback purposes
    let mergeAttempted = false;
    
    // Use a temporary placeholder to avoid duplicate key constraint
    const tempAddress = `temp_merging_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // First, change wallet user's address to temporary value
    walletUser.walletAddress = tempAddress;
    await walletUser.save();
    
    // Set all wallet fields at once to satisfy validation
    Object.assign(emailUser, {
      walletAddress: walletData.walletAddress,
      walletPublicKey: walletData.walletPublicKey,
      walletType: walletData.walletType,
      walletLinkedAt: new Date(),
      authMethod: 'both' // Now supports both authentication methods
    });
    
    await emailUser.save();
    mergeAttempted = true;
    
    // Clear wallet fields from wallet user completely
    walletUser.walletAddress = undefined;
    walletUser.walletPublicKey = undefined;
    walletUser.walletType = undefined;
    await walletUser.save();

    // 8. Merge all data from both accounts (preserve everything!)
    try {
      let mergeStats = {
        walletsTransferred: 0,
        balanceHistoryTransferred: 0,
        transactionsTransferred: 0,
        duplicatesSkipped: 0
      };

      // Merge wallets - check for duplicates by address
      const walletUserWallets = await Wallet.find({ userId: walletUser._id });
      const emailUserWallets = await Wallet.find({ userId: emailUser._id });
      const existingAddresses = new Set(emailUserWallets.map(w => w.address));

      for (const wallet of walletUserWallets) {
        const walletAddress = wallet.address;
        
        // Check if email account already has this wallet address
        if (existingAddresses.has(walletAddress)) {
          console.log(`⚠️ Skipping duplicate wallet: ${walletAddress}`);
          mergeStats.duplicatesSkipped++;
          
          // Delete the duplicate from wallet account
          await Wallet.findByIdAndDelete(wallet._id);
        } else {
          // Transfer to email account
          wallet.userId = emailUser._id;
          await wallet.save();
          mergeStats.walletsTransferred++;
        }
      }

      // Merge balance history - transfer all records
      await BalanceHistory.updateMany(
        { userId: walletUser._id },
        { $set: { userId: emailUser._id } }
      );
      const balanceHistoryCount = await BalanceHistory.countDocuments({ userId: emailUser._id });
      mergeStats.balanceHistoryTransferred = balanceHistoryCount;

      // Merge transactions - check for duplicates by txId and walletId
      const walletUserTransactions = await Transaction.find({ userId: walletUser._id });
      const emailUserTxIds = new Set(
        (await Transaction.find({ userId: emailUser._id }).select('txId walletId'))
          .map(t => `${t.txId}-${t.walletId}`)
      );

      for (const transaction of walletUserTransactions) {
        const txKey = `${transaction.txId}-${transaction.walletId}`;
        
        if (emailUserTxIds.has(txKey)) {
          console.log(`⚠️ Skipping duplicate transaction: ${transaction.txId}`);
          mergeStats.duplicatesSkipped++;
          
          // Delete the duplicate
          await Transaction.findByIdAndDelete(transaction._id);
        } else {
          // Transfer to email account
          transaction.userId = emailUser._id;
          await transaction.save();
          mergeStats.transactionsTransferred++;
        }
      }

      console.log('✅ Data merge completed:', {
        fromWalletUserId: walletUser._id,
        toEmailUserId: emailUser._id,
        walletAddress: walletUser.walletAddress,
        mergeStats
      });
    } catch (transferError) {
      console.error('❌ Error merging data:', transferError);
      
      // Rollback changes if data merge fails and merge was attempted
      if (mergeAttempted) {
        try {
          // Restore wallet data to wallet user
          walletUser.walletAddress = walletData.walletAddress;
          walletUser.walletPublicKey = walletData.walletPublicKey;
          walletUser.walletType = walletData.walletType;
          await walletUser.save();
          
          // Clear wallet data from email user
          emailUser.walletAddress = undefined;
          emailUser.walletPublicKey = undefined;
          emailUser.walletType = undefined;
          emailUser.walletLinkedAt = undefined;
          emailUser.authMethod = 'email';
          await emailUser.save();
        } catch (rollbackError) {
          console.error('❌ Error during rollback:', rollbackError);
        }
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to merge account data. Please try again.' },
        { status: 500 }
      );
    }

    // 9. Delete the old wallet-only account (it's been merged)
    await User.findByIdAndDelete(walletUser._id);

    console.log('✅ Account linking completed:', {
      mergedAccountId: emailUser._id,
      email: emailUser.email,
      walletAddress: emailUser.walletAddress,
      authMethod: emailUser.authMethod,
      deletedWalletAccount: walletUser._id
    });

    // 10. Generate new token for the merged account
    const jwt = require('jsonwebtoken');
    const newToken = jwt.sign(
      { 
        userId: emailUser._id, 
        email: emailUser.email,
        authMethod: emailUser.authMethod,
        walletAddress: emailUser.walletAddress 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Create response with new auth token
    const response = NextResponse.json({
      success: true,
      message: 'Accounts merged successfully! You can now login with either your email or wallet.',
      user: {
        id: emailUser._id,
        email: emailUser.email,
        name: emailUser.name,
        authMethod: emailUser.authMethod,
        walletAddress: emailUser.walletAddress,
        walletLinkedAt: emailUser.walletLinkedAt,
        profileComplete: emailUser.profileComplete,
        isVerified: emailUser.isVerified,
        role: emailUser.role,
      },
      redirectToLogin: true, // Flag to indicate frontend should refresh auth
    });

    // Set new auth cookie
    response.cookies.set('auth-token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;

  } catch (error) {
    console.error('❌ Email linking error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to link email account' 
      },
      { status: 500 }
    );
  }
}