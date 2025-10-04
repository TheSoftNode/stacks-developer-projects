"use client";

import { useEffect, useState } from "react";
import { getAllPools, Pool } from "@/lib/amm";
import { SwapForm } from "@/components/features/swap/swap-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Shield, Zap } from "lucide-react";

export default function SwapPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPools();
  }, []);

  const loadPools = async () => {
    setLoading(true);
    try {
      const allPools = await getAllPools();
      setPools(allPools);
    } catch (error) {
      console.error("Error loading pools:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container px-4 py-8 max-w-7xl space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Swap Tokens</h1>
        <p className="text-muted-foreground text-lg">
          Trade tokens instantly with the best rates and minimal slippage
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Swap Form */}
        <div className="lg:col-span-2">
          {loading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ) : pools.length > 0 ? (
            <SwapForm pools={pools} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Pools Available</CardTitle>
                <CardDescription>
                  There are no liquidity pools available yet. Create a pool to start trading.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Info Sidebar */}
        <div className="space-y-4">
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <CardTitle className="text-lg">How Swaps Work</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">1</div>
                <p className="text-muted-foreground">Select the tokens you want to trade</p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">2</div>
                <p className="text-muted-foreground">Enter the amount you want to swap</p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">3</div>
                <p className="text-muted-foreground">Review the estimated output and price impact</p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">4</div>
                <p className="text-muted-foreground">Confirm the transaction in your wallet</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Zap className="h-5 w-5 text-green-500" />
                </div>
                <CardTitle className="text-lg">Trading Tips</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <span className="text-green-500">•</span>
                Watch out for price impact on large trades
              </p>
              <p className="flex items-start gap-2">
                <span className="text-green-500">•</span>
                Set appropriate slippage tolerance
              </p>
              <p className="flex items-start gap-2">
                <span className="text-green-500">•</span>
                Trading fees go to liquidity providers
              </p>
              <p className="flex items-start gap-2">
                <span className="text-green-500">•</span>
                Double-check token addresses before swapping
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 bg-gradient-to-br from-blue-500/5 to-purple-600/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Shield className="h-5 w-5 text-purple-500" />
                </div>
                <CardTitle className="text-lg">Security</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                All swaps are executed through audited smart contracts. Your funds never leave your wallet until the transaction is confirmed.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
