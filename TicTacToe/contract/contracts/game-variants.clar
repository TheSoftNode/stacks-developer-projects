;; title: game-variants
;; version: 1.0.0
;; summary: Multi-size tic-tac-toe game variants (4x4, 5x5) with custom rules
;; description: Supports different board sizes and win conditions for enhanced gameplay

;; constants
(define-constant ERR_UNAUTHORIZED u401)
(define-constant ERR_INVALID_VARIANT u402)
(define-constant ERR_INVALID_MOVE u403)
(define-constant ERR_GAME_NOT_FOUND u404)
(define-constant ERR_GAME_FINISHED u405)
(define-constant ERR_NOT_YOUR_TURN u406)
(define-constant ERR_INVALID_BOARD_SIZE u407)
(define-constant ERR_GAME_FULL u408)

;; Board size constants
(define-constant BOARD_3X3 u9)
(define-constant BOARD_4X4 u16) 
(define-constant BOARD_5X5 u25)

;; Variant type constants
(define-constant VARIANT_CLASSIC u1)    ;; 3x3, 3-in-a-row
(define-constant VARIANT_EXTENDED u2)   ;; 4x4, 4-in-a-row
(define-constant VARIANT_LARGE u3)      ;; 5x5, 5-in-a-row
(define-constant VARIANT_TACTICAL u4)   ;; 4x4, 3-in-a-row (easier win condition)
(define-constant VARIANT_STRATEGIC u5)  ;; 5x5, 4-in-a-row (strategic play)

;; data vars
(define-data-var latest-variant-game-id uint u0)

;; data maps
(define-map variant-games
    uint ;; game-id
    {
        variant-type: uint,
        board-size: uint,
        win-condition: uint, ;; cells in a row needed to win
        player-one: principal,
        player-two: (optional principal),
        is-player-one-turn: bool,
        bet-amount: uint,
        board: (list 25 uint), ;; Max size for 5x5 board
        winner: (optional principal),
        last-move-block: uint,
        created-at-block: uint,
        status: (string-ascii 20)
    }
)

;; Variant configurations
(define-map variant-configs
    uint ;; variant-type
    {
        board-size: uint,
        win-condition: uint,
        variant-name: (string-ascii 20),
        min-bet-multiplier: uint ;; multiplier for minimum bet
    }
)

;; Create a variant game
;; #[allow(unchecked_data)]
(define-public (create-variant-game (variant-type uint) (bet-amount uint) (move-index uint))
    (let (
        (game-id (var-get latest-variant-game-id))
        (config (unwrap! (map-get? variant-configs variant-type) (err ERR_INVALID_VARIANT)))
        (board-size (get board-size config))
        (starting-board (create-empty-board board-size))
        (game-board (unwrap! (place-move starting-board move-index u1 board-size) (err ERR_INVALID_MOVE)))
        (min-bet (contract-call? .platform-manager get-min-bet-amount))
        (required-bet (* min-bet (get min-bet-multiplier config)))
        (game-data {
            variant-type: variant-type,
            board-size: board-size,
            win-condition: (get win-condition config),
            player-one: contract-caller,
            player-two: none,
            is-player-one-turn: false,
            bet-amount: bet-amount,
            board: game-board,
            winner: none,
            last-move-block: stacks-block-height,
            created-at-block: stacks-block-height,
            status: "active"
        })
    )
    ;; Check if platform is paused
    (asserts! (not (contract-call? .platform-manager is-paused)) (err ERR_UNAUTHORIZED))
    ;; Validate bet amount for variant
    (asserts! (>= bet-amount required-bet) (err ERR_UNAUTHORIZED))
    ;; Validate move position for board size
    (asserts! (< move-index board-size) (err ERR_INVALID_MOVE))
    
    ;; Transfer bet amount
    (try! (stx-transfer? bet-amount contract-caller (as-contract tx-sender)))
    
    ;; Create game
    (map-set variant-games game-id game-data)
    (var-set latest-variant-game-id (+ game-id u1))
    
    ;; Log game creation
    (print { action: "create-variant-game", game-id: game-id, variant-type: variant-type, creator: contract-caller })
    (ok game-id)
    )
)

;; Join a variant game
;; #[allow(unchecked_data)]
(define-public (join-variant-game (game-id uint) (move-index uint))
    (let (
        (original-game-data (unwrap! (map-get? variant-games game-id) (err ERR_GAME_NOT_FOUND)))
        (board-size (get board-size original-game-data))
        (original-board (get board original-game-data))
        (game-board (unwrap! (place-move original-board move-index u2 board-size) (err ERR_INVALID_MOVE)))
        (game-data (merge original-game-data {
            board: game-board,
            player-two: (some contract-caller),
            is-player-one-turn: true,
            last-move-block: stacks-block-height
        }))
    )
    ;; Check if platform is paused
    (asserts! (not (contract-call? .platform-manager is-paused)) (err ERR_UNAUTHORIZED))
    ;; Ensure game can be joined
    (asserts! (is-none (get player-two original-game-data)) (err ERR_GAME_FULL))
    (asserts! (is-eq (get status original-game-data) "active") (err ERR_GAME_FINISHED))
    ;; Validate move position
    (asserts! (< move-index board-size) (err ERR_INVALID_MOVE))
    
    ;; Transfer bet amount
    (try! (stx-transfer? (get bet-amount original-game-data) contract-caller (as-contract tx-sender)))
    
    ;; Update game
    (map-set variant-games game-id game-data)
    
    ;; Log join
    (print { action: "join-variant-game", game-id: game-id, player-two: contract-caller })
    (ok true)
    )
)

;; Make a move in variant game
;; #[allow(unchecked_data)]
(define-public (play-variant-move (game-id uint) (move-index uint))
    (let (
        (original-game-data (unwrap! (map-get? variant-games game-id) (err ERR_GAME_NOT_FOUND)))
        (board-size (get board-size original-game-data))
        (win-condition (get win-condition original-game-data))
        (is-player-one-turn (get is-player-one-turn original-game-data))
        (player-turn (if is-player-one-turn (get player-one original-game-data) (unwrap! (get player-two original-game-data) (err ERR_GAME_NOT_FOUND))))
        (expected-move (if is-player-one-turn u1 u2))
        (original-board (get board original-game-data))
        (game-board (unwrap! (place-move original-board move-index expected-move board-size) (err ERR_INVALID_MOVE)))
        (is-now-winner (check-win-condition game-board board-size win-condition))
        (is-now-draw (and (is-board-full game-board board-size) (not is-now-winner)))
        (new-status (if (or is-now-winner is-now-draw) "finished" "active"))
        (game-data (merge original-game-data {
            board: game-board,
            is-player-one-turn: (not is-player-one-turn),
            winner: (if is-now-winner (some player-turn) none),
            last-move-block: stacks-block-height,
            status: new-status
        }))
    )
    ;; Check if platform is paused
    (asserts! (not (contract-call? .platform-manager is-paused)) (err ERR_UNAUTHORIZED))
    ;; Validate game state and player
    (asserts! (is-eq (get status original-game-data) "active") (err ERR_GAME_FINISHED))
    (asserts! (is-eq player-turn contract-caller) (err ERR_NOT_YOUR_TURN))
    (asserts! (is-some (get player-two original-game-data)) (err ERR_GAME_NOT_FOUND))
    ;; Validate move
    (asserts! (< move-index board-size) (err ERR_INVALID_MOVE))
    
    ;; Handle game completion
    (if is-now-winner 
        (let (
            (winner player-turn)
            (loser (if is-player-one-turn (unwrap-panic (get player-two original-game-data)) (get player-one original-game-data)))
            (prize-amount (* u2 (get bet-amount game-data)))
        )
        ;; Winner gets both bets
        (try! (as-contract (stx-transfer? prize-amount tx-sender winner)))
        ;; Record game result in player registry
        (try! (contract-call? .player-registry record-game-result winner loser prize-amount (get bet-amount game-data)))
        )
        ;; If it's a draw, return bet to both players
        (if is-now-draw
            (begin
                (try! (as-contract (stx-transfer? (get bet-amount game-data) tx-sender (get player-one original-game-data))))
                (try! (as-contract (stx-transfer? (get bet-amount game-data) tx-sender (unwrap-panic (get player-two original-game-data)))))
                ;; Record draw result in player registry
                (try! (contract-call? .player-registry record-draw-result (get player-one original-game-data) (unwrap-panic (get player-two original-game-data))))
            )
            false
        )
    )
    
    ;; Update game
    (map-set variant-games game-id game-data)
    
    ;; Log move
    (print { action: "play-variant-move", game-id: game-id, player: contract-caller, position: move-index })
    (ok game-id)
    )
)

;; Private helper functions
(define-private (create-empty-board (size uint))
    (if (is-eq size BOARD_3X3)
        (list u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0)
        (if (is-eq size BOARD_4X4)
            (list u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0)
            (list u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0 u0)
        )
    )
)

(define-private (place-move (board (list 25 uint)) (position uint) (player uint) (board-size uint))
    (if (< position board-size)
        (if (is-eq (unwrap! (element-at? board position) (err ERR_INVALID_MOVE)) u0)
            (ok (unwrap! (replace-at? board position player) (err ERR_INVALID_MOVE)))
            (err ERR_INVALID_MOVE)
        )
        (err ERR_INVALID_MOVE)
    )
)

(define-private (is-board-full (board (list 25 uint)) (size uint))
    (is-eq (len (filter check-non-zero (slice board u0 size))) size)
)

(define-private (check-non-zero (cell uint))
    (> cell u0)
)

(define-private (slice (board (list 25 uint)) (start uint) (end uint))
    ;; Simplified slice implementation - returns first 'end' elements
    (if (is-eq end u9)
        (list (unwrap-panic (element-at? board u0)) (unwrap-panic (element-at? board u1)) (unwrap-panic (element-at? board u2))
              (unwrap-panic (element-at? board u3)) (unwrap-panic (element-at? board u4)) (unwrap-panic (element-at? board u5))
              (unwrap-panic (element-at? board u6)) (unwrap-panic (element-at? board u7)) (unwrap-panic (element-at? board u8)))
        (if (is-eq end u16)
            (list (unwrap-panic (element-at? board u0)) (unwrap-panic (element-at? board u1)) (unwrap-panic (element-at? board u2)) (unwrap-panic (element-at? board u3))
                  (unwrap-panic (element-at? board u4)) (unwrap-panic (element-at? board u5)) (unwrap-panic (element-at? board u6)) (unwrap-panic (element-at? board u7))
                  (unwrap-panic (element-at? board u8)) (unwrap-panic (element-at? board u9)) (unwrap-panic (element-at? board u10)) (unwrap-panic (element-at? board u11))
                  (unwrap-panic (element-at? board u12)) (unwrap-panic (element-at? board u13)) (unwrap-panic (element-at? board u14)) (unwrap-panic (element-at? board u15)))
            board ;; 5x5 case
        )
    )
)

(define-private (check-win-condition (board (list 25 uint)) (board-size uint) (win-condition uint))
    (if (is-eq board-size BOARD_3X3)
        (check-win-3x3 board)
        (if (is-eq board-size BOARD_4X4)
            (check-win-4x4 board win-condition)
            (check-win-5x5 board win-condition)
        )
    )
)

;; 3x3 win check (standard tic-tac-toe)
(define-private (check-win-3x3 (board (list 25 uint)))
    (or
        (is-line-variant board u0 u1 u2) ;; Row 1
        (is-line-variant board u3 u4 u5) ;; Row 2
        (is-line-variant board u6 u7 u8) ;; Row 3
        (is-line-variant board u0 u3 u6) ;; Column 1
        (is-line-variant board u1 u4 u7) ;; Column 2
        (is-line-variant board u2 u5 u8) ;; Column 3
        (is-line-variant board u0 u4 u8) ;; Diagonal top-left to bottom-right
        (is-line-variant board u2 u4 u6) ;; Diagonal top-right to bottom-left
    )
)

;; 4x4 win check (depends on win condition: 3 or 4 in a row)
(define-private (check-win-4x4 (board (list 25 uint)) (win-condition uint))
    (if (is-eq win-condition u3)
        (check-4x4-3-in-row board)
        (check-4x4-4-in-row board)
    )
)

;; Check for 3-in-a-row on 4x4 board (tactical variant)
(define-private (check-4x4-3-in-row (board (list 25 uint)))
    (or
        ;; Horizontal 3-in-a-row
        (is-line-variant board u0 u1 u2)
        (is-line-variant board u1 u2 u3)
        (is-line-variant board u4 u5 u6)
        (is-line-variant board u5 u6 u7)
        (is-line-variant board u8 u9 u10)
        (is-line-variant board u9 u10 u11)
        (is-line-variant board u12 u13 u14)
        (is-line-variant board u13 u14 u15)
        ;; Vertical 3-in-a-row
        (is-line-variant board u0 u4 u8)
        (is-line-variant board u4 u8 u12)
        (is-line-variant board u1 u5 u9)
        (is-line-variant board u5 u9 u13)
        (is-line-variant board u2 u6 u10)
        (is-line-variant board u6 u10 u14)
        (is-line-variant board u3 u7 u11)
        (is-line-variant board u7 u11 u15)
        ;; Diagonal 3-in-a-row
        (is-line-variant board u0 u5 u10)
        (is-line-variant board u5 u10 u15)
        (is-line-variant board u3 u6 u9)
        (is-line-variant board u6 u9 u12)
        (is-line-variant board u1 u6 u11)
        (is-line-variant board u4 u9 u14)
        (is-line-variant board u2 u5 u8)
        (is-line-variant board u7 u10 u13)
    )
)

;; Check for 4-in-a-row on 4x4 board (extended variant)
(define-private (check-4x4-4-in-row (board (list 25 uint)))
    (or
        ;; Horizontal 4-in-a-row
        (is-line-4 board u0 u1 u2 u3)
        (is-line-4 board u4 u5 u6 u7)
        (is-line-4 board u8 u9 u10 u11)
        (is-line-4 board u12 u13 u14 u15)
        ;; Vertical 4-in-a-row
        (is-line-4 board u0 u4 u8 u12)
        (is-line-4 board u1 u5 u9 u13)
        (is-line-4 board u2 u6 u10 u14)
        (is-line-4 board u3 u7 u11 u15)
        ;; Diagonal 4-in-a-row
        (is-line-4 board u0 u5 u10 u15)
        (is-line-4 board u3 u6 u9 u12)
    )
)

;; 5x5 win check (depends on win condition: 4 or 5 in a row)
(define-private (check-win-5x5 (board (list 25 uint)) (win-condition uint))
    (if (is-eq win-condition u4)
        (check-5x5-4-in-row board)
        (check-5x5-5-in-row board)
    )
)

;; Check for 4-in-a-row on 5x5 board (strategic variant)
(define-private (check-5x5-4-in-row (board (list 25 uint)))
    (or
        ;; Horizontal 4-in-a-row
        (is-line-4 board u0 u1 u2 u3)
        (is-line-4 board u1 u2 u3 u4)
        (is-line-4 board u5 u6 u7 u8)
        (is-line-4 board u6 u7 u8 u9)
        (is-line-4 board u10 u11 u12 u13)
        (is-line-4 board u11 u12 u13 u14)
        (is-line-4 board u15 u16 u17 u18)
        (is-line-4 board u16 u17 u18 u19)
        (is-line-4 board u20 u21 u22 u23)
        (is-line-4 board u21 u22 u23 u24)
        ;; Vertical 4-in-a-row
        (is-line-4 board u0 u5 u10 u15)
        (is-line-4 board u5 u10 u15 u20)
        (is-line-4 board u1 u6 u11 u16)
        (is-line-4 board u6 u11 u16 u21)
        (is-line-4 board u2 u7 u12 u17)
        (is-line-4 board u7 u12 u17 u22)
        (is-line-4 board u3 u8 u13 u18)
        (is-line-4 board u8 u13 u18 u23)
        (is-line-4 board u4 u9 u14 u19)
        (is-line-4 board u9 u14 u19 u24)
        ;; Diagonal 4-in-a-row (main diagonals)
        (is-line-4 board u0 u6 u12 u18)
        (is-line-4 board u6 u12 u18 u24)
        (is-line-4 board u4 u8 u12 u16)
        (is-line-4 board u8 u12 u16 u20)
        ;; Diagonal 4-in-a-row (secondary diagonals)
        (is-line-4 board u1 u7 u13 u19)
        (is-line-4 board u5 u11 u17 u23)
        (is-line-4 board u3 u7 u11 u15)
        (is-line-4 board u9 u13 u17 u21)
    )
)

;; Check for 5-in-a-row on 5x5 board (large variant)
(define-private (check-5x5-5-in-row (board (list 25 uint)))
    (or
        ;; Horizontal 5-in-a-row
        (is-line-5 board u0 u1 u2 u3 u4)
        (is-line-5 board u5 u6 u7 u8 u9)
        (is-line-5 board u10 u11 u12 u13 u14)
        (is-line-5 board u15 u16 u17 u18 u19)
        (is-line-5 board u20 u21 u22 u23 u24)
        ;; Vertical 5-in-a-row
        (is-line-5 board u0 u5 u10 u15 u20)
        (is-line-5 board u1 u6 u11 u16 u21)
        (is-line-5 board u2 u7 u12 u17 u22)
        (is-line-5 board u3 u8 u13 u18 u23)
        (is-line-5 board u4 u9 u14 u19 u24)
        ;; Diagonal 5-in-a-row
        (is-line-5 board u0 u6 u12 u18 u24)
        (is-line-5 board u4 u8 u12 u16 u20)
    )
)

;; Helper function to check if 3 cells form a winning line
(define-private (is-line-variant (board (list 25 uint)) (a uint) (b uint) (c uint))
    (let (
        (a-val (unwrap! (element-at? board a) false))
        (b-val (unwrap! (element-at? board b) false))
        (c-val (unwrap! (element-at? board c) false))
    )
    (and (is-eq a-val b-val) (is-eq a-val c-val) (not (is-eq a-val u0)))
    )
)

;; Helper function to check if 4 cells form a winning line
(define-private (is-line-4 (board (list 25 uint)) (a uint) (b uint) (c uint) (d uint))
    (let (
        (a-val (unwrap! (element-at? board a) false))
        (b-val (unwrap! (element-at? board b) false))
        (c-val (unwrap! (element-at? board c) false))
        (d-val (unwrap! (element-at? board d) false))
    )
    (and
        (is-eq a-val b-val)
        (is-eq a-val c-val)
        (is-eq a-val d-val)
        (not (is-eq a-val u0))
    )
    )
)

;; Helper function to check if 5 cells form a winning line
(define-private (is-line-5 (board (list 25 uint)) (a uint) (b uint) (c uint) (d uint) (e uint))
    (let (
        (a-val (unwrap! (element-at? board a) false))
        (b-val (unwrap! (element-at? board b) false))
        (c-val (unwrap! (element-at? board c) false))
        (d-val (unwrap! (element-at? board d) false))
        (e-val (unwrap! (element-at? board e) false))
    )
    (and
        (is-eq a-val b-val)
        (is-eq a-val c-val)
        (is-eq a-val d-val)
        (is-eq a-val e-val)
        (not (is-eq a-val u0))
    )
    )
)

;; read only functions
(define-read-only (get-variant-game (game-id uint))
    (map-get? variant-games game-id)
)

(define-read-only (get-latest-variant-game-id)
    (var-get latest-variant-game-id)
)

(define-read-only (get-variant-config (variant-type uint))
    (map-get? variant-configs variant-type)
)

;; Initialize variant configurations
(map-set variant-configs VARIANT_CLASSIC { board-size: u9, win-condition: u3, variant-name: "Classic 3x3", min-bet-multiplier: u1 })
(map-set variant-configs VARIANT_EXTENDED { board-size: u16, win-condition: u4, variant-name: "Extended 4x4", min-bet-multiplier: u2 })
(map-set variant-configs VARIANT_LARGE { board-size: u25, win-condition: u5, variant-name: "Large 5x5", min-bet-multiplier: u3 })
(map-set variant-configs VARIANT_TACTICAL { board-size: u16, win-condition: u3, variant-name: "Tactical 4x3", min-bet-multiplier: u2 })
(map-set variant-configs VARIANT_STRATEGIC { board-size: u25, win-condition: u4, variant-name: "Strategic 5x4", min-bet-multiplier: u3 })