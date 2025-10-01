;; title: traits
;; version: 1.0.0
;; summary: Interface definitions to prevent circular dependencies
;; description: Provides trait interfaces that contracts can implement to enable cross-contract communication without circular imports

;; Authorization trait for contracts that need platform manager authorization
(define-trait authorized-contract-trait
  (
    ;; Check if contract is authorized to perform privileged operations
    (is-authorized () (response bool uint))
  )
)

;; Reward pool management trait for staking system
(define-trait reward-pool-trait
  (
    ;; Add funds to the reward pool
    (add-to-reward-pool (uint) (response bool uint))
    ;; Receive platform fees
    (receive-platform-fees () (response uint uint))
  )
)

;; Player registry trait for recording game statistics
(define-trait player-registry-trait
  (
    ;; Record game result
    (record-game-result (principal principal uint uint) (response bool uint))
    ;; Record draw result
    (record-draw-result (principal principal) (response bool uint))
    ;; Record tournament participation
    (record-tournament-participation (principal) (response bool uint))
    ;; Record tournament win
    (record-tournament-win (principal) (response bool uint))
  )
)

;; Platform manager trait for emergency controls and configuration
(define-trait platform-manager-trait
  (
    ;; Check if platform is paused
    (is-paused () (response bool uint))
    ;; Get platform configuration values
    (get-platform-fee-rate () (response uint uint))
    (get-min-bet-amount () (response uint uint))
    (get-move-timeout () (response uint uint))
  )
)
