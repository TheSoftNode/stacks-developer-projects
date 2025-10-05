"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/shared/cards/stat-card";
import { TrendingUp, Droplet, ArrowLeftRight, DollarSign, Plus } from "lucide-react";
import { getAllPools, getUserLiquidity, Pool } from "@/lib/amm";
import { formatNumber, formatCurrency } from "@/lib/stx-utils";
import { PoolCard } from "@/components/shared/cards/pool-card";
import { useStacks } from "@/hooks/use-stacks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { userData } = useStacks();
  const [pools, setPools] = useState<Pool[]>([]);
  const [userPools, setUserPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userData]);

  const loadData = async () => {
    setLoading(true);
    try {
      const allPools = await getAllPools();
      setPools(allPools);

      // Get user's pools if connected
      if (userData) {
        const poolsWithLiquidity = await Promise.all(
          allPools.map(async (pool) => {
            const liquidity = await getUserLiquidity(
              pool,
              userData.profile.stxAddress.testnet
            );
            return { pool, liquidity };
          })
        );

        const filteredPools = poolsWithLiquidity
          .filter(({ liquidity }) => liquidity > 0)
          .map(({ pool }) => pool);

        setUserPools(filteredPools);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const totalLiquidity = pools.reduce((sum, pool) => sum + pool.liquidity, 0);
  const totalTVL = pools.reduce((sum, pool) => sum + (pool.tvl || 0), 0);
  const userPositions = userPools.length;

  return (
    <div className="container px-4 py-8 space-y-8 max-w-7xl bg-slate-900 min-h-screen">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Welcome back{userData ? `, ${userData.profile.stxAddress.testnet.substring(0, 8)}...` : ""}
        </h1>
        <p className="text-slate-400 text-lg">
          {userData
            ? "Here's an overview of your DeFi portfolio and market activity"
            : "Connect your wallet to view your portfolio"}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/dashboard/swap">
          <Card className="hover:shadow-xl hover:shadow-orange-500/10 transition-all cursor-pointer border border-slate-800 hover:border-orange-500/30 bg-slate-950/50 backdrop-blur-sm group">
            <CardContent className="pt-6 pb-6 flex flex-col items-center gap-3">
              <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 group-hover:scale-110 transition-transform duration-300">
                <ArrowLeftRight className="h-6 w-6 text-orange-500" />
              </div>
              <p className="font-semibold text-white group-hover:text-orange-400 transition-colors">Swap</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/pools">
          <Card className="hover:shadow-xl hover:shadow-teal-500/10 transition-all cursor-pointer border border-slate-800 hover:border-teal-500/30 bg-slate-950/50 backdrop-blur-sm group">
            <CardContent className="pt-6 pb-6 flex flex-col items-center gap-3">
              <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 group-hover:scale-110 transition-transform duration-300">
                <Droplet className="h-6 w-6 text-teal-400" />
              </div>
              <p className="font-semibold text-white group-hover:text-teal-400 transition-colors">Pools</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/liquidity">
          <Card className="hover:shadow-xl hover:shadow-emerald-500/10 transition-all cursor-pointer border border-slate-800 hover:border-emerald-500/30 bg-slate-950/50 backdrop-blur-sm group">
            <CardContent className="pt-6 pb-6 flex flex-col items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                <Plus className="h-6 w-6 text-emerald-400" />
              </div>
              <p className="font-semibold text-white group-hover:text-emerald-400 transition-colors">Add Liquidity</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/analytics">
          <Card className="hover:shadow-xl hover:shadow-blue-500/10 transition-all cursor-pointer border border-slate-800 hover:border-blue-500/30 bg-slate-950/50 backdrop-blur-sm group">
            <CardContent className="pt-6 pb-6 flex flex-col items-center gap-3">
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-6 w-6 text-blue-400" />
              </div>
              <p className="font-semibold text-white group-hover:text-blue-400 transition-colors">Analytics</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-24 mb-4" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Value Locked"
            value={formatCurrency(totalTVL, "USD")}
            description="Across all pools"
            icon={DollarSign}
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatCard
            title="Total Liquidity"
            value={formatNumber(totalLiquidity)}
            description="Combined pool liquidity"
            icon={Droplet}
            trend={{ value: 8.3, isPositive: true }}
          />
          <StatCard
            title="Your Positions"
            value={userPositions}
            description="Active liquidity positions"
            icon={TrendingUp}
          />
          <StatCard
            title="24h Volume"
            value="$0"
            description="Last 24 hours"
            icon={ArrowLeftRight}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Your Positions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Your Liquidity Positions</h2>
              <p className="text-slate-400">Pools where you've provided liquidity</p>
            </div>
            <Button asChild variant="outline" className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 hover:border-orange-500/30 text-slate-300 hover:text-orange-400">
              <Link href="/dashboard/liquidity">
                <Plus className="h-4 w-4 mr-2" />
                Add Liquidity
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="border border-slate-800 bg-slate-950/50">
                  <CardContent className="p-6">
                    <Skeleton className="h-20 w-full bg-slate-800" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : userPools.length > 0 ? (
            <div className="grid gap-4">
              {userPools.map((pool) => (
                <PoolCard key={pool.id} pool={pool} />
              ))}
            </div>
          ) : (
            <Card className="border border-slate-800 bg-slate-950/50 backdrop-blur-sm">
              <CardContent className="py-16 text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-500/10 border border-teal-500/20">
                  <Droplet className="h-8 w-8 text-teal-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">No Active Positions</h3>
                <p className="text-slate-400 mb-6 max-w-md mx-auto">
                  {userData
                    ? "You haven't provided liquidity to any pools yet. Start earning fees by providing liquidity."
                    : "Connect your wallet to view your positions"}
                </p>
                {userData && (
                  <Button asChild className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20">
                    <Link href="/dashboard/liquidity">Add Liquidity Now</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Top Pools Sidebar */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Top Pools</h2>
            <p className="text-slate-400">Highest TVL pools</p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="border border-slate-800 bg-slate-950/50">
                  <CardContent className="p-4">
                    <Skeleton className="h-16 w-full bg-slate-800" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pools.length > 0 ? (
            <div className="space-y-4">
              {pools.slice(0, 5).map((pool) => (
                <PoolCard key={pool.id} pool={pool} />
              ))}
            </div>
          ) : (
            <Card className="border border-slate-800 bg-slate-950/50 backdrop-blur-sm">
              <CardContent className="py-8 text-center">
                <p className="text-slate-400">No pools available</p>
              </CardContent>
            </Card>
          )}

          <Button asChild variant="outline" className="w-full border-slate-700 bg-slate-900/50 hover:bg-slate-800 hover:border-teal-500/30 text-slate-300 hover:text-teal-400">
            <Link href="/dashboard/pools">View All Pools</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
