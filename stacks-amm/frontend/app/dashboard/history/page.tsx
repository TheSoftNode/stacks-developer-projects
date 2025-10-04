"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  ArrowUpDown, 
  ArrowLeftRight, 
  Droplet, 
  Plus, 
  Minus,
  ExternalLink,
  Search,
  Download
} from "lucide-react";
import { abbreviateTxnId, getExplorerUrl } from "@/lib/stx-utils";

interface Transaction {
  id: string;
  type: "swap" | "add" | "remove" | "create";
  timestamp: number;
  pool: string;
  amount: string;
  status: "success" | "pending" | "failed";
  txId: string;
}

export default function HistoryPage() {
  const [transactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "swap":
        return <ArrowLeftRight className="h-4 w-4" />;
      case "add":
        return <Plus className="h-4 w-4" />;
      case "remove":
        return <Minus className="h-4 w-4" />;
      case "create":
        return <Droplet className="h-4 w-4" />;
      default:
        return <ArrowUpDown className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "swap":
        return "Swap";
      case "add":
        return "Add Liquidity";
      case "remove":
        return "Remove Liquidity";
      case "create":
        return "Create Pool";
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "default";
      case "pending":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesType = filterType === "all" || tx.type === filterType;
    const matchesSearch =
      !searchQuery ||
      tx.pool.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.txId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const exportToCSV = () => {
    // Implement CSV export functionality
    console.log("Exporting to CSV...");
  };

  return (
    <div className="container px-4 py-8 max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Transaction History</h1>
          <p className="text-muted-foreground text-lg">
            View all your past transactions and activity
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by pool or transaction ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="swap">Swaps</SelectItem>
                <SelectItem value="add">Add Liquidity</SelectItem>
                <SelectItem value="remove">Remove Liquidity</SelectItem>
                <SelectItem value="create">Create Pool</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            {filteredTransactions.length} transaction(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Pool</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Transaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(tx.type)}
                          <span className="font-medium">{getTypeLabel(tx.type)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{tx.pool}</TableCell>
                      <TableCell>{tx.amount}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(tx.status) as any}>
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(tx.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => window.open(getExplorerUrl("tx", tx.txId), "_blank")}
                        >
                          {abbreviateTxnId(tx.txId)}
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <ArrowUpDown className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
              <p className="text-muted-foreground">
                {searchQuery || filterType !== "all"
                  ? "No transactions match your filters"
                  : "Your transaction history will appear here"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
