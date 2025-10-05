"use client";

import { useEffect, useState } from "react";
import { useStacks } from "@/hooks/use-stacks";
import { getAllPools, getUserLiquidity, getTokenName, Pool } from "@/lib/amm";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/stx-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Wallet, PieChart, Droplet } from "lucide-react";
import { StatCard } from "@/components/shared/cards/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type PoolWithUserLiquidity = Pool & {
  userLiquidity?: number;
};

export default function PortfolioPage() {
  const { userData } = useStacks();
  const [userPositions, setUserPositions] = useState<PoolWithUserLiquidity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData) {
      loadUserData();
    }
  }, [userData]);

  const loadUserData = async () => {
    if (!userData?.profile.stxAddress.mainnet) return;
    
    setLoading(true);
    try {
      const allPools = await getAllPools();
      const positionsWithLiquidity: PoolWithUserLiquidity[] = [];
      
      for (const pool of allPools) {
        const userLiq = await getUserLiquidity(pool, userData.profile.stxAddress.mainnet);
        if (userLiq > 0) {
          positionsWithLiquidity.push({ ...pool, userLiquidity: userLiq });
        }
      }
      
      setUserPositions(positionsWithLiquidity);
    } catch (error) {
      console.error("Error loading user positions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate portfolio metrics
  const totalValue = userPositions.reduce(
    (sum, pos) => sum + (pos.userLiquidity || 0),
    0
  );
  const totalPools = userPositions.length;
  const totalFeesEarned = 0; // Would need transaction history for this

  return (
    <div className="container px-4 py-8 max-w-7xl space-y-8 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-white">Portfolio</h1>
        <p className="text-slate-400 text-lg">
          Track your positions, earnings, and performance
        </p>
      </div>

      {!userData ? (
        <Card className="border border-slate-800 bg-slate-950/50 backdrop-blur-sm">
          <CardContent className="py-16 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-500/10 border border-orange-500/20">
              <Wallet className="h-8 w-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">Connect Your Wallet</h3>
            <p className="text-slate-400">
              Please connect your wallet to view your portfolio
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Portfolio Overview */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-4 w-24 mb-4" />
                    <Skeleton className="h-8 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Total Portfolio Value"
                value={formatCurrency(totalValue, "USD")}
                icon={Wallet}
                trend={{ value: 0, isPositive: true }}
              />
              <StatCard
                title="Active Positions"
                value={totalPools}
                icon={PieChart}
              />
              <StatCard
                title="Total Fees Earned"
                value={formatCurrency(totalFeesEarned, "USD")}
                icon={TrendingUp}
                trend={{ value: 0, isPositive: true }}
              />
            </div>
          )}

          {/* Positions Table */}
          <Card className="border border-slate-800 bg-slate-950/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Your Positions</CardTitle>
              <CardDescription className="text-slate-400">
                All your active liquidity positions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : userPositions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800 hover:bg-slate-800/50">
                        <TableHead className="text-slate-300">Pool</TableHead>
                        <TableHead className="text-slate-300">Your Liquidity</TableHead>
                        <TableHead className="text-slate-300">Pool Share</TableHead>
                        <TableHead className="text-slate-300">Value</TableHead>
                        <TableHead className="text-slate-300">Fees Earned</TableHead>
                        <TableHead className="text-slate-300">PnL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userPositions.map((position) => {
                        const sharePercentage = position.userLiquidity && position.liquidity
                          ? (position.userLiquidity / position.liquidity) * 100
                          : 0;
                        const pnl = 0; // Would calculate from initial value
                        const isPositive = pnl >= 0;

                        return (
                          <TableRow key={position.id} className="border-slate-800 hover:bg-slate-800/30">
                            <TableCell className="font-medium text-white">
                              <div className="flex items-center gap-2">
                                <Droplet className="h-4 w-4 text-teal-400" />
                                {getTokenName(position["token-0"])} /{" "}
                                {getTokenName(position["token-1"])}
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-300">
                              {formatNumber(position.userLiquidity || 0)}
                            </TableCell>
                            <TableCell className="text-slate-300">{formatPercentage(sharePercentage)}</TableCell>
                            <TableCell className="text-slate-300">
                              ${formatNumber(position.userLiquidity || 0)}
                            </TableCell>
                            <TableCell className="text-slate-300">$0.00</TableCell>
                            <TableCell>
                              <Badge
                                variant={isPositive ? "default" : "destructive"}
                                className={`gap-1 ${isPositive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}
                              >
                                {isPositive ? (
                                  <TrendingUp className="h-3 w-3" />
                                ) : (
                                  <TrendingDown className="h-3 w-3" />
                                )}
                                {formatPercentage(Math.abs(pnl))}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-500/10 border border-teal-500/20">
                    <Droplet className="h-8 w-8 text-teal-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">No Active Positions</h3>
                  <p className="text-slate-400">
                    Add liquidity to a pool to start earning fees
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Chart Section */}
          <Card className="border border-slate-800 bg-slate-950/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Performance Overview</CardTitle>
              <CardDescription className="text-slate-400">
                Your portfolio performance over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-16">
                <p className="text-slate-400">
                  Performance tracking coming soon...
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
