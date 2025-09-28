
;; title: player-registry
;; version: 1.0.0
;; summary: Player statistics, ELO ratings, and achievement tracking
;; description: Manages player profiles, win/loss records, ELO ratings, and achievements

;; constants
(define-constant ERR_UNAUTHORIZED u401)
(define-constant ERR_PLAYER_NOT_FOUND u402)
(define-constant ERR_INVALID_RATING u403)

;; ELO rating constants
(define-constant INITIAL_ELO u1200)
(define-constant MAX_ELO_CHANGE u32)
(define-constant MIN_ELO u100)
(define-constant MAX_ELO u3000)

;; data maps
(define-map players
    principal
    {
        games-played: uint,
        games-won: uint,
        games-lost: uint,
        games-drawn: uint,
        total-winnings: uint,
        total-losses: uint,
        elo-rating: uint,
        tournaments-won: uint,
        tournaments-played: uint,
        joined-at: uint,
        last-active: uint
    }
)

;; Player registration and profile management
(define-public (register-player)
    (let (
        (existing-player (map-get? players contract-caller))
    )
    (asserts! (is-none existing-player) (err ERR_UNAUTHORIZED)) ;; Player already exists
    (map-set players contract-caller {
        games-played: u0,
        games-won: u0,
        games-lost: u0,
        games-drawn: u0,
        total-winnings: u0,
        total-losses: u0,
        elo-rating: INITIAL_ELO,
        tournaments-won: u0,
        tournaments-played: u0,
        joined-at: stacks-block-height,
        last-active: stacks-block-height
    })
    (ok true)
    )
)

;; Game result recording (called by authorized contracts)
;; #[allow(unchecked_data)]
(define-public (record-game-result (winner principal) (loser principal) (winnings uint) (losses uint))
    (begin
        ;; Check authorization (should be called by game engine)
        (asserts! (contract-call? .platform-manager is-authorized-contract contract-caller) (err ERR_UNAUTHORIZED))
        
        ;; Update winner stats
        (update-player-stats winner true winnings u0)
        ;; Update loser stats  
        (update-player-stats loser false u0 losses)
        ;; Update ELO ratings
        (update-elo-ratings winner loser)
        
        (ok true)
    )
)

;; Record draw result
;; #[allow(unchecked_data)]
(define-public (record-draw-result (player-one principal) (player-two principal))
    (begin
        ;; Check authorization
        (asserts! (contract-call? .platform-manager is-authorized-contract contract-caller) (err ERR_UNAUTHORIZED))
        
        ;; Update both players' draw counts
        (update-player-draw player-one)
        (update-player-draw player-two)
        
        (ok true)
    )
)

;; Tournament result recording
;; #[allow(unchecked_data)]
(define-public (record-tournament-result (winner principal) (participants (list 32 principal)))
    (begin
        ;; Check authorization
        (asserts! (contract-call? .platform-manager is-authorized-contract contract-caller) (err ERR_UNAUTHORIZED))
        
        ;; Update winner's tournament stats
        (update-tournament-winner winner)
        ;; Update all participants' tournament played count
        (fold update-tournament-participation participants u0)
        
        (ok true)
    )
)

;; private functions
(define-private (update-player-stats (player principal) (won bool) (winnings uint) (losses uint))
    (let (
        (current-stats (default-to {
            games-played: u0, games-won: u0, games-lost: u0, games-drawn: u0,
            total-winnings: u0, total-losses: u0, elo-rating: INITIAL_ELO,
            tournaments-won: u0, tournaments-played: u0,
            joined-at: stacks-block-height, last-active: stacks-block-height
        } (map-get? players player)))
    )
    (map-set players player (merge current-stats {
        games-played: (+ (get games-played current-stats) u1),
        games-won: (+ (get games-won current-stats) (if won u1 u0)),
        games-lost: (+ (get games-lost current-stats) (if won u0 u1)),
        total-winnings: (+ (get total-winnings current-stats) winnings),
        total-losses: (+ (get total-losses current-stats) losses),
        last-active: stacks-block-height
    }))
    )
)

(define-private (update-player-draw (player principal))
    (let (
        (current-stats (default-to {
            games-played: u0, games-won: u0, games-lost: u0, games-drawn: u0,
            total-winnings: u0, total-losses: u0, elo-rating: INITIAL_ELO,
            tournaments-won: u0, tournaments-played: u0,
            joined-at: stacks-block-height, last-active: stacks-block-height
        } (map-get? players player)))
    )
    (map-set players player (merge current-stats {
        games-played: (+ (get games-played current-stats) u1),
        games-drawn: (+ (get games-drawn current-stats) u1),
        last-active: stacks-block-height
    }))
    )
)

(define-private (update-tournament-winner (winner principal))
    (let (
        (current-stats (default-to {
            games-played: u0, games-won: u0, games-lost: u0, games-drawn: u0,
            total-winnings: u0, total-losses: u0, elo-rating: INITIAL_ELO,
            tournaments-won: u0, tournaments-played: u0,
            joined-at: stacks-block-height, last-active: stacks-block-height
        } (map-get? players winner)))
    )
    (map-set players winner (merge current-stats {
        tournaments-won: (+ (get tournaments-won current-stats) u1),
        tournaments-played: (+ (get tournaments-played current-stats) u1),
        last-active: stacks-block-height
    }))
    )
)

(define-private (update-tournament-participation (participant principal) (acc uint))
    (let (
        (current-stats (default-to {
            games-played: u0, games-won: u0, games-lost: u0, games-drawn: u0,
            total-winnings: u0, total-losses: u0, elo-rating: INITIAL_ELO,
            tournaments-won: u0, tournaments-played: u0,
            joined-at: stacks-block-height, last-active: stacks-block-height
        } (map-get? players participant)))
    )
    (map-set players participant (merge current-stats {
        tournaments-played: (+ (get tournaments-played current-stats) u1),
        last-active: stacks-block-height
    }))
    u0
    )
)

;; ELO rating calculation
(define-private (update-elo-ratings (winner principal) (loser principal))
    (let (
        (winner-stats (unwrap-panic (map-get? players winner)))
        (loser-stats (unwrap-panic (map-get? players loser)))
        (winner-elo (get elo-rating winner-stats))
        (loser-elo (get elo-rating loser-stats))
        (elo-changes (calculate-elo-changes winner-elo loser-elo))
        (winner-new-elo (+ winner-elo (get winner-change elo-changes)))
        (loser-new-elo (- loser-elo (get loser-change elo-changes)))
    )
    ;; Update winner ELO
    (map-set players winner (merge winner-stats { elo-rating: winner-new-elo }))
    ;; Update loser ELO
    (map-set players loser (merge loser-stats { elo-rating: loser-new-elo }))
    )
)

(define-private (calculate-elo-changes (winner-elo uint) (loser-elo uint))
    (let (
        (rating-diff (if (> winner-elo loser-elo) (- winner-elo loser-elo) (- loser-elo winner-elo)))
        (k-factor u32) ;; Standard K-factor
        ;; Simplified ELO calculation (proper implementation would use probability tables)
        (change (if (<= rating-diff u200) u16 u8))
    )
    { winner-change: change, loser-change: change }
    )
)

;; Helper function to get or create player stats
(define-private (get-or-create-player (player principal))
    (match (map-get? players player)
        existing-stats existing-stats
        ;; If player doesn't exist, create with default stats
        {
            games-played: u0,
            games-won: u0,
            games-lost: u0,
            games-drawn: u0,
            total-winnings: u0,
            total-losses: u0,
            elo-rating: INITIAL_ELO,
            tournaments-won: u0,
            tournaments-played: u0,
            joined-at: stacks-block-height,
            last-active: stacks-block-height
        }
    )
)

;; Tournament statistics functions
;; #[allow(unchecked_data)]
(define-public (record-tournament-participation (player principal))
    (let (
        (player-stats (get-or-create-player player))
    )
    ;; Only authorized contracts (tournament-manager) can record tournament participation
    (asserts! (contract-call? .platform-manager is-authorized-contract contract-caller) (err ERR_UNAUTHORIZED))
    
    ;; Update tournament participation count
    (map-set players player (merge player-stats {
        tournaments-played: (+ (get tournaments-played player-stats) u1),
        last-active: stacks-block-height
    }))
    (ok true)
    )
)

;; #[allow(unchecked_data)]
(define-public (record-tournament-win (winner principal))
    (let (
        (winner-stats (get-or-create-player winner))
    )
    ;; Only authorized contracts (tournament-manager) can record tournament wins
    (asserts! (contract-call? .platform-manager is-authorized-contract contract-caller) (err ERR_UNAUTHORIZED))
    
    ;; Update tournament win count
    (map-set players winner (merge winner-stats {
        tournaments-won: (+ (get tournaments-won winner-stats) u1),
        last-active: stacks-block-height
    }))
    (ok true)
    )
)

;; Record multiple tournament participants at once
;; #[allow(unchecked_data)]
(define-public (record-tournament-participants (participants (list 32 principal)))
    (begin
    ;; Only authorized contracts can record tournament participation
    (asserts! (contract-call? .platform-manager is-authorized-contract contract-caller) (err ERR_UNAUTHORIZED))
    
    ;; Update each participant's tournament count
    (fold record-single-participant participants (ok u0))
    )
)

(define-private (record-single-participant (player principal) (previous-result (response uint uint)))
    (let (
        (player-stats (get-or-create-player player))
    )
    (map-set players player (merge player-stats {
        tournaments-played: (+ (get tournaments-played player-stats) u1),
        last-active: stacks-block-height
    }))
    (ok u0)
    )
)

;; Get tournament-specific statistics
(define-read-only (get-tournament-stats (player principal))
    (match (map-get? players player)
        player-stats (ok {
            tournaments-played: (get tournaments-played player-stats),
            tournaments-won: (get tournaments-won player-stats),
            tournament-win-rate: (if (> (get tournaments-played player-stats) u0)
                (/ (* (get tournaments-won player-stats) u10000) (get tournaments-played player-stats))
                u0
            )
        })
        (err ERR_PLAYER_NOT_FOUND)
    )
)

;; read only functions
(define-read-only (get-player-stats (player principal))
    (map-get? players player)
)

(define-read-only (get-player-elo (player principal))
    (match (map-get? players player)
        player-data (some (get elo-rating player-data))
        none
    )
)

(define-read-only (get-player-wins (player principal))
    (match (map-get? players player)
        player-data (some (get games-won player-data))
        none
    )
)

(define-read-only (is-player-registered (player principal))
    (is-some (map-get? players player))
)

