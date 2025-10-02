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

;; create-pool
;; Creates a new pool with the given token-0, token-1, and fee
;; Ensures that a pool with these two tokens and given fee amount does not already exist
(define-public (create-pool
        (token-0 <ft-trait>)
        (token-1 <ft-trait>)
        (fee uint)
    )
    (let (
            ;; Create a pool-info tuple with the information
            (pool-info {
                token-0: token-0,
                token-1: token-1,
                fee: fee,
            })
            ;; Compute the pool ID
            (pool-id (get-pool-id pool-info))
            ;; Ensure this Pool ID doesn't already exist in the `pools` map
            (pool-does-not-exist (is-none (map-get? pools pool-id)))
            ;; Convert the <ft-trait> values into principals
            (token-0-principal (contract-of token-0))
            (token-1-principal (contract-of token-1))
            ;; Prepare the pool-data tuple
            (pool-data {
                token-0: token-0-principal,
                token-1: token-1-principal,
                fee: (get fee pool-info),
                liquidity: u0, ;; initially, liquidity is 0
                balance-0: u0, ;; initially, balance-0 (x) is 0
                balance-1: u0, ;; initially, balance-1 (y) is 0
            })
        )
        ;; If pool does already exist, throw an error
        (asserts! pool-does-not-exist ERR_POOL_ALREADY_EXISTS)
        ;; If the token-0 principal is not "less than" the token-1 principal, throw an error
        (asserts!
            (is-ok (correct-token-ordering token-0-principal token-1-principal))
            ERR_INCORRECT_TOKEN_ORDERING
        )

        ;; Update the `pools` map with the new pool data
        (map-set pools pool-id pool-data)
        (print {
            action: "create-pool",
            data: pool-data,
        })
        (ok true)
    )
)

;; get-position-liquidity
;; Given a Pool ID and a user address, returns how much liquidity the user has in the pool
(define-read-only (get-position-liquidity
        (pool-id (buff 20))
        (owner principal)
    )
    (let (
            ;; look up the position in the `positions` map
            (position (map-get? positions {
                pool-id: pool-id,
                owner: owner,
            }))
            ;; if position exists, return the liquidity otherwise return 0
            (existing-owner-liquidity (if (is-some position)
                (unwrap-panic position)
                { liquidity: u0 }
            ))
        )
        (ok (get liquidity existing-owner-liquidity))
    )
)

;; get-amounts
;; Given the desired amount of token-0 and token-1, the minimum amounts of token-0 and token-1, and current reserves of token-0 and token-1,
;; returns the amounts of token-0 and token-1 that should be provided to the pool to meet all constraints
(define-private (get-amounts
        (amount-0-desired uint)
        (amount-1-desired uint)
        (amount-0-min uint)
        (amount-1-min uint)
        (balance-0 uint)
        (balance-1 uint)
    )
    (let (
            ;; calculate ideal amount of token-1 that should be provided based on the current ratio of reserves if `amount-0-desired` can be fully used
            (amount-1-given-0 (/ (* amount-0-desired balance-1) balance-0))
            ;; calculate ideal amount of token-0 that should be provided based on the current ratio of reserves if `amount-1-desired` can be fully used
            (amount-0-given-1 (/ (* amount-1-desired balance-0) balance-1))
        )
        (if ;; if ideal amount-1 is less than the desired amount-1
            (<= amount-1-given-0 amount-1-desired)
            (begin
                ;; make sure that ideal amount-1 is >= minimum amount-1 otherwise throw an error
                (asserts! (>= amount-1-given-0 amount-1-min)
                    ERR_INSUFFICIENT_1_AMOUNT
                )
                ;; we can add amount-0-desired and ideal amount-1 to the pool successfully
                (ok {
                    amount-0: amount-0-desired,
                    amount-1: amount-1-given-0,
                })
            )
            ;; else if ideal amount-1 is greater than the desired amount-1, we can only add up to `amount-1-desired` to the pool
            (begin
                ;; make sure that ideal amount-0 is <= desired amount-0 otherwise throw an error
                (asserts! (<= amount-0-given-1 amount-0-desired)
                    ERR_INSUFFICIENT_0_AMOUNT
                )
                ;; make sure that ideal amount-0 is >= minimum amount-0 otherwise throw an error
                (asserts! (>= amount-0-given-1 amount-0-min)
                    ERR_INSUFFICIENT_0_AMOUNT
                )
                ;; we can add ideal amount-0 and amount-1-desired to the pool successfully
                (ok {
                    amount-0: amount-0-given-1,
                    amount-1: amount-1-desired,
                })
            )
        )
    )
)

;; add-liquidity
;; Adds liquidity to a given pool
;; Ensure the pool exists, calculate what token amounts are possible to add as liquidity, handle the case where this is the first time liquidity is being added
;; Transfer tokens from user to pool, and update mappings as needed
(define-public (add-liquidity
        (token-0 <ft-trait>)
        (token-1 <ft-trait>)
        (fee uint)
        (amount-0-desired uint)
        (amount-1-desired uint)
        (amount-0-min uint)
        (amount-1-min uint)
    )
    (let (
            ;; compute the pool id and fetch the current state of the pool from the mapping
            (pool-info {
                token-0: token-0,
                token-1: token-1,
                fee: fee,
            })
            (pool-id (get-pool-id pool-info))
            (pool-data (unwrap! (map-get? pools pool-id) (err u0)))
            (sender tx-sender)
            (pool-liquidity (get liquidity pool-data))
            (balance-0 (get balance-0 pool-data))
            (balance-1 (get balance-1 pool-data))
            ;; fetch the current liquidity of the user in the pool (default 0 if no existing position)
            (user-liquidity (unwrap! (get-position-liquidity pool-id sender) (err u0)))
            ;; is this the first time liquidity is being added?
            (is-initial-liquidity (is-eq pool-liquidity u0))
            (amounts (if is-initial-liquidity
                ;; if it is the first time, we can add tokens in whatever amounts we want
                {
                    amount-0: amount-0-desired,
                    amount-1: amount-1-desired,
                }
                ;; otherwise, we use get-amounts to calculate the amounts of tokens to add within the constraints
                (unwrap!
                    (get-amounts amount-0-desired amount-1-desired amount-0-min
                        amount-1-min balance-0 balance-1
                    )
                    (err u0)
                )
            ))
            (amount-0 (get amount-0 amounts))
            (amount-1 (get amount-1 amounts))
            ;; calculate the new liquidity (L value) 
            (new-liquidity (if is-initial-liquidity

                ;; if this is first-time liquidity, we subtract MINIMUM_LIQUIDITY to make sure that the pool has at least some liquidity forever
                ;; so we compute L = sqrt(x * y) - MINIMUM_LIQUIDITY
                (- (sqrti (* amount-0 amount-1)) MINIMUM_LIQUIDITY)

                ;; if it is not the first time, we update L based on how much % of the pool's liquidity this user is adding
                ;; min( amount0 * pool-liquidity / balance0 , amount1 * pool-liquidity / balance1 )
                (min (/ (* amount-0 pool-liquidity) balance-0)
                    (/ (* amount-1 pool-liquidity) balance-1)
                )
            ))
            (new-pool-liquidity (if is-initial-liquidity
                (+ new-liquidity MINIMUM_LIQUIDITY)
                new-liquidity
            ))
        )
        (asserts! (> new-liquidity u0) ERR_INSUFFICIENT_LIQUIDITY_MINTED)

        ;; transfer tokens from user to pool
        (try! (contract-call? token-0 transfer amount-0 sender THIS_CONTRACT none))
        (try! (contract-call? token-1 transfer amount-1 sender THIS_CONTRACT none))

        ;; update the `positions` map with the new liquidity of the user (pre existing liquidity + new liquidity)
        (map-set positions {
            pool-id: pool-id,
            owner: sender,
        } { liquidity: (+ user-liquidity new-liquidity) }
        )

        ;; update the `pools` map with the new pool liquidity, balance-0, and balance-1
        (map-set pools pool-id
            (merge pool-data {
                liquidity: (+ pool-liquidity new-pool-liquidity),
                balance-0: (+ balance-0 amount-0),
                balance-1: (+ balance-1 amount-1),
            })
        )

        (print {
            action: "add-liquidity",
            pool-id: pool-id,
            amount-0: amount-0,
            amount-1: amount-1,
            liquidity: (+ user-liquidity new-liquidity),
        })
        (ok true)
    )
)

(define-private (min
        (a uint)
        (b uint)
    )
    (if (< a b)
        a
        b
    )
)
