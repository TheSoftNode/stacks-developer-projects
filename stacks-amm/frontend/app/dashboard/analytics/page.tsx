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
    <div className="container px-4 py-8 max-w-7xl space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-lg">
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
      <Card className="border-2">
        <CardHeader>
          <CardTitle>All Pools</CardTitle>
          <CardDescription>Detailed pool statistics</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : pools.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pool</TableHead>
                    <TableHead>TVL</TableHead>
                    <TableHead>Liquidity</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>APY</TableHead>
                    <TableHead>24h Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pools.map((pool) => (
                    <TableRow key={pool.id}>
                      <TableCell className="font-medium">
                        {getTokenName(pool["token-0"])} / {getTokenName(pool["token-1"])}
                      </TableCell>
                      <TableCell>${formatNumber(pool.tvl || 0)}</TableCell>
                      <TableCell>{formatNumber(pool.liquidity)}</TableCell>
                      <TableCell>{formatPercentage(pool.fee / 10_000)}</TableCell>
                      <TableCell>{formatPercentage(pool.apy || 0)}</TableCell>
                      <TableCell>$0</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No pools available yet
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
