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
    <div className="container px-4 py-8 space-y-8 max-w-7xl">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome back{userData ? `, ${userData.profile.stxAddress.testnet.substring(0, 8)}...` : ""}
        </h1>
        <p className="text-muted-foreground text-lg">
          {userData 
            ? "Here's an overview of your DeFi portfolio and market activity"
            : "Connect your wallet to view your portfolio"}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/dashboard/swap">
          <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50">
            <CardContent className="pt-6 pb-6 flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-blue-500/10">
                <ArrowLeftRight className="h-6 w-6 text-blue-500" />
              </div>
              <p className="font-semibold">Swap</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/pools">
          <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50">
            <CardContent className="pt-6 pb-6 flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-purple-500/10">
                <Droplet className="h-6 w-6 text-purple-500" />
              </div>
              <p className="font-semibold">Pools</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/liquidity">
          <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50">
            <CardContent className="pt-6 pb-6 flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-green-500/10">
                <Plus className="h-6 w-6 text-green-500" />
              </div>
              <p className="font-semibold">Add Liquidity</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/analytics">
          <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50">
            <CardContent className="pt-6 pb-6 flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-orange-500/10">
                <TrendingUp className="h-6 w-6 text-orange-500" />
              </div>
              <p className="font-semibold">Analytics</p>
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
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Your Liquidity Positions</h2>
              <p className="text-muted-foreground">Pools where you've provided liquidity</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard/liquidity">
                <Plus className="h-4 w-4 mr-2" />
                Add Liquidity
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-20 w-full" />
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
            <Card>
              <CardContent className="py-12 text-center">
                <Droplet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Active Positions</h3>
                <p className="text-muted-foreground mb-4">
                  {userData
                    ? "You haven't provided liquidity to any pools yet."
                    : "Connect your wallet to view your positions"}
                </p>
                {userData && (
                  <Button asChild>
                    <Link href="/dashboard/liquidity">Add Liquidity</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Top Pools Sidebar */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Top Pools</h2>
            <p className="text-muted-foreground">Highest TVL pools</p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-16 w-full" />
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
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No pools available</p>
              </CardContent>
            </Card>
          )}

          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard/pools">View All Pools</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
