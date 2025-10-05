"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pool, calculateSwapQuote, SwapQuote } from "@/lib/amm";
import { getTokenName } from "@/lib/amm";
import { formatNumber, formatPercentage } from "@/lib/stx-utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownUp, Settings2 } from "lucide-react";
import { useStacks } from "@/hooks/use-stacks";

interface SwapFormProps {
  pools: Pool[];
}

export function SwapForm({ pools }: SwapFormProps) {
  const { handleSwap, isLoading, userData } = useStacks();
  const [fromToken, setFromToken] = useState<string>("");
  const [toToken, setToToken] = useState<string>("");
  const [fromAmount, setFromAmount] = useState<string>("");
  const [slippage, setSlippage] = useState<number>(0.5);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);

  // Get unique tokens from all pools
  const uniqueTokens = Array.from(
    new Set(pools.flatMap((pool) => [pool["token-0"], pool["token-1"]]))
  );

  // Get available destination tokens based on selected from token
  const availableToTokens = pools
    .filter((pool) => 
      pool["token-0"] === fromToken || pool["token-1"] === fromToken
    )
    .flatMap((pool) => 
      pool["token-0"] === fromToken ? [pool["token-1"]] : [pool["token-0"]]
    );

  // Find the pool for the selected pair
  useEffect(() => {
    if (fromToken && toToken) {
      const pool = pools.find(
        (p) =>
          (p["token-0"] === fromToken && p["token-1"] === toToken) ||
          (p["token-0"] === toToken && p["token-1"] === fromToken)
      );
      setSelectedPool(pool || null);
    }
  }, [fromToken, toToken, pools]);

  // Calculate quote when amount or tokens change
  useEffect(() => {
    if (selectedPool && fromAmount && parseFloat(fromAmount) > 0) {
      const amount = parseFloat(fromAmount);
      const zeroForOne = fromToken === selectedPool["token-0"];
      const newQuote = calculateSwapQuote(selectedPool, amount, zeroForOne, slippage);
      setQuote(newQuote);
    } else {
      setQuote(null);
    }
  }, [selectedPool, fromAmount, fromToken, slippage]);

  const handleSwapClick = async () => {
    if (!selectedPool || !fromAmount || parseFloat(fromAmount) <= 0) return;
    
    const amount = parseFloat(fromAmount);
    const zeroForOne = fromToken === selectedPool["token-0"];
    
    await handleSwap(selectedPool, amount, zeroForOne);
  };

  const handleSwapDirection = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount("");
  };

  return (
    <Card className="w-full border border-slate-800 bg-slate-950/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Swap Tokens</CardTitle>
            <CardDescription className="text-slate-400">Trade tokens instantly</CardDescription>
          </div>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-teal-400 hover:bg-slate-800">
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* From Token */}
        <div className="space-y-2">
          <Label className="text-slate-300">From</Label>
          <div className="flex gap-2">
            <Select value={fromToken} onValueChange={setFromToken}>
              <SelectTrigger className="w-[140px] border-slate-700 bg-slate-900/50 text-white hover:border-orange-500/30">
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent className="border-slate-800 bg-slate-900">
                {uniqueTokens.map((token) => (
                  <SelectItem key={token} value={token} className="text-slate-300 hover:text-white hover:bg-slate-800">
                    {getTokenName(token)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="0.0"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="flex-1 border-slate-700 bg-slate-900/50 text-white placeholder:text-slate-500 focus:border-orange-500/30"
            />
          </div>
        </div>

        {/* Swap Direction Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="icon"
            onClick={handleSwapDirection}
            disabled={!fromToken || !toToken}
            className="rounded-full border-slate-700 bg-slate-900/50 hover:bg-slate-800 hover:border-teal-500/30 text-slate-400 hover:text-teal-400 disabled:opacity-50"
          >
            <ArrowDownUp className="h-4 w-4" />
          </Button>
        </div>

        {/* To Token */}
        <div className="space-y-2">
          <Label className="text-slate-300">To</Label>
          <div className="flex gap-2">
            <Select
              value={toToken}
              onValueChange={setToToken}
              disabled={!fromToken || availableToTokens.length === 0}
            >
              <SelectTrigger className="w-[140px] border-slate-700 bg-slate-900/50 text-white hover:border-orange-500/30 disabled:opacity-50">
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent className="border-slate-800 bg-slate-900">
                {availableToTokens.map((token) => (
                  <SelectItem key={token} value={token} className="text-slate-300 hover:text-white hover:bg-slate-800">
                    {getTokenName(token)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="0.0"
              value={quote ? quote.outputAmount.toFixed(6) : ""}
              disabled
              className="flex-1 border-slate-700 bg-slate-900/50 text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Quote Details */}
        {quote && (
          <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Price Impact</span>
              <span className={quote.priceImpact > 5 ? "text-red-400 font-medium" : "text-white"}>
                {formatPercentage(quote.priceImpact)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Fee</span>
              <span className="text-white">{quote.fee.toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Minimum Received</span>
              <span className="text-white">{quote.minimumReceived.toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Slippage Tolerance</span>
              <span className="text-white">{formatPercentage(slippage)}</span>
            </div>
          </div>
        )}

        {/* Swap Button */}
        <Button
          onClick={handleSwapClick}
          disabled={!userData || !selectedPool || !fromAmount || isLoading}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all"
          size="lg"
        >
          {!userData
            ? "Connect Wallet"
            : !selectedPool
            ? "Select Tokens"
            : isLoading
            ? "Swapping..."
            : "Swap"}
        </Button>
      </CardContent>
    </Card>
  );
}
