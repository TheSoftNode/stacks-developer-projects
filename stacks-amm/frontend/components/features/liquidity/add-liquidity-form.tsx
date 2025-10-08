"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pool } from "@/lib/amm";
import { getTokenName } from "@/lib/amm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStacks } from "@/hooks/use-stacks";
import { formatNumber } from "@/lib/stx-utils";

interface AddLiquidityFormProps {
  pools: Pool[];
  preselectedPool?: Pool;
}

export function AddLiquidityForm({ pools, preselectedPool }: AddLiquidityFormProps) {
  const { handleAddLiquidity, isLoading, userData } = useStacks();
  const [selectedPoolId, setSelectedPoolId] = useState<string>("");
  const [amount0, setAmount0] = useState<string>("");
  const [amount1, setAmount1] = useState<string>("");

  // Initialize with preselected pool if provided
  useEffect(() => {
    if (preselectedPool && !selectedPoolId) {
      setSelectedPoolId(preselectedPool.id);
    }
  }, [preselectedPool, selectedPoolId]);
  
  const selectedPool = pools.find((p) => p.id === selectedPoolId);

  // Auto-calculate amount1 based on pool ratio
  useEffect(() => {
    if (selectedPool && amount0 && selectedPool.liquidity > 0) {
      const ratio = selectedPool["balance-1"] / selectedPool["balance-0"];
      const calculatedAmount1 = parseFloat(amount0) * ratio;
      setAmount1(calculatedAmount1.toFixed(6));
    }
  }, [amount0, selectedPool]);

  const handleSubmit = async () => {
    if (!selectedPool || !amount0 || !amount1) return;
    // Convert from user-friendly tokens to micro-units (6 decimals)
    const microAmount0 = Math.floor(parseFloat(amount0) * 1_000_000);
    const microAmount1 = Math.floor(parseFloat(amount1) * 1_000_000);

    await handleAddLiquidity(
      selectedPool,
      microAmount0,
      microAmount1
    );
    // Reset form
    setAmount0("");
    setAmount1("");
  };

  return (
    <Card className="border border-slate-800 bg-slate-950/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Add Liquidity</CardTitle>
        <CardDescription className="text-slate-400">
          Add liquidity to a pool and earn trading fees
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-slate-300">Select Pool</Label>
          <Select value={selectedPoolId} onValueChange={setSelectedPoolId}>
            <SelectTrigger className="border-slate-700 bg-slate-900/50 text-white hover:border-orange-500/30">
              <SelectValue placeholder="Choose a pool" />
            </SelectTrigger>
            <SelectContent className="border-slate-800 bg-slate-900">
              {pools.map((pool) => (
                <SelectItem key={pool.id} value={pool.id} className="text-slate-300 hover:text-white hover:bg-slate-800">
                  {getTokenName(pool["token-0"])} / {getTokenName(pool["token-1"])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPool && (
          <>
            <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Pool Liquidity</span>
                <span className="font-medium text-white">{formatNumber(selectedPool.liquidity)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Ratio</span>
                <span className="font-medium text-white">
                  {selectedPool["balance-0"] === 0 || selectedPool["balance-1"] === 0
                    ? "No liquidity yet"
                    : `1 : ${(selectedPool["balance-1"] / selectedPool["balance-0"]).toFixed(4)}`}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">{getTokenName(selectedPool["token-0"])} Amount</Label>
              <Input
                type="number"
                step="0.000001"
                placeholder="0.0"
                value={amount0}
                onChange={(e) => setAmount0(e.target.value)}
                className="border-slate-700 bg-slate-900/50 text-white placeholder:text-slate-500 focus:border-orange-500/30"
              />
              <p className="text-xs text-slate-500">
                Enter amount in tokens (e.g., 100 for 100 tokens)
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">{getTokenName(selectedPool["token-1"])} Amount</Label>
              <Input
                type="number"
                step="0.000001"
                placeholder="0.0"
                value={amount1}
                onChange={(e) => setAmount1(e.target.value)}
                disabled={selectedPool.liquidity > 0}
                className="border-slate-700 bg-slate-900/50 text-white placeholder:text-slate-500 focus:border-orange-500/30 disabled:opacity-50"
              />
              <p className="text-xs text-slate-500">
                {selectedPool.liquidity > 0
                  ? "Amount calculated based on pool ratio"
                  : "Enter amount in tokens (e.g., 100 for 100 tokens)"}
              </p>
            </div>
          </>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!userData || !selectedPool || !amount0 || !amount1 || isLoading}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all"
        >
          {!userData
            ? "Connect Wallet"
            : !selectedPool
            ? "Select Pool"
            : isLoading
            ? "Adding Liquidity..."
            : "Add Liquidity"}
        </Button>
      </CardContent>
    </Card>
  );
}
