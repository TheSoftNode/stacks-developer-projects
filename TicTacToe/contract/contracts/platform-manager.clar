
;; title: platform-manager
;; version: 1.0.0
;; summary: Platform administration, emergency controls, and configuration management
;; description: Handles admin functions, emergency pause, timeout configurations, and platform fees

;; constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED u401)
(define-constant ERR_ALREADY_PAUSED u402)
(define-constant ERR_NOT_PAUSED u403)
(define-constant ERR_INVALID_CONFIG u404)

;; data vars
(define-data-var contract-admin principal CONTRACT_OWNER)
(define-data-var emergency-paused bool false)
(define-data-var move-timeout-blocks uint u144) ;; 24 hours default
(define-data-var platform-fee-rate uint u250) ;; 2.5% in basis points
(define-data-var min-bet-amount uint u1000000) ;; 1 STX minimum
(define-data-var platform-treasury uint u0)
(define-data-var total-fees-collected uint u0)
(define-data-var staking-rewards-allocation uint u3000) ;; 30% to staking rewards
(define-data-var development-fund-allocation uint u2000) ;; 20% to development
(define-data-var marketing-fund-allocation uint u1000) ;; 10% to marketing

;; authorized contracts that can interact with this manager
(define-map authorized-contracts principal bool)

;; admin management
(define-map admins principal bool)

;; private functions
(define-private (is-admin (user principal))
    (or 
        (is-eq user (var-get contract-admin))
        (default-to false (map-get? admins user))
    )
)

;; Make this read-only so other contracts can call it
(define-read-only (is-authorized-contract (contract principal))
    (default-to false (map-get? authorized-contracts contract))
)

;; Platform configuration functions
(define-public (set-move-timeout (new-timeout uint))
    (begin
        (asserts! (is-admin contract-caller) (err ERR_UNAUTHORIZED))
        (asserts! (and (>= new-timeout u6) (<= new-timeout u1008)) (err ERR_INVALID_CONFIG)) ;; 1 hour to 1 week
        (var-set move-timeout-blocks new-timeout)
        (ok true)
    )
)

(define-public (set-platform-fee (new-fee uint))
    (begin
        (asserts! (is-admin contract-caller) (err ERR_UNAUTHORIZED))
        (asserts! (<= new-fee u1000) (err ERR_INVALID_CONFIG)) ;; max 10%
        (var-set platform-fee-rate new-fee)
        (ok true)
    )
)

(define-public (set-min-bet (new-min uint))
    (begin
        (asserts! (is-admin contract-caller) (err ERR_UNAUTHORIZED))
        (asserts! (>= new-min u100000) (err ERR_INVALID_CONFIG)) ;; min 0.1 STX
        (var-set min-bet-amount new-min)
        (ok true)
    )
)

;; Emergency controls
(define-public (emergency-pause)
    (begin
        (asserts! (is-admin contract-caller) (err ERR_UNAUTHORIZED))
        (asserts! (not (var-get emergency-paused)) (err ERR_ALREADY_PAUSED))
        (var-set emergency-paused true)
        (print { action: "emergency-pause", admin: contract-caller })
        (ok true)
    )
)

(define-public (emergency-unpause)
    (begin
        (asserts! (is-admin contract-caller) (err ERR_UNAUTHORIZED))
        (asserts! (var-get emergency-paused) (err ERR_NOT_PAUSED))
        (var-set emergency-paused false)
        (print { action: "emergency-unpause", admin: contract-caller })
        (ok true)
    )
)

;; Admin management
(define-public (add-admin (new-admin principal))
    (begin
        (asserts! (is-eq contract-caller (var-get contract-admin)) (err ERR_UNAUTHORIZED))
        (map-set admins new-admin true)
        (ok true)
    )
)

(define-public (remove-admin (admin principal))
    (begin
        (asserts! (is-eq contract-caller (var-get contract-admin)) (err ERR_UNAUTHORIZED))
        (map-delete admins admin)
        (ok true)
    )
)

;; Contract authorization
;; #[allow(unchecked_data)]
(define-public (authorize-contract (contract principal))
    (begin
        (asserts! (is-admin contract-caller) (err ERR_UNAUTHORIZED))
        (map-set authorized-contracts contract true)
        (ok true)
    )
)

;; Enhanced Treasury management
;; #[allow(unchecked_data)]
(define-public (collect-platform-fee (amount uint))
    (begin
        (asserts! (is-authorized-contract contract-caller) (err ERR_UNAUTHORIZED))
        
        ;; Update treasury and total collected
        (var-set platform-treasury (+ (var-get platform-treasury) amount))
        (var-set total-fees-collected (+ (var-get total-fees-collected) amount))
        
        ;; Automatically distribute funds based on allocation percentages
        (try! (distribute-treasury-funds amount))
        
        (print { action: "collect-platform-fee", amount: amount, new-treasury: (var-get platform-treasury) })
        (ok true)
    )
)

;; Distribute treasury funds to different pools
(define-private (distribute-treasury-funds (amount uint))
    (let (
        (staking-allocation (var-get staking-rewards-allocation))
        (development-allocation (var-get development-fund-allocation))
        (marketing-allocation (var-get marketing-fund-allocation))
        (staking-amount (/ (* amount staking-allocation) u10000))
        (development-amount (/ (* amount development-allocation) u10000))
        (marketing-amount (/ (* amount marketing-allocation) u10000))
    )
    ;; Transfer to staking rewards pool
    (if (> staking-amount u0)
        (try! (contract-call? .staking-system add-to-reward-pool staking-amount))
        (ok true)
    )
    
    ;; Log distribution
    (print { 
        action: "distribute-treasury-funds", 
        staking: staking-amount, 
        development: development-amount, 
        marketing: marketing-amount 
    })
    (ok true)
    )
)

;; Withdraw funds from treasury (admin only)
;; #[allow(unchecked_data)]
(define-public (withdraw-treasury-funds (amount uint) (recipient principal))
    (begin
        (asserts! (is-admin contract-caller) (err ERR_UNAUTHORIZED))
        (asserts! (<= amount (var-get platform-treasury)) (err ERR_INVALID_CONFIG))
        
        ;; Transfer funds
        (try! (as-contract (stx-transfer? amount tx-sender recipient)))
        ;; Update treasury
        (var-set platform-treasury (- (var-get platform-treasury) amount))
        
        (print { action: "withdraw-treasury", amount: amount, recipient: recipient })
        (ok true)
    )
)

;; Update fund allocation percentages
(define-public (update-fund-allocations (staking-pct uint) (development-pct uint) (marketing-pct uint))
    (begin
        (asserts! (is-admin contract-caller) (err ERR_UNAUTHORIZED))
        ;; Ensure allocations don't exceed 100%
        (asserts! (<= (+ (+ staking-pct development-pct) marketing-pct) u10000) (err ERR_INVALID_CONFIG))
        
        (var-set staking-rewards-allocation staking-pct)
        (var-set development-fund-allocation development-pct)
        (var-set marketing-fund-allocation marketing-pct)
        
        (print { action: "update-allocations", staking: staking-pct, development: development-pct, marketing: marketing-pct })
        (ok true)
    )
)

;; read only functions
(define-read-only (is-paused)
    (var-get emergency-paused)
)

(define-read-only (get-move-timeout)
    (var-get move-timeout-blocks)
)

(define-read-only (get-platform-fee-rate)
    (var-get platform-fee-rate)
)

(define-read-only (get-min-bet-amount)
    (var-get min-bet-amount)
)

(define-read-only (get-platform-treasury)
    (var-get platform-treasury)
)

(define-read-only (get-total-fees-collected)
    (var-get total-fees-collected)
)

(define-read-only (get-fund-allocations)
    {
        staking-rewards: (var-get staking-rewards-allocation),
        development-fund: (var-get development-fund-allocation),
        marketing-fund: (var-get marketing-fund-allocation),
        remaining-treasury: (- u10000 (+ (+ (var-get staking-rewards-allocation) (var-get development-fund-allocation)) (var-get marketing-fund-allocation)))
    }
)

(define-read-only (get-treasury-stats)
    {
        current-treasury: (var-get platform-treasury),
        total-collected: (var-get total-fees-collected),
        platform-fee-rate: (var-get platform-fee-rate),
        allocations: (get-fund-allocations)
    }
)



;; Initialize authorized contracts
(map-set authorized-contracts .tic-tac-toe true)
(map-set authorized-contracts .tournament-manager true)
(map-set authorized-contracts .game-series true)
(map-set authorized-contracts .staking-system true)
(map-set authorized-contracts .game-variants true)

