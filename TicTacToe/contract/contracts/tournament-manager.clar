;; title: tournament-manager
;; version: 1.0.0
;; summary: Multi-player tournament management with automated bracket progression
;; description: Handles tournament creation, registration, bracket management, and prize distribution

;; constants
(define-constant ERR_UNAUTHORIZED u401)
(define-constant ERR_TOURNAMENT_NOT_FOUND u402)
(define-constant ERR_TOURNAMENT_FULL u403)
(define-constant ERR_TOURNAMENT_ALREADY_STARTED u404)
(define-constant ERR_TOURNAMENT_NOT_STARTED u405)
(define-constant ERR_INVALID_TOURNAMENT_SIZE u406)
(define-constant ERR_INSUFFICIENT_PLAYERS u407)
(define-constant ERR_ALREADY_REGISTERED u408)
(define-constant ERR_NOT_REGISTERED u409)
(define-constant ERR_INVALID_BRACKET u410)

;; Tournament status constants
(define-constant TOURNAMENT_STATUS_REGISTRATION "registration")
(define-constant TOURNAMENT_STATUS_ACTIVE "active")
(define-constant TOURNAMENT_STATUS_COMPLETED "completed")
(define-constant TOURNAMENT_STATUS_CANCELLED "cancelled")

;; Tournament types
(define-constant TOURNAMENT_TYPE_SINGLE_ELIMINATION u1)
(define-constant TOURNAMENT_TYPE_DOUBLE_ELIMINATION u2)

;; data vars
(define-data-var latest-tournament-id uint u0)

;; data maps
(define-map tournaments
    uint ;; tournament-id
    {
        creator: principal,
        tournament-type: uint,
        max-players: uint,
        current-players: uint,
        entry-fee: uint,
        prize-pool: uint,
        status: (string-ascii 20),
        winner: (optional principal),
        created-at: uint,
        started-at: (optional uint),
        completed-at: (optional uint),
        current-round: uint,
        total-rounds: uint,
    }
)

(define-map tournament-participants
    {
        tournament-id: uint,
        player: principal,
    }
    {
        registered-at: uint,
        eliminated-at: (optional uint),
        current-round: uint,
        is-active: bool,
    }
)

(define-map tournament-brackets
    {
        tournament-id: uint,
        round: uint,
        position: uint,
    }
    {
        player-one: (optional principal),
        player-two: (optional principal),
        winner: (optional principal),
        game-id: (optional uint),
        completed: bool,
    }
)

;; Tournament configuration for different sizes
(define-map tournament-configs
    uint ;; max-players
    {
        min-players: uint,
        total-rounds: uint,
        prize-distribution: (list 8 uint), ;; percentage distribution (basis points)
    }
)

;; Tournament creation
;; #[allow(unchecked_data)]
(define-public (create-tournament
        (tournament-type uint)
        (max-players uint)
        (entry-fee uint)
    )
    (let (
            (tournament-id (var-get latest-tournament-id))
            (config (unwrap! (map-get? tournament-configs max-players)
                (err ERR_INVALID_TOURNAMENT_SIZE)
            ))
            (tournament-data {
                creator: contract-caller,
                tournament-type: tournament-type,
                max-players: max-players,
                current-players: u0,
                entry-fee: entry-fee,
                prize-pool: u0,
                status: TOURNAMENT_STATUS_REGISTRATION,
                winner: none,
                created-at: stacks-block-height,
                started-at: none,
                completed-at: none,
                current-round: u0,
                total-rounds: (get total-rounds config),
            })
        )
        ;; Check if platform is paused
        (asserts! (not (contract-call? .platform-manager is-paused))
            (err ERR_UNAUTHORIZED)
        )
        ;; Validate tournament type
        (asserts!
            (or
                (is-eq tournament-type TOURNAMENT_TYPE_SINGLE_ELIMINATION)
                (is-eq tournament-type TOURNAMENT_TYPE_DOUBLE_ELIMINATION)
            )
            (err ERR_INVALID_TOURNAMENT_SIZE)
        )
        ;; Validate entry fee meets minimum
        (asserts!
            (>= entry-fee (contract-call? .platform-manager get-min-bet-amount))
            (err ERR_UNAUTHORIZED)
        )

        ;; Create tournament
        (map-set tournaments tournament-id tournament-data)
        (var-set latest-tournament-id (+ tournament-id u1))

        ;; Auto-register creator (manual implementation to avoid circular dependency)
        (map-set tournament-participants {
            tournament-id: tournament-id,
            player: contract-caller,
        } {
            registered-at: stacks-block-height,
            eliminated-at: none,
            current-round: u1,
            is-active: true,
        })
        ;; Transfer entry fee from creator
        (try! (stx-transfer? entry-fee contract-caller (as-contract tx-sender)))
        ;; Update tournament with creator registered
        (map-set tournaments tournament-id
            (merge tournament-data {
                current-players: u1,
                prize-pool: entry-fee,
            })
        )

        ;; Log tournament creation
        (print {
            action: "create-tournament",
            tournament-id: tournament-id,
            creator: contract-caller,
            max-players: max-players,
        })
        (ok tournament-id)
    )
)

;; Join tournament
;; #[allow(unchecked_data)]
(define-public (join-tournament (tournament-id uint))
    (let (
            (tournament-data (unwrap! (map-get? tournaments tournament-id)
                (err ERR_TOURNAMENT_NOT_FOUND)
            ))
            (participant-key {
                tournament-id: tournament-id,
                player: contract-caller,
            })
            (existing-participant (map-get? tournament-participants participant-key))
            (updated-tournament (merge tournament-data {
                current-players: (+ (get current-players tournament-data) u1),
                prize-pool: (+ (get prize-pool tournament-data)
                    (get entry-fee tournament-data)
                ),
            }))
        )
        ;; Check if platform is paused
        (asserts! (not (contract-call? .platform-manager is-paused))
            (err ERR_UNAUTHORIZED)
        )
        ;; Ensure tournament exists and is in registration
        (asserts!
            (is-eq (get status tournament-data) TOURNAMENT_STATUS_REGISTRATION)
            (err ERR_TOURNAMENT_ALREADY_STARTED)
        )
        ;; Ensure tournament isn't full
        (asserts!
            (< (get current-players tournament-data)
                (get max-players tournament-data)
            )
            (err ERR_TOURNAMENT_FULL)
        )
        ;; Ensure player isn't already registered
        (asserts! (is-none existing-participant) (err ERR_ALREADY_REGISTERED))

        ;; Transfer entry fee to contract
        (try! (stx-transfer? (get entry-fee tournament-data) contract-caller
            (as-contract tx-sender)
        ))

        ;; Register participant
        (map-set tournament-participants participant-key {
            registered-at: stacks-block-height,
            eliminated-at: none,
            current-round: u1,
            is-active: true,
        })

        ;; Update tournament
        (map-set tournaments tournament-id updated-tournament)

        ;; Log if tournament is full (auto-start will be called separately)
        (if (is-eq (get current-players updated-tournament)
                (get max-players updated-tournament)
            )
            (begin
                (print {
                    action: "tournament-full",
                    tournament-id: tournament-id,
                })
                true
            )
            true
        )
        (ok true)
    )
)

;; Start tournament (can be called by creator or auto-triggered when full)
(define-public (start-tournament (tournament-id uint))
    (let (
            (tournament-data (unwrap! (map-get? tournaments tournament-id)
                (err ERR_TOURNAMENT_NOT_FOUND)
            ))
            (config (unwrap!
                (map-get? tournament-configs (get max-players tournament-data))
                (err ERR_INVALID_TOURNAMENT_SIZE)
            ))
        )
        ;; Check authorization (creator or auto-start when full)
        (asserts!
            (or
                (is-eq contract-caller (get creator tournament-data))
                (is-eq (get current-players tournament-data)
                    (get max-players tournament-data)
                )
            )
            (err ERR_UNAUTHORIZED)
        )
        ;; Ensure tournament is in registration status
        (asserts!
            (is-eq (get status tournament-data) TOURNAMENT_STATUS_REGISTRATION)
            (err ERR_TOURNAMENT_ALREADY_STARTED)
        )
        ;; Ensure minimum players
        (asserts!
            (>= (get current-players tournament-data) (get min-players config))
            (err ERR_INSUFFICIENT_PLAYERS)
        )

        ;; Update tournament status
        (map-set tournaments tournament-id
            (merge tournament-data {
                status: TOURNAMENT_STATUS_ACTIVE,
                started-at: (some stacks-block-height),
                current-round: u1,
            })
        )

        ;; First round brackets will be generated separately to avoid circular dependencies

        ;; Log tournament start
        (print {
            action: "start-tournament",
            tournament-id: tournament-id,
            players: (get current-players tournament-data),
        })
        (ok true)
    )
)

;; private functions
;; Helper to get active players in a round
(define-private (get-active-players-in-round
        (tournament-id uint)
        (round uint)
    )
    ;; Simplified - in real implementation would query tournament-participants
    ;; Returns list of active players for the round
    (list)
)

;; Helper to create a single bracket match
(define-private (create-bracket-match
        (tournament-id uint)
        (round uint)
        (position uint)
        (player-one (optional principal))
        (player-two (optional principal))
    )
    (let ((bracket-key {
            tournament-id: tournament-id,
            round: round,
            position: position,
        }))
        (map-set tournament-brackets bracket-key {
            player-one: player-one,
            player-two: player-two,
            winner: none,
            game-id: none,
            completed: false,
        })
        (ok true)
    )
)

;; Generate initial brackets for first round
;; #[allow(unchecked_data)]
(define-public (generate-first-round-brackets
        (tournament-id uint)
        (players (list 32 principal))
    )
    (let (
            (tournament-data (unwrap! (map-get? tournaments tournament-id)
                (err ERR_TOURNAMENT_NOT_FOUND)
            ))
            (num-players (len players))
            (num-matches (/ num-players u2))
        )
        ;; Verify tournament is active and in first round
        (asserts! (is-eq (get status tournament-data) TOURNAMENT_STATUS_ACTIVE)
            (err ERR_TOURNAMENT_NOT_STARTED)
        )
        (asserts! (is-eq (get current-round tournament-data) u1)
            (err ERR_INVALID_BRACKET)
        )
        ;; Only creator or admin can generate brackets
        (asserts!
            (or
                (is-eq contract-caller (get creator tournament-data))
                (contract-call? .platform-manager is-authorized-contract
                    contract-caller
                )
            )
            (err ERR_UNAUTHORIZED)
        )
        ;; Verify player count matches tournament size
        (asserts! (<= num-players (get max-players tournament-data))
            (err ERR_TOURNAMENT_FULL)
        )

        ;; Create bracket matchups for first round
        ;;  Create bracket matchups manually (supports up to 16 matches = 32 players)
        ;; Clarity doesn't support mutual recursion, so we unroll the loop
        (begin
            (unwrap-panic (create-matchup-if-exists tournament-id u1 players u0))
            (unwrap-panic (create-matchup-if-exists tournament-id u1 players u1))
            (unwrap-panic (create-matchup-if-exists tournament-id u1 players u2))
            (unwrap-panic (create-matchup-if-exists tournament-id u1 players u3))
            (unwrap-panic (create-matchup-if-exists tournament-id u1 players u4))
            (unwrap-panic (create-matchup-if-exists tournament-id u1 players u5))
            (unwrap-panic (create-matchup-if-exists tournament-id u1 players u6))
            (unwrap-panic (create-matchup-if-exists tournament-id u1 players u7))
            (unwrap-panic (create-matchup-if-exists tournament-id u1 players u8))
            (unwrap-panic (create-matchup-if-exists tournament-id u1 players u9))
            (unwrap-panic (create-matchup-if-exists tournament-id u1 players u10))
            (unwrap-panic (create-matchup-if-exists tournament-id u1 players u11))
            (unwrap-panic (create-matchup-if-exists tournament-id u1 players u12))
            (unwrap-panic (create-matchup-if-exists tournament-id u1 players u13))
            (unwrap-panic (create-matchup-if-exists tournament-id u1 players u14))
            (unwrap-panic (create-matchup-if-exists tournament-id u1 players u15))

            (print {
                action: "brackets-generated",
                tournament-id: tournament-id,
                round: u1,
            })
            (ok true)
        )
    )
)

;; Helper to create a single matchup if players exist at that position
(define-private (create-matchup-if-exists
        (tournament-id uint)
        (round uint)
        (players (list 32 principal))
        (position uint)
    )
    (let (
            (player-one-idx (* position u2))
            (player-two-idx (+ (* position u2) u1))
            (player-one (element-at? players player-one-idx))
            (player-two (element-at? players player-two-idx))
        )
        (if (is-some player-one)
            (create-bracket-match tournament-id round position player-one
                player-two
            )
            (ok true) ;; No more players, skip this position
        )
    )
)

;; Record the result of a tournament match
;; #[allow(unchecked_data)]
(define-public (record-match-result
        (tournament-id uint)
        (round uint)
        (position uint)
        (winner principal)
        (game-id uint)
    )
    (let (
            (tournament-data (unwrap! (map-get? tournaments tournament-id)
                (err ERR_TOURNAMENT_NOT_FOUND)
            ))
            (bracket-key {
                tournament-id: tournament-id,
                round: round,
                position: position,
            })
            (bracket-data (unwrap! (map-get? tournament-brackets bracket-key)
                (err ERR_INVALID_BRACKET)
            ))
        )
        ;; Verify tournament is active
        (asserts! (is-eq (get status tournament-data) TOURNAMENT_STATUS_ACTIVE)
            (err ERR_TOURNAMENT_NOT_STARTED)
        )
        ;; Verify match hasn't been completed yet
        (asserts! (not (get completed bracket-data)) (err ERR_INVALID_BRACKET))
        ;; Verify winner is one of the players in this match
        (asserts!
            (or
                (is-eq (some winner) (get player-one bracket-data))
                (is-eq (some winner) (get player-two bracket-data))
            )
            (err ERR_UNAUTHORIZED)
        )

        ;; Update bracket with result
        (map-set tournament-brackets bracket-key
            (merge bracket-data {
                winner: (some winner),
                game-id: (some game-id),
                completed: true,
            })
        )

        ;; Log match result
        (print {
            action: "match-result",
            tournament-id: tournament-id,
            round: round,
            position: position,
            winner: winner,
        })
        (ok true)
    )
)

;; Advance tournament to next round
(define-public (advance-tournament-round (tournament-id uint))
    (let (
            (tournament-data (unwrap! (map-get? tournaments tournament-id)
                (err ERR_TOURNAMENT_NOT_FOUND)
            ))
            (current-round (get current-round tournament-data))
            (total-rounds (get total-rounds tournament-data))
        )
        ;; Check authorization (creator or platform admin)
        (asserts!
            (or
                (is-eq contract-caller (get creator tournament-data))
                (contract-call? .platform-manager is-authorized-contract
                    contract-caller
                )
            )
            (err ERR_UNAUTHORIZED)
        )
        ;; Verify tournament is active
        (asserts! (is-eq (get status tournament-data) TOURNAMENT_STATUS_ACTIVE)
            (err ERR_TOURNAMENT_NOT_STARTED)
        )
        ;; Verify not already at final round
        (asserts! (< current-round total-rounds) (err ERR_INVALID_BRACKET))

        ;; Check if current round is complete (simplified check)
        ;; In full implementation, would verify all matches in current round are completed

        (if (is-eq current-round total-rounds)
            ;; Tournament is complete
            (begin
                (map-set tournaments tournament-id
                    (merge tournament-data {
                        status: TOURNAMENT_STATUS_COMPLETED,
                        completed-at: (some stacks-block-height),
                    })
                )
                (print {
                    action: "tournament-completed",
                    tournament-id: tournament-id,
                })
                (ok true)
            )
            ;; Advance to next round
            (begin
                (map-set tournaments tournament-id
                    (merge tournament-data { current-round: (+ current-round u1) })
                )
                (print {
                    action: "tournament-advanced",
                    tournament-id: tournament-id,
                    new-round: (+ current-round u1),
                })
                (ok true)
            )
        )
    )
)

;; Prize distribution for completed tournaments
;; #[allow(unchecked_data)]
(define-public (distribute-tournament-prizes
        (tournament-id uint)
        (winner principal)
    )
    (let (
            (tournament-data (unwrap! (map-get? tournaments tournament-id)
                (err ERR_TOURNAMENT_NOT_FOUND)
            ))
            (config (unwrap!
                (map-get? tournament-configs (get max-players tournament-data))
                (err ERR_INVALID_TOURNAMENT_SIZE)
            ))
            (prize-pool (get prize-pool tournament-data))
            (prize-distribution (get prize-distribution config))
        )
        ;; Check authorization (creator or platform admin)
        (asserts!
            (or
                (is-eq contract-caller (get creator tournament-data))
                (contract-call? .platform-manager is-authorized-contract
                    contract-caller
                )
            )
            (err ERR_UNAUTHORIZED)
        )
        ;; Verify tournament is completed
        (asserts!
            (is-eq (get status tournament-data) TOURNAMENT_STATUS_COMPLETED)
            (err ERR_TOURNAMENT_NOT_STARTED)
        )
        ;; Verify winner is valid
        (asserts! (is-some (get winner tournament-data))
            (err ERR_TOURNAMENT_NOT_FOUND)
        )
        ;; Verify winner matches the provided winner
        (asserts! (is-eq (some winner) (get winner tournament-data))
            (err ERR_UNAUTHORIZED)
        )

        ;; Calculate and distribute prizes
        (let (
                (winner-percentage (unwrap! (element-at? prize-distribution u0)
                    (err ERR_INVALID_TOURNAMENT_SIZE)
                ))
                (winner-prize (/ (* prize-pool winner-percentage) u10000))
                (platform-fee-rate (contract-call? .platform-manager get-platform-fee-rate))
                (platform-fee (/ (* prize-pool platform-fee-rate) u10000))
                (net-winner-prize (- winner-prize platform-fee))
            )
            ;; Transfer prize to winner
            (try! (as-contract (stx-transfer? net-winner-prize tx-sender winner)))
            ;; Collect platform fee (platform-manager handles the treasury)
            (try! (contract-call? .platform-manager collect-platform-fee platform-fee))

            ;; Mark prizes as distributed
            (map-set tournaments tournament-id
                (merge tournament-data { status: "prizes-distributed" })
            )

            ;; Log prize distribution
            (print {
                action: "prizes-distributed",
                tournament-id: tournament-id,
                winner: winner,
                amount: net-winner-prize,
            })
            (ok net-winner-prize)
        )
    )
)

;; Emergency function to cancel tournament and refund players
(define-public (cancel-tournament (tournament-id uint))
    (let (
            (tournament-data (unwrap! (map-get? tournaments tournament-id)
                (err ERR_TOURNAMENT_NOT_FOUND)
            ))
            (entry-fee (get entry-fee tournament-data))
            (current-players (get current-players tournament-data))
            (total-refund (* entry-fee current-players))
        )
        ;; Check authorization (creator or platform admin)
        (asserts!
            (or
                (is-eq contract-caller (get creator tournament-data))
                (contract-call? .platform-manager is-authorized-contract
                    contract-caller
                )
            )
            (err ERR_UNAUTHORIZED)
        )
        ;; Can only cancel if not completed
        (asserts!
            (not (is-eq (get status tournament-data) TOURNAMENT_STATUS_COMPLETED))
            (err ERR_TOURNAMENT_ALREADY_STARTED)
        )

        ;; Update tournament status
        (map-set tournaments tournament-id
            (merge tournament-data {
                status: TOURNAMENT_STATUS_CANCELLED,
                completed-at: (some stacks-block-height),
            })
        )

        ;; Note: Individual refunds would need to be claimed by participants
        ;; This is simplified - full implementation would track individual refunds

        ;; Log cancellation
        (print {
            action: "tournament-cancelled",
            tournament-id: tournament-id,
            refund-pool: total-refund,
        })
        (ok true)
    )
)

;; Allow players to claim refunds from cancelled tournaments
;; #[allow(unchecked_data)]
(define-public (claim-tournament-refund (tournament-id uint))
    (let (
            (tournament-data (unwrap! (map-get? tournaments tournament-id)
                (err ERR_TOURNAMENT_NOT_FOUND)
            ))
            (participant-key {
                tournament-id: tournament-id,
                player: contract-caller,
            })
            (participant-data (unwrap! (map-get? tournament-participants participant-key)
                (err ERR_NOT_REGISTERED)
            ))
            (entry-fee (get entry-fee tournament-data))
        )
        ;; Verify tournament is cancelled
        (asserts!
            (is-eq (get status tournament-data) TOURNAMENT_STATUS_CANCELLED)
            (err ERR_TOURNAMENT_NOT_STARTED)
        )
        ;; Verify player is still active (hasn't claimed refund yet)
        (asserts! (get is-active participant-data) (err ERR_ALREADY_REGISTERED))

        ;; Mark participant as refunded
        (map-set tournament-participants participant-key
            (merge participant-data {
                is-active: false,
                eliminated-at: (some stacks-block-height),
            })
        )

        ;; Transfer refund
        (try! (as-contract (stx-transfer? entry-fee tx-sender contract-caller)))

        ;; Log refund
        (print {
            action: "refund-claimed",
            tournament-id: tournament-id,
            player: contract-caller,
            amount: entry-fee,
        })
        (ok entry-fee)
    )
)

;; read only functions
(define-read-only (get-tournament (tournament-id uint))
    (map-get? tournaments tournament-id)
)

(define-read-only (get-latest-tournament-id)
    (var-get latest-tournament-id)
)

(define-read-only (get-tournament-participant
        (tournament-id uint)
        (player principal)
    )
    (map-get? tournament-participants {
        tournament-id: tournament-id,
        player: player,
    })
)

(define-read-only (get-tournament-bracket
        (tournament-id uint)
        (round uint)
        (position uint)
    )
    (map-get? tournament-brackets {
        tournament-id: tournament-id,
        round: round,
        position: position,
    })
)

;; Initialize tournament configurations
(map-set tournament-configs u4 {
    min-players: u4,
    total-rounds: u2,
    prize-distribution: (list u7000 u3000),
})
;; 4 players: 70% winner, 30% runner-up
(map-set tournament-configs u8 {
    min-players: u6,
    total-rounds: u3,
    prize-distribution: (list u5000 u3000 u1500 u500),
})
;; 8 players
(map-set tournament-configs u16 {
    min-players: u8,
    total-rounds: u4,
    prize-distribution: (list u4000 u2500 u1500 u1000 u500 u500),
})
;; 16 players
(map-set tournament-configs u32 {
    min-players: u16,
    total-rounds: u5,
    prize-distribution: (list u3500 u2000 u1500 u1000 u800 u600 u400 u200),
})
;; 32 players
