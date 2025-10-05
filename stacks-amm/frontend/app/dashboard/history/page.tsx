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
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "pending":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "failed":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
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
    <div className="container px-4 py-8 max-w-7xl space-y-8 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-white">Transaction History</h1>
          <p className="text-slate-400 text-lg">
            View all your past transactions and activity
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline" className="gap-2 border-slate-700 bg-slate-900/50 hover:bg-slate-800 hover:border-orange-500/30 text-slate-300 hover:text-orange-400">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="border border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search by pool or transaction ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-slate-700 bg-slate-900/50 text-white placeholder:text-slate-500 focus:border-teal-500/30"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-[180px] border-slate-700 bg-slate-900/50 text-white hover:border-orange-500/30">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent className="border-slate-800 bg-slate-900">
                <SelectItem value="all" className="text-slate-300 hover:text-white hover:bg-slate-800">All Types</SelectItem>
                <SelectItem value="swap" className="text-slate-300 hover:text-white hover:bg-slate-800">Swaps</SelectItem>
                <SelectItem value="add" className="text-slate-300 hover:text-white hover:bg-slate-800">Add Liquidity</SelectItem>
                <SelectItem value="remove" className="text-slate-300 hover:text-white hover:bg-slate-800">Remove Liquidity</SelectItem>
                <SelectItem value="create" className="text-slate-300 hover:text-white hover:bg-slate-800">Create Pool</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="border border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">All Transactions</CardTitle>
          <CardDescription className="text-slate-400">
            {filteredTransactions.length} transaction(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-slate-800/50">
                    <TableHead className="text-slate-300">Type</TableHead>
                    <TableHead className="text-slate-300">Pool</TableHead>
                    <TableHead className="text-slate-300">Amount</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Time</TableHead>
                    <TableHead className="text-slate-300">Transaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => (
                    <TableRow key={tx.id} className="border-slate-800 hover:bg-slate-800/30">
                      <TableCell>
                        <div className="flex items-center gap-2 text-white">
                          {getTypeIcon(tx.type)}
                          <span className="font-medium">{getTypeLabel(tx.type)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">{tx.pool}</TableCell>
                      <TableCell className="text-slate-300">{tx.amount}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(tx.status)}>
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {new Date(tx.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 text-teal-400 hover:text-teal-300 hover:bg-slate-800"
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
            <div className="text-center py-16">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 border border-slate-700">
                <ArrowUpDown className="h-8 w-8 text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">No Transactions Yet</h3>
              <p className="text-slate-400">
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
