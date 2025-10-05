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
    <div className="container px-4 py-8 max-w-7xl space-y-8 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-white">Swap Tokens</h1>
        <p className="text-slate-400 text-lg">
          Trade tokens instantly with the best rates and minimal slippage
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Swap Form */}
        <div className="lg:col-span-2">
          {loading ? (
            <Card className="border border-slate-800 bg-slate-950/50 backdrop-blur-sm">
              <CardHeader>
                <Skeleton className="h-6 w-32 bg-slate-800" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full bg-slate-800" />
                <Skeleton className="h-20 w-full bg-slate-800" />
                <Skeleton className="h-12 w-full bg-slate-800" />
              </CardContent>
            </Card>
          ) : pools.length > 0 ? (
            <SwapForm pools={pools} />
          ) : (
            <Card className="border border-slate-800 bg-slate-950/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">No Pools Available</CardTitle>
                <CardDescription className="text-slate-400">
                  There are no liquidity pools available yet. Create a pool to start trading.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Info Sidebar */}
        <div className="space-y-4">
          <Card className="border border-slate-800 bg-slate-950/50 backdrop-blur-sm hover:border-slate-700 transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20">
                  <TrendingUp className="h-5 w-5 text-teal-400" />
                </div>
                <CardTitle className="text-lg text-white">How Swaps Work</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-500">1</div>
                <p className="text-slate-400">Select the tokens you want to trade</p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-500">2</div>
                <p className="text-slate-400">Enter the amount you want to swap</p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-500">3</div>
                <p className="text-slate-400">Review the estimated output and price impact</p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-500">4</div>
                <p className="text-slate-400">Confirm the transaction in your wallet</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-800 bg-slate-950/50 backdrop-blur-sm hover:border-slate-700 transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Zap className="h-5 w-5 text-emerald-400" />
                </div>
                <CardTitle className="text-lg text-white">Trading Tips</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-400">
              <p className="flex items-start gap-2">
                <span className="text-emerald-400">•</span>
                Watch out for price impact on large trades
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-400">•</span>
                Set appropriate slippage tolerance
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-400">•</span>
                Trading fees go to liquidity providers
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-400">•</span>
                Double-check token addresses before swapping
              </p>
            </CardContent>
          </Card>

          <Card className="border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-slate-950/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Shield className="h-5 w-5 text-blue-400" />
                </div>
                <CardTitle className="text-lg text-white">Security</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-slate-400">
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
