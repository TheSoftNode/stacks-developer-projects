import mongoose from 'mongoose';

export interface ITransaction {
  _id?: string;
  userId: string;
  walletId: string;
  walletAddress: string;
  txId: string;
  type: 'sent' | 'received' | 'staking' | 'mining';
  amount: number;
  fee?: number;
  fromAddress?: string;
  toAddress?: string;
  blockHeight?: number;
  blockHash?: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: Date;
  memo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new mongoose.Schema<ITransaction>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    walletId: {
      type: String,
      required: true,
      ref: 'Wallet',
    },
    walletAddress: {
      type: String,
      required: true,
    },
    txId: {
      type: String,
      required: true,
      // Remove unique here since we have explicit index below
    },
    type: {
      type: String,
      enum: ['sent', 'received', 'staking', 'mining'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    fee: {
      type: Number,
      default: 0,
    },
    fromAddress: {
      type: String,
    },
    toAddress: {
      type: String,
    },
    blockHeight: {
      type: Number,
    },
    blockHash: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed'],
      default: 'pending',
    },
    timestamp: {
      type: Date,
      required: true,
    },
    memo: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
transactionSchema.index({ userId: 1 });
transactionSchema.index({ walletId: 1 });
transactionSchema.index({ userId: 1, timestamp: -1 });
transactionSchema.index({ txId: 1, walletId: 1 }, { unique: true }); // Unique per wallet, not globally
transactionSchema.index({ walletAddress: 1 });
transactionSchema.index({ timestamp: -1 });

export const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', transactionSchema);