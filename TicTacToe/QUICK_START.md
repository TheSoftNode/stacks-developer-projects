# TicTacToe Platform - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
```bash
# Check installations
clarinet --version  # Should be v2.11.2+
node --version      # Should be v18+
```

### 1. Test Locally
```bash
cd TicTacToe/contract

# Check all contracts compile
clarinet check

# Run tests (if available)
npm test

# Interactive console
clarinet console
```

### 2. Deploy to Testnet

```bash
# 1. Add your seed phrase to settings/Testnet.toml
# [accounts.deployer]
# mnemonic = "your twelve word seed phrase here..."

# 2. Get testnet STX from faucet
# https://explorer.hiro.so/sandbox/faucet?chain=testnet

# 3. Deploy
clarinet deployments apply --testnet

# 4. Note your contract addresses
# They will be in format: ST1234...ABCD.contract-name
```

### 3. Post-Deployment Setup

```bash
# Run setup script
npm run setup:testnet

# Or manually authorize contracts using Clarinet console:
```

```clarity
;; Connect to testnet
(contract-call? .platform-manager authorize-contract .tic-tac-toe)
(contract-call? .platform-manager authorize-contract .tournament-manager)
(contract-call? .platform-manager authorize-contract .game-series)
(contract-call? .platform-manager authorize-contract .staking-system)
(contract-call? .platform-manager authorize-contract .game-variants)
```

### 4. Test a Game

```clarity
;; Create a game (1 STX bet, place X at position 0)
(contract-call? .tic-tac-toe create-game u1000000 u0 u1)
;; Returns: (ok u0) - game ID is 0

;; Join the game as player 2 (place O at position 1)
(contract-call? .tic-tac-toe join-game u0 u1 u2)

;; Continue playing...
(contract-call? .tic-tac-toe play u0 u3 u1)  ;; Player 1: X at pos 3
(contract-call? .tic-tac-toe play u0 u4 u2)  ;; Player 2: O at pos 4
(contract-call? .tic-tac-toe play u0 u6 u1)  ;; Player 1: X at pos 6 - WINS!
```

## 📋 Common Commands

### Check Platform Status
```clarity
(contract-call? .platform-manager is-paused)
(contract-call? .platform-manager get-platform-treasury)
(contract-call? .tic-tac-toe get-latest-game-id)
```

### View Game Details
```clarity
(contract-call? .tic-tac-toe get-game u0)  ;; Get game 0
```

### Check Player Stats
```clarity
(contract-call? .player-registry get-player-stats tx-sender)
```

### Stake Tokens
```clarity
;; Stake 10 STX
(contract-call? .staking-system stake u10000000)

;; Claim rewards
(contract-call? .staking-system claim-rewards)

;; Unstake
(contract-call? .staking-system unstake u5000000)  ;; Unstake 5 STX
```

## 🎮 Game Board Layout

```
Position indices for 3x3 board:

 0 | 1 | 2
-----------
 3 | 4 | 5
-----------
 6 | 7 | 8

Moves:
- u1 = X (Player One)
- u2 = O (Player Two)
- u0 = Empty
```

## 🏆 Create a Tournament

```clarity
;; Create 8-player single-elimination tournament (10 STX entry)
(contract-call? .tournament-manager
  create-tournament
  u1        ;; Type: Single elimination
  u8        ;; Max players
  u10000000 ;; Entry fee: 10 STX
)

;; Join tournament
(contract-call? .tournament-manager join-tournament u0)  ;; Tournament ID 0

;; Start tournament (when full)
(contract-call? .tournament-manager start-tournament u0)

;; Generate brackets
(contract-call? .tournament-manager
  generate-first-round-brackets
  u0
  (list 'ST1... 'ST2... 'ST3... 'ST4... 'ST5... 'ST6... 'ST7... 'ST8...)
)
```

## 🔧 Admin Functions

### Emergency Controls
```clarity
;; Pause platform
(contract-call? .platform-manager emergency-pause)

;; Unpause
(contract-call? .platform-manager emergency-unpause)
```

### Configure Settings
```clarity
;; Set minimum bet to 0.5 STX
(contract-call? .platform-manager set-min-bet u500000)

;; Set platform fee to 3%
(contract-call? .platform-manager set-platform-fee u300)

;; Set move timeout to 12 hours (72 blocks)
(contract-call? .platform-manager set-move-timeout u72)
```

### Distribute Rewards
```clarity
;; Send 100 STX from treasury to staking rewards
(contract-call? .platform-manager distribute-to-staking u100000000)

;; Update staking pool accounting
(contract-call? .staking-system receive-platform-fees)
```

## 📊 Query Functions

```clarity
;; Platform stats
(contract-call? .platform-manager get-platform-treasury)
(contract-call? .platform-manager get-platform-fee-rate)
(contract-call? .platform-manager get-min-bet-amount)

;; Game stats
(contract-call? .tic-tac-toe get-latest-game-id)
(contract-call? .tic-tac-toe get-game u0)

;; Player stats
(contract-call? .player-registry get-player-stats 'ST1...)
(contract-call? .player-registry get-player-elo 'ST1...)

;; Staking stats
(contract-call? .staking-system get-player-stake 'ST1...)
(contract-call? .staking-system calculate-rewards 'ST1...)
(contract-call? .staking-system get-staking-stats)

;; Tournament stats
(contract-call? .tournament-manager get-tournament u0)
(contract-call? .tournament-manager get-bracket u0 u1 u0)  ;; Tournament 0, Round 1, Position 0
```

## 🐛 Troubleshooting

### Contract won't deploy
- Check deployment order in Clarinet.toml
- Ensure previous contracts deployed successfully
- Verify sufficient STX balance

### Function calls fail with "unauthorized"
- Run post-deployment setup
- Authorize contracts in platform-manager

### Games don't end
- Ensure using fixed game-variants.clar with complete win detection
- Check game state with get-game function

### Staking rewards not updating
- Admin must call distribute-to-staking first
- Then call receive-platform-fees to update accounting

## 📚 Additional Resources

- **Full Documentation**: [DEPLOYMENT_GUIDE.md](./contract/DEPLOYMENT_GUIDE.md)
- **Architecture**: [docs/ARCHITECTURE.md](./TicTacToe/docs/ARCHITECTURE.md)
- **Fixes Summary**: [FIXES_SUMMARY.md](./FIXES_SUMMARY.md)

## 🎯 Next Steps

1. ✅ Deploy contracts
2. ✅ Authorize contracts
3. ✅ Test basic gameplay
4. ⬜ Build frontend application
5. ⬜ Set up event indexing
6. ⬜ Launch on mainnet

---

**Need Help?**
- Review the full [DEPLOYMENT_GUIDE.md](./contract/DEPLOYMENT_GUIDE.md)
- Check contract comments for detailed function documentation
- Test on simnet/testnet before mainnet deployment

**Ready for Production?**
- Complete all tests
- Run security audit
- Verify all documentation
- Set up monitoring

---

Good luck! 🚀
