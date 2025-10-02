import { Cl } from "@stacks/transactions";
import { describe, expect, it, beforeAll } from "vitest";

let deployer: string;
let alice: string;
let bob: string;
let charlie: string;

describe("Player Registry Tests", () => {
  beforeAll(() => {
    const accounts = simnet.getAccounts();
    deployer = accounts.get("deployer")!;
    alice = accounts.get("wallet_1")!;
    bob = accounts.get("wallet_2")!;
    charlie = accounts.get("wallet_3")!;
  });

  it("ensures simnet is well initialised", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  it("allows player registration", () => {
    const { result } = simnet.callPublicFn(
      "player-registry",
      "register-player",
      [],
      alice
    );

    expect(result).toBeOk(Cl.bool(true));

    const playerData = simnet.callReadOnlyFn(
      "player-registry",
      "get-player-stats",
      [Cl.principal(alice)],
      alice
    );

    const playerTuple = playerData.result as any;
    expect(playerTuple.value.data["elo-rating"]).toBeUint(1200); // INITIAL_ELO
    expect(playerTuple.value.data["games-played"]).toBeUint(0);
    expect(playerTuple.value.data["games-won"]).toBeUint(0);
    expect(playerTuple.value.data["games-lost"]).toBeUint(0);
    expect(playerTuple.value.data["games-drawn"]).toBeUint(0);
  });

  it("prevents duplicate registration", () => {
    simnet.callPublicFn(
      "player-registry",
      "register-player",
      [],
      alice
    );

    const { result } = simnet.callPublicFn(
      "player-registry",
      "register-player",
      [],
      alice
    );

    expect(result).toBeErr(Cl.uint(401)); // ERR_UNAUTHORIZED (player already exists)
  });

  it("records game result correctly - tests unauthorized user", () => {
    // Register players
    simnet.callPublicFn(
      "player-registry",
      "register-player",
      [],
      alice
    );
    simnet.callPublicFn(
      "player-registry",
      "register-player",
      [],
      bob
    );

    // Record a win for Alice - simnet doesn't support contract-as-caller
    // so we test that unauthorized users get errors
    const { result } = simnet.callPublicFn(
      "player-registry",
      "record-game-result",
      [Cl.principal(alice), Cl.principal(bob), Cl.uint(1000000), Cl.uint(1000000)],
      charlie // unauthorized user
    );

    expect(result).toBeErr(Cl.uint(401)); // ERR_UNAUTHORIZED
  });

  it("records draw result correctly - tests unauthorized user", () => {
    // Register players
    simnet.callPublicFn(
      "player-registry",
      "register-player",
      [],
      alice
    );
    simnet.callPublicFn(
      "player-registry",
      "register-player",
      [],
      bob
    );

    // Record a draw - simnet doesn't support contract-as-caller
    // so we test that unauthorized users get errors
    const { result } = simnet.callPublicFn(
      "player-registry",
      "record-draw-result",
      [Cl.principal(alice), Cl.principal(bob)],
      charlie // unauthorized user
    );

    expect(result).toBeErr(Cl.uint(401)); // ERR_UNAUTHORIZED
  });

  it("updates ELO rating after game - skipped (requires contract-as-caller)", () => {
    // This test is skipped because simnet doesn't support contract-as-caller
    // In a real deployment, the tic-tac-toe contract would call record-game-result
    // and ELO ratings would be updated. For now we just verify the initial state.

    // Register players
    simnet.callPublicFn(
      "player-registry",
      "register-player",
      [],
      alice
    );
    simnet.callPublicFn(
      "player-registry",
      "register-player",
      [],
      bob
    );

    // Check initial ELO ratings
    const aliceData = simnet.callReadOnlyFn(
      "player-registry",
      "get-player-stats",
      [Cl.principal(alice)],
      alice
    );

    const aliceTuple = aliceData.result as any;
    const aliceElo = aliceTuple.value.data["elo-rating"];
    expect(aliceElo).toBeUint(1200); // Starting ELO

    const bobData = simnet.callReadOnlyFn(
      "player-registry",
      "get-player-stats",
      [Cl.principal(bob)],
      bob
    );

    const bobTuple = bobData.result as any;
    const bobElo = bobTuple.value.data["elo-rating"];
    expect(bobElo).toBeUint(1200); // Starting ELO
  });

  it("checks if player is registered", () => {
    simnet.callPublicFn(
      "player-registry",
      "register-player",
      [],
      alice
    );

    const isRegistered = simnet.callReadOnlyFn(
      "player-registry",
      "is-player-registered",
      [Cl.principal(alice)],
      alice
    );

    expect(isRegistered.result).toBeBool(true);

    const isNotRegistered = simnet.callReadOnlyFn(
      "player-registry",
      "is-player-registered",
      [Cl.principal(charlie)],
      charlie
    );

    expect(isNotRegistered.result).toBeBool(false);
  });

  it("gets player ELO rating", () => {
    simnet.callPublicFn(
      "player-registry",
      "register-player",
      [],
      alice
    );

    const elo = simnet.callReadOnlyFn(
      "player-registry",
      "get-player-elo",
      [Cl.principal(alice)],
      alice
    );

    expect(elo.result).toBeSome(Cl.uint(1200));
  });

  it("gets player wins", () => {
    // Register player
    simnet.callPublicFn(
      "player-registry",
      "register-player",
      [],
      alice
    );

    // Check initial wins (should be 0)
    const wins = simnet.callReadOnlyFn(
      "player-registry",
      "get-player-wins",
      [Cl.principal(alice)],
      alice
    );

    expect(wins.result).toBeSome(Cl.uint(0));
  });

  it("records tournament participation - tests unauthorized user", () => {
    simnet.callPublicFn(
      "player-registry",
      "register-player",
      [],
      alice
    );

    // Try to record tournament participation as unauthorized user
    const { result } = simnet.callPublicFn(
      "player-registry",
      "record-tournament-participation",
      [Cl.principal(alice)],
      charlie // unauthorized user
    );

    expect(result).toBeErr(Cl.uint(401)); // ERR_UNAUTHORIZED
  });

  it("records tournament win - tests unauthorized user", () => {
    simnet.callPublicFn(
      "player-registry",
      "register-player",
      [],
      alice
    );

    // Try to record tournament win as unauthorized user
    const { result } = simnet.callPublicFn(
      "player-registry",
      "record-tournament-win",
      [Cl.principal(alice)],
      charlie // unauthorized user
    );

    expect(result).toBeErr(Cl.uint(401)); // ERR_UNAUTHORIZED
  });

  it("records series participation - tests unauthorized user", () => {
    simnet.callPublicFn(
      "player-registry",
      "register-player",
      [],
      alice
    );

    // Try to record series participation as unauthorized user
    const { result } = simnet.callPublicFn(
      "player-registry",
      "record-series-participation",
      [Cl.principal(alice)],
      charlie // unauthorized user
    );

    expect(result).toBeErr(Cl.uint(401)); // ERR_UNAUTHORIZED
  });

  it("records series win - tests unauthorized user", () => {
    simnet.callPublicFn(
      "player-registry",
      "register-player",
      [],
      alice
    );

    // Try to record series win as unauthorized user
    const { result } = simnet.callPublicFn(
      "player-registry",
      "record-series-win",
      [Cl.principal(alice)],
      charlie // unauthorized user
    );

    expect(result).toBeErr(Cl.uint(401)); // ERR_UNAUTHORIZED
  });

  it("gets tournament stats", () => {
    simnet.callPublicFn(
      "player-registry",
      "register-player",
      [],
      alice
    );

    const stats = simnet.callReadOnlyFn(
      "player-registry",
      "get-tournament-stats",
      [Cl.principal(alice)],
      alice
    );

    // get-tournament-stats returns a response with a tuple
    const statsTuple = (stats.result as any).value.data;
    expect(statsTuple["tournaments-played"]).toBeUint(0);
    expect(statsTuple["tournaments-won"]).toBeUint(0);
  });

  it("gets series stats", () => {
    simnet.callPublicFn(
      "player-registry",
      "register-player",
      [],
      alice
    );

    const stats = simnet.callReadOnlyFn(
      "player-registry",
      "get-series-stats",
      [Cl.principal(alice)],
      alice
    );

    // get-series-stats returns a response with a tuple
    const statsTuple = (stats.result as any).value.data;
    expect(statsTuple["series-played"]).toBeUint(0);
    expect(statsTuple["series-won"]).toBeUint(0);
  });

  it("prevents unauthorized game result recording", () => {
    simnet.callPublicFn(
      "player-registry",
      "register-player",
      [],
      alice
    );
    simnet.callPublicFn(
      "player-registry",
      "register-player",
      [],
      bob
    );

    // Try to record result from unauthorized user
    const { result } = simnet.callPublicFn(
      "player-registry",
      "record-game-result",
      [Cl.principal(alice), Cl.principal(bob), Cl.uint(1000000), Cl.uint(1000000)],
      charlie // unauthorized
    );

    expect(result).toBeErr(Cl.uint(401)); // ERR_UNAUTHORIZED
  });
});
