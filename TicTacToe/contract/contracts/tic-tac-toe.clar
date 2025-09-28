
;; title: tic-tac-toe
;; version: 1.0.0
;; summary: A multiplayer tic-tac-toe game with STX betting
;; description: Allows players to create games, join games, and play tic-tac-toe with STX token bets

;; constants
(define-constant THIS_CONTRACT (as-contract tx-sender))
(define-constant ERR_MIN_BET_AMOUNT u100)
(define-constant ERR_INVALID_MOVE u101)
(define-constant ERR_GAME_NOT_FOUND u102)
(define-constant ERR_GAME_CANNOT_BE_JOINED u103)
(define-constant ERR_NOT_YOUR_TURN u104)
(define-constant ERR_GAME_TIMEOUT u105)
(define-constant ERR_GAME_FINISHED u106)
(define-constant ERR_NOT_ABANDONED u107)
(define-constant ERR_PLATFORM_PAUSED u108)
(define-constant ERR_INVALID_BET_AMOUNT u109)

;; data vars
;; The Game ID to use for the next game
(define-data-var latest-game-id uint u0)

;; data maps
(define-map games
    uint ;; Key (Game ID)
    { ;; Value (Game Tuple)
        player-one: principal,
        player-two: (optional principal),
        is-player-one-turn: bool,
        bet-amount: uint,
        board: (list 9 uint),
        winner: (optional principal),
        last-move-block: uint,
        created-at-block: uint,
        status: (string-ascii 20), ;; "active", "finished", "abandoned"
        tournament-id: (optional uint), ;; Tournament context
        tournament-round: (optional uint), ;; Tournament round
        tournament-position: (optional uint) ;; Position in tournament bracket
    }
)

;; private functions
;; Check if a game has timed out (no move for configured timeout blocks)
(define-private (is-game-timed-out (game-data {player-one: principal, player-two: (optional principal), is-player-one-turn: bool, bet-amount: uint, board: (list 9 uint), winner: (optional principal), last-move-block: uint, created-at-block: uint, status: (string-ascii 20), tournament-id: (optional uint), tournament-round: (optional uint), tournament-position: (optional uint)}))
    (let (
        (timeout-blocks (contract-call? .platform-manager get-move-timeout))
    )
    (and 
        (is-eq (get status game-data) "active")
        (> (- stacks-block-height (get last-move-block game-data)) timeout-blocks)
        (is-some (get player-two game-data)) ;; Game must have both players
    )
    )
)

;; Check if a game is active and can be played
(define-private (is-game-active (game-data {player-one: principal, player-two: (optional principal), is-player-one-turn: bool, bet-amount: uint, board: (list 9 uint), winner: (optional principal), last-move-block: uint, created-at-block: uint, status: (string-ascii 20), tournament-id: (optional uint), tournament-round: (optional uint), tournament-position: (optional uint)}))
    (and
        (is-eq (get status game-data) "active")
        (is-none (get winner game-data))
        (is-some (get player-two game-data))
    )
)
;; Validate that a move is valid (within bounds, X or O, and on an empty spot)
(define-private (validate-move (board (list 9 uint)) (move-index uint) (move uint))
    (let (
        ;; Validate that the move is being played within range of the board
        (index-in-range (and (>= move-index u0) (< move-index u9)))
        ;; Validate that the move is either an X or an O
        (x-or-o (or (is-eq move u1) (is-eq move u2)))
        ;; Validate that the cell the move is being played on is currently empty
        (empty-spot (is-eq (unwrap! (element-at? board move-index) false) u0))
    )
    ;; All three conditions must be true for the move to be valid
    (and (is-eq index-in-range true) (is-eq x-or-o true) empty-spot)
))

;; Given a board and three cells to look at on the board
;; Return true if all three are not empty and are the same value (all X or all O)
;; Return false if any of the three is empty or a different value
(define-private (is-line (board (list 9 uint)) (a uint) (b uint) (c uint))
    (let (
        ;; Value of cell at index a
        (a-val (unwrap! (element-at? board a) false))
        ;; Value of cell at index b
        (b-val (unwrap! (element-at? board b) false))
        ;; Value of cell at index c
        (c-val (unwrap! (element-at? board c) false))
    )
    ;; a-val must equal b-val and must also equal c-val while not being empty (non-zero)
    (and (is-eq a-val b-val) (is-eq a-val c-val) (not (is-eq a-val u0)))
))

;; Given a board, return true if any possible three-in-a-row line has been completed
(define-private (has-won (board (list 9 uint)))
    (or
        (is-line board u0 u1 u2) ;; Row 1
        (is-line board u3 u4 u5) ;; Row 2
        (is-line board u6 u7 u8) ;; Row 3
        (is-line board u0 u3 u6) ;; Column 1
        (is-line board u1 u4 u7) ;; Column 2
        (is-line board u2 u5 u8) ;; Column 3
        (is-line board u0 u4 u8) ;; Left to Right Diagonal
        (is-line board u2 u4 u6) ;; Right to Left Diagonal
    )
)

;; Check if the board is full (all cells occupied)
(define-private (is-board-full (board (list 9 uint)))
    (is-eq (len (filter is-cell-empty board)) u0)
)

(define-private (is-cell-empty (cell uint))
    (is-eq cell u0)
)

;; Check if the game is a draw (board full and no winner)
(define-private (is-draw (board (list 9 uint)))
    (and 
        (is-board-full board)
        (not (has-won board))
    )
)

;; public functions
;; Create a new game with a bet amount and initial move
(define-public (create-game (bet-amount uint) (move-index uint) (move uint))
    (let (
        ;; Get the Game ID to use for creation of this new game
        (game-id (var-get latest-game-id))
        ;; The initial starting board for the game with all cells empty
        (starting-board (list u0 u0 u0 u0 u0 u0 u0 u0 u0))
        ;; Updated board with the starting move played by the game creator (X)
        (game-board (unwrap! (replace-at? starting-board move-index move) (err ERR_INVALID_MOVE)))
        ;; Create the game data tuple (player one address, bet amount, game board, and mark next turn to be player two's turn)
        (game-data {
            player-one: contract-caller,
            player-two: none,
            is-player-one-turn: false,
            bet-amount: bet-amount,
            board: game-board,
            winner: none,
            last-move-block: stacks-block-height,
            created-at-block: stacks-block-height,
            status: "active",
            tournament-id: none,
            tournament-round: none,
            tournament-position: none
        })
    )
    ;; Check if platform is paused
    (asserts! (not (contract-call? .platform-manager is-paused)) (err ERR_PLATFORM_PAUSED))
    ;; Ensure that user has put up a bet amount greater than the minimum from platform manager
    (asserts! (>= bet-amount (contract-call? .platform-manager get-min-bet-amount)) (err ERR_INVALID_BET_AMOUNT))
    ;; Ensure that the move being played is an `X`, not an `O`
    (asserts! (is-eq move u1) (err ERR_INVALID_MOVE))
    ;; Ensure that the move meets validity requirements
    (asserts! (validate-move starting-board move-index move) (err ERR_INVALID_MOVE))

    ;; Transfer the bet amount STX from user to this contract
    (try! (stx-transfer? bet-amount contract-caller THIS_CONTRACT))
    ;; Update the games map with the new game data
    (map-set games game-id game-data)
    ;; Increment the Game ID counter
    (var-set latest-game-id (+ game-id u1))

    ;; Log the creation of the new game
    (print { action: "create-game", data: game-data})
    ;; Return the Game ID of the new game
    (ok game-id)
))

;; Create a tournament game between two specific players
;; #[allow(unchecked_data)]
(define-public (create-tournament-game (player-one principal) (player-two principal) (bet-amount uint) (tournament-id uint) (round uint) (position uint))
    (let (
        ;; Get the Game ID to use for creation of this new game
        (game-id (var-get latest-game-id))
        ;; Empty board for tournament games
        (starting-board (list u0 u0 u0 u0 u0 u0 u0 u0 u0))
        ;; Create the tournament game data
        (game-data {
            player-one: player-one,
            player-two: (some player-two),
            is-player-one-turn: true,
            bet-amount: bet-amount,
            board: starting-board,
            winner: none,
            last-move-block: stacks-block-height,
            created-at-block: stacks-block-height,
            status: "active",
            tournament-id: (some tournament-id),
            tournament-round: (some round),
            tournament-position: (some position)
        })
    )
    ;; Check if platform is paused
    (asserts! (not (contract-call? .platform-manager is-paused)) (err ERR_PLATFORM_PAUSED))
    ;; Only tournament manager can create tournament games
    (asserts! (is-eq contract-caller .tournament-manager) (err ERR_NOT_YOUR_TURN))
    
    ;; Update the games map with the new game data
    (map-set games game-id game-data)
    ;; Increment the Game ID counter
    (var-set latest-game-id (+ game-id u1))

    ;; Log the creation of the tournament game
    (print { action: "create-tournament-game", game-id: game-id, tournament-id: tournament-id, round: round })
    ;; Return the Game ID of the new game
    (ok game-id)
    )
)

;; Join an existing game as player two
(define-public (join-game (game-id uint) (move-index uint) (move uint))
    (let (
        ;; Load the game data for the game being joined, throw an error if Game ID is invalid
        (original-game-data (unwrap! (map-get? games game-id) (err ERR_GAME_NOT_FOUND)))
        ;; Get the original board from the game data
        (original-board (get board original-game-data))
        ;; Update the game board by placing the player's move at the specified index
        (game-board (unwrap! (replace-at? original-board move-index move) (err ERR_INVALID_MOVE)))
        ;; Update the copy of the game data with the updated board and marking the next turn to be player one's turn
        (game-data (merge original-game-data {
            board: game-board,
            player-two: (some contract-caller),
            is-player-one-turn: true,
            last-move-block: stacks-block-height
        }))
    )
    ;; Check if platform is paused
    (asserts! (not (contract-call? .platform-manager is-paused)) (err ERR_PLATFORM_PAUSED))
    ;; Ensure that the game being joined is able to be joined
    ;; i.e. player-two is currently empty
    (asserts! (is-none (get player-two original-game-data)) (err ERR_GAME_CANNOT_BE_JOINED))
    ;; Ensure that the move being played is an `O`, not an `X`
    (asserts! (is-eq move u2) (err ERR_INVALID_MOVE))
    ;; Ensure that the move meets validity requirements
    (asserts! (validate-move original-board move-index move) (err ERR_INVALID_MOVE))

    ;; Transfer the bet amount STX from user to this contract
    (try! (stx-transfer? (get bet-amount original-game-data) contract-caller THIS_CONTRACT))
    ;; Update the games map with the new game data
    (map-set games game-id game-data)

    ;; Log the joining of the game
    (print { action: "join-game", data: game-data})
    ;; Return the Game ID of the game
    (ok game-id)
))

;; Make a move in an existing game
;; #[allow(unchecked_data)]
(define-public (play (game-id uint) (move-index uint) (move uint))
    (let (
        ;; Load the game data for the game being joined, throw an error if Game ID is invalid
        (original-game-data (unwrap! (map-get? games game-id) (err ERR_GAME_NOT_FOUND)))
        ;; Get the original board from the game data
        (original-board (get board original-game-data))
        ;; Is it player one's turn?
        (is-player-one-turn (get is-player-one-turn original-game-data))
        ;; Get the player whose turn it currently is based on the is-player-one-turn flag
        (player-turn (if is-player-one-turn (get player-one original-game-data) (unwrap! (get player-two original-game-data) (err ERR_GAME_NOT_FOUND))))
        ;; Get the expected move based on whose turn it is (X or O?)
        (expected-move (if is-player-one-turn u1 u2))
        ;; Update the game board by placing the player's move at the specified index
        (game-board (unwrap! (replace-at? original-board move-index move) (err ERR_INVALID_MOVE)))
        ;; Check if the game has been won now with this modified board
        (is-now-winner (has-won game-board))
        ;; Check if the game is a draw
        (is-now-draw (is-draw game-board))
        ;; Determine game status
        (new-status (if (or is-now-winner is-now-draw) "finished" "active"))
        ;; Merge the game data with the updated board and marking the next turn to be player two's turn
        ;; Also mark the winner if the game has been won
        (game-data (merge original-game-data {
            board: game-board,
            is-player-one-turn: (not is-player-one-turn),
            winner: (if is-now-winner (some player-turn) none),
            last-move-block: stacks-block-height,
            status: new-status
        }))
    )
    ;; Check if platform is paused
    (asserts! (not (contract-call? .platform-manager is-paused)) (err ERR_PLATFORM_PAUSED))
    ;; Ensure that the game is still active and can be played
    (asserts! (is-game-active original-game-data) (err ERR_GAME_FINISHED))
    ;; Ensure that the function is being called by the player whose turn it is
    (asserts! (is-eq player-turn contract-caller) (err ERR_NOT_YOUR_TURN))
    ;; Ensure that the move being played is the correct move based on the current turn (X or O)
    (asserts! (is-eq move expected-move) (err ERR_INVALID_MOVE))
    ;; Ensure that the move meets validity requirements
    (asserts! (validate-move original-board move-index move) (err ERR_INVALID_MOVE))

    ;; Handle prize distribution and player statistics
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

    ;; Update the games map with the new game data
    (map-set games game-id game-data)
    
    ;; Handle tournament game completion if applicable
    (try! (handle-tournament-game-completion game-id game-data))

    ;; Log the action of a move being made
    (print {action: "play", data: game-data})
    ;; Return the Game ID of the game
    (ok game-id)
))

;; Function to handle tournament game completion
(define-private (handle-tournament-game-completion (game-id uint) (game-data {player-one: principal, player-two: (optional principal), is-player-one-turn: bool, bet-amount: uint, board: (list 9 uint), winner: (optional principal), last-move-block: uint, created-at-block: uint, status: (string-ascii 20), tournament-id: (optional uint), tournament-round: (optional uint), tournament-position: (optional uint)}))
    (match (get tournament-id game-data)
        tournament-id-val (match (get tournament-round game-data)
            round-val (match (get tournament-position game-data)
                position-val (match (get winner game-data)
                    winner-val (begin
                        ;; Notify tournament manager of the result
                        (try! (contract-call? .tournament-manager record-match-result 
                            tournament-id-val 
                            round-val 
                            position-val 
                            winner-val 
                            game-id))
                        (ok true)
                    )
                    (ok true) ;; No winner yet
                )
                (ok true) ;; No position
            )
            (ok true) ;; No round
        )
        (ok true) ;; Not a tournament game
    )
)

;; Claim an abandoned game and recover funds
(define-public (claim-abandoned-game (game-id uint))
    (let (
        ;; Load the game data
        (game-data (unwrap! (map-get? games game-id) (err ERR_GAME_NOT_FOUND)))
        ;; Calculate total prize amount (both players' bets)
        (total-prize (* u2 (get bet-amount game-data)))
        ;; Updated game data marking it as abandoned
        (updated-game-data (merge game-data {
            status: "abandoned",
            winner: (some contract-caller)
        }))
    )
    ;; Ensure the game has timed out
    (asserts! (is-game-timed-out game-data) (err ERR_NOT_ABANDONED))
    ;; Ensure the claimer is one of the players
    (asserts! (or 
        (is-eq contract-caller (get player-one game-data))
        (is-eq contract-caller (unwrap! (get player-two game-data) (err ERR_GAME_NOT_FOUND)))
    ) (err ERR_NOT_YOUR_TURN))

    ;; Transfer the total prize to the claiming player
    (try! (as-contract (stx-transfer? total-prize tx-sender contract-caller)))
    ;; Update the games map with the abandoned status
    (map-set games game-id updated-game-data)

    ;; Log the game abandonment claim
    (print { action: "claim-abandoned-game", game-id: game-id, claimer: contract-caller, amount: total-prize })
    ;; Return success
    (ok game-id)
))

;; read only functions
;; Get game data by game ID
(define-read-only (get-game (game-id uint))
    (map-get? games game-id)
)

;; Get the latest game ID counter
(define-read-only (get-latest-game-id)
    (var-get latest-game-id)
)

