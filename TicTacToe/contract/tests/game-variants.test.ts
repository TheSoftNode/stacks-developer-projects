import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const alice = accounts.get("wallet_1")!;
const bob = accounts.get("wallet_2")!;

describe("Game Variants Tests", () => {
  it("ensures simnet is well initialised", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  it("allows creating a classic 3x3 variant game", () => {
    const { result } = simnet.callPublicFn(
      "game-variants",
      "create-variant-game",
      [Cl.uint(1), Cl.uint(1000000), Cl.uint(4)], // variant-type: 1 (CLASSIC), bet-amount, move-index
      alice
    );

    expect(result).toBeOk(Cl.uint(0));

    const gameData = simnet.callReadOnlyFn(
      "game-variants",
      "get-variant-game",
      [Cl.uint(0)],
      alice
    );

    const gameTuple = gameData.result as any;
    expect(gameTuple.value.data["variant-type"]).toBeUint(1);
    expect(gameTuple.value.data["board-size"]).toBeUint(9);
    expect(gameTuple.value.data["win-condition"]).toBeUint(3);
  });

  it("allows creating an extended 4x4 variant game", () => {
    const { result } = simnet.callPublicFn(
      "game-variants",
      "create-variant-game",
      [Cl.uint(2), Cl.uint(2000000), Cl.uint(4)], // variant-type: 2 (EXTENDED), bet-amount, move-index
      alice
    );

    expect(result).toBeOk(Cl.uint(0));

    const gameData = simnet.callReadOnlyFn(
      "game-variants",
      "get-variant-game",
      [Cl.uint(0)],
      alice
    );

    const gameTuple = gameData.result as any;
    expect(gameTuple.value.data["variant-type"]).toBeUint(2);
    expect(gameTuple.value.data["board-size"]).toBeUint(16);
    expect(gameTuple.value.data["win-condition"]).toBeUint(4);
  });

  it("allows creating a large 5x5 variant game", () => {
    const { result } = simnet.callPublicFn(
      "game-variants",
      "create-variant-game",
      [Cl.uint(3), Cl.uint(3000000), Cl.uint(4)], // variant-type: 3 (LARGE), bet-amount, move-index
      alice
    );

    expect(result).toBeOk(Cl.uint(0));

    const gameData = simnet.callReadOnlyFn(
      "game-variants",
      "get-variant-game",
      [Cl.uint(0)],
      alice
    );

    const gameTuple = gameData.result as any;
    expect(gameTuple.value.data["variant-type"]).toBeUint(3);
    expect(gameTuple.value.data["board-size"]).toBeUint(25);
    expect(gameTuple.value.data["win-condition"]).toBeUint(5);
  });

  it("allows creating a tactical 4x3 variant game", () => {
    const { result } = simnet.callPublicFn(
      "game-variants",
      "create-variant-game",
      [Cl.uint(4), Cl.uint(2000000), Cl.uint(4)], // variant-type: 4 (TACTICAL), bet-amount, move-index
      alice
    );

    expect(result).toBeOk(Cl.uint(0));

    const gameData = simnet.callReadOnlyFn(
      "game-variants",
      "get-variant-game",
      [Cl.uint(0)],
      alice
    );

    const gameTuple = gameData.result as any;
    expect(gameTuple.value.data["variant-type"]).toBeUint(4);
    expect(gameTuple.value.data["board-size"]).toBeUint(16);
    expect(gameTuple.value.data["win-condition"]).toBeUint(3);
  });

  it("allows creating a strategic 5x4 variant game", () => {
    const { result } = simnet.callPublicFn(
      "game-variants",
      "create-variant-game",
      [Cl.uint(5), Cl.uint(3000000), Cl.uint(4)], // variant-type: 5 (STRATEGIC), bet-amount, move-index
      alice
    );

    expect(result).toBeOk(Cl.uint(0));

    const gameData = simnet.callReadOnlyFn(
      "game-variants",
      "get-variant-game",
      [Cl.uint(0)],
      alice
    );

    const gameTuple = gameData.result as any;
    expect(gameTuple.value.data["variant-type"]).toBeUint(5);
    expect(gameTuple.value.data["board-size"]).toBeUint(25);
    expect(gameTuple.value.data["win-condition"]).toBeUint(4);
  });

  it("allows player to join a variant game", () => {
    // Create game
    simnet.callPublicFn(
      "game-variants",
      "create-variant-game",
      [Cl.uint(1), Cl.uint(1000000), Cl.uint(4)],
      alice
    );

    // Join game
    const { result } = simnet.callPublicFn(
      "game-variants",
      "join-variant-game",
      [Cl.uint(0), Cl.uint(0)], // game-id, move-index
      bob
    );

    expect(result).toBeOk(Cl.bool(true));

    const gameData = simnet.callReadOnlyFn(
      "game-variants",
      "get-variant-game",
      [Cl.uint(0)],
      alice
    );

    const gameTuple = gameData.result as any;
    expect(gameTuple.value.data["player-two"]).toBeSome(Cl.principal(bob));
  });

  it("allows playing moves in variant game", () => {
    // Create game
    simnet.callPublicFn(
      "game-variants",
      "create-variant-game",
      [Cl.uint(1), Cl.uint(1000000), Cl.uint(4)],
      alice
    );

    // Join game
    simnet.callPublicFn(
      "game-variants",
      "join-variant-game",
      [Cl.uint(0), Cl.uint(0)],
      bob
    );

    // Play move
    const { result } = simnet.callPublicFn(
      "game-variants",
      "play-variant-move",
      [Cl.uint(0), Cl.uint(1)],
      alice
    );

    expect(result).toBeOk(Cl.uint(0));
  });

  it("prevents invalid move position", () => {
    // Create game
    simnet.callPublicFn(
      "game-variants",
      "create-variant-game",
      [Cl.uint(1), Cl.uint(1000000), Cl.uint(4)],
      alice
    );

    // Join game
    simnet.callPublicFn(
      "game-variants",
      "join-variant-game",
      [Cl.uint(0), Cl.uint(0)],
      bob
    );

    // Try invalid move (position >= board-size)
    const { result } = simnet.callPublicFn(
      "game-variants",
      "play-variant-move",
      [Cl.uint(0), Cl.uint(99)],
      alice
    );

    expect(result).toBeErr(Cl.uint(403)); // ERR_INVALID_MOVE
  });

  it("prevents playing on occupied position", () => {
    // Create game
    simnet.callPublicFn(
      "game-variants",
      "create-variant-game",
      [Cl.uint(1), Cl.uint(1000000), Cl.uint(4)],
      alice
    );

    // Join game
    simnet.callPublicFn(
      "game-variants",
      "join-variant-game",
      [Cl.uint(0), Cl.uint(0)],
      bob
    );

    // Alice plays on position 1
    simnet.callPublicFn(
      "game-variants",
      "play-variant-move",
      [Cl.uint(0), Cl.uint(1)],
      alice
    );

    // Bob tries to play on same position
    const { result } = simnet.callPublicFn(
      "game-variants",
      "play-variant-move",
      [Cl.uint(0), Cl.uint(1)],
      bob
    );

    expect(result).toBeErr(Cl.uint(403)); // ERR_INVALID_MOVE
  });

  it("gets variant config correctly", () => {
    const classicConfig = simnet.callReadOnlyFn(
      "game-variants",
      "get-variant-config",
      [Cl.uint(1)],
      alice
    );

    const configTuple = classicConfig.result as any;
    expect(configTuple.value.data["board-size"]).toBeUint(9);
    expect(configTuple.value.data["win-condition"]).toBeUint(3);
    expect(configTuple.value.data["min-bet-multiplier"]).toBeUint(1);
  });

  it("gets latest variant game ID", () => {
    const initial = simnet.callReadOnlyFn(
      "game-variants",
      "get-latest-variant-game-id",
      [],
      alice
    );

    expect(initial.result).toBeUint(0);

    // Create game
    simnet.callPublicFn(
      "game-variants",
      "create-variant-game",
      [Cl.uint(1), Cl.uint(1000000), Cl.uint(4)],
      alice
    );

    const after = simnet.callReadOnlyFn(
      "game-variants",
      "get-latest-variant-game-id",
      [],
      alice
    );

    expect(after.result).toBeUint(1);
  });

  it("prevents creating game with invalid variant type", () => {
    const { result } = simnet.callPublicFn(
      "game-variants",
      "create-variant-game",
      [Cl.uint(99), Cl.uint(1000000), Cl.uint(4)], // invalid variant-type
      alice
    );

    expect(result).toBeErr(Cl.uint(402)); // ERR_INVALID_VARIANT
  });

  it("enforces minimum bet multiplier for variants", () => {
    // Extended variant requires 2x min bet
    const { result } = simnet.callPublicFn(
      "game-variants",
      "create-variant-game",
      [Cl.uint(2), Cl.uint(1000000), Cl.uint(4)], // bet too low for 2x multiplier
      alice
    );

    expect(result).toBeErr(Cl.uint(401)); // ERR_UNAUTHORIZED
  });
});
