import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pool } from "@/lib/amm";
import { getTokenName } from "@/lib/amm";
import { formatNumber, formatPercentage } from "@/lib/stx-utils";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Droplet, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PoolCardProps {
  pool: Pool;
  userLiquidity?: number;
}

export function PoolCard({ pool, userLiquidity }: PoolCardProps) {
  const token0Name = getTokenName(pool["token-0"]);
  const token1Name = getTokenName(pool["token-1"]);
  const feesInPercentage = pool.fee / 10_000;
  const hasLiquidity = userLiquidity && userLiquidity > 0;

  return (
    <Card className="border border-slate-800 bg-slate-950/50 backdrop-blur-sm hover:border-slate-700 hover:shadow-xl hover:shadow-teal-500/5 transition-all duration-300 group">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-white group-hover:text-teal-400 transition-colors">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 group-hover:scale-110 transition-transform duration-300">
              <Droplet className="h-4 w-4 text-teal-400" />
            </div>
            {token0Name} / {token1Name}
          </CardTitle>
          <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20">
            {formatPercentage(feesInPercentage)}% Fee
          </Badge>
        </div>
        <CardDescription className="text-xs text-slate-500">
          Pool ID: {pool.id.substring(0, 10)}...
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
            <p className="text-xs text-slate-400 mb-1">Total Liquidity</p>
            <p className="text-lg font-semibold text-white">
              {formatNumber(pool.liquidity)}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
            <p className="text-xs text-slate-400 mb-1">TVL</p>
            <p className="text-lg font-semibold text-white">
              ${formatNumber(pool.tvl || 0)}
            </p>
          </div>
        </div>

        <div className="space-y-2 p-3 rounded-xl bg-slate-800/30">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">{token0Name}:</span>
            <span className="font-medium text-white">{formatNumber(pool["balance-0"])}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">{token1Name}:</span>
            <span className="font-medium text-white">{formatNumber(pool["balance-1"])}</span>
          </div>
        </div>

        {hasLiquidity && (
          <div className="pt-2 border-t border-slate-700">
            <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 rounded-lg px-3 py-2">
              <TrendingUp className="h-4 w-4" />
              <span>Your Liquidity: {formatNumber(userLiquidity)}</span>
            </div>
          </div>
        )}

        <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all group">
          <Link href={`/dashboard/pools/${pool.id}`}>
            Manage Pool
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
