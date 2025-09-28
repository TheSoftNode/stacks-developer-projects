
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

;; Treasury management
;; #[allow(unchecked_data)]
(define-public (collect-platform-fee (amount uint))
    (begin
        (asserts! (is-authorized-contract contract-caller) (err ERR_UNAUTHORIZED))
        (var-set platform-treasury (+ (var-get platform-treasury) amount))
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



;; Initialize the game engine as authorized contract
(map-set authorized-contracts .tic-tac-toe true)

