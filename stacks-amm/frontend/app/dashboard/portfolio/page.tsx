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
    <div className="container px-4 py-8 max-w-7xl space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Portfolio</h1>
        <p className="text-muted-foreground text-lg">
          Track your positions, earnings, and performance
        </p>
      </div>

      {!userData ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-muted-foreground">
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
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Your Positions</CardTitle>
              <CardDescription>
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
                      <TableRow>
                        <TableHead>Pool</TableHead>
                        <TableHead>Your Liquidity</TableHead>
                        <TableHead>Pool Share</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Fees Earned</TableHead>
                        <TableHead>PnL</TableHead>
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
                          <TableRow key={position.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Droplet className="h-4 w-4 text-blue-500" />
                                {getTokenName(position["token-0"])} /{" "}
                                {getTokenName(position["token-1"])}
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatNumber(position.userLiquidity || 0)}
                            </TableCell>
                            <TableCell>{formatPercentage(sharePercentage)}</TableCell>
                            <TableCell>
                              ${formatNumber(position.userLiquidity || 0)}
                            </TableCell>
                            <TableCell>$0.00</TableCell>
                            <TableCell>
                              <Badge
                                variant={isPositive ? "default" : "destructive"}
                                className="gap-1"
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
                <div className="text-center py-12">
                  <Droplet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Active Positions</h3>
                  <p className="text-muted-foreground">
                    Add liquidity to a pool to start earning fees
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Chart Section */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>
                Your portfolio performance over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-muted-foreground">
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
