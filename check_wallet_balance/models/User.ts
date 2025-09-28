import mongoose from 'mongoose';
import { encrypt, decrypt } from '@/lib/encryption';

export interface IUser {
  _id?: string;
  email: string;
  password?: string; // Optional for wallet-only users
  name: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  // Wallet authentication fields
  walletAddress?: string;
  walletPublicKey?: string;
  walletType?: 'stacks';
  walletLinkedAt?: Date; // Track when wallet was linked to account
  authMethod: 'email' | 'wallet' | 'both'; // Track how user authenticates
  profileComplete: boolean; // Track if user has completed their profile
  emailNotifications: boolean;
  balanceThreshold: number;
  autoUpdate: boolean;
  updateFrequency: string;
  monthlyUpdateDay: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      // Remove unique constraint to avoid conflicts with placeholder emails
    },
    password: {
      type: String,
      required: false, // Not required for wallet-only users
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    // Wallet authentication fields
    walletAddress: {
      type: String,
      // Remove sparse here since we have explicit index below
    },
    walletPublicKey: {
      type: String,
    },
    walletType: {
      type: String,
      enum: ['stacks'],
    },
    walletLinkedAt: {
      type: Date,
    },
    authMethod: {
      type: String,
      enum: ['email', 'wallet', 'both'],
      default: 'email',
    },
    profileComplete: {
      type: Boolean,
      default: false,
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    balanceThreshold: {
      type: Number,
      default: 1000,
    },
    autoUpdate: {
      type: Boolean,
      default: true,
    },
    updateFrequency: {
      type: String,
      enum: ['daily', 'every-3-days', 'every-5-days', 'weekly', 'bi-weekly', 'monthly'],
      default: 'every-5-days',
    },
    monthlyUpdateDay: {
      type: Number,
      min: 1,
      max: 28,
      default: 15,
    },
  },
  {
    timestamps: true,
  }
);

// Index for performance
userSchema.index({ email: 1 });
userSchema.index({ verificationToken: 1 });
userSchema.index({ resetPasswordToken: 1 });
userSchema.index({ walletAddress: 1 }, { unique: true, sparse: true }); // Unique wallet addresses only
userSchema.index({ authMethod: 1 });

// Compound indexes for wallet authentication
userSchema.index({ walletAddress: 1, walletType: 1 });

// Custom validation to ensure either email or wallet auth method is properly set
userSchema.pre('save', function(next) {
  // Ensure password exists for email authentication
  if (this.authMethod === 'email' && !this.password) {
    return next(new Error('Password is required for email authentication'));
  }
  
  // Ensure wallet fields exist for wallet authentication
  if ((this.authMethod === 'wallet' || this.authMethod === 'both') && !this.walletAddress) {
    return next(new Error('Wallet address is required for wallet authentication'));
  }

  // Mark profile as complete for email users by default
  if (this.authMethod === 'email' && !this.isNew) {
    this.profileComplete = true;
  }

  next();
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);