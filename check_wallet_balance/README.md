# Stacks Wallet Balance Checker & Monitor

A comprehensive Next.js application for monitoring Stacks blockchain wallets, tracking balances, and managing wallet portfolios with real-time updates and transaction history.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Core Features](#core-features)
- [API Routes](#api-routes)
- [Database Models](#database-models)
- [Authentication](#authentication)
- [Wallet Integration](#wallet-integration)
- [Scheduled Tasks](#scheduled-tasks)
- [Security](#security)
- [Deployment](#deployment)

## Overview

This application provides a complete solution for Stacks wallet management with two main use cases:

1. **Public Wallet Explorer**: Anyone can check any Stacks wallet address (mainnet or testnet) to view balances, transaction history, and analytics without authentication.

2. **Authenticated Wallet Monitor**: Registered users can add multiple wallets to their portfolio, receive automated balance updates via email, and track wallet performance over time.

## Features

### Public Features (No Authentication Required)

- **Real-time Wallet Lookup**: Search any Stacks address (SP/SM for mainnet, ST for testnet)
- **Balance Display**: View available, locked, and total STX balances with USD equivalent
- **Transaction History**: Complete transaction history with pagination (20 transactions per page)
- **Transaction Types**: Support for transfers, contract calls, contract deployments, mining rewards, and microblocks
- **Analytics**: Visual charts showing transaction distribution and wallet activity
- **Transaction Details**: View from/to addresses, fees, block height, timestamps, and contract interactions
- **Share Functionality**: Generate shareable links to wallet views

### Authenticated Features

- **Dual Authentication**: Support for both email/password and Stacks wallet authentication
- **Multi-Wallet Management**: Add and monitor multiple Stacks wallets
- **Dashboard**: Comprehensive overview with portfolio statistics and trends
- **Balance History**: Track balance changes over time with historical charts
- **Automated Updates**: Scheduled balance checks every 5 days
- **Email Notifications**: Receive balance update notifications
- **Monthly Reports**: Automated monthly wallet performance reports (12th-16th of each month)
- **User Settings**: Customize notification preferences and update frequency
- **Analytics Dashboard**: Detailed analytics with charts and performance metrics

## Tech Stack

### Frontend
- **Framework**: Next.js 15.5.3 (React 19.1.0)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 with custom theming
- **UI Components**: Radix UI primitives (Dialog, Select, Tabs, etc.)
- **Animations**: Framer Motion 12.23.12
- **Charts**: Recharts 3.2.0
- **Forms**: React Hook Form 7.62.0 with Zod 4.1.8 validation
- **Notifications**: Sonner 2.0.7

### Backend
- **Runtime**: Node.js with Next.js API Routes
- **Database**: MongoDB 6.19.0 with Mongoose 8.18.1
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Encryption**: crypto-js 4.2.0 for sensitive data
- **Password Hashing**: bcryptjs 3.0.2
- **Email**: Nodemailer 6.10.1
- **Scheduling**: node-cron 4.2.1

### Blockchain Integration
- **Stacks SDK**: @stacks/connect 8.2.0, @stacks/transactions 7.2.0, @stacks/network 7.2.0
- **Wallet Support**: Leather, Xverse, and other Stacks wallets
- **APIs**: Hiro Stacks API for balance and transaction data

## Architecture

### Application Structure

```
check_wallet_balance/
├── app/                          # Next.js App Router
│   ├── api/                     # API Routes
│   │   ├── auth/               # Authentication endpoints
│   │   │   ├── login/          # Email & wallet login
│   │   │   ├── register/       # Email & wallet registration
│   │   │   ├── wallet/         # Wallet authentication
│   │   │   ├── link-wallet/    # Link wallet to existing account
│   │   │   └── settings/       # User settings management
│   │   ├── wallets/            # Wallet management
│   │   │   ├── route.ts        # CRUD operations for wallets
│   │   │   ├── update-balances/# Manual balance updates
│   │   │   └── balance-history/# Historical balance data
│   │   ├── transactions/       # Transaction history
│   │   ├── scheduler/          # Cron job management
│   │   ├── admin/              # Admin endpoints
│   │   └── public/             # Unauthenticated endpoints
│   │       └── wallet/[address]/ # Public wallet lookup
│   ├── dashboard/              # Authenticated dashboard pages
│   │   ├── page.tsx           # Main dashboard
│   │   ├── wallets/           # Wallet management
│   │   ├── analytics/         # Analytics view
│   │   ├── settings/          # User settings
│   │   └── profile/           # User profile
│   ├── wallet-checker/         # Public wallet explorer
│   ├── docs/                   # Documentation page
│   └── page.tsx               # Landing page
├── components/                 # React components
│   ├── ui/                    # Reusable UI components
│   ├── docs/                  # Documentation components
│   ├── Header.tsx             # Navigation header
│   ├── Footer.tsx             # Footer
│   ├── HeroSection.tsx        # Landing hero
│   ├── AuthModal.tsx          # Authentication modal
│   └── DashboardLayout.tsx    # Dashboard layout
├── lib/                       # Utility libraries
│   ├── db.ts                 # MongoDB connection
│   ├── auth.ts               # JWT authentication
│   ├── wallet-service.ts     # Stacks wallet integration
│   ├── wallet-auth.ts        # Wallet signature verification
│   ├── encryption.ts         # Data encryption
│   ├── scheduler.ts          # Cron jobs
│   ├── email.ts              # Email notifications
│   └── utils.ts              # Helper functions
├── models/                    # MongoDB schemas
│   ├── User.ts               # User model
│   ├── Wallet.ts             # Wallet model
│   ├── BalanceHistory.ts     # Balance history
│   └── Transaction.ts        # Transaction records
└── types/                     # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js 20+ installed
- MongoDB instance (local or cloud like MongoDB Atlas)
- Gmail account for email notifications (or other SMTP service)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd check_wallet_balance
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file in the root directory (see [Environment Variables](#environment-variables))

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
# Standard build
npm run build

# Build with Turbopack (faster)
npm run build:turbo

# Start production server
npm start
```

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-in-production

# JWT Secret (for custom auth)
JWT_SECRET=your-jwt-secret-key-here

# Encryption Key (32 characters for AES-256)
ENCRYPTION_KEY=your-32-character-encryption-key

# Email Configuration (Gmail example)
EMAIL_FROM=your-email@gmail.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Stacks API Configuration
STACKS_API_URL=https://api.hiro.so/extended/v1
NEXT_PUBLIC_STACKS_NETWORK=mainnet  # or testnet

# API URL (for production deployment)
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Email Setup (Gmail)

1. Enable 2-factor authentication on your Google account
2. Generate an app-specific password at https://myaccount.google.com/apppasswords
3. Use the generated password in `EMAIL_PASS`

## Project Structure

### Core Features

#### 1. Public Wallet Explorer (`/wallet-checker`)

Allows anyone to explore Stacks wallets without authentication:

- **Search**: Enter any Stacks address (SP, SM, or ST prefix)
- **Balance Display**: Shows available, locked, and total STX with USD values
- **Transaction History**: Paginated list of all transactions
- **Transaction Types**: Sent, received, contract calls, deployments, mining
- **Analytics**: Charts showing transaction distribution
- **Filters**: Filter transactions by type
- **Share**: Generate shareable links

**Key Files**:
- `app/wallet-checker/page.tsx` - Main UI component
- `app/api/public/wallet/[address]/route.ts` - Balance API
- `app/api/public/wallet/[address]/full/route.ts` - Full data with transactions

#### 2. User Authentication

Dual authentication system supporting both traditional and Web3 methods:

**Email/Password Authentication**:
- Registration with email verification
- Password hashing with bcrypt
- JWT token-based sessions
- Password reset functionality

**Wallet Authentication**:
- Challenge-response signature verification
- Support for Stacks wallets (Leather, Xverse)
- No password required for wallet-only users
- Ability to link wallet to existing email account

**Key Files**:
- `lib/auth.ts` - JWT token management
- `lib/wallet-auth.ts` - Wallet signature verification
- `lib/wallet-service.ts` - Frontend wallet integration
- `app/api/auth/` - Authentication endpoints

#### 3. Wallet Management Dashboard

Authenticated users can manage their wallet portfolio:

**Dashboard Features**:
- Portfolio overview with total balance
- Active wallet count
- Recent transactions
- Balance trend charts
- Quick actions (add wallet, update balances)

**Wallet Operations**:
- Add wallet by address
- View individual wallet details
- Update balances manually or automatically
- Delete wallets
- View balance history

**Key Files**:
- `app/dashboard/page.tsx` - Main dashboard
- `app/dashboard/wallets/page.tsx` - Wallet management
- `app/api/wallets/route.ts` - Wallet CRUD operations

#### 4. Automated Balance Updates

Scheduled tasks for keeping wallet balances current:

**Update Schedule**:
- Every 5 days: Automatic balance updates for all active wallets
- Monthly (14th): Comprehensive monthly reports

**Process**:
1. Fetch current balance from Hiro API
2. Compare with stored balance
3. Save to balance history
4. Send email notifications if enabled
5. Update wallet records

**Key Files**:
- `lib/scheduler.ts` - Cron job definitions
- `lib/email.ts` - Email notification system
- `app/api/scheduler/route.ts` - Manual trigger endpoints

## API Routes

### Public Endpoints (No Authentication)

#### Get Wallet Balance
```
GET /api/public/wallet/[address]
```
Returns balance information for any Stacks address.

**Response**:
```json
{
  "address": "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",
  "balance": {
    "available": 1000.123456,
    "locked": 500.0,
    "total": 1500.123456,
    "totalSent": 250.0,
    "totalReceived": 1750.123456,
    "totalFees": 0.123456
  }
}
```

#### Get Wallet with Transactions
```
GET /api/public/wallet/[address]/full?limit=20&offset=0
```
Returns balance and transaction history.

**Query Parameters**:
- `limit` (optional): Number of transactions (max 100, default 50)
- `offset` (optional): Pagination offset (default 0)
- `transactions` (optional): Set to false to exclude transactions

### Authentication Endpoints

#### Register with Email
```
POST /api/auth/register
Body: { email, password, name }
```

#### Login with Email
```
POST /api/auth/login
Body: { email, password }
```

#### Register with Wallet
```
POST /api/auth/register/wallet
Body: { address, signature, message, publicKey, walletType }
```

#### Login with Wallet
```
POST /api/auth/login/wallet
Body: { address, signature, message, publicKey, walletType }
```

#### Get Wallet Challenge
```
GET /api/auth/wallet/challenge?address=SP...&type=connection
```

#### Link Wallet to Account
```
POST /api/auth/link-wallet
Headers: { Authorization: Bearer <token> }
Body: { address, signature, message, publicKey }
```

### Authenticated Endpoints

#### Get User's Wallets
```
GET /api/wallets
Headers: { Authorization: Bearer <token> }
```

#### Add Wallet
```
POST /api/wallets
Headers: { Authorization: Bearer <token> }
Body: { email, address }
```

#### Update Wallet
```
PUT /api/wallets/[id]
Headers: { Authorization: Bearer <token> }
Body: { email?, isActive? }
```

#### Delete Wallet
```
DELETE /api/wallets/[id]
Headers: { Authorization: Bearer <token> }
```

#### Update All Balances
```
POST /api/wallets/update-balances
Headers: { Authorization: Bearer <token> }
```

#### Get Balance History
```
GET /api/wallets/balance-history?days=30
Headers: { Authorization: Bearer <token> }
```

## Database Models

### User Model

```typescript
{
  email: string;                    // User email
  password?: string;                // Hashed (optional for wallet-only)
  name: string;                     // Display name
  role: 'user' | 'admin';          // User role
  isVerified: boolean;             // Email verification status
  walletAddress?: string;          // Linked Stacks wallet
  walletPublicKey?: string;        // Wallet public key
  walletType?: 'stacks';           // Wallet type
  authMethod: 'email' | 'wallet' | 'both';  // Authentication method
  profileComplete: boolean;        // Profile completion status
  emailNotifications: boolean;     // Email notification preference
  balanceThreshold: number;        // Alert threshold
  autoUpdate: boolean;             // Auto-update enabled
  updateFrequency: string;         // Update frequency
  monthlyUpdateDay: number;        // Day of month for reports
  createdAt: Date;
  updatedAt: Date;
}
```

### Wallet Model

```typescript
{
  userId: string;                  // Reference to User
  email: string;                   // Encrypted email
  address: string;                 // Encrypted Stacks address
  balance: {
    available: number;             // Available STX
    locked: number;                // Locked/staked STX
    total: number;                 // Total STX
  };
  lastUpdated: Date;              // Last balance check
  isActive: boolean;              // Active status
  createdAt: Date;
  updatedAt: Date;
}
```

### BalanceHistory Model

```typescript
{
  userId: string;                  // Reference to User
  walletId: string;                // Reference to Wallet
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
  updateType: 'manual' | 'scheduled' | 'initial';
  createdAt: Date;
}
```

### Transaction Model

```typescript
{
  userId: string;                  // Reference to User
  walletId: string;                // Reference to Wallet
  walletAddress: string;           // Wallet address
  txid: string;                    // Transaction ID
  type: 'sent' | 'received' | 'staking' | 'mining';
  amount: number;                  // STX amount
  fee: number;                     // Transaction fee
  status: 'pending' | 'confirmed' | 'failed';
  blockHeight: number;             // Block number
  blockHash: string;               // Block hash
  timestamp: Date;                 // Transaction time
  memo?: string;                   // Transaction memo
  createdAt: Date;
}
```

## Authentication

### JWT Token Flow

1. User registers/logs in with email or wallet
2. Server generates JWT token with user info
3. Token stored in localStorage and sent in Authorization header
4. Token expires after 7 days
5. Refresh token mechanism for extended sessions

### Wallet Authentication Flow

1. User clicks "Connect Wallet"
2. Frontend requests challenge from backend: `GET /api/auth/wallet/challenge?address=SP...`
3. Backend generates unique challenge string and stores it temporarily
4. Frontend prompts wallet to sign challenge using Stacks Connect
5. Wallet returns signature
6. Frontend sends signature to backend: `POST /api/auth/login/wallet` or `/api/auth/register/wallet`
7. Backend verifies signature matches challenge using public key
8. If valid, creates/retrieves user account and returns JWT token

**Key Security Features**:
- Challenges expire after 5 minutes
- Each challenge is single-use
- Signature verification uses Stacks encryption library
- Public key derived from signature must match wallet address

## Wallet Integration

### Supported Wallets

- **Leather (Hiro Wallet)**: Full support for Stacks authentication
- **Xverse**: Full support for Stacks authentication
- **Other Stacks-compatible wallets**: Using standard Stacks Connect protocol

### Integration Features

- **Explicit Connection**: Wallets only connect when user explicitly clicks "Connect"
- **Persistent Sessions**: Connection state stored in localStorage
- **Network Detection**: Automatic mainnet/testnet detection
- **Balance Queries**: Real-time balance fetching from Hiro API
- **Transaction Signing**: Message signing for authentication

### Frontend Service (`lib/wallet-service.ts`)

```typescript
// Connect wallet
await walletService.connectWallet();

// Get current address
const address = await walletService.getCurrentAddress();

// Get balance
const balance = await walletService.getStxBalance();

// Sign message
const signature = await walletService.signMessage(challenge);

// Register with wallet
const result = await walletService.registerWithWallet();

// Login with wallet
const result = await walletService.loginWithWallet();
```

## Scheduled Tasks

### Configuration

Tasks are configured using cron expressions in `lib/scheduler.ts`:

```typescript
// Every 5 days at 9:00 AM UTC
cron.schedule('0 9 */5 * *', updateAllWalletBalances);

// 14th of each month at 10:00 AM UTC
cron.schedule('0 10 14 * *', sendMonthlyReports);
```

### Balance Update Task

**Process**:
1. Query all users with email notifications enabled
2. For each user, fetch their active wallets
3. Query current balance from Hiro API
4. Compare with stored balance
5. Update wallet balance in database
6. Create balance history record
7. Send email notification with changes

### Monthly Report Task

**Process**:
1. Query all users with email notifications enabled
2. Fetch 30-day balance history for each wallet
3. Calculate monthly changes and trends
4. Generate comprehensive email report
5. Send to all users with active wallets

### Manual Triggers

Endpoints for manual task execution:

```
POST /api/scheduler/update-balances
POST /api/scheduler/monthly-report
GET /api/scheduler/status
```

## Security

### Data Protection

1. **Encryption at Rest**:
   - Wallet addresses encrypted in database (AES-256)
   - Wallet emails encrypted
   - Passwords hashed with bcrypt (10 rounds)

2. **Encryption in Transit**:
   - HTTPS enforced in production
   - Secure WebSocket connections for wallet interactions

3. **Authentication**:
   - JWT tokens with 7-day expiration
   - Secure token storage
   - Token validation on all protected routes

4. **Wallet Security**:
   - Challenge-response authentication
   - Single-use challenges with 5-minute expiry
   - Signature verification using Stacks cryptography
   - No private keys stored or transmitted

### Best Practices

- Environment variables for secrets
- MongoDB connection with authentication
- CORS configuration
- Rate limiting (recommended for production)
- Input validation with Zod schemas
- SQL injection prevention (using Mongoose ODM)
- XSS protection (React auto-escaping)

## Deployment

### Vercel (Recommended)

1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy with automatic builds on push

```bash
# Manual deployment
npm run build
vercel --prod
```

### Other Platforms

The application can be deployed on any platform supporting Next.js:

- **Netlify**: Use Next.js build plugin
- **AWS**: Deploy to Lambda with AWS Amplify
- **DigitalOcean**: Use App Platform
- **Self-hosted**: Build and run with Node.js

### Production Checklist

- [ ] Update `NEXTAUTH_SECRET` and `JWT_SECRET`
- [ ] Use strong `ENCRYPTION_KEY`
- [ ] Configure production MongoDB instance
- [ ] Set up email service (Gmail app password or SendGrid)
- [ ] Update `NEXTAUTH_URL` and `NEXT_PUBLIC_API_URL`
- [ ] Enable HTTPS
- [ ] Configure CORS for your domain
- [ ] Set up monitoring and error tracking
- [ ] Configure backup strategy for MongoDB
- [ ] Test scheduled tasks in production environment

## Development

### Code Structure

- **TypeScript**: Strict typing throughout
- **ESLint**: Code linting
- **Prettier**: Code formatting (via Tailwind CSS)
- **Component-based**: Modular React components
- **API Route Handlers**: Server-side logic
- **Middleware**: Request validation and auth

### Adding New Features

1. Create database models in `models/`
2. Add API routes in `app/api/`
3. Create frontend components in `components/`
4. Add pages in `app/`
5. Update types in TypeScript files

### Testing

```bash
# Run development server with hot reload
npm run dev

# Test API endpoints
curl http://localhost:3000/api/public/wallet/SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7

# Test wallet connection (requires browser)
# Visit http://localhost:3000/wallet-checker
```

## Support & Documentation

- **In-App Documentation**: Visit `/docs` for complete feature documentation
- **API Documentation**: See API Routes section above
- **Issues**: Report bugs or request features via GitHub issues

## License

This project is private and proprietary.

---

**Built with Next.js, React, TypeScript, and the Stacks blockchain.**
