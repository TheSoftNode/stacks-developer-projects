"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Wallet, 
  TrendingUp, 
  RefreshCw, 
  Plus,
  DollarSign,
  Activity,
  Users,
  Loader2
} from "lucide-react";
import { 
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Wallet {
  _id: string;
  email: string;
  address: string;
  balance: {
    available: number;
    locked: number;
    total: number;
  };
  lastUpdated: string;
  isActive: boolean;
}

interface Transaction {
  _id: string;
  walletId: string;
  walletAddress: string;
  txid: string;
  amount: number;
  timestamp: string;
  type: string;
  status: string;
}

interface BalanceHistory {
  _id: string;
  balance: {
    available: number;
    locked: number;
    total: number;
  };
  timestamp: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [balanceHistory, setBalanceHistory] = useState<BalanceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newWallet, setNewWallet] = useState({ email: '', address: '' });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch wallets
      const walletsResponse = await fetch('/api/wallets');
      if (walletsResponse.ok) {
        const walletsData = await walletsResponse.json();
        setWallets(walletsData.wallets || []);
      }

      // Fetch recent transactions
      const transactionsResponse = await fetch('/api/transactions?limit=5');
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setRecentTransactions(transactionsData.transactions || []);
      }

      // Fetch balance history for chart (last 30 days)
      const historyResponse = await fetch('/api/wallets/balance-history?days=30');
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setBalanceHistory(historyData.history || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBalances = async () => {
    setUpdating(true);
    try {
      const response = await fetch('/api/wallets/update-balances', {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Balances updated successfully!');
        await fetchDashboardData(); // Refresh data
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update balances');
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newWallet.email || !newWallet.address) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWallet),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Wallet added successfully!');
        setNewWallet({ email: '', address: '' });
        setIsAddModalOpen(false);
        await fetchDashboardData(); // Refresh data
      } else {
        toast.error(data.error || 'Failed to add wallet');
      }
    } catch (error) {
      toast.error('Network error occurred');
    }
  };

  // Calculate stats from real data
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance.total, 0);
  const activeWallets = wallets.filter(wallet => wallet.isActive).length;
  const lastUpdate = wallets.length > 0 
    ? new Date(Math.max(...wallets.map(w => new Date(w.lastUpdated).getTime())))
    : null;
  
  // Calculate balance change from history
  const balanceChange = balanceHistory.length >= 2 
    ? ((totalBalance - balanceHistory[0].balance.total) / balanceHistory[0].balance.total * 100)
    : 0;

  const stats = [
    {
      title: "Total Balance",
      value: `${totalBalance.toFixed(6)} STX`,
      change: balanceChange >= 0 ? `+${balanceChange.toFixed(2)}%` : `${balanceChange.toFixed(2)}%`,
      changeType: balanceChange >= 0 ? "positive" as const : "negative" as const,
      icon: DollarSign,
    },
    {
      title: "Active Wallets",
      value: activeWallets.toString(),
      change: `${wallets.length} Total`,
      changeType: "neutral" as const,
      icon: Wallet,
    },
    {
      title: "Last Update",
      value: lastUpdate ? formatTimeAgo(lastUpdate) : "Never",
      change: "Auto",
      changeType: "neutral" as const,
      icon: Activity,
    },
    {
      title: "Recent Transactions",
      value: recentTransactions.length.toString(),
      change: "Last 24h",
      changeType: "neutral" as const,
      icon: Users,
    },
  ];

  // Format time ago helper
  function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  }

  // Prepare chart data
  const chartData = balanceHistory.map(item => ({
    date: new Date(item.timestamp).toLocaleDateString(),
    balance: item.balance.total,
  })).reverse(); // Reverse to show chronological order

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's an overview of your wallet portfolio.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              className="border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white"
              onClick={handleUpdateBalances}
              disabled={updating}
            >
              {updating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {updating ? 'Updating...' : 'Update Balances'}
            </Button>
            
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-brand-pink hover:bg-brand-pink/90 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Wallet
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Wallet</DialogTitle>
                  <DialogDescription>
                    Add a Stacks wallet address to monitor its balance
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddWallet} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email associated with this wallet"
                      value={newWallet.email}
                      onChange={(e) => setNewWallet({ ...newWallet, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Wallet Address</Label>
                    <Input
                      id="address"
                      placeholder="Enter Stacks wallet address (SP...)"
                      value={newWallet.address}
                      onChange={(e) => setNewWallet({ ...newWallet, address: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-brand-pink hover:bg-brand-pink/90">
                    Add Wallet
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Badge 
                      variant={stat.changeType === 'positive' ? 'default' : stat.changeType === 'negative' ? 'destructive' : 'secondary'}
                      className={
                        stat.changeType === 'positive' 
                          ? 'bg-brand-teal text-white' 
                          : stat.changeType === 'negative'
                          ? 'bg-red-500 text-white'
                          : ''
                      }
                    >
                      {stat.change}
                    </Badge>
                    <span>from last update</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest wallet balance updates and transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction, index) => (
                    <div key={transaction._id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-brand-pink/10 rounded-full">
                          <Activity className="h-4 w-4 text-brand-pink" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {transaction.type === 'received' ? 'Received' : 
                             transaction.type === 'sent' ? 'Sent' : 'Transaction'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {transaction.walletAddress.slice(0, 8)}...{transaction.walletAddress.slice(-6)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          transaction.type === 'received' ? 'text-brand-teal' : 'text-red-500'
                        }`}>
                          {transaction.type === 'received' ? '+' : '-'}{Math.abs(transaction.amount).toFixed(6)} STX
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(new Date(transaction.timestamp))}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent transactions</p>
                    <p className="text-xs">Transactions will appear here once you add wallets</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Manage your wallets and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  className="w-full justify-start bg-brand-pink hover:bg-brand-pink/90 text-white"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Wallet
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white"
                  onClick={handleUpdateBalances}
                  disabled={updating}
                >
                  {updating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  {updating ? 'Updating...' : 'Update All Balances'}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/dashboard/analytics')}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/dashboard/wallets')}
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Manage Wallets
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Overview Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Overview</CardTitle>
            <CardDescription>
              Your wallet balance trends over the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs"
                      tickLine={false}
                    />
                    <YAxis 
                      className="text-xs"
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value.toFixed(6)} STX`, 'Balance']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="balance" 
                      stroke="#14b8a6" 
                      strokeWidth={2}
                      dot={{ fill: '#14b8a6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#14b8a6', strokeWidth: 2, fill: '#ffffff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                  <p>No balance history available</p>
                  <p className="text-sm">Add wallets and update balances to see trends</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}