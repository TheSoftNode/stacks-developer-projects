# LearnWeb3 Stacks Development Portfolio

A comprehensive collection of Stacks blockchain projects showcasing smart contract development, Web3 integration, and full-stack decentralized applications. This repository contains four major projects built using Clarity smart contracts and modern web technologies.

---

## 📚 Projects Overview

This repository contains four distinct projects, each demonstrating different aspects of Stacks blockchain development:

1. **[TicTacToe Platform](#1-tictactoe-platform)** - Multiplayer gaming platform with tournaments and staking
2. **[Wallet Balance Checker](#2-wallet-balance-checker)** - Full-stack wallet monitoring application
3. **[Stacks AMM (Automated Market Maker)](#3-stacks-amm)** - Decentralized exchange protocol
4. **[Token Streaming](#4-token-streaming)** - Time-based token payment system

---

## 1. TicTacToe Platform

**Directory:** `/TicTacToe`

A complete on-chain gaming platform featuring multiplayer Tic-Tac-Toe with STX betting, tournaments, player rankings, and staking rewards.

### Features

- **Multiplayer Gaming**: Players can create and join games with STX token bets
- **Tournament System**: Single-elimination and round-robin tournaments
- **Player Registry**: ELO-based ranking system with stats tracking
- **Staking System**: Stake STX to earn platform rewards
- **Game Variants**: Support for different board sizes and rule sets
- **Platform Management**: Admin controls, fee management, emergency pause

### Smart Contracts

- `tic-tac-toe.clar` - Core game logic with betting mechanics
- `platform-manager.clar` - Platform governance and fee management
- `tournament-manager.clar` - Tournament creation and bracket management
- `player-registry.clar` - Player statistics and ELO rankings
- `game-variants.clar` - Win condition detection and game rules

### Tech Stack

**Smart Contracts:**
- Clarity language
- Clarinet development framework
- Vitest for testing

**Frontend:**
- Next.js
- React
- Stacks.js for blockchain interaction

### Quick Start

```bash
cd TicTacToe/contract

# Test contracts
clarinet check
npm test

# Deploy to testnet
clarinet deployments apply --testnet

# Post-deployment setup
npm run setup:testnet
```

### Game Board Layout

```
Position indices for 3x3 board:

 0 | 1 | 2
-----------
 3 | 4 | 5
-----------
 6 | 7 | 8

Moves: u1 = X, u2 = O, u0 = Empty
```

### Key Functions

```clarity
;; Create game with 1 STX bet
(contract-call? .tic-tac-toe create-game u1000000 u0 u1)

;; Join game
(contract-call? .tic-tac-toe join-game u0 u1 u2)

;; Make move
(contract-call? .tic-tac-toe play u0 u3 u1)

;; Create tournament
(contract-call? .tournament-manager create-tournament u1 u8 u10000000)
```

### Documentation

- `QUICK_START.md` - Getting started guide
- `FIXES_SUMMARY.md` - Development notes and fixes
- `docs/ARCHITECTURE.md` - System architecture

---

## 2. Wallet Balance Checker

**Directory:** `/check_wallet_balance`

A comprehensive Next.js application for monitoring Stacks blockchain wallets with real-time balance tracking, transaction history, and automated email notifications.

### Features

#### Public Features (No Auth Required)
- **Real-time Wallet Lookup**: Search any Stacks address (SP/SM/ST)
- **Balance Display**: Available, locked, and total STX with USD equivalent
- **Transaction History**: Paginated transaction list with filtering
- **Analytics**: Visual charts showing transaction distribution
- **Share Functionality**: Generate shareable wallet links

#### Authenticated Features
- **Dual Authentication**: Email/password and Stacks wallet login
- **Multi-Wallet Management**: Monitor multiple wallets in one account
- **Dashboard**: Portfolio overview with statistics and trends
- **Balance History**: Track balance changes over time
- **Automated Updates**: Scheduled balance checks every 5 days
- **Email Notifications**: Balance update alerts
- **Monthly Reports**: Automated performance reports
- **Transaction Management**: Clear and sync transactions
- **Analytics Dashboard**: Detailed transaction analysis

### Tech Stack

**Frontend:**
- Next.js 15.5.3 (React 19.1.0)
- TypeScript 5
- Tailwind CSS 4
- Radix UI components
- Recharts for data visualization
- Framer Motion for animations

**Backend:**
- Next.js API Routes
- MongoDB with Mongoose
- JWT authentication
- Nodemailer for emails
- Node-cron for scheduling

**Blockchain:**
- Stacks Connect SDK
- Hiro Stacks API
- Support for Leather & Xverse wallets

### Quick Start

```bash
cd check_wallet_balance

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

### Environment Variables

```bash
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-32-char-key
EMAIL_FROM=your-email@gmail.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=app-specific-password
NEXT_PUBLIC_STACKS_NETWORK=mainnet
```

### Key Features

#### Public Wallet Explorer (`/wallet-checker`)
- Enter any Stacks address to view balance and transactions
- No authentication required
- Real-time data from Hiro API

#### Authenticated Dashboard (`/dashboard`)
- Add and manage multiple wallets
- View portfolio balance and trends
- Track transaction history
- Clear or sync transactions
- Analytics and reporting

### API Routes

```bash
# Public endpoints
GET  /api/public/wallet/[address]
GET  /api/public/wallet/[address]/full

# Authentication
POST /api/auth/register
POST /api/auth/login
POST /api/auth/register/wallet
POST /api/auth/login/wallet

# Wallet management
GET  /api/wallets
POST /api/wallets
PUT  /api/wallets/[id]
DELETE /api/wallets/[id]

# Transactions
GET  /api/transactions
POST /api/transactions (sync)
POST /api/transactions/clear
POST /api/transactions/cleanup
```

### Database Models

- **User**: Authentication and preferences
- **Wallet**: Monitored wallet addresses (encrypted)
- **BalanceHistory**: Historical balance records
- **Transaction**: Transaction records with metadata

### Security Features

- Wallet addresses encrypted (AES-256)
- Password hashing (bcrypt)
- JWT token authentication
- Ownership verification for all operations
- HTTPS in production
- Input validation with Zod

---

## 3. Stacks AMM

**Directory:** `/stacks-amm`

An Automated Market Maker (AMM) decentralized exchange protocol implementing constant product formula (x * y = k) for token swaps on the Stacks blockchain.

### Features

- **Liquidity Pools**: Create pools for token pairs with custom fees
- **Token Swaps**: Execute token swaps using AMM algorithm
- **Liquidity Provision**: Add/remove liquidity and earn fees
- **Fee Management**: Configurable trading fees per pool
- **Pool Analytics**: Track reserves, liquidity, and trading volume

### Smart Contracts

- `amm.clar` - Main AMM logic with pool management
- `mock-token.clar` - SIP-010 compliant test tokens

### AMM Mechanics

**Constant Product Formula:**
```
x * y = k

where:
- x = Reserve of token 0
- y = Reserve of token 1
- k = Constant product
```

**Key Concepts:**
- **Liquidity Providers**: Supply tokens and earn fees
- **Automated Pricing**: Prices determined by reserve ratios
- **Slippage**: Price impact based on trade size
- **LP Tokens**: Represent share of pool ownership

### Tech Stack

**Smart Contracts:**
- Clarity language
- SIP-010 fungible token standard
- Clarinet framework
- Vitest testing

**Frontend:**
- React/Next.js
- Stacks.js for blockchain interaction
- Web3 wallet integration

### Quick Start

```bash
cd stacks-amm/contract

# Test contracts
npm test

# Deploy to testnet
clarinet deployments apply --testnet
```

### Key Functions

```clarity
;; Create liquidity pool
(contract-call? .amm create-pool token-0 token-1 u300) ;; 3% fee

;; Add liquidity
(contract-call? .amm add-liquidity
  token-0 token-1
  u1000000  ;; Amount token 0
  u1000000  ;; Amount token 1
  u300      ;; Fee tier
)

;; Swap tokens
(contract-call? .amm swap-exact-tokens-for-tokens
  token-0 token-1
  u100000   ;; Amount in
  u95000    ;; Min amount out
  u300      ;; Fee
)

;; Remove liquidity
(contract-call? .amm remove-liquidity
  token-0 token-1
  u50000    ;; LP tokens to burn
  u300      ;; Fee tier
)
```

### Pool Creation Fee

- **Fee**: 1 STX to create a pool
- **Minimum Liquidity**: 1000 units must remain in pool
- **Purpose**: Prevent spam pool creation

### Error Codes

- `ERR_POOL_ALREADY_EXISTS (u200)` - Pool exists
- `ERR_INCORRECT_TOKEN_ORDERING (u201)` - Invalid token order
- `ERR_INSUFFICIENT_LIQUIDITY_MINTED (u202)` - Too little liquidity
- `ERR_INSUFFICIENT_INPUT_AMOUNT (u205)` - Insufficient swap input
- `ERR_INSUFFICIENT_LIQUIDITY_FOR_SWAP (u206)` - Pool liquidity too low

---

## 4. Token Streaming

**Directory:** `/stacks-token-streaming`

A Clarity smart contract for creating time-based token streams, enabling continuous payments that release tokens over time on the Stacks blockchain.

### Features

- **Create Streams**: Set up streams with custom timeframes and rates
- **Automatic Release**: Recipients withdraw earned tokens based on elapsed blocks
- **Stream Management**: Refuel streams or withdraw excess funds
- **Signature Updates**: Modify parameters with cryptographic consent
- **Secure Withdrawals**: Only authorized parties can withdraw

### Smart Contract

`stream.clar` - Token streaming implementation

### Stream Mechanics

**Time-Based Release:**
- Tokens released linearly based on block height
- Payment rate: STX per block
- Configurable start and stop blocks
- Partial withdrawals allowed anytime

**Stream States:**
```
1. Created - Stream exists but not started
2. Active - Currently releasing tokens
3. Ended - All tokens released or refunded
```

### Tech Stack

- Clarity smart contracts
- Stacks blockchain
- Clarinet development framework
- TypeScript testing with Vitest

### Quick Start

```bash
cd stacks-token-streaming

# Install dependencies
npm install

# Run tests
npm test

# Watch mode
npm run test:watch
```

### Key Functions

```clarity
;; Create stream (100 STX over 50 blocks = 2 STX per block)
(contract-call? .stream stream-to
  recipient-principal
  u100000000        ;; 100 STX (in microSTX)
  {
    start-block: u10,
    stop-block: u60
  }
  u2000000          ;; 2 STX per block
)

;; Recipient withdraws earned tokens
(contract-call? .stream withdraw u0)  ;; Stream ID 0

;; Refuel stream with more tokens
(contract-call? .stream refuel u0 u50000000)  ;; Add 50 STX

;; Sender reclaims excess after stream ends
(contract-call? .stream refund u0)

;; Update stream parameters (requires signatures)
(contract-call? .stream update-details
  u0                ;; Stream ID
  u3000000          ;; New payment per block
  {
    start-block: u5,
    stop-block: u55
  }
  signer-principal
  signature-buffer
)
```

### Use Cases

- **Salary Payments**: Stream employee salaries continuously
- **Subscriptions**: Pay for services over time
- **Vesting**: Token vesting schedules
- **Grants**: Continuous funding for projects
- **Rent/Leases**: Time-based payment streams

### Security Features

- **Authorization**: Only stream parties can perform operations
- **Signature Verification**: Updates require cryptographic consent
- **Balance Protection**: Prevents unauthorized access
- **State Validation**: Ensures operations respect lifecycle

### Error Codes

- `ERR_UNAUTHORIZED (u0)` - Not authorized
- `ERR_INVALID_SIGNATURE (u1)` - Signature verification failed
- `ERR_STREAM_STILL_ACTIVE (u2)` - Stream not ended yet
- `ERR_INVALID_STREAM_ID (u3)` - Stream doesn't exist

---

## 🛠️ Development Tools

### Common Dependencies

All projects use:
- **Clarinet**: Stacks smart contract development framework
- **TypeScript**: Type-safe development
- **Vitest**: Fast testing framework
- **Node.js**: JavaScript runtime

### Installation

```bash
# Install Clarinet
curl -L https://github.com/hirosystems/clarinet/releases/latest/download/clarinet-macos-x64.tar.gz | tar xz
sudo mv clarinet /usr/local/bin

# Verify installation
clarinet --version

# Install Node.js dependencies (in each project)
npm install
```

### Testing

Each project includes comprehensive test suites:

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage and cost analysis
npm run test:report
```

### Deployment

Deploy to Stacks testnet or mainnet:

```bash
# Configure deployment in settings/*.toml
# Add mnemonic to Testnet.toml or Mainnet.toml

# Deploy to testnet
clarinet deployments apply --testnet

# Deploy to mainnet (use with caution!)
clarinet deployments apply --mainnet
```

---

## 📖 Documentation

### Per-Project Documentation

- **TicTacToe**: `QUICK_START.md`, `FIXES_SUMMARY.md`, `docs/`
- **Wallet Checker**: `README.md` (comprehensive guide)
- **Stacks AMM**: See contract comments
- **Token Streaming**: `README.md`

### External Resources

- [Stacks Documentation](https://docs.stacks.co/)
- [Clarity Language Reference](https://docs.stacks.co/clarity/)
- [Clarinet Documentation](https://docs.hiro.so/clarinet/)
- [Stacks.js Documentation](https://stacks.js.org/)

---

## 🎯 Project Highlights

### Smart Contract Development
- ✅ Multiple Clarity contracts with complex interactions
- ✅ SIP-010 token standard implementation
- ✅ Signature verification and cryptographic proofs
- ✅ Access control and authorization patterns
- ✅ State management and data structures

### Full-Stack Web3
- ✅ Next.js applications with blockchain integration
- ✅ Wallet connection (Leather, Xverse)
- ✅ Real-time blockchain data fetching
- ✅ Transaction signing and submission
- ✅ Event listening and state updates

### Backend & Database
- ✅ MongoDB integration
- ✅ JWT authentication
- ✅ Scheduled tasks with node-cron
- ✅ Email notifications
- ✅ Data encryption

### Testing & Security
- ✅ Comprehensive test coverage
- ✅ Security audits and best practices
- ✅ Input validation
- ✅ Authorization checks
- ✅ Error handling

---

## 🚀 Getting Started

### Prerequisites

```bash
# Required software
- Node.js 18+
- Clarinet 2.0+
- MongoDB (for wallet checker)
- Git
```

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LearnWeb3-stacks
   ```

2. **Choose a project**
   ```bash
   # For TicTacToe
   cd TicTacToe

   # For Wallet Checker
   cd check_wallet_balance

   # For AMM
   cd stacks-amm

   # For Token Streaming
   cd stacks-token-streaming
   ```

3. **Install and test**
   ```bash
   npm install
   npm test
   ```

4. **Deploy (optional)**
   ```bash
   clarinet deployments apply --testnet
   ```

---

## 📊 Project Comparison

| Feature | TicTacToe | Wallet Checker | AMM | Token Streaming |
|---------|-----------|----------------|-----|-----------------|
| **Type** | Gaming Platform | Web App | DeFi Protocol | Payment System |
| **Contracts** | 5 | 0 | 2 | 1 |
| **Frontend** | Next.js | Next.js | Next.js | None |
| **Database** | None | MongoDB | None | None |
| **Complexity** | High | High | Medium | Low |
| **Auth** | Wallet | Dual | Wallet | None |
| **Best For** | Learning game logic | Full-stack Web3 | DeFi mechanics | Payment streams |

---

## 🔐 Security Considerations

### Smart Contracts
- All contracts use authorization checks
- Input validation on all public functions
- Protection against common vulnerabilities
- Test coverage for security scenarios

### Web Applications
- JWT token authentication
- Data encryption (AES-256)
- Password hashing (bcrypt)
- HTTPS in production
- CORS configuration
- Input sanitization

---

## 📝 License

Each project may have its own license. See individual project directories for details.

---

## 🤝 Contributing

This is a learning portfolio repository. For contributions:
1. Fork the repository
2. Create a feature branch
3. Test thoroughly
4. Submit a pull request

---

## 📞 Support

For questions or issues:
- Review project-specific documentation
- Check Clarity language docs
- Test on simnet/testnet before mainnet
- Run comprehensive tests

---

## 🎓 Learning Path

**Recommended Order:**

1. **Token Streaming** (Simplest) - Learn basic Clarity syntax and patterns
2. **Stacks AMM** (Medium) - Understand DeFi mechanics and math
3. **Wallet Checker** (Full-stack) - Build complete Web3 application
4. **TicTacToe** (Advanced) - Master complex contract interactions

---

## 🏆 Achievements

This portfolio demonstrates:
- ✅ Clarity smart contract development
- ✅ Full-stack Web3 application development
- ✅ DeFi protocol implementation
- ✅ Complex state management
- ✅ Testing and security best practices
- ✅ Real-world deployment experience

---

**Built with Clarity on Stacks blockchain** 🚀

*Part of the LearnWeb3 curriculum for Stacks blockchain development*
