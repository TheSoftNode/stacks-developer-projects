"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/shared/cards/stat-card";
import { TrendingUp, Droplet, ArrowLeftRight, Users } from "lucide-react";
import { getAllPools, Pool } from "@/lib/amm";
import { formatNumber, formatCurrency, formatPercentage } from "@/lib/stx-utils";
import { AnalyticsCharts } from "@/components/features/analytics/analytics-charts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTokenName } from "@/lib/amm";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsPage() {
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
  
  // Calculate stats
  const totalLiquidity = pools.reduce((sum, pool) => sum + pool.liquidity, 0);
  const totalTVL = pools.reduce((sum, pool) => sum + (pool.tvl || 0), 0);

  return (
    <div className="container px-4 py-8 max-w-7xl space-y-8 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-white">Analytics</h1>
        <p className="text-slate-400 text-lg">
          Comprehensive market statistics and insights
        </p>
      </div>

      {/* Key Metrics */}
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
            icon={TrendingUp}
            trend={{ value: 15.2, isPositive: true }}
          />
          <StatCard
            title="24h Volume"
            value="$0"
            icon={ArrowLeftRight}
            trend={{ value: 0, isPositive: false }}
          />
          <StatCard
            title="Total Pools"
            value={pools.length}
            icon={Droplet}
          />
          <StatCard
            title="Active Users"
            value="0"
            icon={Users}
            trend={{ value: 0, isPositive: true }}
          />
        </div>
      )}

      {/* Charts */}
      <AnalyticsCharts />

      {/* Pools Table */}
      <Card className="border border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">All Pools</CardTitle>
          <CardDescription className="text-slate-400">Detailed pool statistics</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full bg-slate-800" />
              ))}
            </div>
          ) : pools.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-slate-800/50">
                    <TableHead className="text-slate-300">Pool</TableHead>
                    <TableHead className="text-slate-300">TVL</TableHead>
                    <TableHead className="text-slate-300">Liquidity</TableHead>
                    <TableHead className="text-slate-300">Fee</TableHead>
                    <TableHead className="text-slate-300">APY</TableHead>
                    <TableHead className="text-slate-300">24h Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pools.map((pool) => (
                    <TableRow key={pool.id} className="border-slate-800 hover:bg-slate-800/30">
                      <TableCell className="font-medium text-white">
                        {getTokenName(pool["token-0"])} / {getTokenName(pool["token-1"])}
                      </TableCell>
                      <TableCell className="text-slate-300">${formatNumber(pool.tvl || 0)}</TableCell>
                      <TableCell className="text-slate-300">{formatNumber(pool.liquidity)}</TableCell>
                      <TableCell className="text-slate-300">{formatPercentage(pool.fee / 10_000)}</TableCell>
                      <TableCell className="text-emerald-400 font-medium">{formatPercentage(pool.apy || 0)}</TableCell>
                      <TableCell className="text-slate-300">$0</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 border border-slate-700">
                <Droplet className="h-8 w-8 text-slate-500" />
              </div>
              <p className="text-slate-400">
                No pools available yet
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
