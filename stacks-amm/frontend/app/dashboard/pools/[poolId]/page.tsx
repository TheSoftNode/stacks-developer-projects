"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllPools, Pool, getUserLiquidity, getTokenName, formatTokenAmount } from "@/lib/amm";
import { formatNumber, formatPercentage } from "@/lib/stx-utils";
import { useStacks } from "@/hooks/use-stacks";
import { AddLiquidityForm } from "@/components/features/liquidity/add-liquidity-form";
import { RemoveLiquidityForm } from "@/components/features/liquidity/remove-liquidity-form";
import { SwapForm } from "@/components/features/swap/swap-form";
import { ArrowLeft, Droplet, TrendingUp, BarChart3, Coins, ArrowLeftRight } from "lucide-react";
import Link from "next/link";

export default function PoolPage() {
  const params = useParams();
  const router = useRouter();
  const poolId = params.poolId as string;
  const { userData } = useStacks();

  const [pool, setPool] = useState<Pool | null>(null);
  const [userLiquidity, setUserLiquidity] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPool() {
      try {
        setLoading(true);
        const pools = await getAllPools();
        const foundPool = pools.find((p) => p.id === poolId);

        if (!foundPool) {
          router.push("/dashboard/pools");
          return;
        }

        setPool(foundPool);

        if (userData) {
          const address = userData.profile.stxAddress.testnet;
          const liquidity = await getUserLiquidity(foundPool, address);
          setUserLiquidity(liquidity);
        }
      } catch (error) {
        console.error("Error loading pool:", error);
      } finally {
        setLoading(false);
      }
    }

    loadPool();
  }, [poolId, userData, router]);

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading pool...</p>
        </div>
      </div>
    );
  }

  if (!pool) {
    return null;
  }

  const token0Name = getTokenName(pool["token-0"]);
  const token1Name = getTokenName(pool["token-1"]);
  const feesInPercentage = pool.fee / 10_000;
  const hasLiquidity = userLiquidity > 0;

  return (
    <div className="min-h-screen p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/pools")}
          className="border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Pools
        </Button>
      </div>

      {/* Pool Overview */}
      <Card className="border border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20">
                <Droplet className="h-6 w-6 text-teal-400" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">
                  {token0Name} / {token1Name}
                </CardTitle>
                <CardDescription className="text-slate-400 mt-1">
                  Pool ID: {pool.id.substring(0, 16)}...
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-lg px-4 py-2">
              {formatPercentage(feesInPercentage)}% Fee
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="h-4 w-4 text-slate-400" />
                <p className="text-xs text-slate-400">Total Liquidity</p>
              </div>
              <p className="text-2xl font-bold text-white">
                {formatNumber(pool.liquidity)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-slate-400" />
                <p className="text-xs text-slate-400">TVL</p>
              </div>
              <p className="text-2xl font-bold text-white">
                ${formatNumber(pool.tvl || 0)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-slate-400" />
                <p className="text-xs text-slate-400">{token0Name} Balance</p>
              </div>
              <p className="text-2xl font-bold text-white">
                {formatNumber(pool["balance-0"])}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-slate-400" />
                <p className="text-xs text-slate-400">{token1Name} Balance</p>
              </div>
              <p className="text-2xl font-bold text-white">
                {formatNumber(pool["balance-1"])}
              </p>
            </div>
          </div>

          {hasLiquidity && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Your Position</span>
                </div>
                <span className="text-2xl font-bold text-emerald-400">
                  {formatNumber(userLiquidity)} LP Tokens
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions Tabs */}
      <Tabs defaultValue="swap" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-900/50 border border-slate-800">
          <TabsTrigger
            value="swap"
            className="data-[state=active]:bg-orange-600 data-[state=active]:text-white"
          >
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Swap
          </TabsTrigger>
          <TabsTrigger
            value="add"
            className="data-[state=active]:bg-orange-600 data-[state=active]:text-white"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Add Liquidity
          </TabsTrigger>
          <TabsTrigger
            value="remove"
            className="data-[state=active]:bg-orange-600 data-[state=active]:text-white"
            disabled={!hasLiquidity}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Remove Liquidity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="swap" className="mt-6">
          <div className="max-w-2xl mx-auto">
            <SwapForm pools={[pool]} preselectedPool={pool} />
          </div>
        </TabsContent>

        <TabsContent value="add" className="mt-6">
          <div className="max-w-2xl mx-auto">
            <AddLiquidityForm pools={[pool]} preselectedPool={pool} />
          </div>
        </TabsContent>

        <TabsContent value="remove" className="mt-6">
          <div className="max-w-2xl mx-auto">
            <RemoveLiquidityForm pools={[pool]} preselectedPool={pool} userLiquidity={userLiquidity} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
