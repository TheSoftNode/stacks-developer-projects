"use client";

import { useEffect, useState } from "react";
import { getAllPools, Pool } from "@/lib/amm";
import { AddLiquidityForm } from "@/components/features/liquidity/add-liquidity-form";
import { RemoveLiquidityForm } from "@/components/features/liquidity/remove-liquidity-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Droplet, TrendingUp, AlertCircle } from "lucide-react";

export default function LiquidityPage() {
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
        <h1 className="text-4xl font-bold tracking-tight text-white">Manage Liquidity</h1>
        <p className="text-slate-400 text-lg">
          Add or remove liquidity from pools and earn trading fees
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {loading ? (
            <Card className="border border-slate-800 bg-slate-950/50">
              <CardContent className="p-6">
                <Skeleton className="h-96 w-full bg-slate-800" />
              </CardContent>
            </Card>
          ) : pools.length > 0 ? (
            <Tabs defaultValue="add" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-950/50 border border-slate-800">
                <TabsTrigger
                  value="add"
                  className="data-[state=active]:bg-orange-500/10 data-[state=active]:text-orange-500 data-[state=active]:border-orange-500/20 text-slate-400"
                >
                  Add Liquidity
                </TabsTrigger>
                <TabsTrigger
                  value="remove"
                  className="data-[state=active]:bg-orange-500/10 data-[state=active]:text-orange-500 data-[state=active]:border-orange-500/20 text-slate-400"
                >
                  Remove Liquidity
                </TabsTrigger>
              </TabsList>

              <TabsContent value="add" className="mt-6">
                <AddLiquidityForm pools={pools} />
              </TabsContent>

              <TabsContent value="remove" className="mt-6">
                <RemoveLiquidityForm pools={pools} />
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="border border-slate-800 bg-slate-950/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">No Pools Available</CardTitle>
                <CardDescription className="text-slate-400">
                  There are no liquidity pools available yet. Create a pool first.
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
                  <Droplet className="h-5 w-5 text-teal-400" />
                </div>
                <CardTitle className="text-lg text-white">About Liquidity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-400">
              <p>
                When you add liquidity, you'll receive LP tokens representing your share of the pool.
              </p>
              <p>
                You earn a portion of all trading fees proportional to your share.
              </p>
              <p>
                You can remove your liquidity at any time by burning your LP tokens.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-800 bg-slate-950/50 backdrop-blur-sm hover:border-slate-700 transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                </div>
                <CardTitle className="text-lg text-white">Earning Fees</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-400">
              <p>
                Liquidity providers earn fees from every swap in their pool.
              </p>
              <p>
                The more volume a pool has, the more fees you earn.
              </p>
              <p>
                Fees are automatically added to your position.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-slate-950/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <AlertCircle className="h-5 w-5 text-orange-400" />
                </div>
                <CardTitle className="text-lg text-white">Important Notes</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-400">
              <p className="flex items-start gap-2">
                <span className="text-orange-400">•</span>
                Be aware of impermanent loss when providing liquidity
              </p>
              <p className="flex items-start gap-2">
                <span className="text-orange-400">•</span>
                Ensure you have both tokens before adding liquidity
              </p>
              <p className="flex items-start gap-2">
                <span className="text-orange-400">•</span>
                Your funds are always in your control
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
