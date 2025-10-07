"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coins, Download, Shield } from "lucide-react";
import { fetchCallReadOnlyFunction, cvToValue, uintCV, Pc } from "@stacks/transactions";
import { STACKS_TESTNET } from "@stacks/network";
import { useStacks } from "@/hooks/use-stacks";
import { openContractCall } from "@stacks/connect";
import { toast } from "sonner";

const AMM_CONTRACT_ADDRESS = "ST2F3J1PK46D6XVRBB9SQ66PY89P8G0EBDW5E05M7";
const AMM_CONTRACT_NAME = "amm-v4";

export function TreasuryCard() {
  const { userData } = useStacks();
  const [treasuryBalance, setTreasuryBalance] = useState<number>(0);
  const [contractOwner, setContractOwner] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [checkingOwner, setCheckingOwner] = useState(true);

  useEffect(() => {
    fetchTreasuryData();
  }, []);

  useEffect(() => {
    if (userData && contractOwner) {
      const userAddress = userData.profile.stxAddress.testnet;
      setIsOwner(userAddress === contractOwner);
      setCheckingOwner(false);
    } else if (contractOwner) {
      setCheckingOwner(false);
    }
  }, [userData, contractOwner]);

  // Don't render anything if user is not the owner
  if (!checkingOwner && !isOwner) {
    return (
      <Card className="border border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <CardContent className="py-12 text-center">
          <Shield className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg font-medium mb-2">Access Restricted</p>
          <p className="text-slate-500 text-sm">
            Only the contract owner can access the treasury dashboard.
          </p>
        </CardContent>
      </Card>
    );
  }

  async function fetchTreasuryData() {
    setIsRefreshing(true);
    try {
      // Fetch treasury balance
      const balanceResult = await fetchCallReadOnlyFunction({
        contractAddress: AMM_CONTRACT_ADDRESS,
        contractName: AMM_CONTRACT_NAME,
        functionName: "get-treasury-balance",
        functionArgs: [],
        senderAddress: AMM_CONTRACT_ADDRESS,
        network: STACKS_TESTNET,
      });

      if (balanceResult.type === "ok" && balanceResult.value.type === "uint") {
        const balance = Number(balanceResult.value.value);
        setTreasuryBalance(balance);
      }

      // Fetch contract owner
      const ownerResult = await fetchCallReadOnlyFunction({
        contractAddress: AMM_CONTRACT_ADDRESS,
        contractName: AMM_CONTRACT_NAME,
        functionName: "get-contract-owner",
        functionArgs: [],
        senderAddress: AMM_CONTRACT_ADDRESS,
        network: STACKS_TESTNET,
      });

      if (ownerResult.type === "ok") {
        const ownerValue: any = ownerResult.value;
        if (ownerValue.type === "principal" || ownerValue.type === "address") {
          setContractOwner(ownerValue.value);
        }
      }
    } catch (error) {
      console.error("Error fetching treasury data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleWithdraw() {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error("Invalid amount");
      return;
    }

    const microAmount = Math.floor(parseFloat(withdrawAmount) * 1_000_000);

    if (microAmount > treasuryBalance) {
      toast.error("Insufficient treasury balance");
      return;
    }

    setIsLoading(true);

    try {
      await openContractCall({
        contractAddress: AMM_CONTRACT_ADDRESS,
        contractName: AMM_CONTRACT_NAME,
        functionName: "withdraw-treasury",
        functionArgs: [uintCV(microAmount)],
        postConditionMode: 0x01, // Allow mode - bypass automatic post-conditions
        network: STACKS_TESTNET,
        onFinish: (data) => {
          console.log("🔗 Withdrawal Transaction ID:", data.txId);
          console.log("🔍 View in explorer:", `https://explorer.hiro.so/txid/${data.txId}?chain=testnet`);
          toast.success("Withdrawal submitted!", {
            description: `Transaction ID: ${data.txId}`,
          });
          setWithdrawAmount("");
          // Refresh treasury balance after a delay
          setTimeout(() => {
            fetchTreasuryData();
          }, 3000);
        },
        onCancel: () => {
          toast.info("Transaction cancelled");
        },
      });
    } catch (error: any) {
      toast.error("Withdrawal failed", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const treasuryInStx = treasuryBalance / 1_000_000;

  return (
    <Card className="border border-slate-800 bg-slate-950/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Coins className="h-5 w-5 text-teal-400" />
          Protocol Treasury
        </CardTitle>
        <CardDescription className="text-slate-400">
          View and manage protocol fees collected from pool creation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Treasury Balance Display */}
        <div className="rounded-xl bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-500/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Treasury Balance</p>
              <p className="text-3xl font-bold text-white">
                {treasuryInStx.toFixed(6)} <span className="text-xl text-slate-400">STX</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                From pool creation fees (1 STX per pool)
              </p>
            </div>
            <div className="p-3 rounded-full bg-teal-500/20">
              <Coins className="h-8 w-8 text-teal-400" />
            </div>
          </div>
        </div>

        {/* Contract Owner Info */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-orange-400" />
            <span className="text-slate-400">Contract Owner:</span>
          </div>
          <p className="text-xs font-mono text-white break-all bg-slate-900/50 p-2 rounded">
            {contractOwner || "Loading..."}
          </p>
          {isOwner && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 p-2 rounded">
              <Shield className="h-3 w-3" />
              <span>You are the contract owner</span>
            </div>
          )}
        </div>

        {/* Withdraw Section - Only for Owner */}
        {isOwner ? (
          <div className="space-y-4">
            <div className="h-px bg-slate-700" />

            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <Download className="h-4 w-4 text-orange-400" />
                Withdraw Amount (STX)
              </Label>
              <Input
                type="number"
                step="0.000001"
                placeholder="Enter amount in STX"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="border-slate-700 bg-slate-900/50 text-white placeholder:text-slate-500 focus:border-orange-500/30"
              />
              <p className="text-xs text-slate-500">
                Available: {treasuryInStx.toFixed(6)} STX
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setWithdrawAmount(treasuryInStx.toString())}
                className="flex-1 border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Max
              </Button>
              <Button
                onClick={handleWithdraw}
                disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || isLoading}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
              >
                {isLoading ? "Withdrawing..." : "Withdraw"}
              </Button>
            </div>
          </div>
        ) : userData ? (
          <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-4">
            <p className="text-sm text-orange-400">
              Only the contract owner can withdraw treasury funds.
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-4">
            <p className="text-sm text-slate-400 text-center">
              Connect your wallet to check if you're the contract owner
            </p>
          </div>
        )}

        <Button
          variant="outline"
          onClick={fetchTreasuryData}
          disabled={isRefreshing}
          className="w-full border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-50"
        >
          {isRefreshing ? "Refreshing..." : "Refresh Balance"}
        </Button>
      </CardContent>
    </Card>
  );
}
