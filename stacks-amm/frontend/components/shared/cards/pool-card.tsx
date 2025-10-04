import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pool } from "@/lib/amm";
import { getTokenName } from "@/lib/amm";
import { formatNumber, formatPercentage } from "@/lib/stx-utils";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Droplet, TrendingUp } from "lucide-react";

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
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Droplet className="h-5 w-5 text-blue-500" />
            {token0Name} / {token1Name}
          </CardTitle>
          <Badge variant="secondary">{formatPercentage(feesInPercentage)}% Fee</Badge>
        </div>
        <CardDescription className="text-xs">
          Pool ID: {pool.id.substring(0, 10)}...
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Liquidity</p>
            <p className="text-lg font-semibold">
              {formatNumber(pool.liquidity)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">TVL</p>
            <p className="text-lg font-semibold">
              ${formatNumber(pool.tvl || 0)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{token0Name}:</span>
            <span className="font-medium">{formatNumber(pool["balance-0"])}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{token1Name}:</span>
            <span className="font-medium">{formatNumber(pool["balance-1"])}</span>
          </div>
        </div>

        {hasLiquidity && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span>Your Liquidity: {formatNumber(userLiquidity)}</span>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Link href={`/pools/${pool.id}`} className="flex-1">
            <button className="w-full text-sm px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
              Manage
            </button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
