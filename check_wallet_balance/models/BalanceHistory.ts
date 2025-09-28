import mongoose from 'mongoose';

export interface IBalanceHistory {
  _id?: string;
  userId: string;
  walletId: string;
  balance: {
    available: number;
    locked: number;
    total: number;
  };
  previousBalance: {
    available: number;
    locked: number;
    total: number;
  };
  change: {
    available: number;
    locked: number;
    total: number;
  };
  updateType: 'scheduled' | 'manual' | 'monthly' | 'initial';
  createdAt: Date;
}

const balanceHistorySchema = new mongoose.Schema<IBalanceHistory>(
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
    balance: {
      available: {
        type: Number,
        required: true,
      },
      locked: {
        type: Number,
        required: true,
      },
      total: {
        type: Number,
        required: true,
      },
    },
    previousBalance: {
      available: {
        type: Number,
        required: true,
      },
      locked: {
        type: Number,
        required: true,
      },
      total: {
        type: Number,
        required: true,
      },
    },
    change: {
      available: {
        type: Number,
        required: true,
      },
      locked: {
        type: Number,
        required: true,
      },
      total: {
        type: Number,
        required: true,
      },
    },
    updateType: {
      type: String,
      enum: ['scheduled', 'manual', 'monthly', 'initial'],
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes for performance
balanceHistorySchema.index({ userId: 1 });
balanceHistorySchema.index({ walletId: 1 });
balanceHistorySchema.index({ userId: 1, createdAt: -1 });
balanceHistorySchema.index({ createdAt: -1 });

export const BalanceHistory = mongoose.models.BalanceHistory || mongoose.model<IBalanceHistory>('BalanceHistory', balanceHistorySchema);