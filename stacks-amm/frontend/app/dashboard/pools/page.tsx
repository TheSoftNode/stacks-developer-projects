"use client";

import { useEffect, useState } from "react";
import { getAllPools, Pool } from "@/lib/amm";
import { CreatePoolForm } from "@/components/features/pools/create-pool-form";
import { PoolCard } from "@/components/shared/cards/pool-card";
import { TreasuryCard } from "@/components/features/treasury/treasury-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useStacks } from "@/hooks/use-stacks";
import { fetchCallReadOnlyFunction } from "@stacks/transactions";
import { STACKS_TESTNET } from "@stacks/network";

const AMM_CONTRACT_ADDRESS = "ST2F3J1PK46D6XVRBB9SQ66PY89P8G0EBDW5E05M7";
const AMM_CONTRACT_NAME = "amm-v3";

export default function PoolsPage() {
  const { userData } = useStacks();
  const [pools, setPools] = useState<Pool[]>([]);
  const [filteredPools, setFilteredPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    loadPools();
  }, []);

  useEffect(() => {
    console.log("userData changed:", userData);
    // Only check ownership when userData is available
    if (userData) {
      console.log("Calling checkOwnership...");
      checkOwnership();
    } else {
      console.log("No userData, setting isOwner to false");
      setIsOwner(false);
    }
  }, [userData]);

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

  const checkOwnership = async () => {
    if (!userData) {
      console.log("No userData, not owner");
      setIsOwner(false);
      return;
    }

    console.log("🔍 Starting ownership check...");

    try {
      console.log("📞 Calling get-contract-owner...");
      const ownerResult = await fetchCallReadOnlyFunction({
        contractAddress: AMM_CONTRACT_ADDRESS,
        contractName: AMM_CONTRACT_NAME,
        functionName: "get-contract-owner",
        functionArgs: [],
        senderAddress: AMM_CONTRACT_ADDRESS,
        network: STACKS_TESTNET,
      });

      console.log("📦 Owner result:", ownerResult);
      console.log("📦 Owner result.type:", ownerResult.type);
      console.log("📦 Owner result.value:", ownerResult.value);
      console.log("📦 Owner result.value.type:", ownerResult.value?.type);

      if (ownerResult.type === "ok" && (ownerResult.value.type === "principal" || ownerResult.value.type === "address")) {
        const contractOwner = ownerResult.value.value;
        // Try different possible address paths from wallet data
        const userAddress = userData.profile?.stxAddress?.testnet ||
                           userData.addresses?.stx?.[0]?.address ||
                           userData.address;
        console.log("✅ Contract Owner:", contractOwner);
        console.log("✅ User Address:", userAddress);
        console.log("✅ Full userData:", userData);
        console.log("✅ Is Owner:", userAddress === contractOwner);
        setIsOwner(userAddress === contractOwner);
      } else {
        console.log("❌ Invalid owner result type:", ownerResult);
        setIsOwner(false);
      }
    } catch (error) {
      console.error("❌ Error checking ownership:", error);
      setIsOwner(false);
    }
  };

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
        <TabsList className={`grid w-full max-w-2xl ${isOwner ? 'grid-cols-3' : 'grid-cols-2'} bg-slate-950/50 border border-slate-800`}>
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
          {isOwner && (
            <TabsTrigger
              value="treasury"
              className="data-[state=active]:bg-teal-500/10 data-[state=active]:text-teal-500 data-[state=active]:border-teal-500/20 text-slate-400"
            >
              Treasury
            </TabsTrigger>
          )}
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

        <TabsContent value="treasury" className="mt-6">
          <div className="max-w-2xl mx-auto">
            <TreasuryCard />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
