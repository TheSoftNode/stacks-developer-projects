# Stacks AMM - Professional DeFi Frontend

A production-ready, professional decentralized exchange (DEX) built on the Stacks blockchain. This application features a complete AMM (Automated Market Maker) with advanced UI/UX, comprehensive analytics, and full liquidity management capabilities.

## 🌟 Features

### Core Functionality

- **Token Swapping**: Instant token swaps with real-time price quotes and slippage protection
- **Liquidity Provision**: Add and remove liquidity from pools to earn trading fees
- **Pool Management**: Create new liquidity pools for any SIP-010 token pair
- **Portfolio Tracking**: Monitor your positions, earnings, and transaction history
- **Analytics Dashboard**: Comprehensive market statistics, TVL charts, and volume data

### UI/UX Features

- ✨ **Dark/Light Mode**: Fully themed with next-themes and persistent preferences
- 📱 **Responsive Design**: Mobile-first design that works on all devices
- 🎯 **Collapsible Sidebar**: Professional dashboard layout with navigation
- 🔔 **Real-time Notifications**: Toast notifications for all transactions using Sonner
- ⚡ **Loading States**: Smooth loading states and feedback
- 🎬 **Animated Components**: Framer Motion animations for enhanced user experience
- 📊 **Professional Charts**: Recharts integration for data visualization

## 📁 Project Structure

## 📁 Project Structure

```
frontend/
├── app/
│   ├── page.tsx              # Landing page (public)
│   ├── layout.tsx            # Root layout with ThemeProvider
│   └── dashboard/            # Protected dashboard area
│       ├── layout.tsx        # Dashboard layout with sidebar
│       ├── page.tsx          # Dashboard home (overview)
│       ├── swap/             # Token swapping
│       │   └── page.tsx
│       ├── pools/            # Browse and create pools
│       │   └── page.tsx
│       ├── liquidity/        # Add/remove liquidity
│       │   └── page.tsx
│       ├── analytics/        # Market analytics and charts
│       │   └── page.tsx
│       ├── portfolio/        # User portfolio tracking
│       │   └── page.tsx
│       └── history/          # Transaction history
│           └── page.tsx
├── components/
│   ├── layout/              # Layout components
│   │   ├── navbar.tsx       # Top navigation
│   │   ├── sidebar.tsx      # Collapsible sidebar
│   │   ├── footer.tsx       # Footer
│   │   └── dashboard-layout.tsx
│   ├── features/            # Feature-specific components
│   │   ├── swap/
│   │   │   └── swap-form.tsx
│   │   ├── pools/
│   │   │   ├── create-pool-form.tsx
│   │   │   └── pools-filter.tsx
│   │   ├── liquidity/
│   │   │   ├── add-liquidity-form.tsx
│   │   │   └── remove-liquidity-form.tsx
│   │   └── analytics/
│   │       └── analytics-charts.tsx
│   ├── shared/              # Reusable components
│   │   ├── cards/
│   │   │   ├── stat-card.tsx
│   │   │   ├── pool-card.tsx
│   │   │   └── transaction-card.tsx
│   │   └── theme-toggle.tsx
│   ├── landing/             # Landing page components
│   │   ├── hero-section.tsx
│   │   ├── features-section.tsx
│   │   └── cta-section.tsx
│   ├── providers/
│   │   └── theme-provider.tsx
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── amm.ts              # AMM contract interactions
│   ├── stx-utils.ts        # Stacks utility functions
│   └── utils.ts            # General utilities
├── hooks/
│   └── use-stacks.ts       # Stacks wallet hook
└── public/                 # Static assets
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Stacks wallet (Hiro Wallet recommended)

### Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure the contract address**

   Edit `lib/amm.ts` and update the contract address:

   ```typescript
   const AMM_CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS";
   const AMM_CONTRACT_NAME = "amm";
   ```

3. **Run the development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## 🎨 Theming

The application supports both light and dark modes:

- **Manual Toggle**: Click the sun/moon icon in the navigation bar
- **System Default**: Automatically matches your system theme on first load
- **Persistent**: Your preference is saved across sessions

## 📦 Key Dependencies

- **Next.js 15**: React framework with App Router
- **React 19**: Latest React with concurrent features
- **TypeScript**: Type-safe development
- **Tailwind CSS 4**: Utility-first styling
- **shadcn/ui**: High-quality UI components
- **@stacks/connect**: Wallet connection and transactions
- **next-themes**: Dark/light mode support
- **framer-motion**: Smooth animations
- **recharts**: Data visualization
- **sonner**: Toast notifications
- **lucide-react**: Beautiful icons

## 🎯 Features

### 🏠 Landing Page (`/`)

- **Modern Hero Section**: Eye-catching introduction with gradient animations
- **Feature Showcase**: Highlighting key platform capabilities
- **Call-to-Action**: Easy wallet connection and onboarding
- **Responsive Design**: Fully mobile-friendly

### 📊 Dashboard (Protected Area)

All features below require wallet connection and are accessible through the collapsible sidebar:

#### Dashboard Home (`/dashboard`)

- Overview of user stats and quick actions
- Portfolio value and active positions
- Quick access cards to all features
- Top pools sidebar with live data

#### Token Swap (`/dashboard/swap`)

- Real-time swap quotes with price impact calculation
- Adjustable slippage tolerance settings
- Token selection with search functionality
- Informational cards about how swaps work

#### Pools (`/dashboard/pools`)

- Browse all available liquidity pools with search
- Create new token pairs with custom fees
- Pool statistics (TVL, APY, volume, fees)
- Responsive grid layout for pool cards

#### Liquidity Management (`/dashboard/liquidity`)

- Add liquidity to existing pools
- Remove liquidity with percentage slider
- View pool share and estimated returns
- LP token management and tracking

#### Analytics (`/dashboard/analytics`)

- Market statistics and key metrics
- Pool performance charts (coming soon)
- Volume and TVL tracking
- Comprehensive pools table with sorting

#### Portfolio (`/dashboard/portfolio`)

- Track all active liquidity positions
- Portfolio value calculation and PnL
- Fees earned tracking (coming soon)
- Performance overview charts (coming soon)

#### Transaction History (`/dashboard/history`)

- Complete transaction history
- Filter by transaction type (swap, add, remove, create)
- Search by pool or transaction ID
- Export to CSV functionality
- View on block explorer links

## 🔐 Security

- **Non-Custodial**: Your wallet, your keys
- **Transaction Confirmation**: All transactions require user approval
- **Open Source**: Transparent and auditable code

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## 📄 License

MIT License

---

**Built with ❤️ for the Stacks community**
