;; title: game-series
;; version: 1.0.0
;; summary: Best of N game series functionality with series betting and tracking
;; description: Allows players to create and play multi-game series (best of 3, 5, 7, etc.)

;; constants
(define-constant ERR_UNAUTHORIZED u401)
(define-constant ERR_SERIES_NOT_FOUND u402)
(define-constant ERR_SERIES_FULL u403)
(define-constant ERR_SERIES_ALREADY_STARTED u404)
(define-constant ERR_SERIES_FINISHED u405)
(define-constant ERR_INVALID_SERIES_LENGTH u406)
(define-constant ERR_NOT_PLAYER_TURN u407)
(define-constant ERR_ALREADY_JOINED u408)

;; Series status constants
(define-constant SERIES_STATUS_WAITING "waiting")
(define-constant SERIES_STATUS_ACTIVE "active")
(define-constant SERIES_STATUS_COMPLETED "completed")
(define-constant SERIES_STATUS_CANCELLED "cancelled")

;; data vars
(define-data-var latest-series-id uint u0)

;; data maps
(define-map game-series
    uint ;; series-id
    {
        creator: principal,
        player-one: principal,
        player-two: (optional principal),
        games-to-win: uint, ;; 2 for best-of-3, 3 for best-of-5, etc.
        player-one-wins: uint,
        player-two-wins: uint,
        total-games-played: uint,
        current-game-id: (optional uint),
        winner: (optional principal),
        series-bet: uint,
        prize-pool: uint,
        status: (string-ascii 20),
        created-at: uint,
        started-at: (optional uint),
        completed-at: (optional uint)
    }
)

;; Track individual games within a series
(define-map series-games
    { series-id: uint, game-number: uint }
    {
        game-id: uint,
        winner: (optional principal),
        completed-at: (optional uint),
        game-duration: uint ;; in blocks
    }
)

;; Series configurations
(define-map series-configs
    uint ;; games-to-win
    {
        max-games: uint,
        series-name: (string-ascii 20),
        min-bet: uint
    }
)

;; Create a new game series
;; #[allow(unchecked_data)]
(define-public (create-series (games-to-win uint) (series-bet uint))
    (let (
        (series-id (var-get latest-series-id))
        (config (unwrap! (map-get? series-configs games-to-win) (err ERR_INVALID_SERIES_LENGTH)))
        (series-data {
            creator: contract-caller,
            player-one: contract-caller,
            player-two: none,
            games-to-win: games-to-win,
            player-one-wins: u0,
            player-two-wins: u0,
            total-games-played: u0,
            current-game-id: none,
            winner: none,
            series-bet: series-bet,
            prize-pool: series-bet,
            status: SERIES_STATUS_WAITING,
            created-at: stacks-block-height,
            started-at: none,
            completed-at: none
        })
    )
    ;; Check if platform is paused
    (asserts! (not (contract-call? .platform-manager is-paused)) (err ERR_UNAUTHORIZED))
    ;; Validate minimum bet
    (asserts! (>= series-bet (get min-bet config)) (err ERR_UNAUTHORIZED))
    
    ;; Transfer series bet from creator
    (try! (stx-transfer? series-bet contract-caller (as-contract tx-sender)))
    
    ;; Create series
    (map-set game-series series-id series-data)
    (var-set latest-series-id (+ series-id u1))
    
    ;; Log series creation
    (print { action: "create-series", series-id: series-id, creator: contract-caller, games-to-win: games-to-win })
    (ok series-id)
    )
)

;; Join an existing game series
;; #[allow(unchecked_data)]
(define-public (join-series (series-id uint))
    (let (
        (series-data (unwrap! (map-get? game-series series-id) (err ERR_SERIES_NOT_FOUND)))
        (updated-series (merge series-data {
            player-two: (some contract-caller),
            prize-pool: (+ (get prize-pool series-data) (get series-bet series-data)),
            status: SERIES_STATUS_ACTIVE,
            started-at: (some stacks-block-height)
        }))
    )
    ;; Check if platform is paused
    (asserts! (not (contract-call? .platform-manager is-paused)) (err ERR_UNAUTHORIZED))
    ;; Ensure series is waiting for players
    (asserts! (is-eq (get status series-data) SERIES_STATUS_WAITING) (err ERR_SERIES_ALREADY_STARTED))
    ;; Ensure series doesn't already have two players
    (asserts! (is-none (get player-two series-data)) (err ERR_SERIES_FULL))
    ;; Ensure player isn't joining their own series
    (asserts! (not (is-eq contract-caller (get player-one series-data))) (err ERR_ALREADY_JOINED))
    
    ;; Transfer series bet from joiner
    (try! (stx-transfer? (get series-bet series-data) contract-caller (as-contract tx-sender)))
    
    ;; Update series
    (map-set game-series series-id updated-series)
    
    ;; Record series participation in player registry
    (try! (contract-call? .player-registry record-series-participation (get player-one series-data)))
    (try! (contract-call? .player-registry record-series-participation contract-caller))
    
    ;; Log series joined
    (print { action: "join-series", series-id: series-id, player-two: contract-caller })
    (ok true)
    )
)

;; Start the next game in a series
;; #[allow(unchecked_data)]
(define-public (start-next-game (series-id uint))
    (let (
        (series-data (unwrap! (map-get? game-series series-id) (err ERR_SERIES_NOT_FOUND)))
        (game-number (+ (get total-games-played series-data) u1))
    )
    ;; Verify series is active
    (asserts! (is-eq (get status series-data) SERIES_STATUS_ACTIVE) (err ERR_SERIES_FINISHED))
    ;; Verify series isn't already finished
    (asserts! (is-none (get winner series-data)) (err ERR_SERIES_FINISHED))
    ;; Verify caller is one of the players
    (asserts! (or 
        (is-eq contract-caller (get player-one series-data))
        (is-eq (some contract-caller) (get player-two series-data))
    ) (err ERR_UNAUTHORIZED))
    
    ;; Create a new tic-tac-toe game for this series
    (let (
        (player-two (unwrap! (get player-two series-data) (err ERR_SERIES_NOT_FOUND)))
        (game-id (try! (contract-call? .tic-tac-toe create-tournament-game 
            (get player-one series-data) 
            player-two 
            u0 ;; No individual game bet for series games
            series-id 
            u1 ;; Series are always round 1
            game-number ;; Use game number as position
        )))
    )
    ;; Update series with current game
    (map-set game-series series-id (merge series-data {
        current-game-id: (some game-id)
    }))
    
    ;; Track the game in series-games map
    (map-set series-games { series-id: series-id, game-number: game-number } {
        game-id: game-id,
        winner: none,
        completed-at: none,
        game-duration: u0
    })
    
    ;; Log game start
    (print { action: "start-series-game", series-id: series-id, game-id: game-id, game-number: game-number })
    (ok game-id)
    )
    )
)

;; Record the completion of a game in the series
;; #[allow(unchecked_data)]
(define-public (record-game-completion (series-id uint) (game-id uint) (winner principal))
    (let (
        (series-data (unwrap! (map-get? game-series series-id) (err ERR_SERIES_NOT_FOUND)))
        (game-number (get total-games-played series-data))
        (game-key { series-id: series-id, game-number: (+ game-number u1) })
        (is-player-one-winner (is-eq winner (get player-one series-data)))
        (new-p1-wins (if is-player-one-winner (+ (get player-one-wins series-data) u1) (get player-one-wins series-data)))
        (new-p2-wins (if is-player-one-winner (get player-two-wins series-data) (+ (get player-two-wins series-data) u1)))
        (games-to-win (get games-to-win series-data))
        (series-winner (if (>= new-p1-wins games-to-win) 
            (some (get player-one series-data))
            (if (>= new-p2-wins games-to-win)
                (get player-two series-data)
                none
            )
        ))
        (is-series-complete (is-some series-winner))
    )
    ;; Only tic-tac-toe contract can record game completion
    (asserts! (is-eq contract-caller .tic-tac-toe) (err ERR_UNAUTHORIZED))
    
    ;; Update game record
    (map-set series-games game-key (merge (unwrap! (map-get? series-games game-key) (err ERR_SERIES_NOT_FOUND)) {
        winner: (some winner),
        completed-at: (some stacks-block-height),
        game-duration: (- stacks-block-height (get created-at series-data))
    }))
    
    ;; Update series
    (map-set game-series series-id (merge series-data {
        player-one-wins: new-p1-wins,
        player-two-wins: new-p2-wins,
        total-games-played: (+ (get total-games-played series-data) u1),
        current-game-id: none,
        winner: series-winner,
        status: (if is-series-complete SERIES_STATUS_COMPLETED SERIES_STATUS_ACTIVE),
        completed-at: (if is-series-complete (some stacks-block-height) none)
    }))
    
    ;; If series is complete, distribute prizes
    (if is-series-complete
        (begin
            (try! (distribute-series-prizes series-id (unwrap! series-winner (err ERR_SERIES_NOT_FOUND))))
            (try! (contract-call? .player-registry record-series-win (unwrap! series-winner (err ERR_SERIES_NOT_FOUND))))
        )
        true
    )
    
    ;; Log game completion
    (print { action: "series-game-completed", series-id: series-id, winner: winner, series-complete: is-series-complete })
    (ok is-series-complete)
    )
)

;; Distribute prizes when series completes
(define-private (distribute-series-prizes (series-id uint) (winner principal))
    (let (
        (series-data (unwrap! (map-get? game-series series-id) (err ERR_SERIES_NOT_FOUND)))
        (prize-amount (get prize-pool series-data))
        (platform-fee-rate (contract-call? .platform-manager get-platform-fee-rate))
        (platform-fee (/ (* prize-amount platform-fee-rate) u10000))
        (winner-prize (- prize-amount platform-fee))
    )
    ;; Transfer prize to winner
    (try! (as-contract (stx-transfer? winner-prize tx-sender winner)))
    ;; Collect platform fee
    (try! (contract-call? .platform-manager collect-platform-fee platform-fee))
    
    ;; Log prize distribution
    (print { action: "series-prizes-distributed", series-id: series-id, winner: winner, amount: winner-prize })
    (ok winner-prize)
    )
)

;; read only functions
(define-read-only (get-series (series-id uint))
    (map-get? game-series series-id)
)

(define-read-only (get-latest-series-id)
    (var-get latest-series-id)
)

(define-read-only (get-series-game (series-id uint) (game-number uint))
    (map-get? series-games { series-id: series-id, game-number: game-number })
)

;; Initialize series configurations
(map-set series-configs u2 { max-games: u3, series-name: "Best of 3", min-bet: u1000000 }) ;; Best of 3
(map-set series-configs u3 { max-games: u5, series-name: "Best of 5", min-bet: u2000000 }) ;; Best of 5  
(map-set series-configs u4 { max-games: u7, series-name: "Best of 7", min-bet: u5000000 }) ;; Best of 7