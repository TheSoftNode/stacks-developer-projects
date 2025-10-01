# TicTacToe Platform Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the TicTacToe gaming platform contracts to Stacks blockchain.

## Architecture Summary

The platform consists of 8 smart contracts:

1. **traits.clar** - Interface definitions (no dependencies)
2. **platform-manager.clar** - Core authorization and configuration
3. **player-registry.clar** - Player statistics and ELO ratings
4. **tic-tac-toe.clar** - Main game engine
5. **staking-system.clar** - Player staking and rewards
6. **game-variants.clar** - Alternative board sizes (4x4, 5x5)
7. **game-series.clar** - Best-of-N game series
8. **tournament-manager.clar** - Multi-player tournaments

## Circular Dependency Resolution

### Problem
- `platform-manager` needed to call `staking-system.add-to-reward-pool`
- `staking-system` needed to call `platform-manager.is-authorized-contract`
- This created a circular dependency preventing compilation

### Solution
1. **Direct STX Transfer**: Instead of calling `add-to-reward-pool`, `platform-manager` sends STX directly to `staking-system` contract
2. **Receive Function**: `staking-system.receive-platform-fees` detects and accounts for received STX
3. **No circular calls**: Contracts can now compile independently

## Deployment Order

**Critical**: Contracts must be deployed in this exact order:

```
1. traits.clar
2. platform-manager.clar
3. player-registry.clar
4. tic-tac-toe.clar
5. staking-system.clar
6. game-variants.clar
7. game-series.clar
8. tournament-manager.clar
```

This order is enforced in `Clarinet.toml` via the `depends_on` configuration.

## Pre-Deployment Checklist

- [ ] Clarinet CLI installed (v2.11.2+)
- [ ] Node.js installed (v18+)
- [ ] Wallet with sufficient STX for deployment
- [ ] Testnet/Mainnet configuration in `settings/`
- [ ] Seed phrase added to appropriate `.toml` file
- [ ] All contracts pass `clarinet check`

## Deployment Steps

### Local Testing (Simnet)

```bash
# Check all contracts
clarinet check

# Run tests
npm test

# Start console for manual testing
clarinet console
```

### Testnet Deployment

1. **Configure Wallet**
   ```bash
   # Edit settings/Testnet.toml
   # Add your mnemonic under [accounts.deployer]
   ```

2. **Deploy Contracts**
   ```bash
   clarinet deployments apply --testnet
   ```

3. **Verify Deployment**
   - Check each contract on [Stacks Explorer](https://explorer.hiro.so/?chain=testnet)
   - Note down deployed contract addresses

4. **Post-Deployment Setup**
   ```bash
   npm run setup:testnet
   ```

### Mainnet Deployment

1. **Final Security Review**
   - Review all contract code
   - Verify test coverage
   - Run security audit if possible

2. **Configure Mainnet Wallet**
   ```bash
   # Edit settings/Mainnet.toml
   # Add your mainnet mnemonic (use secure wallet!)
   ```

3. **Deploy to Mainnet**
   ```bash
   clarinet deployments apply --mainnet
   ```

4. **Post-Deployment Setup**
   ```bash
   npm run setup:mainnet
   ```

## Post-Deployment Configuration

### 1. Authorize Contracts

Run these transactions as the contract owner:

```clarity
;; Authorize game contracts to call platform-manager functions
(contract-call? .platform-manager authorize-contract .tic-tac-toe)
(contract-call? .platform-manager authorize-contract .tournament-manager)
(contract-call? .platform-manager authorize-contract .game-series)
(contract-call? .platform-manager authorize-contract .staking-system)
(contract-call? .platform-manager authorize-contract .game-variants)
```

### 2. Configure Platform Settings (Optional)

```clarity
;; Set custom minimum bet (default: 1 STX = 1,000,000 micro-STX)
(contract-call? .platform-manager set-min-bet u1000000)

;; Set platform fee rate (default: 2.5% = 250 basis points)
(contract-call? .platform-manager set-platform-fee u250)

;; Set move timeout (default: 144 blocks ≈ 24 hours)
(contract-call? .platform-manager set-move-timeout u144)
```

### 3. Distribute Initial Rewards (Optional)

```clarity
;; Transfer funds from platform treasury to staking rewards
(contract-call? .platform-manager distribute-to-staking u10000000) ;; 10 STX

;; Update reward pool accounting in staking system
(contract-call? .staking-system receive-platform-fees)
```

## Contract Interactions

### Platform Manager → Staking System

```clarity
;; Admin distributes fees to staking rewards
(contract-call? .platform-manager distribute-to-staking amount)
  ↓ (STX transfer)
(contract-call? .staking-system receive-platform-fees)
  ↓ (updates reward pool)
```

### Tournament Flow

```clarity
;; 1. Create tournament
(contract-call? .tournament-manager create-tournament type max-players entry-fee)

;; 2. Players join
(contract-call? .tournament-manager join-tournament tournament-id)

;; 3. Start tournament
(contract-call? .tournament-manager start-tournament tournament-id)

;; 4. Generate brackets
(contract-call? .tournament-manager generate-first-round-brackets tournament-id players)

;; 5. Games are played via tic-tac-toe.create-tournament-game

;; 6. Record results
(contract-call? .tournament-manager record-match-result tournament-id round position winner game-id)
```

## Monitoring & Maintenance

### Health Checks

```clarity
;; Check if platform is operational
(contract-call? .platform-manager is-paused) ;; Should return false

;; Check treasury balance
(contract-call? .platform-manager get-platform-treasury)

;; Check staking pool
(contract-call? .staking-system get-staking-stats)

;; Check latest game ID
(contract-call? .tic-tac-toe get-latest-game-id)
```

### Emergency Controls

```clarity
;; Pause platform (emergency only!)
(contract-call? .platform-manager emergency-pause)

;; Resume operations
(contract-call? .platform-manager emergency-unpause)
```

## Common Issues & Troubleshooting

### Issue: Contracts won't compile
**Solution**: Ensure deployment order is correct in `Clarinet.toml`

### Issue: Circular dependency errors
**Solution**: This has been fixed. Ensure you're using the latest contract code.

### Issue: Authorization failures
**Solution**: Run post-deployment setup to authorize all contracts

### Issue: Game variants don't end
**Solution**: Ensure you deployed the fixed `game-variants.clar` with complete win detection

### Issue: Tournament brackets empty
**Solution**: Call `generate-first-round-brackets` with player list after starting tournament

### Issue: Staking rewards not updating
**Solution**: Admin must call `distribute-to-staking` then `receive-platform-fees`

## Testing Checklist

After deployment, test these core functions:

- [ ] Create and join a basic 3x3 game
- [ ] Complete a game with winner
- [ ] Test game abandonment/timeout
- [ ] Create and play 4x4 variant game
- [ ] Create and play 5x5 variant game
- [ ] Create and join a game series
- [ ] Create and run a small tournament (4 players)
- [ ] Stake STX tokens
- [ ] Claim staking rewards
- [ ] Check player statistics
- [ ] Verify ELO rating updates
- [ ] Test platform pause functionality
- [ ] Verify fee collection
- [ ] Test reward distribution

## Security Considerations

1. **Admin Keys**: Keep deployer private keys secure
2. **Authorization**: Only authorize trusted contracts
3. **Configuration**: Set reasonable limits for bets and fees
4. **Emergency Controls**: Test pause functionality before mainnet
5. **Monitoring**: Watch for unusual activity or exploits
6. **Upgrades**: Plan for potential contract upgrades
7. **Audits**: Consider professional security audit before mainnet

## Support & Resources

- [Clarity Documentation](https://docs.stacks.co/clarity)
- [Clarinet Documentation](https://docs.hiro.so/clarinet)
- [Stacks Explorer](https://explorer.hiro.so)
- [LearnWeb3 Course](https://learnweb3.io)

## License

MIT License - see LICENSE file for details

---

**Last Updated**: 2025-01-XX
**Version**: 1.0.0
**Status**: Production Ready
