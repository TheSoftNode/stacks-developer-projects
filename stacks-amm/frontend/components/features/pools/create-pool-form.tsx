"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStacks } from "@/hooks/use-stacks";

export function CreatePoolForm() {
  const { handleCreatePool, isLoading, userData } = useStacks();
  const [token0, setToken0] = useState("");
  const [token1, setToken1] = useState("");
  const [fee, setFee] = useState("500");

  const handleSubmit = async () => {
    if (!token0 || !token1 || !fee) return;
    await handleCreatePool(token0, token1, parseInt(fee));
    // Reset form
    setToken0("");
    setToken1("");
    setFee("500");
  };

  const feeOptions = [
    { value: "100", label: "0.01% - Best for stablecoins" },
    { value: "500", label: "0.05% - Common pair" },
    { value: "3000", label: "0.30% - Exotic pair" },
    { value: "10000", label: "1.00% - Very volatile" },
  ];

  return (
    <Card className="border border-slate-800 bg-slate-950/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Create New Pool</CardTitle>
        <CardDescription className="text-slate-400">
          Create a new liquidity pool for a token pair
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="token0" className="text-slate-300">Token 0 (Principal)</Label>
          <Input
            id="token0"
            placeholder="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.token-name"
            value={token0}
            onChange={(e) => setToken0(e.target.value)}
            className="border-slate-700 bg-slate-900/50 text-white placeholder:text-slate-500 focus:border-orange-500/30"
          />
          <p className="text-xs text-slate-500">
            Enter the full token principal address
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="token1" className="text-slate-300">Token 1 (Principal)</Label>
          <Input
            id="token1"
            placeholder="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.token-name"
            value={token1}
            onChange={(e) => setToken1(e.target.value)}
            className="border-slate-700 bg-slate-900/50 text-white placeholder:text-slate-500 focus:border-orange-500/30"
          />
          <p className="text-xs text-slate-500">
            Enter the full token principal address
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
  );
}
