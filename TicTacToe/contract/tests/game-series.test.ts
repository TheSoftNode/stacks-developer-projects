import { Cl } from "@stacks/transactions";
import { describe, expect, it, beforeAll } from "vitest";

let deployer: string;
let alice: string;
let bob: string;

describe("Game Series Tests", () => {
  beforeAll(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get("deployer")!;
    alice = accounts.get("wallet_1")!;
    bob = accounts.get("wallet_2")!;
  });

  it("ensures simnet is well initialised", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  it("allows creating a best-of-3 series", () => {
    const { result } = simnet.callPublicFn(
      "game-series",
      "create-series",
      [Cl.uint(2), Cl.uint(1000000)], // games-to-win: 2, series-bet: 1000000
      alice
    );

    expect(result).toBeOk(Cl.uint(0));

    const seriesData = simnet.callReadOnlyFn(
      "game-series",
      "get-series",
      [Cl.uint(0)],
      alice
    );

    expect(seriesData.result).toBeSome(
      Cl.tuple({
        creator: Cl.principal(alice),
        "player-one": Cl.principal(alice),
        "player-two": Cl.none(),
        "games-to-win": Cl.uint(2),
        "player-one-wins": Cl.uint(0),
        "player-two-wins": Cl.uint(0),
        "total-games-played": Cl.uint(0),
        "current-game-id": Cl.none(),
        winner: Cl.none(),
        "series-bet": Cl.uint(1000000),
        "prize-pool": Cl.uint(1000000),
        status: Cl.stringAscii("waiting"),
        "created-at": Cl.uint(simnet.blockHeight),
        "started-at": Cl.none(),
        "completed-at": Cl.none(),
      })
    );
  });

  it("allows creating a best-of-5 series", () => {
    const { result } = simnet.callPublicFn(
      "game-series",
      "create-series",
      [Cl.uint(3), Cl.uint(2000000)], // games-to-win: 3, series-bet: 2000000
      alice
    );

    expect(result).toBeOk(Cl.uint(0));

    const seriesData = simnet.callReadOnlyFn(
      "game-series",
      "get-series",
      [Cl.uint(0)],
      alice
    );

    const seriesTuple = seriesData.result as any;
    expect(seriesTuple.value.data["games-to-win"]).toBeUint(3);
  });

  it("allows creating a best-of-7 series", () => {
    const { result } = simnet.callPublicFn(
      "game-series",
      "create-series",
      [Cl.uint(4), Cl.uint(5000000)], // games-to-win: 4, series-bet: 5000000
      alice
    );

    expect(result).toBeOk(Cl.uint(0));

    const seriesData = simnet.callReadOnlyFn(
      "game-series",
      "get-series",
      [Cl.uint(0)],
      alice
    );

    const seriesTuple = seriesData.result as any;
    expect(seriesTuple.value.data["games-to-win"]).toBeUint(4);
  });

  it("prevents creating series with invalid games-to-win value", () => {
    const { result } = simnet.callPublicFn(
      "game-series",
      "create-series",
      [Cl.uint(5), Cl.uint(1000000)], // 5 is invalid, must be 2, 3, or 4
      alice
    );

    expect(result).toBeErr(Cl.uint(406)); // ERR_INVALID_SERIES_LENGTH
  });

  it("prevents creating series with bet below minimum", () => {
    const { result } = simnet.callPublicFn(
      "game-series",
      "create-series",
      [Cl.uint(2), Cl.uint(500000)], // Below min bet of 1000000 for best-of-3
      alice
    );

    expect(result).toBeErr(Cl.uint(401)); // ERR_UNAUTHORIZED
  });

  it("allows creating a series (series starts with waiting status)", () => {
    const { result } = simnet.callPublicFn(
      "game-series",
      "create-series",
      [Cl.uint(2), Cl.uint(1000000)],
      alice
    );

    expect(result).toBeOk(Cl.uint(0));

    const seriesData = simnet.callReadOnlyFn(
      "game-series",
      "get-series",
      [Cl.uint(0)],
      alice
    );

    const seriesTuple = seriesData.result as any;
    expect(seriesTuple.value.data.status.data).toBe("waiting");
  });

  it("records game completion for series", () => {
    // Create series first
    simnet.callPublicFn(
      "game-series",
      "create-series",
      [Cl.uint(2), Cl.uint(1000000)],
      alice
    );

    // Join series
    simnet.callPublicFn(
      "game-series",
      "join-series",
      [Cl.uint(0)],
      bob
    );

    // Start the next game in the series (this reserves the slot)
    simnet.callPublicFn(
      "game-series",
      "start-next-game",
      [Cl.uint(0)],
      alice
    );

    // Record a game completion (Alice wins) - requires series-id, game-id (from tic-tac-toe), winner
    // The game-id parameter is the actual tic-tac-toe game ID (starts at 0)
    const { result } = simnet.callPublicFn(
      "game-series",
      "record-game-completion",
      [Cl.uint(0), Cl.uint(0), Cl.principal(alice)],
      alice
    );

    expect(result).toBeOk(Cl.bool(false)); // Returns false if series not complete

    const seriesData = simnet.callReadOnlyFn(
      "game-series",
      "get-series",
      [Cl.uint(0)],
      alice
    );

    const seriesTuple = seriesData.result as any;
    expect(seriesTuple.value.data["player-one-wins"]).toBeUint(1);
    expect(seriesTuple.value.data["total-games-played"]).toBeUint(1);
  });

  it("completes series when player reaches winning threshold", () => {
    // Create best-of-3 series (games-to-win: 2)
    simnet.callPublicFn(
      "game-series",
      "create-series",
      [Cl.uint(2), Cl.uint(1000000)],
      alice
    );

    // Join series
    simnet.callPublicFn(
      "game-series",
      "join-series",
      [Cl.uint(0)],
      bob
    );

    // Start game 1
    simnet.callPublicFn(
      "game-series",
      "start-next-game",
      [Cl.uint(0)],
      alice
    );

    // Alice wins game 1 (game-id 0)
    simnet.callPublicFn(
      "game-series",
      "record-game-completion",
      [Cl.uint(0), Cl.uint(0), Cl.principal(alice)],
      alice
    );

    // Start game 2
    simnet.callPublicFn(
      "game-series",
      "start-next-game",
      [Cl.uint(0)],
      alice
    );

    // Alice wins game 2 (game-id 1) (should complete series)
    const { result } = simnet.callPublicFn(
      "game-series",
      "record-game-completion",
      [Cl.uint(0), Cl.uint(1), Cl.principal(alice)],
      alice
    );

    expect(result).toBeOk(Cl.bool(true)); // Returns true when series complete

    const seriesData = simnet.callReadOnlyFn(
      "game-series",
      "get-series",
      [Cl.uint(0)],
      alice
    );

    const seriesTuple = seriesData.result as any;
    expect(seriesTuple.value.data.status.data).toBe("completed");
    expect(seriesTuple.value.data.winner).toBeSome(Cl.principal(alice));
  });

  it("tracks game records in series", () => {
    // Create series
    simnet.callPublicFn(
      "game-series",
      "create-series",
      [Cl.uint(2), Cl.uint(1000000)],
      alice
    );

    // Join series
    simnet.callPublicFn(
      "game-series",
      "join-series",
      [Cl.uint(0)],
      bob
    );

    // Start next game
    simnet.callPublicFn(
      "game-series",
      "start-next-game",
      [Cl.uint(0)],
      alice
    );

    // Record a game (Bob wins) - game-id 0
    const { result } = simnet.callPublicFn(
      "game-series",
      "record-game-completion",
      [Cl.uint(0), Cl.uint(0), Cl.principal(bob)],
      alice
    );

    expect(result).toBeOk(Cl.bool(false));

    const seriesData = simnet.callReadOnlyFn(
      "game-series",
      "get-series",
      [Cl.uint(0)],
      alice
    );

    const seriesTuple = seriesData.result as any;
    expect(seriesTuple.value.data["player-one-wins"]).toBeUint(0);
    expect(seriesTuple.value.data["player-two-wins"]).toBeUint(1);
    expect(seriesTuple.value.data["total-games-played"]).toBeUint(1);
  });

  it("prevents recording game for non-existent series", () => {
    const { result } = simnet.callPublicFn(
      "game-series",
      "record-game-completion",
      [Cl.uint(999), Cl.uint(1), Cl.principal(alice)],
      alice
    );

    expect(result).toBeErr(Cl.uint(402)); // ERR_SERIES_NOT_FOUND
  });

  it("prevents non-participants from recording game completion", () => {
    // Create series between Alice and Bob
    simnet.callPublicFn(
      "game-series",
      "create-series",
      [Cl.uint(2), Cl.uint(1000000)],
      alice
    );

    // Join series
    simnet.callPublicFn(
      "game-series",
      "join-series",
      [Cl.uint(0)],
      bob
    );

    // Charlie (non-participant) tries to record game
    const charlie = accounts.get("wallet_3")!;
    const { result } = simnet.callPublicFn(
      "game-series",
      "record-game-completion",
      [Cl.uint(0), Cl.uint(1), Cl.principal(alice)],
      charlie
    );

    expect(result).toBeErr(Cl.uint(401)); // ERR_UNAUTHORIZED
  });

  it("increments series counter correctly", () => {
    const initialCounter = simnet.callReadOnlyFn(
      "game-series",
      "get-latest-series-id",
      [],
      alice
    );

    expect(initialCounter.result).toBeUint(0);

    // Create first series
    simnet.callPublicFn(
      "game-series",
      "create-series",
      [Cl.uint(2), Cl.uint(1000000)],
      alice
    );

    const afterOne = simnet.callReadOnlyFn(
      "game-series",
      "get-latest-series-id",
      [],
      alice
    );

    expect(afterOne.result).toBeUint(1);

    // Create second series
    simnet.callPublicFn(
      "game-series",
      "create-series",
      [Cl.uint(3), Cl.uint(2000000)],
      alice
    );

    const afterTwo = simnet.callReadOnlyFn(
      "game-series",
      "get-latest-series-id",
      [],
      alice
    );

    expect(afterTwo.result).toBeUint(2);
  });

  it("retrieves series game information", () => {
    // Create and join series
    simnet.callPublicFn(
      "game-series",
      "create-series",
      [Cl.uint(2), Cl.uint(1000000)],
      alice
    );

    simnet.callPublicFn(
      "game-series",
      "join-series",
      [Cl.uint(0)],
      bob
    );

    // Start next game
    simnet.callPublicFn(
      "game-series",
      "start-next-game",
      [Cl.uint(0)],
      alice
    );

    // Check series game data - game-number is 1 (first game in series)
    const gameData = simnet.callReadOnlyFn(
      "game-series",
      "get-series-game",
      [Cl.uint(0), Cl.uint(1)], // series-id, game-number
      alice
    );

    expect(gameData.result).toBeSome(
      Cl.tuple({
        "game-id": Cl.uint(0), // This is the tic-tac-toe game-id
        winner: Cl.none(),
        "completed-at": Cl.none(),
        "game-duration": Cl.uint(0),
      })
    );
  });
});