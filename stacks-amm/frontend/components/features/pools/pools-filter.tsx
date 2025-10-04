"use client";

import { useState } from "react";
import { Pool } from "@/lib/amm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PoolsFilterProps {
  pools: Pool[];
  onFilterChange: (filtered: Pool[]) => void;
}

export function PoolsFilter({ pools, onFilterChange }: PoolsFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"liquidity" | "tvl" | "apy">("liquidity");
  const [filterByUser, setFilterByUser] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters(query, sortBy);
  };

  const handleSort = (sort: "liquidity" | "tvl" | "apy") => {
    setSortBy(sort);
    applyFilters(searchQuery, sort);
  };

  const applyFilters = (query: string, sort: string) => {
    let filtered = [...pools];

    // Search filter
    if (query) {
      filtered = filtered.filter((pool) =>
        pool["token-0"].toLowerCase().includes(query.toLowerCase()) ||
        pool["token-1"].toLowerCase().includes(query.toLowerCase()) ||
        pool.id.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sort) {
        case "liquidity":
          return b.liquidity - a.liquidity;
        case "tvl":
          return (b.tvl || 0) - (a.tvl || 0);
        case "apy":
          return (b.apy || 0) - (a.apy || 0);
        default:
          return 0;
      }
    });

    onFilterChange(filtered);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pools by token name or address..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(value: any) => handleSort(value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="liquidity">Liquidity</SelectItem>
            <SelectItem value="tvl">TVL</SelectItem>
            <SelectItem value="apy">APY</SelectItem>
          </SelectContent>
        </Select>

        {/* Filter Button */}
        <Button variant="outline" size="icon">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Active Filters */}
      {searchQuery && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSearch("")}
              className="h-7"
            >
              {searchQuery}
              <span className="ml-2">×</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
