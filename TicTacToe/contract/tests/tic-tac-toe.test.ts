
import { Cl } from "@stacks/transactions";
import { describe, expect, it, beforeAll } from "vitest";

let alice: string;
let bob: string;

// Helper function to create a new game with the given bet amount, move index, and move
// on behalf of the `user` address
function createGame(
  betAmount: number,
  moveIndex: number,
  move: number,
  user: string
) {
  return simnet.callPublicFn(
    "tic-tac-toe",
    "create-game",
    [Cl.uint(betAmount), Cl.uint(moveIndex), Cl.uint(move)],
    user
  );
}

// Helper function to join a game with the given move index and move on behalf of the `user` address
function joinGame(moveIndex: number, move: number, user: string) {
  return simnet.callPublicFn(
    "tic-tac-toe",
    "join-game",
    [Cl.uint(0), Cl.uint(moveIndex), Cl.uint(move)],
    user
  );
}

// Helper function to play a move with the given move index and move on behalf of the `user` address
function play(moveIndex: number, move: number, user: string) {
  return simnet.callPublicFn(
    "tic-tac-toe",
    "play",
    [Cl.uint(0), Cl.uint(moveIndex), Cl.uint(move)],
    user
  );
}

describe("Tic Tac Toe Tests", () => {
  beforeAll(() => {
    const accounts = simnet.getAccounts();
    alice = accounts.get("wallet_1")!;
    bob = accounts.get("wallet_2")!;
  });

  it("allows game creation", () => {
    const { result, events } = createGame(100, 0, 1, alice);

    expect(result).toBeOk(Cl.uint(0));
    expect(events.length).toBe(2); // print_event and stx_transfer_event
  });

  it("allows game joining", () => {
    createGame(100, 0, 1, alice);
    const { result, events } = joinGame(1, 2, bob);

    expect(result).toBeOk(Cl.uint(0));
    expect(events.length).toBe(2); // print_event and stx_transfer_event
  });

  it("allows game playing", () => {
    createGame(100, 0, 1, alice);
    joinGame(1, 2, bob);
    const { result, events } = play(2, 1, alice);

    expect(result).toBeOk(Cl.uint(0));
    expect(events.length).toBe(1); // print_event
  });

  it("does not allow creating a game with a bet amount of 0", () => {
    const { result } = createGame(0, 0, 1, alice);
    expect(result).toBeErr(Cl.uint(100));
  });

  it("does not allow joining a game that has already been joined", () => {
    createGame(100, 0, 1, alice);
    joinGame(1, 2, bob);

    const { result } = joinGame(1, 2, alice);
    expect(result).toBeErr(Cl.uint(103));
  });

  it("does not allow an out of bounds move", () => {
    createGame(100, 0, 1, alice);
    joinGame(1, 2, bob);

    const { result } = play(10, 1, alice);
    expect(result).toBeErr(Cl.uint(101));
  });

  it("does not allow a non X or O move", () => {
    createGame(100, 0, 1, alice);
    joinGame(1, 2, bob);

    const { result } = play(2, 3, alice);
    expect(result).toBeErr(Cl.uint(101));
  });

  it("does not allow moving on an occupied spot", () => {
    createGame(100, 0, 1, alice);
    joinGame(1, 2, bob);

    const { result } = play(1, 1, alice);
    expect(result).toBeErr(Cl.uint(101));
  });

  it("allows player one to win", () => {
    createGame(100, 0, 1, alice);
    joinGame(3, 2, bob);
    play(1, 1, alice);
    play(4, 2, bob);
    const { result, events } = play(2, 1, alice);

    expect(result).toBeOk(Cl.uint(0));
    expect(events.length).toBe(2); // print_event and stx_transfer_event

    const gameData = simnet.getMapEntry("tic-tac-toe", "games", Cl.uint(0));
    expect(gameData).toBeSome(
      Cl.tuple({
        "player-one": Cl.principal(alice),
        "player-two": Cl.some(Cl.principal(bob)),
        "is-player-one-turn": Cl.bool(false),
        "bet-amount": Cl.uint(100),
        board: Cl.list([
          Cl.uint(1),
          Cl.uint(1),
          Cl.uint(1),
          Cl.uint(2),
          Cl.uint(2),
          Cl.uint(0),
          Cl.uint(0),
          Cl.uint(0),
          Cl.uint(0),
        ]),
        winner: Cl.some(Cl.principal(alice)),
      })
    );
  });

  it("allows player two to win", () => {
    createGame(100, 0, 1, alice);
    joinGame(3, 2, bob);
    play(1, 1, alice);
    play(4, 2, bob);
    play(8, 1, alice);
    const { result, events } = play(5, 2, bob);

    expect(result).toBeOk(Cl.uint(0));
    expect(events.length).toBe(2); // print_event and stx_transfer_event

    const gameData = simnet.getMapEntry("tic-tac-toe", "games", Cl.uint(0));
    expect(gameData).toBeSome(
      Cl.tuple({
        "player-one": Cl.principal(alice),
        "player-two": Cl.some(Cl.principal(bob)),
        "is-player-one-turn": Cl.bool(true),
        "bet-amount": Cl.uint(100),
        board: Cl.list([
          Cl.uint(1),
          Cl.uint(1),
          Cl.uint(0),
          Cl.uint(2),
          Cl.uint(2),
          Cl.uint(2),
          Cl.uint(0),
          Cl.uint(0),
          Cl.uint(1),
        ]),
        winner: Cl.some(Cl.principal(bob)),
      })
    );
  });

  it("detects a draw", () => {
    createGame(100, 0, 1, alice);  // X at position 0
    joinGame(4, 2, bob);           // O at position 4
    play(1, 1, alice);              // X at position 1
    play(2, 2, bob);                // O at position 2
    play(5, 1, alice);              // X at position 5
    play(3, 2, bob);                // O at position 3
    play(6, 1, alice);              // X at position 6
    play(8, 2, bob);                // O at position 8
    const { result, events } = play(7, 1, alice); // X at position 7 - board full, draw

    expect(result).toBeOk(Cl.uint(0));

    const gameData = simnet.getMapEntry("tic-tac-toe", "games", Cl.uint(0));
    const gameTuple = gameData as any;
    expect(gameTuple.value.data.winner).toBeNone();
    expect(gameTuple.value.data.status.data).toBe("completed");
  });

  it("prevents moves after game is won", () => {
    createGame(100, 0, 1, alice);
    joinGame(3, 2, bob);
    play(1, 1, alice);
    play(4, 2, bob);
    play(2, 1, alice); // Alice wins

    // Try to make another move
    const { result } = play(5, 2, bob);
    expect(result).toBeErr(Cl.uint(104)); // Game already completed
  });

  it("prevents wrong player from making a move", () => {
    createGame(100, 0, 1, alice);
    joinGame(3, 2, bob);

    // Bob tries to move when it's Alice's turn
    const { result } = play(1, 2, bob);
    expect(result).toBeErr(Cl.uint(102)); // Not player's turn
  });

  it("allows diagonal win (top-left to bottom-right)", () => {
    createGame(100, 0, 1, alice);  // X at position 0
    joinGame(1, 2, bob);           // O at position 1
    play(4, 1, alice);             // X at position 4
    play(2, 2, bob);               // O at position 2
    const { result } = play(8, 1, alice); // X at position 8 - diagonal win

    expect(result).toBeOk(Cl.uint(0));

    const gameData = simnet.getMapEntry("tic-tac-toe", "games", Cl.uint(0));
    const gameTuple = gameData as any;
    expect(gameTuple.value.data.winner).toBeSome(Cl.principal(alice));
  });

  it("allows diagonal win (top-right to bottom-left)", () => {
    createGame(100, 2, 1, alice);  // X at position 2
    joinGame(0, 2, bob);           // O at position 0
    play(4, 1, alice);             // X at position 4
    play(1, 2, bob);               // O at position 1
    const { result } = play(6, 1, alice); // X at position 6 - diagonal win

    expect(result).toBeOk(Cl.uint(0));

    const gameData = simnet.getMapEntry("tic-tac-toe", "games", Cl.uint(0));
    const gameTuple = gameData as any;
    expect(gameTuple.value.data.winner).toBeSome(Cl.principal(alice));
  });

  it("allows vertical win", () => {
    createGame(100, 0, 1, alice);  // X at position 0
    joinGame(1, 2, bob);           // O at position 1
    play(3, 1, alice);             // X at position 3
    play(2, 2, bob);               // O at position 2
    const { result } = play(6, 1, alice); // X at position 6 - vertical win

    expect(result).toBeOk(Cl.uint(0));

    const gameData = simnet.getMapEntry("tic-tac-toe", "games", Cl.uint(0));
    const gameTuple = gameData as any;
    expect(gameTuple.value.data.winner).toBeSome(Cl.principal(alice));
  });

  it("increments game counter for multiple games", () => {
    createGame(100, 0, 1, alice);
    createGame(200, 0, 1, bob);

    const gameCounter = simnet.callReadOnlyFn(
      "tic-tac-toe",
      "get-game-counter",
      [],
      alice
    );

    expect(gameCounter.result).toBeUint(2);
  });

  it("retrieves game data correctly", () => {
    createGame(100, 0, 1, alice);

    const gameData = simnet.callReadOnlyFn(
      "tic-tac-toe",
      "get-game",
      [Cl.uint(0)],
      alice
    );

    expect(gameData.result).toBeSome(
      Cl.tuple({
        "player-one": Cl.principal(alice),
        "player-two": Cl.none(),
        "is-player-one-turn": Cl.bool(false),
        "bet-amount": Cl.uint(100),
        board: Cl.list([
          Cl.uint(1),
          Cl.uint(0),
          Cl.uint(0),
          Cl.uint(0),
          Cl.uint(0),
          Cl.uint(0),
          Cl.uint(0),
          Cl.uint(0),
          Cl.uint(0),
        ]),
        winner: Cl.none(),
      })
    );
  });
});
