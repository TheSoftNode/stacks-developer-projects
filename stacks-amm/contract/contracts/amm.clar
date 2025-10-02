;; traits
(use-trait ft-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; constants
;;
(define-constant MINIMUM_LIQUIDITY u1000) ;; minimum liquidity that must exist in a pool
(define-constant THIS_CONTRACT (as-contract tx-sender)) ;; this contract
(define-constant FEES_DENOM u10000) ;; fees denominator

;; errors
(define-constant ERR_POOL_ALREADY_EXISTS (err u200)) ;; pool already exists
(define-constant ERR_INCORRECT_TOKEN_ORDERING (err u201)) ;; incorrect token ordering (invalid sorting)
(define-constant ERR_INSUFFICIENT_LIQUIDITY_MINTED (err u202)) ;; insufficient liquidity amounts being added
(define-constant ERR_INSUFFICIENT_LIQUIDITY_OWNED (err u203)) ;; not enough liquidity owned to withdraw the requested amount
(define-constant ERR_INSUFFICIENT_LIQUIDITY_BURNED (err u204)) ;; insufficient liquidity amounts being removed
(define-constant ERR_INSUFFICIENT_INPUT_AMOUNT (err u205)) ;; insufficient input token amount for swap
(define-constant ERR_INSUFFICIENT_LIQUIDITY_FOR_SWAP (err u206)) ;; insufficient liquidity in pool for swap
(define-constant ERR_INSUFFICIENT_1_AMOUNT (err u207)) ;; insufficient amount of token 1 for swap
(define-constant ERR_INSUFFICIENT_0_AMOUNT (err u208)) ;; insufficient amount of token 0 for swap

;; mappings
(define-map pools
    (buff 20) ;; Pool ID (hash of Token0 + Token1 + Fee)
    {
        token-0: principal,
        token-1: principal,
        fee: uint,
        liquidity: uint,
        balance-0: uint,
        balance-1: uint,
    }
)

(define-map positions
    {
        pool-id: (buff 20),
        owner: principal,
    }
    { liquidity: uint }
)

;; Compute the hash of (token0 + token1 + fee) to use as a pool ID
(define-read-only (get-pool-id (pool-info {
    token-0: <ft-trait>,
    token-1: <ft-trait>,
    fee: uint,
}))
    (let (
            (buff (unwrap-panic (to-consensus-buff? pool-info)))
            (pool-id (hash160 buff))
        )
        pool-id
    )
)

;; private functions
;;

;; Ensure that the token-0 principal is "less than" the token-1 principal
(define-private (correct-token-ordering
        (token-0 principal)
        (token-1 principal)
    )
    (let (
            (token-0-buff (unwrap-panic (to-consensus-buff? token-0)))
            (token-1-buff (unwrap-panic (to-consensus-buff? token-1)))
        )
        (asserts! (< token-0-buff token-1-buff) ERR_INCORRECT_TOKEN_ORDERING)
        (ok true)
    )
)
