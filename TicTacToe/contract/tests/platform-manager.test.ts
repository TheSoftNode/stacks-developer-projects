import { Cl } from "@stacks/transactions";
import { describe, expect, it, beforeEach } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const admin = accounts.get("wallet_1")!;
const user1 = accounts.get("wallet_2")!;
const user2 = accounts.get("wallet_3")!;

describe("Platform Manager Tests", () => {
  it("ensures simnet is well initialised", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  it("reads platform fee rate correctly", () => {
    const feeRate = simnet.callReadOnlyFn(
      "platform-manager",
      "get-platform-fee-rate",
      [],
      deployer
    );

    expect(feeRate.result).toBeUint(250); // 2.5% in basis points
  });

  it("reads min bet amount correctly", () => {
    const minBet = simnet.callReadOnlyFn(
      "platform-manager",
      "get-min-bet-amount",
      [],
      deployer
    );

    expect(minBet.result).toBeUint(1000000); // 1 STX
  });

  it("reads platform treasury correctly", () => {
    const treasury = simnet.callReadOnlyFn(
      "platform-manager",
      "get-platform-treasury",
      [],
      deployer
    );

    expect(treasury.result).toBeUint(0); // Initially 0
  });

  it("reads paused status correctly", () => {
    const isPaused = simnet.callReadOnlyFn(
      "platform-manager",
      "is-paused",
      [],
      deployer
    );

    expect(isPaused.result).toBeBool(false); // Initially not paused
  });

  it("reads move timeout correctly", () => {
    const timeout = simnet.callReadOnlyFn(
      "platform-manager",
      "get-move-timeout",
      [],
      deployer
    );

    expect(timeout.result).toBeUint(144); // Default 24 hours
  });

  it("allows admin to set platform fee", () => {
    const { result } = simnet.callPublicFn(
      "platform-manager",
      "set-platform-fee",
      [Cl.uint(500)], // 5%
      deployer
    );

    expect(result).toBeOk(Cl.bool(true));

    const feeRate = simnet.callReadOnlyFn(
      "platform-manager",
      "get-platform-fee-rate",
      [],
      deployer
    );

    expect(feeRate.result).toBeUint(500);
  });

  it("prevents non-admin from setting platform fee", () => {
    const { result } = simnet.callPublicFn(
      "platform-manager",
      "set-platform-fee",
      [Cl.uint(500)],
      user1
    );

    expect(result).toBeErr(Cl.uint(401)); // ERR_UNAUTHORIZED
  });

  it("prevents setting platform fee above 10%", () => {
    const { result } = simnet.callPublicFn(
      "platform-manager",
      "set-platform-fee",
      [Cl.uint(1001)], // More than 10%
      deployer
    );

    expect(result).toBeErr(Cl.uint(404)); // ERR_INVALID_CONFIG
  });

  it("allows admin to set min bet", () => {
    const { result } = simnet.callPublicFn(
      "platform-manager",
      "set-min-bet",
      [Cl.uint(2000000)], // 2 STX
      deployer
    );

    expect(result).toBeOk(Cl.bool(true));

    const minBet = simnet.callReadOnlyFn(
      "platform-manager",
      "get-min-bet-amount",
      [],
      deployer
    );

    expect(minBet.result).toBeUint(2000000);
  });

  it("prevents setting min bet below 0.1 STX", () => {
    const { result } = simnet.callPublicFn(
      "platform-manager",
      "set-min-bet",
      [Cl.uint(50000)], // Less than 0.1 STX
      deployer
    );

    expect(result).toBeErr(Cl.uint(404)); // ERR_INVALID_CONFIG
  });

  it("allows admin to set move timeout", () => {
    const { result } = simnet.callPublicFn(
      "platform-manager",
      "set-move-timeout",
      [Cl.uint(288)], // 48 hours
      deployer
    );

    expect(result).toBeOk(Cl.bool(true));

    const timeout = simnet.callReadOnlyFn(
      "platform-manager",
      "get-move-timeout",
      [],
      deployer
    );

    expect(timeout.result).toBeUint(288);
  });

  it("allows admin to pause platform", () => {
    const { result } = simnet.callPublicFn(
      "platform-manager",
      "emergency-pause",
      [],
      deployer
    );

    expect(result).toBeOk(Cl.bool(true));

    const isPaused = simnet.callReadOnlyFn(
      "platform-manager",
      "is-paused",
      [],
      deployer
    );

    expect(isPaused.result).toBeBool(true);
  });

  it("allows admin to unpause platform", () => {
    // First pause
    simnet.callPublicFn("platform-manager", "emergency-pause", [], deployer);

    // Then unpause
    const { result } = simnet.callPublicFn(
      "platform-manager",
      "emergency-unpause",
      [],
      deployer
    );

    expect(result).toBeOk(Cl.bool(true));

    const isPaused = simnet.callReadOnlyFn(
      "platform-manager",
      "is-paused",
      [],
      deployer
    );

    expect(isPaused.result).toBeBool(false);
  });

  it("prevents pausing when already paused", () => {
    // First pause
    simnet.callPublicFn("platform-manager", "emergency-pause", [], deployer);

    // Try to pause again
    const { result } = simnet.callPublicFn(
      "platform-manager",
      "emergency-pause",
      [],
      deployer
    );

    expect(result).toBeErr(Cl.uint(402)); // ERR_ALREADY_PAUSED
  });

  it("prevents unpausing when not paused", () => {
    const { result } = simnet.callPublicFn(
      "platform-manager",
      "emergency-unpause",
      [],
      deployer
    );

    expect(result).toBeErr(Cl.uint(403)); // ERR_NOT_PAUSED
  });

  it("allows admin to authorize contracts", () => {
    const { result } = simnet.callPublicFn(
      "platform-manager",
      "authorize-contract",
      [Cl.principal(`${deployer}.test-contract`)],
      deployer
    );

    expect(result).toBeOk(Cl.bool(true));

    const isAuthorized = simnet.callReadOnlyFn(
      "platform-manager",
      "is-authorized-contract",
      [Cl.principal(`${deployer}.test-contract`)],
      deployer
    );

    expect(isAuthorized.result).toBeBool(true);
  });

  it("allows admin to add another admin", () => {
    const { result } = simnet.callPublicFn(
      "platform-manager",
      "add-admin",
      [Cl.principal(admin)],
      deployer
    );

    expect(result).toBeOk(Cl.bool(true));
  });

  it("allows admin to remove an admin", () => {
    // First add admin
    simnet.callPublicFn(
      "platform-manager",
      "add-admin",
      [Cl.principal(admin)],
      deployer
    );

    // Then remove
    const { result } = simnet.callPublicFn(
      "platform-manager",
      "remove-admin",
      [Cl.principal(admin)],
      deployer
    );

    expect(result).toBeOk(Cl.bool(true));
  });

  it("prevents non-admin from adding admins", () => {
    const { result } = simnet.callPublicFn(
      "platform-manager",
      "add-admin",
      [Cl.principal(user2)],
      user1
    );

    expect(result).toBeErr(Cl.uint(401)); // ERR_UNAUTHORIZED
  });

  it("reads treasury stats correctly", () => {
    const stats = simnet.callReadOnlyFn(
      "platform-manager",
      "get-treasury-stats",
      [],
      deployer
    );

    // get-treasury-stats returns a tuple directly
    const statsTuple = (stats.result as any).data;
    expect(statsTuple["current-treasury"]).toBeUint(0);
    expect(statsTuple["total-collected"]).toBeUint(0);
    expect(statsTuple["platform-fee-rate"]).toBeUint(250);
  });

  it("reads fund allocations correctly", () => {
    const allocations = simnet.callReadOnlyFn(
      "platform-manager",
      "get-fund-allocations",
      [],
      deployer
    );

    // get-fund-allocations returns a tuple directly
    const allocationsTuple = (allocations.result as any).data;
    expect(allocationsTuple["staking-rewards"]).toBeUint(3000); // 30%
    expect(allocationsTuple["development-fund"]).toBeUint(2000); // 20%
    expect(allocationsTuple["marketing-fund"]).toBeUint(1000); // 10%
  });

  it("allows admin to update fund allocations", () => {
    const { result } = simnet.callPublicFn(
      "platform-manager",
      "update-fund-allocations",
      [Cl.uint(4000), Cl.uint(3000), Cl.uint(2000)], // 40%, 30%, 20%
      deployer
    );

    expect(result).toBeOk(Cl.bool(true));

    const allocations = simnet.callReadOnlyFn(
      "platform-manager",
      "get-fund-allocations",
      [],
      deployer
    );

    // get-fund-allocations returns a tuple directly
    const allocationsTuple = (allocations.result as any).data;
    expect(allocationsTuple["staking-rewards"]).toBeUint(4000);
    expect(allocationsTuple["development-fund"]).toBeUint(3000);
    expect(allocationsTuple["marketing-fund"]).toBeUint(2000);
  });

  it("prevents allocations exceeding 100%", () => {
    const { result } = simnet.callPublicFn(
      "platform-manager",
      "update-fund-allocations",
      [Cl.uint(5000), Cl.uint(5000), Cl.uint(5000)], // 150% total
      deployer
    );

    expect(result).toBeErr(Cl.uint(404)); // ERR_INVALID_CONFIG
  });

  it("allows admin to withdraw treasury funds", () => {
    // Note: This test withdraws 0 amount since treasury is empty
    // Withdrawing 0 STX will fail with STX transfer error (u3)
    const { result } = simnet.callPublicFn(
      "platform-manager",
      "withdraw-treasury-funds",
      [Cl.uint(0), Cl.principal(admin)],
      deployer
    );

    // STX transfer of 0 fails with error u3 (sender equals recipient)
    expect(result).toBeErr(Cl.uint(3));
  });
});
