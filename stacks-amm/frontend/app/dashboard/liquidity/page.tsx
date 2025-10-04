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
    <div className="container px-4 py-8 max-w-7xl space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Manage Liquidity</h1>
        <p className="text-muted-foreground text-lg">
          Add or remove liquidity from pools and earn trading fees
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {loading ? (
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-96 w-full" />
              </CardContent>
            </Card>
          ) : pools.length > 0 ? (
            <Tabs defaultValue="add" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="add">Add Liquidity</TabsTrigger>
                <TabsTrigger value="remove">Remove Liquidity</TabsTrigger>
              </TabsList>

              <TabsContent value="add" className="mt-6">
                <AddLiquidityForm pools={pools} />
              </TabsContent>

              <TabsContent value="remove" className="mt-6">
                <RemoveLiquidityForm pools={pools} />
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Pools Available</CardTitle>
                <CardDescription>
                  There are no liquidity pools available yet. Create a pool first.
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
                  <Droplet className="h-5 w-5 text-blue-500" />
                </div>
                <CardTitle className="text-lg">About Liquidity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
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

          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <CardTitle className="text-lg">Earning Fees</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
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

          <Card className="border-2 bg-orange-500/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                </div>
                <CardTitle className="text-lg">Important Notes</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                Be aware of impermanent loss when providing liquidity
              </p>
              <p className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                Ensure you have both tokens before adding liquidity
              </p>
              <p className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                Your funds are always in your control
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
