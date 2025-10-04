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
}

export function RemoveLiquidityForm({ pools }: RemoveLiquidityFormProps) {
  const { handleRemoveLiquidity, isLoading, userData } = useStacks();
  const [selectedPoolId, setSelectedPoolId] = useState<string>("");
  const [liquidityAmount, setLiquidityAmount] = useState<string>("");
  const [liquidityPercentage, setLiquidityPercentage] = useState<number>(0);
  const [userLiquidity, setUserLiquidity] = useState<number>(0);
  
  const selectedPool = pools.find((p) => p.id === selectedPoolId);

  // Fetch user's liquidity for selected pool
  useEffect(() => {
    if (selectedPool && userData) {
      getUserLiquidity(selectedPool, userData.profile.stxAddress.testnet).then(
        (liquidity) => {
          setUserLiquidity(liquidity);
        }
      );
    }
  }, [selectedPool, userData]);

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
    ? (parseFloat(liquidityAmount) / selectedPool.liquidity) * selectedPool["balance-0"]
    : 0;

  const estimatedToken1 = selectedPool && liquidityAmount
    ? (parseFloat(liquidityAmount) / selectedPool.liquidity) * selectedPool["balance-1"]
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Remove Liquidity</CardTitle>
        <CardDescription>
          Remove your liquidity from a pool
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Select Pool</Label>
          <Select value={selectedPoolId} onValueChange={setSelectedPoolId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a pool" />
            </SelectTrigger>
            <SelectContent>
              {pools.map((pool) => (
                <SelectItem key={pool.id} value={pool.id}>
                  {getTokenName(pool["token-0"])} / {getTokenName(pool["token-1"])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPool && (
          <>
            <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Your Liquidity</span>
                <span className="font-medium">{formatNumber(userLiquidity)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Your Pool Share</span>
                <span className="font-medium">
                  {calculateSharePercentage(userLiquidity, selectedPool.liquidity).toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Amount to Remove</Label>
                  <span className="text-sm text-muted-foreground">
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
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="flex gap-2">
                  {[25, 50, 75, 100].map((percent) => (
                    <Button
                      key={percent}
                      variant="outline"
                      size="sm"
                      onClick={() => handlePercentageChange([percent])}
                      className="flex-1"
                    >
                      {percent}%
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Liquidity Amount</Label>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={liquidityAmount}
                  onChange={(e) => setLiquidityAmount(e.target.value)}
                  max={userLiquidity}
                />
              </div>
            </div>

            {liquidityAmount && parseFloat(liquidityAmount) > 0 && (
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm font-medium">You will receive:</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {getTokenName(selectedPool["token-0"])}:
                    </span>
                    <span className="font-medium">{estimatedToken0.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {getTokenName(selectedPool["token-1"])}:
                    </span>
                    <span className="font-medium">{estimatedToken1.toFixed(6)}</span>
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
          className="w-full"
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
