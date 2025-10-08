"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pool, getUserLiquidity } from "@/lib/amm";
import { getTokenName } from "@/lib/amm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStacks } from "@/hooks/use-stacks";
import { formatNumber, calculateSharePercentage } from "@/lib/stx-utils";
// import { Slider } from "@/components/ui/slider";

interface RemoveLiquidityFormProps {
  pools: Pool[];
  preselectedPool?: Pool;
  userLiquidity?: number;
}

export function RemoveLiquidityForm({ pools, preselectedPool, userLiquidity: initialUserLiquidity }: RemoveLiquidityFormProps) {
  const { handleRemoveLiquidity, isLoading, userData } = useStacks();
  const [selectedPoolId, setSelectedPoolId] = useState<string>("");
  const [liquidityAmount, setLiquidityAmount] = useState<string>("");
  const [liquidityPercentage, setLiquidityPercentage] = useState<number>(0);
  const [userLiquidity, setUserLiquidity] = useState<number>(initialUserLiquidity || 0);

  // Initialize with preselected pool if provided
  useEffect(() => {
    if (preselectedPool && !selectedPoolId) {
      setSelectedPoolId(preselectedPool.id);
    }
  }, [preselectedPool, selectedPoolId]);

  // Update userLiquidity when initialUserLiquidity changes
  useEffect(() => {
    if (initialUserLiquidity !== undefined) {
      setUserLiquidity(initialUserLiquidity);
    }
  }, [initialUserLiquidity]);
  
  const selectedPool = pools.find((p) => p.id === selectedPoolId);

  // Fetch user's liquidity for selected pool only if not provided
  useEffect(() => {
    if (selectedPool && userData && !initialUserLiquidity) {
      getUserLiquidity(selectedPool, userData.profile.stxAddress.testnet).then(
        (liquidity) => {
          setUserLiquidity(liquidity);
        }
      );
    }
  }, [selectedPool, userData, initialUserLiquidity]);

  // Update percentage when amount changes
  useEffect(() => {
    if (liquidityAmount && userLiquidity > 0) {
      const percentage = (parseFloat(liquidityAmount) / userLiquidity) * 100;
      setLiquidityPercentage(Math.min(percentage, 100));
    }
  }, [liquidityAmount, userLiquidity]);

  const handlePercentageChange = (value: number[]) => {
    const percentage = value[0];
    setLiquidityPercentage(percentage);
    const amount = (userLiquidity * percentage) / 100;
    setLiquidityAmount(amount.toFixed(0));
  };

  const handleSubmit = async () => {
    if (!selectedPool || !liquidityAmount) return;
    await handleRemoveLiquidity(selectedPool, parseFloat(liquidityAmount));
    // Reset form
    setLiquidityAmount("");
    setLiquidityPercentage(0);
  };

  const estimatedToken0 = selectedPool && liquidityAmount
    ? ((parseFloat(liquidityAmount) / selectedPool.liquidity) * selectedPool["balance-0"]) / 1_000_000
    : 0;

  const estimatedToken1 = selectedPool && liquidityAmount
    ? ((parseFloat(liquidityAmount) / selectedPool.liquidity) * selectedPool["balance-1"]) / 1_000_000
    : 0;

  return (
    <Card className="border border-slate-800 bg-slate-950/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Remove Liquidity</CardTitle>
        <CardDescription className="text-slate-400">
          Remove your liquidity from a pool
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
                <span className="text-slate-400">Your Liquidity</span>
                <span className="font-medium text-white">{formatNumber(userLiquidity)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Your Pool Share</span>
                <span className="font-medium text-white">
                  {calculateSharePercentage(userLiquidity, selectedPool.liquidity).toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label className="text-slate-300">Amount to Remove</Label>
                  <span className="text-sm text-orange-400 font-medium">
                    {liquidityPercentage.toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={liquidityPercentage}
                  onChange={(e) => handlePercentageChange([parseInt(e.target.value)])}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  style={{
                    background: `linear-gradient(to right, rgb(249 115 22) 0%, rgb(249 115 22) ${liquidityPercentage}%, rgb(51 65 85) ${liquidityPercentage}%, rgb(51 65 85) 100%)`
                  }}
                />
                <div className="flex gap-2">
                  {[25, 50, 75, 100].map((percent) => (
                    <Button
                      key={percent}
                      variant="outline"
                      size="sm"
                      onClick={() => handlePercentageChange([percent])}
                      className="flex-1 border-slate-700 bg-slate-900/50 hover:bg-slate-800 hover:border-orange-500/30 text-slate-300 hover:text-orange-400"
                    >
                      {percent}%
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {liquidityAmount && parseFloat(liquidityAmount) > 0 && (
              <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4 space-y-2">
                <p className="text-sm font-medium text-white">You will receive:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">
                      {getTokenName(selectedPool["token-0"])}:
                    </span>
                    <span className="font-medium text-white">{estimatedToken0.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">
                      {getTokenName(selectedPool["token-1"])}:
                    </span>
                    <span className="font-medium text-white">{estimatedToken1.toFixed(6)}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <Button
          onClick={handleSubmit}
          disabled={
            !userData ||
            !selectedPool ||
            !liquidityAmount ||
            parseFloat(liquidityAmount) > userLiquidity ||
            isLoading
          }
          className="w-full bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all"
        >
          {!userData
            ? "Connect Wallet"
            : !selectedPool
            ? "Select Pool"
            : parseFloat(liquidityAmount) > userLiquidity
            ? "Insufficient Liquidity"
            : isLoading
            ? "Removing Liquidity..."
            : "Remove Liquidity"}
        </Button>
      </CardContent>
    </Card>
  );
}
