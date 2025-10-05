"use client";

import { useEffect, useState } from "react";
import { getAllPools, Pool } from "@/lib/amm";
import { CreatePoolForm } from "@/components/features/pools/create-pool-form";
import { PoolCard } from "@/components/shared/cards/pool-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function PoolsPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [filteredPools, setFilteredPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadPools();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = pools.filter(
        (pool) =>
          pool["token-0"].toLowerCase().includes(searchQuery.toLowerCase()) ||
          pool["token-1"].toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPools(filtered);
    } else {
      setFilteredPools(pools);
    }
  }, [searchQuery, pools]);

  const loadPools = async () => {
    setLoading(true);
    try {
      const allPools = await getAllPools();
      setPools(allPools);
      setFilteredPools(allPools);
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
        <h1 className="text-4xl font-bold tracking-tight text-white">Liquidity Pools</h1>
        <p className="text-slate-400 text-lg">
          Browse pools, create new pairs, and manage liquidity
        </p>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-950/50 border border-slate-800">
          <TabsTrigger
            value="browse"
            className="data-[state=active]:bg-orange-500/10 data-[state=active]:text-orange-500 data-[state=active]:border-orange-500/20 text-slate-400"
          >
            Browse Pools
          </TabsTrigger>
          <TabsTrigger
            value="create"
            className="data-[state=active]:bg-orange-500/10 data-[state=active]:text-orange-500 data-[state=active]:border-orange-500/20 text-slate-400"
          >
            Create Pool
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-6 space-y-6">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search pools by token name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-slate-700 bg-slate-950/50 text-white placeholder:text-slate-500 focus:border-teal-500/30"
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="border border-slate-800 bg-slate-950/50">
                  <CardContent className="p-6">
                    <Skeleton className="h-32 w-full bg-slate-800" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPools.map((pool) => (
                <PoolCard key={pool.id} pool={pool} />
              ))}
            </div>
          ) : (
            <Card className="border border-slate-800 bg-slate-950/50 backdrop-blur-sm">
              <CardContent className="py-12 text-center">
                <p className="text-slate-400">
                  {searchQuery ? "No pools found matching your search" : "No pools available yet. Be the first to create one!"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="create" className="mt-6">
          <div className="max-w-2xl mx-auto">
            <CreatePoolForm />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
