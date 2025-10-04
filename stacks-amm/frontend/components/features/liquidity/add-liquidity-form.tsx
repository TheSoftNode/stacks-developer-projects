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
}

export function AddLiquidityForm({ pools }: AddLiquidityFormProps) {
  const { handleAddLiquidity, isLoading, userData } = useStacks();
  const [selectedPoolId, setSelectedPoolId] = useState<string>("");
  const [amount0, setAmount0] = useState<string>("");
  const [amount1, setAmount1] = useState<string>("");
  
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
    await handleAddLiquidity(
      selectedPool,
      parseFloat(amount0),
      parseFloat(amount1)
    );
    // Reset form
    setAmount0("");
    setAmount1("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Liquidity</CardTitle>
        <CardDescription>
          Add liquidity to a pool and earn trading fees
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
                <span className="text-muted-foreground">Pool Liquidity</span>
                <span className="font-medium">{formatNumber(selectedPool.liquidity)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Ratio</span>
                <span className="font-medium">
                  1 : {(selectedPool["balance-1"] / selectedPool["balance-0"]).toFixed(4)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{getTokenName(selectedPool["token-0"])} Amount</Label>
              <Input
                type="number"
                placeholder="0.0"
                value={amount0}
                onChange={(e) => setAmount0(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Available: {formatNumber(selectedPool["balance-0"])}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{getTokenName(selectedPool["token-1"])} Amount</Label>
              <Input
                type="number"
                placeholder="0.0"
                value={amount1}
                onChange={(e) => setAmount1(e.target.value)}
                disabled={selectedPool.liquidity > 0}
              />
              <p className="text-xs text-muted-foreground">
                {selectedPool.liquidity > 0 
                  ? "Amount calculated based on pool ratio" 
                  : "Initial liquidity - enter any amount"}
              </p>
            </div>
          </>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!userData || !selectedPool || !amount0 || !amount1 || isLoading}
          className="w-full"
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
