import mongoose from 'mongoose';
import { encrypt, decrypt } from '@/lib/encryption';

export interface IWallet {
  _id?: string;
  userId: string;
  email: string; // Encrypted
  address: string; // Encrypted
  balance: {
    available: number;
    locked: number;
    total: number;
  };
  lastUpdated: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new mongoose.Schema<IWallet>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    email: {
      type: String,
      required: true,
      set: encrypt, // Automatically encrypt when saving
      get: decrypt, // Automatically decrypt when retrieving
    },
    address: {
      type: String,
      required: true,
      set: encrypt, // Automatically encrypt when saving
      get: decrypt, // Automatically decrypt when retrieving
    },
    balance: {
      available: {
        type: Number,
        default: 0,
      },
      locked: {
        type: Number,
        default: 0,
      },
      total: {
        type: Number,
        default: 0,
      },
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true }, // Include getters when converting to JSON
    toObject: { getters: true }, // Include getters when converting to object
  }
);

// Indexes for performance
walletSchema.index({ userId: 1 });
walletSchema.index({ userId: 1, isActive: 1 });
walletSchema.index({ lastUpdated: 1 });

export const Wallet = mongoose.models.Wallet || mongoose.model<IWallet>('Wallet', walletSchema);