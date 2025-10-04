import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatPercentage, abbreviateTxnId } from "@/lib/stx-utils";
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Plus, Minus } from "lucide-react";
import Link from "next/link";

export type TransactionType = "swap" | "add-liquidity" | "remove-liquidity" | "create-pool";

interface Transaction {
  id: string;
  type: TransactionType;
  token0?: string;
  token1?: string;
  amount0?: number;
  amount1?: number;
  timestamp: number;
  status: "pending" | "confirmed" | "failed";
  txId: string;
}

interface TransactionCardProps {
  transaction: Transaction;
}

const typeConfig = {
  swap: {
    icon: RefreshCw,
    label: "Swap",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  "add-liquidity": {
    icon: Plus,
    label: "Add Liquidity",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  "remove-liquidity": {
    icon: Minus,
    label: "Remove Liquidity",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  "create-pool": {
    icon: Plus,
    label: "Create Pool",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
};

export function TransactionCard({ transaction }: TransactionCardProps) {
  const config = typeConfig[transaction.type];
  const Icon = config.icon;
  const timeAgo = new Date(transaction.timestamp).toLocaleString();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              <Icon className={`h-4 w-4 ${config.color}`} />
            </div>
            <div>
              <CardTitle className="text-base">{config.label}</CardTitle>
              <CardDescription className="text-xs">{timeAgo}</CardDescription>
            </div>
          </div>
          <Badge
            variant={
              transaction.status === "confirmed"
                ? "default"
                : transaction.status === "pending"
                ? "secondary"
                : "destructive"
            }
          >
            {transaction.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {transaction.token0 && transaction.token1 && (
          <div className="text-sm">
            <span className="font-medium">
              {transaction.token0} ↔ {transaction.token1}
            </span>
          </div>
        )}
        {transaction.amount0 !== undefined && (
          <div className="text-sm text-muted-foreground">
            Amount: {formatNumber(transaction.amount0)}
          </div>
        )}
        <Link
          href={`https://explorer.hiro.so/txid/${transaction.txId}?chain=testnet`}
          target="_blank"
          className="text-xs text-blue-500 hover:underline flex items-center gap-1"
        >
          View on Explorer
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
