;; title: staking-system
;; version: 1.0.0
;; summary: Player staking mechanism with reward distribution system
;; description: Allows players to stake STX tokens to earn rewards from platform fees and game activities

;; constants
(define-constant ERR_UNAUTHORIZED u401)
(define-constant ERR_INSUFFICIENT_STAKE u402)
(define-constant ERR_INSUFFICIENT_BALANCE u403)
(define-constant ERR_NO_STAKES u404)
(define-constant ERR_ALREADY_STAKED u405)
(define-constant ERR_COOLDOWN_PERIOD u406)
(define-constant ERR_INVALID_AMOUNT u407)

;; Staking configuration constants
(define-constant MIN_STAKE_AMOUNT u10000000) ;; 10 STX minimum
(define-constant UNSTAKE_COOLDOWN_BLOCKS u1008) ;; 7 days cooldown
(define-constant REWARD_RATE_BASIS_POINTS u500) ;; 5% annual reward rate
(define-constant BLOCKS_PER_YEAR u52560) ;; Approximate blocks per year

;; data vars
(define-data-var total-staked uint u0)
(define-data-var reward-pool uint u0)
(define-data-var last-reward-distribution uint u0)

;; data maps
(define-map player-stakes
    principal
    {
        staked-amount: uint,
        stake-timestamp: uint,
        last-claim: uint,
        unstake-requested-at: (optional uint),
        reward-multiplier: uint ;; basis points multiplier for VIP stakers
    }
)

;; Track total rewards distributed for analytics
(define-map reward-history
    uint ;; block height
    {
        total-distributed: uint,
        recipients-count: uint,
        average-reward: uint
    }
)

;; Staking tiers with different multipliers
(define-map staking-tiers
    uint ;; tier-id
    {
        min-amount: uint,
        multiplier: uint, ;; basis points (10000 = 1x)
        tier-name: (string-ascii 20)
    }
)

;; Stake STX tokens
;; #[allow(unchecked_data)]
(define-public (stake-tokens (amount uint))
    (let (
        (current-stake (map-get? player-stakes contract-caller))
        (new-total-staked (+ (var-get total-staked) amount))
        (tier-multiplier (get-staking-tier-multiplier amount))
    )
    ;; Check if platform is paused
    (asserts! (not (contract-call? .platform-manager is-paused)) (err ERR_UNAUTHORIZED))
    ;; Validate minimum stake amount
    (asserts! (>= amount MIN_STAKE_AMOUNT) (err ERR_INVALID_AMOUNT))
    ;; Ensure player doesn't already have a stake (simplification)
    (asserts! (is-none current-stake) (err ERR_ALREADY_STAKED))
    
    ;; Transfer STX from player to contract
    (try! (stx-transfer? amount contract-caller (as-contract tx-sender)))
    
    ;; Create stake record
    (map-set player-stakes contract-caller {
        staked-amount: amount,
        stake-timestamp: stacks-block-height,
        last-claim: stacks-block-height,
        unstake-requested-at: none,
        reward-multiplier: tier-multiplier
    })
    
    ;; Update total staked
    (var-set total-staked new-total-staked)
    
    ;; Register player in player registry if not exists
    (try! (contract-call? .player-registry register-player))
    
    ;; Log staking action
    (print { action: "stake-tokens", player: contract-caller, amount: amount, tier-multiplier: tier-multiplier })
    (ok amount)
    )
)

;; Add more tokens to existing stake
;; #[allow(unchecked_data)]
(define-public (add-to-stake (amount uint))
    (let (
        (current-stake (unwrap! (map-get? player-stakes contract-caller) (err ERR_NO_STAKES)))
        (new-staked-amount (+ (get staked-amount current-stake) amount))
        (new-total-staked (+ (var-get total-staked) amount))
        (new-tier-multiplier (get-staking-tier-multiplier new-staked-amount))
    )
    ;; Check if platform is paused
    (asserts! (not (contract-call? .platform-manager is-paused)) (err ERR_UNAUTHORIZED))
    ;; Validate amount
    (asserts! (> amount u0) (err ERR_INVALID_AMOUNT))
    ;; Ensure no unstake request pending
    (asserts! (is-none (get unstake-requested-at current-stake)) (err ERR_COOLDOWN_PERIOD))
    
    ;; Transfer additional STX
    (try! (stx-transfer? amount contract-caller (as-contract tx-sender)))
    
    ;; Update stake record
    (map-set player-stakes contract-caller (merge current-stake {
        staked-amount: new-staked-amount,
        reward-multiplier: new-tier-multiplier
    }))
    
    ;; Update total staked
    (var-set total-staked new-total-staked)
    
    ;; Log action
    (print { action: "add-to-stake", player: contract-caller, amount: amount, new-total: new-staked-amount })
    (ok new-staked-amount)
    )
)

;; Request unstaking (starts cooldown period)
(define-public (request-unstake)
    (let (
        (current-stake (unwrap! (map-get? player-stakes contract-caller) (err ERR_NO_STAKES)))
    )
    ;; Ensure no unstake request is already pending
    (asserts! (is-none (get unstake-requested-at current-stake)) (err ERR_COOLDOWN_PERIOD))
    
    ;; Claim any pending rewards before unstaking
    (try! (claim-staking-rewards))
    
    ;; Mark unstake request
    (map-set player-stakes contract-caller (merge current-stake {
        unstake-requested-at: (some stacks-block-height)
    }))
    
    ;; Log action
    (print { action: "request-unstake", player: contract-caller, cooldown-blocks: UNSTAKE_COOLDOWN_BLOCKS })
    (ok stacks-block-height)
    )
)

;; Complete unstaking after cooldown period
(define-public (complete-unstake)
    (let (
        (current-stake (unwrap! (map-get? player-stakes contract-caller) (err ERR_NO_STAKES)))
        (unstake-requested (unwrap! (get unstake-requested-at current-stake) (err ERR_NO_STAKES)))
        (staked-amount (get staked-amount current-stake))
        (new-total-staked (- (var-get total-staked) staked-amount))
    )
    ;; Check cooldown period has passed
    (asserts! (>= (- stacks-block-height unstake-requested) UNSTAKE_COOLDOWN_BLOCKS) (err ERR_COOLDOWN_PERIOD))
    
    ;; Transfer staked STX back to player
    (try! (as-contract (stx-transfer? staked-amount tx-sender contract-caller)))
    
    ;; Remove stake record
    (map-delete player-stakes contract-caller)
    
    ;; Update total staked
    (var-set total-staked new-total-staked)
    
    ;; Log action
    (print { action: "complete-unstake", player: contract-caller, amount: staked-amount })
    (ok staked-amount)
    )
)

;; Claim staking rewards
(define-public (claim-staking-rewards)
    (let (
        (current-stake (unwrap! (map-get? player-stakes contract-caller) (err ERR_NO_STAKES)))
        (reward-amount (calculate-staking-rewards contract-caller))
    )
    ;; Ensure there are rewards to claim
    (asserts! (> reward-amount u0) (err ERR_INSUFFICIENT_BALANCE))
    ;; Ensure reward pool has sufficient funds
    (asserts! (>= (var-get reward-pool) reward-amount) (err ERR_INSUFFICIENT_BALANCE))
    
    ;; Transfer rewards from contract to player
    (try! (as-contract (stx-transfer? reward-amount tx-sender contract-caller)))
    
    ;; Update player's last claim timestamp
    (map-set player-stakes contract-caller (merge current-stake {
        last-claim: stacks-block-height
    }))
    
    ;; Update reward pool
    (var-set reward-pool (- (var-get reward-pool) reward-amount))
    
    ;; Log reward claim
    (print { action: "claim-rewards", player: contract-caller, amount: reward-amount })
    (ok reward-amount)
    )
)

;; Add funds to reward pool (called by platform-manager)
;; #[allow(unchecked_data)]
(define-public (add-to-reward-pool (amount uint))
    (begin
    ;; Only authorized contracts can add to reward pool
    (asserts! (contract-call? .platform-manager is-authorized-contract contract-caller) (err ERR_UNAUTHORIZED))
    
    ;; Add to reward pool
    (var-set reward-pool (+ (var-get reward-pool) amount))
    
    ;; Log action
    (print { action: "add-to-reward-pool", amount: amount, new-total: (var-get reward-pool) })
    (ok true)
    )
)

;; Private helper functions
(define-private (get-staking-tier-multiplier (amount uint))
    (if (>= amount u100000000) ;; 100 STX - VIP tier
        u12000  ;; 1.2x multiplier
        (if (>= amount u50000000) ;; 50 STX - Premium tier
            u11000  ;; 1.1x multiplier
            u10000  ;; 1.0x multiplier - Standard tier
        )
    )
)

;; Calculate staking rewards for a player
(define-read-only (calculate-staking-rewards (player principal))
    (match (map-get? player-stakes player)
        stake-data (let (
            (staked-amount (get staked-amount stake-data))
            (last-claim (get last-claim stake-data))
            (reward-multiplier (get reward-multiplier stake-data))
            (blocks-since-claim (- stacks-block-height last-claim))
            (base-reward (/ (* (* staked-amount REWARD_RATE_BASIS_POINTS) blocks-since-claim) (* BLOCKS_PER_YEAR u10000)))
            (multiplied-reward (/ (* base-reward reward-multiplier) u10000))
        )
        multiplied-reward
        )
        u0
    )
)

;; Get player's staking information
(define-read-only (get-player-stake (player principal))
    (map-get? player-stakes player)
)

;; Get staking pool statistics
(define-read-only (get-staking-stats)
    {
        total-staked: (var-get total-staked),
        reward-pool: (var-get reward-pool),
        total-stakers: u0, ;; Could implement counter if needed
        last-reward-distribution: (var-get last-reward-distribution)
    }
)

;; Get staking tier information
(define-read-only (get-staking-tier (amount uint))
    (if (>= amount u100000000)
        { tier: u3, name: "VIP", multiplier: u12000, min-amount: u100000000 }
        (if (>= amount u50000000)
            { tier: u2, name: "Premium", multiplier: u11000, min-amount: u50000000 }
            { tier: u1, name: "Standard", multiplier: u10000, min-amount: MIN_STAKE_AMOUNT }
        )
    )
)

;; Check if player can unstake
(define-read-only (can-unstake (player principal))
    (match (map-get? player-stakes player)
        stake-data (match (get unstake-requested-at stake-data)
            unstake-time (>= (- stacks-block-height unstake-time) UNSTAKE_COOLDOWN_BLOCKS)
            false
        )
        false
    )
)

;; Initialize staking tiers
(map-set staking-tiers u1 { min-amount: u10000000, multiplier: u10000, tier-name: "Standard" })
(map-set staking-tiers u2 { min-amount: u50000000, multiplier: u11000, tier-name: "Premium" })
(map-set staking-tiers u3 { min-amount: u100000000, multiplier: u12000, tier-name: "VIP" })