"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStacks } from "@/hooks/use-stacks";
import { MOCK_TOKEN_1, MOCK_TOKEN_2, MOCK_TOKEN_3, MOCK_TOKEN_4 } from "@/lib/amm";
import { MintTokensModal } from "@/components/features/tokens/mint-tokens-modal";
import { toast } from "sonner";
import { Coins } from "lucide-react";

export function CreatePoolForm() {
  const { handleCreatePool, isLoading, userData, checkTokenBalances } = useStacks();
  const [token0, setToken0] = useState("");
  const [token1, setToken1] = useState("");
  const [fee, setFee] = useState("500");
  const [showMintModal, setShowMintModal] = useState(false);

  const handleSubmit = async () => {
    if (!token0 || !token1 || !fee) return;

    // Check if user has tokens before creating pool (only for mock tokens)
    const mockTokens = [MOCK_TOKEN_1, MOCK_TOKEN_2, MOCK_TOKEN_3, MOCK_TOKEN_4];
    if (mockTokens.includes(token0) && mockTokens.includes(token1)) {
      const balances = await checkTokenBalances();
      if (balances.token1 === 0 || balances.token2 === 0) {
        toast.error("No test tokens found", {
          description: "Please mint test tokens before creating a pool",
        });
        setShowMintModal(true);
        return;
      }
    }

    await handleCreatePool(token0, token1, parseInt(fee));
    // Reset form
    setToken0("");
    setToken1("");
    setFee("500");
  };

  const fillMockTokens = () => {
    setToken0(MOCK_TOKEN_1);
    setToken1(MOCK_TOKEN_2);
  };

  const feeOptions = [
    { value: "100", label: "0.01% - Best for stablecoins" },
    { value: "500", label: "0.05% - Common pair" },
    { value: "3000", label: "0.30% - Exotic pair" },
    { value: "10000", label: "1.00% - Very volatile" },
  ];

  return (
    <>
      <Card className="border border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            Create New Pool
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMintModal(true)}
              className="border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 hover:text-orange-300"
            >
              <Coins className="h-4 w-4 mr-2" />
              Get Test Tokens
            </Button>
          </CardTitle>
          <CardDescription className="text-slate-400">
            Create a new liquidity pool for a token pair
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="token0" className="text-slate-300">Token 0 (Principal)</Label>
              <Button
                variant="link"
                size="sm"
                onClick={fillMockTokens}
                className="h-auto p-0 text-xs text-teal-400 hover:text-teal-300"
              >
                Use mock tokens
              </Button>
            </div>
            <Input
              id="token0"
              placeholder="ST2F3J1PK46D6XVRBB9SQ66PY89P8G0EBDW5E05M7.your-token"
              value={token0}
              onChange={(e) => setToken0(e.target.value)}
              className="border-slate-700 bg-slate-900/50 text-white placeholder:text-slate-500 focus:border-orange-500/30"
            />
            <p className="text-xs text-slate-500">
              Enter any SIP-010 token principal address
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="token1" className="text-slate-300">Token 1 (Principal)</Label>
            <Input
              id="token1"
              placeholder="ST2F3J1PK46D6XVRBB9SQ66PY89P8G0EBDW5E05M7.your-token"
              value={token1}
              onChange={(e) => setToken1(e.target.value)}
              className="border-slate-700 bg-slate-900/50 text-white placeholder:text-slate-500 focus:border-orange-500/30"
            />
            <p className="text-xs text-slate-500">
              Enter any SIP-010 token principal address
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fee" className="text-slate-300">Fee Tier</Label>
            <select
              id="fee"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/30"
            >
              {feeOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-slate-900 text-white">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Pool Creation Fee Info */}
          <div className="rounded-xl bg-teal-500/10 border border-teal-500/20 p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-teal-500/20">
                <Coins className="h-4 w-4 text-teal-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-teal-400 mb-1">Pool Creation Fee</h4>
                <p className="text-xs text-slate-300">
                  A one-time fee of <span className="font-bold text-teal-400">1 STX</span> is required to create a new pool. This fee helps support protocol development and maintenance.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!userData || !token0 || !token1 || isLoading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all"
          >
            {!userData
              ? "Connect Wallet"
              : isLoading
              ? "Creating Pool..."
              : "Create Pool"}
          </Button>
        </CardContent>
      </Card>

      <MintTokensModal
        open={showMintModal}
        onOpenChange={setShowMintModal}
        onMintComplete={() => {
          toast.success("Ready to create pool!");
        }}
      />
    </>
  );
}
