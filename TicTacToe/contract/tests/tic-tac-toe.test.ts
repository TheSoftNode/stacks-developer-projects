
import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const alice = accounts.get("wallet_1")!;
const bob = accounts.get("wallet_2")!;

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
  it("allows game creation", () => {
    const { result, events } = createGame(1000000, 0, 1, alice);

    expect(result).toBeOk(Cl.uint(0));
    expect(events.length).toBe(2); // print_event and stx_transfer_event
  });

  it("allows game joining", () => {
    createGame(1000000, 0, 1, alice);
    const { result, events } = joinGame(1, 2, bob);

    expect(result).toBeOk(Cl.uint(0));
    expect(events.length).toBe(2); // print_event and stx_transfer_event
  });

  it("allows game playing", () => {
    createGame(1000000, 0, 1, alice);
    joinGame(1, 2, bob);
    const { result, events } = play(2, 1, alice);

    expect(result).toBeOk(Cl.uint(0));
    expect(events.length).toBe(1); // print_event
  });

  it("does not allow creating a game with a bet amount of 0", () => {
    const { result } = createGame(0, 0, 1, alice);
    expect(result).toBeErr(Cl.uint(109)); // ERR_INVALID_BET_AMOUNT
  });

  it("does not allow joining a game that has already been joined", () => {
    createGame(1000000, 0, 1, alice);
    joinGame(1, 2, bob);

    const { result } = joinGame(1, 2, alice);
    expect(result).toBeErr(Cl.uint(103)); // ERR_GAME_CANNOT_BE_JOINED
  });

  it("does not allow an out of bounds move", () => {
    createGame(1000000, 0, 1, alice);
    joinGame(1, 2, bob);

    const { result } = play(10, 1, alice);
    expect(result).toBeErr(Cl.uint(101)); // ERR_INVALID_MOVE
  });

  it("does not allow a non X or O move", () => {
    createGame(1000000, 0, 1, alice);
    joinGame(1, 2, bob);

    const { result } = play(2, 3, alice);
    expect(result).toBeErr(Cl.uint(101)); // ERR_INVALID_MOVE
  });

  it("does not allow moving on an occupied spot", () => {
    createGame(1000000, 0, 1, alice);
    joinGame(1, 2, bob);

    const { result } = play(1, 1, alice);
    expect(result).toBeErr(Cl.uint(101)); // ERR_INVALID_MOVE
  });

  it("allows player one to win", () => {
    createGame(1000000, 0, 1, alice);
    joinGame(3, 2, bob);
    play(1, 1, alice);
    play(4, 2, bob);
    const { result, events } = play(2, 1, alice);

    expect(result).toBeOk(Cl.uint(0));
    expect(events.length).toBe(2); // print_event and stx_transfer_event

    const gameData = simnet.getMapEntry("tic-tac-toe", "games", Cl.uint(0));
    const gameTuple = gameData as any;
    expect(gameTuple.value.data["player-one"]).toStrictEqual(Cl.principal(alice));
    expect(gameTuple.value.data["player-two"]).toBeSome(Cl.principal(bob));
    expect(gameTuple.value.data.winner).toBeSome(Cl.principal(alice));
  });

  it("allows player two to win", () => {
    createGame(1000000, 0, 1, alice);
    joinGame(3, 2, bob);
    play(1, 1, alice);
    play(4, 2, bob);
    play(8, 1, alice);
    const { result, events } = play(5, 2, bob);

    expect(result).toBeOk(Cl.uint(0));
    expect(events.length).toBe(2); // print_event and stx_transfer_event

    const gameData = simnet.getMapEntry("tic-tac-toe", "games", Cl.uint(0));
    const gameTuple = gameData as any;
    expect(gameTuple.value.data["player-one"]).toStrictEqual(Cl.principal(alice));
    expect(gameTuple.value.data["player-two"]).toBeSome(Cl.principal(bob));
    expect(gameTuple.value.data.winner).toBeSome(Cl.principal(bob));
  });

  it("detects a draw", () => {
    createGame(1000000, 0, 1, alice);  // X at position 0
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
    expect(gameTuple.value.data.status.data).toBe("finished");
  });

  it("prevents moves after game is won", () => {
    createGame(1000000, 0, 1, alice);
    joinGame(3, 2, bob);
    play(1, 1, alice);
    play(4, 2, bob);
    play(2, 1, alice); // Alice wins

    // Try to make another move
    const { result } = play(5, 2, bob);
    expect(result).toBeErr(Cl.uint(106)); // ERR_GAME_FINISHED
  });

  it("prevents wrong player from making a move", () => {
    createGame(1000000, 0, 1, alice);
    joinGame(3, 2, bob);

    // Bob tries to move when it's Alice's turn
    const { result } = play(1, 2, bob);
    expect(result).toBeErr(Cl.uint(104)); // ERR_NOT_YOUR_TURN
  });

  it("allows diagonal win (top-left to bottom-right)", () => {
    createGame(1000000, 0, 1, alice);  // X at position 0
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
    createGame(1000000, 2, 1, alice);  // X at position 2
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
    createGame(1000000, 0, 1, alice);  // X at position 0
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
    createGame(1000000, 0, 1, alice);
    createGame(2000000, 0, 1, bob);

    const gameCounter = simnet.callReadOnlyFn(
      "tic-tac-toe",
      "get-latest-game-id",
      [],
      alice
    );

    expect(gameCounter.result).toBeUint(2);
  });

  it("retrieves game data correctly", () => {
    createGame(1000000, 0, 1, alice);

    const gameData = simnet.callReadOnlyFn(
      "tic-tac-toe",
      "get-game",
      [Cl.uint(0)],
      alice
    );

    const gameTuple = gameData.result as any;
    expect(gameTuple).toBeDefined();
    expect(gameTuple.value.data["player-one"]).toStrictEqual(Cl.principal(alice));
    expect(gameTuple.value.data["player-two"]).toBeNone();
    expect(gameTuple.value.data["bet-amount"]).toStrictEqual(Cl.uint(1000000));
    expect(gameTuple.value.data.winner).toBeNone();
  });
});
