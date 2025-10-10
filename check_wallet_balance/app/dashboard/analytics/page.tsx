"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { 
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Search,
  RefreshCw,
  Wallet,
  ChevronDown,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Transaction {
  _id: string;
  txId: string;
  type: 'sent' | 'received' | 'staking' | 'mining';
  amount: number;
  fee: number;
  currency: string;
  fromAddress: string;
  toAddress: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  walletId: {
    _id: string;
    address: string;
    email: string;
  };
}

interface Wallet {
  _id: string;
  address: string;
  email: string;
  balance: {
    available: number;
    locked: number;
    total: number;
  };
}

interface GroupedTransactions {
  [key: string]: {
    wallet: Wallet;
    transactions: Transaction[];
    totalSent: number;
    totalReceived: number;
    transactionCount: number;
  };
}

interface BalanceHistory {
  date: string;
  total: number;
  available: number;
  locked: number;
}

export default function AnalyticsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [balanceHistory, setBalanceHistory] = useState<BalanceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [stxToUsd, setStxToUsd] = useState<number>(0);
  const [timeframe, setTimeframe] = useState('30d');
  const [transactionType, setTransactionType] = useState('all');
  const [selectedWallet, setSelectedWallet] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [groupBy, setGroupBy] = useState<'wallet' | 'date' | 'type'>('wallet');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [itemsPerPage] = useState(20);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [walletToClear, setWalletToClear] = useState<{ id: string; address: string } | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [manualClearDialogOpen, setManualClearDialogOpen] = useState(false);
  const [manualWalletAddress, setManualWalletAddress] = useState('');

  useEffect(() => {
    fetchData();
    fetchStxPrice();
  }, [timeframe, transactionType]);

  const fetchStxPrice = async () => {
    try {
      // Using DIA API to get STX price
      const response = await fetch('https://api.diadata.org/v1/assetQuotation/Stacks/0x0000000000000000000000000000000000000000');
      const data = await response.json();
      setStxToUsd(data.Price || 0);
    } catch (error) {
      console.error('Failed to fetch STX price:', error);
      setStxToUsd(0);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch transactions with configurable limit
      const txResponse = await fetch(`/api/transactions?type=${transactionType}&limit=5000&wallet=${selectedWallet}`);
      if (txResponse.ok) {
        const txData = await txResponse.json();
        setTransactions(txData.transactions || []);
        console.log(`📊 Fetched ${txData.transactions?.length || 0} transactions from database`);
        
        // Debug: Check transaction structure
        if (txData.transactions && txData.transactions.length > 0) {
          console.log('🔍 Sample transaction structure:', txData.transactions[0]);
          console.log('🔍 Transaction walletId type:', typeof txData.transactions[0].walletId);
          console.log('🔍 Transaction walletId value:', txData.transactions[0].walletId);
        }
      }

      // Fetch wallets
      const walletsResponse = await fetch('/api/wallets');
      if (walletsResponse.ok) {
        const walletsData = await walletsResponse.json();
        setWallets(walletsData.wallets || []);
        console.log(`👛 Fetched ${walletsData.wallets?.length || 0} wallets from database`);
        
        // Debug: Check wallet structure
        if (walletsData.wallets && walletsData.wallets.length > 0) {
          console.log('🔍 Sample wallet structure:', walletsData.wallets[0]);
          console.log('🔍 Wallet _id type:', typeof walletsData.wallets[0]._id);
          console.log('🔍 Wallet _id value:', walletsData.wallets[0]._id);
        }
      }

      // Fetch REAL balance history from API
      await fetchBalanceHistory();

    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to fetch analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const syncTransactions = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Starting transaction sync...');
      toast.info('Syncing transactions from blockchain...');
      
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`📡 Sync response status: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Sync result:', result);
        let message = `Synced ${result.totalSynced} new transactions`;
        if (result.duplicatesRemoved > 0) {
          message += ` (removed ${result.duplicatesRemoved} duplicates)`;
        }
        toast.success(message);
        // Refresh data after sync
        await fetchData();
      } else {
        const errorText = await response.text();
        console.error('❌ Sync failed:', response.status, errorText);
        toast.error(`Failed to sync transactions: ${response.status}`);
      }
    } catch (error) {
      console.error('💥 Sync error:', error);
      toast.error('Failed to sync transactions');
    } finally {
      console.log('🏁 Sync completed, setting loading to false');
      setIsLoading(false);
    }
  };

  const fetchBalanceHistory = async () => {
    try {
      console.log('📈 Fetching balance history...');
      const response = await fetch('/api/wallets/balance-history?days=30');
      console.log(`📊 Balance history response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('💰 Balance history data:', data);
        
        if (data.history && Array.isArray(data.history)) {
          // Transform the API response to match our chart format
          const chartData = data.history.map((record: any) => ({
            date: record.timestamp.split('T')[0],
            total: record.balance.total,
            available: record.balance.available,
            locked: record.balance.locked,
          }));
          console.log('📋 Transformed chart data:', chartData);
          setBalanceHistory(chartData);
        } else {
          console.log('⚠️ No history array in response');
          setBalanceHistory([]);
        }
      } else {
        console.log('❌ Balance history fetch failed:', response.status);
        // If no history available, set empty array
        setBalanceHistory([]);
      }
    } catch (error) {
      console.error('💥 Failed to fetch balance history:', error);
      setBalanceHistory([]);
    }
  };

  const getFilteredTransactions = () => {
    return transactions.filter(tx => {
      const matchesSearch = 
        tx.txId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.fromAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.toAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.walletId.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesWallet = selectedWallet === 'all' || tx.walletId._id === selectedWallet;
      const matchesType = transactionType === 'all' || tx.type === transactionType;
      
      return matchesSearch && matchesWallet && matchesType;
    });
  };

  const getGroupedTransactions = (): GroupedTransactions => {
    const filtered = getFilteredTransactions();
    const grouped: GroupedTransactions = {};

    if (groupBy === 'wallet') {
      // First, initialize all wallets even if they have no transactions in the current filter
      wallets.forEach(wallet => {
        const key = wallet._id;
        if (!grouped[key]) {
          grouped[key] = {
            wallet: {
              _id: wallet._id,
              address: wallet.address,
              email: wallet.email,
              balance: wallet.balance || { available: 0, locked: 0, total: 0 }
            },
            transactions: [],
            totalSent: 0,
            totalReceived: 0,
            transactionCount: 0
          };
        }
      });

      // Then add transactions to their respective wallets
      console.log(`🔍 Processing ${filtered.length} filtered transactions...`);
      
      filtered.forEach((tx, index) => {
        // Ensure key is always a string
        const key = typeof tx.walletId === 'string' 
          ? tx.walletId 
          : tx.walletId._id || '';
        
        if (index < 3) { // Debug first few transactions
          console.log(`🔍 Transaction ${index + 1}:`, {
            txId: tx.txId,
            type: tx.type,
            amount: tx.amount,
            walletId: tx.walletId,
            walletIdKey: key,
            groupedKeysAvailable: Object.keys(grouped)
          });
        }
        
        if (key && grouped[key]) {
          grouped[key].transactions.push(tx);
          grouped[key].transactionCount++;
          
          const amount = Number(tx.amount);
          if (!isNaN(amount)) {
            if (tx.type === 'sent') {
              grouped[key].totalSent += Math.abs(amount);
            } else if (tx.type === 'received') {
              grouped[key].totalReceived += amount;
            }
          }
        } else {
          if (index < 5) { // Debug mismatches
            console.log(`❌ No matching wallet group found for transaction ${tx.txId} with key: ${key}`);
          }
        }
      });
      
      console.log(`🔍 Final grouped transaction counts:`, 
        Object.entries(grouped).map(([key, group]) => ({
          walletId: key,
          address: group.wallet.address.substring(0, 10) + '...',
          transactionCount: group.transactionCount
        }))
      );
    } else if (groupBy === 'date') {
      filtered.forEach(tx => {
        const date = new Date(tx.timestamp).toDateString();
        if (!grouped[date]) {
          grouped[date] = {
            wallet: { 
              _id: '', 
              address: date, 
              email: '', 
              balance: { available: 0, locked: 0, total: 0 }
            },
            transactions: [],
            totalSent: 0,
            totalReceived: 0,
            transactionCount: 0
          };
        }
        grouped[date].transactions.push(tx);
        grouped[date].transactionCount++;
        
        const amount = Number(tx.amount);
        if (!isNaN(amount)) {
          if (tx.type === 'sent') {
            // Sent transactions are stored as negative, so take absolute value
            grouped[date].totalSent += Math.abs(amount);
          } else if (tx.type === 'received') {
            // Received transactions are stored as positive
            grouped[date].totalReceived += amount;
          }
        }
      });
    } else if (groupBy === 'type') {
      filtered.forEach(tx => {
        const key = tx.type;
        if (!grouped[key]) {
          grouped[key] = {
            wallet: { 
              _id: '', 
              address: key, 
              email: '', 
              balance: { available: 0, locked: 0, total: 0 }
            },
            transactions: [],
            totalSent: 0,
            totalReceived: 0,
            transactionCount: 0
          };
        }
        grouped[key].transactions.push(tx);
        grouped[key].transactionCount++;
        
        const amount = Number(tx.amount);
        if (!isNaN(amount)) {
          if (tx.type === 'sent') {
            grouped[key].totalSent += Math.abs(amount);
          } else if (tx.type === 'received') {
            grouped[key].totalReceived += amount;
          }
        }
      });
    }

    return grouped;
  };

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const formatStxAmount = (stxAmount: number, showUsd: boolean = true) => {
    const stxValue = Number(stxAmount);
    if (isNaN(stxValue)) return '0.000000 STX';
    
    const stx = stxValue.toFixed(6);
    if (!showUsd || !stxToUsd || isNaN(stxToUsd)) {
      return `${stx} STX`;
    }
    const usd = (stxValue * stxToUsd).toFixed(2);
    return `${stx} STX ($${usd})`;
  };

  const formatUsdEquivalent = (stxAmount: number) => {
    const stxValue = Number(stxAmount);
    if (!stxToUsd || isNaN(stxToUsd) || isNaN(stxValue)) return '$0.00';
    const usd = (stxValue * stxToUsd).toFixed(2);
    return `$${usd}`;
  };

  const handleSyncTransactions = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/transactions', { method: 'POST' });
      const data = await response.json();

      if (response.ok) {
        toast.success(`Synced ${data.totalSynced} new transactions`);
        fetchData();
      } else {
        toast.error(data.error || 'Failed to sync transactions');
      }
    } catch (error) {
      toast.error('Network error occurred');
    }
    setIsSyncing(false);
  };

  const handleClearTransactions = async () => {
    if (!walletToClear) return;

    setIsClearing(true);
    try {
      const response = await fetch('/api/transactions/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletId: walletToClear.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Cleared ${data.deletedCount} transactions for wallet`);
        setClearDialogOpen(false);
        setWalletToClear(null);
        await fetchData(); // Refresh data
      } else {
        toast.error(data.error || 'Failed to clear transactions');
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setIsClearing(false);
    }
  };

  const openClearDialog = (walletId: string, walletAddress: string) => {
    setWalletToClear({ id: walletId, address: walletAddress });
    setClearDialogOpen(true);
  };

  const handleManualClearTransactions = async () => {
    if (!manualWalletAddress.trim()) {
      toast.error('Please enter a wallet address');
      return;
    }

    setIsClearing(true);
    try {
      const response = await fetch('/api/transactions/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: manualWalletAddress.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Cleared ${data.deletedCount} transactions for wallet`);
        setManualClearDialogOpen(false);
        setManualWalletAddress('');
        await fetchData(); // Refresh data
      } else {
        toast.error(data.error || 'Failed to clear transactions');
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setIsClearing(false);
    }
  };

  const getTransactionStats = () => {
    const sent = transactions.filter(tx => tx.type === 'sent');
    const received = transactions.filter(tx => tx.type === 'received');
    const totalSent = sent.reduce((sum, tx) => {
      const amount = Number(tx.amount);
      // Sent transactions are stored as negative, so take absolute value
      return sum + (isNaN(amount) ? 0 : Math.abs(amount));
    }, 0);
    const totalReceived = received.reduce((sum, tx) => {
      const amount = Number(tx.amount);
      // Received transactions are stored as positive
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    return {
      totalTransactions: transactions.length,
      totalSent,
      totalReceived,
      netFlow: totalReceived - totalSent,
      sentCount: sent.length,
      receivedCount: received.length,
    };
  };

  const getTransactionsByType = () => {
    const types = ['sent', 'received', 'staking', 'mining'];
    return types.map(type => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: transactions.filter(tx => tx.type === type).length,
      color: type === 'sent' ? '#ef4444' : type === 'received' ? '#10b981' : type === 'staking' ? '#8b5cf6' : '#f59e0b'
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const stats = getTransactionStats();

  const groupedTransactions = getGroupedTransactions();
  
  // Calculate totals with safety checks and number conversion
  const safeWallets = wallets.filter(wallet => wallet && wallet.balance && typeof wallet.balance.total !== 'undefined');
  const totalBalance = safeWallets.reduce((sum, wallet) => {
    const balance = Number(wallet.balance.total);
    return sum + (isNaN(balance) ? 0 : balance);
  }, 0);
  
  const sentTransactions = transactions.filter(tx => tx.type === 'sent');
  const totalSent = sentTransactions.reduce((sum, tx) => {
    const amount = Number(tx.amount);
    // Sent transactions are stored as negative, so take absolute value for display
    return sum + (isNaN(amount) ? 0 : Math.abs(amount));
  }, 0);
  
  const receivedTransactions = transactions.filter(tx => tx.type === 'received');
  const totalReceived = receivedTransactions.reduce((sum, tx) => {
    const amount = Number(tx.amount);
    // Received transactions are stored as positive
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  if (isLoading) {
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
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
              <div className="flex items-center gap-4">
                <p className="text-muted-foreground">
                  Detailed insights into your wallet performance and transaction history
                </p>
                {stxToUsd > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>STX:</span>
                    <span className="font-medium">${stxToUsd.toFixed(4)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setManualClearDialogOpen(true)}
                className="gap-2 text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
              >
                <Trash2 className="h-4 w-4" />
                Clear Wallet Transactions
              </Button>
              <Button
                onClick={syncTransactions}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Sync Transactions
              </Button>
            </div>
          </div>
        </div>

        {/* Balance Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Balance
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isNaN(totalBalance) ? '0.000000' : totalBalance.toFixed(6)} STX</div>
              <p className="text-xs text-muted-foreground">
                {stxToUsd > 0 && !isNaN(totalBalance) && `≈ ${formatUsdEquivalent(totalBalance)} • `}Across {wallets.length} wallets
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Sent
              </CardTitle>
              <ArrowUpRight className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isNaN(totalSent) ? '0.000000' : totalSent.toFixed(6)} STX</div>
              <p className="text-xs text-muted-foreground">
                {stxToUsd > 0 && !isNaN(totalSent) && `≈ ${formatUsdEquivalent(totalSent)} • `}{transactions.filter(t => t.type === 'sent').length} transactions
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Received
              </CardTitle>
              <ArrowDownRight className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isNaN(totalReceived) ? '0.000000' : totalReceived.toFixed(6)} STX</div>
              <p className="text-xs text-muted-foreground">
                {stxToUsd > 0 && !isNaN(totalReceived) && `≈ ${formatUsdEquivalent(totalReceived)} • `}{transactions.filter(t => t.type === 'received').length} transactions
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Transaction Volume
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactions.length}</div>
              <p className="text-xs text-muted-foreground">
                Total transactions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Balance History Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Balance History</CardTitle>
            <CardDescription>
              Your wallet balance trends over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={balanceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Total Balance"
                />
                <Line 
                  type="monotone" 
                  dataKey="available" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Available"
                />
                <Line 
                  type="monotone" 
                  dataKey="locked" 
                  stroke="#ffc658" 
                  strokeWidth={2}
                  name="Locked"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Transaction Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Analysis</CardTitle>
            <CardDescription>
              Organize and analyze your transactions by wallet, date, or type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Filters and Controls */}
            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="wallet-filter">Wallet</Label>
                <Select value={selectedWallet} onValueChange={setSelectedWallet}>
                  <SelectTrigger>
                    <SelectValue placeholder="All wallets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All wallets</SelectItem>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet._id} value={wallet._id}>
                        {wallet.email || `${wallet.address.slice(0, 10)}...`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type-filter">Type</Label>
                <Select value={transactionType} onValueChange={setTransactionType as (value: string) => void}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="group-by">Group by</Label>
                <Select value={groupBy} onValueChange={setGroupBy as (value: string) => void}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wallet">Wallet</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="type">Type</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Actions</Label>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allGroups = new Set(Object.keys(groupedTransactions));
                      setExpandedGroups(allGroups);
                    }}
                  >
                    Expand All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedGroups(new Set())}
                  >
                    Collapse All
                  </Button>
                </div>
              </div>
            </div>

            {/* Grouped Transactions */}
            <div className="space-y-4">
              {Object.entries(groupedTransactions).map(([groupKey, group]) => (
                <Card key={groupKey} className="border">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center space-x-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => toggleGroup(groupKey)}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          {expandedGroups.has(groupKey) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        <div>
                          <h3 className="font-semibold">
                            {groupBy === 'wallet'
                              ? (group.wallet.email || `${group.wallet.address.slice(0, 20)}...`)
                              : groupBy === 'date'
                              ? group.wallet.address
                              : `${group.wallet.address.charAt(0).toUpperCase()}${group.wallet.address.slice(1)} Transactions`
                            }
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {group.transactionCount} transactions
                            {groupBy === 'wallet' && (() => {
                              const balance = Number(group.wallet.balance.total);
                              const balanceStr = isNaN(balance) ? '0.000000' : balance.toFixed(6);
                              const usdStr = (stxToUsd > 0 && !isNaN(balance)) ? ` (≈ ${formatUsdEquivalent(balance)})` : '';
                              return ` • Balance: ${balanceStr} STX${usdStr}`;
                            })()}
                          </p>
                        </div>
                      </div>
                      {groupBy === 'wallet' && group.transactionCount > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                          onClick={(e) => {
                            e.stopPropagation();
                            openClearDialog(groupKey, group.wallet.address);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Clear Transactions
                        </Button>
                      )}
                      <div className="text-right">
                        <div className="flex flex-col space-y-1 text-sm">
                          <div className="flex space-x-4">
                            <span className="text-green-600">
                              +{isNaN(group.totalReceived) ? '0.000000' : group.totalReceived.toFixed(6)} STX
                            </span>
                            <span className="text-red-600">
                              -{isNaN(group.totalSent) ? '0.000000' : group.totalSent.toFixed(6)} STX
                            </span>
                          </div>
                          {stxToUsd > 0 && (
                            <div className="flex space-x-4 text-xs text-muted-foreground">
                              <span>≈ {!isNaN(group.totalReceived) ? formatUsdEquivalent(group.totalReceived) : '$0.00'}</span>
                              <span>≈ {!isNaN(group.totalSent) ? formatUsdEquivalent(group.totalSent) : '$0.00'}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Net: {(() => {
                            const received = isNaN(group.totalReceived) ? 0 : group.totalReceived;
                            const sent = isNaN(group.totalSent) ? 0 : group.totalSent;
                            const net = received - sent;
                            return `${net.toFixed(6)} STX`;
                          })()}
                          {stxToUsd > 0 && (() => {
                            const received = isNaN(group.totalReceived) ? 0 : group.totalReceived;
                            const sent = isNaN(group.totalSent) ? 0 : group.totalSent;
                            const net = received - sent;
                            return ` (≈ ${formatUsdEquivalent(net)})`;
                          })()}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {expandedGroups.has(groupKey) && (
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {group.transactions.map((transaction) => (
                          <div
                            key={transaction._id}
                            className="flex items-center space-x-4 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                          >
                            <div className={`rounded-full p-2 ${
                              transaction.type === 'received' 
                                ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                                : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                            }`}>
                              {transaction.type === 'received' ? 
                                <ArrowDownRight className="h-4 w-4" /> : 
                                <ArrowUpRight className="h-4 w-4" />
                              }
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">
                                  {transaction.type === 'received' ? 'Received' : 'Sent'} {(() => {
                                    const amount = Number(transaction.amount);
                                    return isNaN(amount) ? '0.000000' : Math.abs(amount).toFixed(6);
                                  })()} STX
                                </p>
                                <div className="text-right">
                                  <p className={`text-sm font-medium ${
                                    transaction.type === 'received' ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {(() => {
                                      const amount = Number(transaction.amount);
                                      if (isNaN(amount)) return '0.000000';
                                      // For sent transactions (negative amounts), show as negative
                                      // For received transactions (positive amounts), show as positive
                                      return amount >= 0 ? `+${amount.toFixed(6)}` : `${amount.toFixed(6)}`;
                                    })()} STX
                                  </p>
                                  {stxToUsd > 0 && !isNaN(Number(transaction.amount)) && (
                                    <p className="text-xs text-muted-foreground">
                                      ≈ {formatUsdEquivalent(transaction.amount)}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                TX: {transaction.txId}
                              </p>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">
                                  {transaction.type === 'received' ? 'From' : 'To'}: {
                                    transaction.type === 'received' 
                                      ? transaction.fromAddress 
                                      : transaction.toAddress
                                  }
                                </p>
                                <div className="flex items-center space-x-2">
                                  <Badge variant={transaction.status === 'confirmed' ? 'default' : 'secondary'}>
                                    {transaction.status}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(transaction.timestamp).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
              
              {Object.keys(groupedTransactions).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No transactions found matching your filters.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clear Transactions Confirmation Dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Transactions?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all transactions for wallet:
              <div className="mt-2 p-2 bg-muted rounded-md font-mono text-sm break-all">
                {walletToClear?.address}
              </div>
              <div className="mt-3 text-red-600 font-semibold">
                This action cannot be undone. You can always re-sync transactions from the blockchain later.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearTransactions}
              disabled={isClearing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isClearing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                'Clear Transactions'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manual Clear Transactions Dialog */}
      <AlertDialog open={manualClearDialogOpen} onOpenChange={setManualClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Wallet Transactions</AlertDialogTitle>
            <AlertDialogDescription>
              Select a wallet from your list or enter a wallet address manually to clear all its transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            {/* Wallet Selector */}
            {wallets.length > 0 && (
              <div>
                <Label htmlFor="wallet-selector">Select Your Wallet</Label>
                <Select
                  value={manualWalletAddress}
                  onValueChange={setManualWalletAddress}
                  disabled={isClearing}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose a wallet or enter manually below" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet._id} value={wallet.address}>
                        <div className="flex items-center justify-between w-full">
                          <span className="font-mono text-sm">
                            {wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}
                          </span>
                          {wallet.email && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({wallet.email})
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Manual Input */}
            <div>
              <Label htmlFor="manual-wallet-address">Or Enter Wallet Address Manually</Label>
              <Input
                id="manual-wallet-address"
                placeholder="Enter Stacks wallet address (SP...)"
                value={manualWalletAddress}
                onChange={(e) => setManualWalletAddress(e.target.value)}
                className="mt-2"
                disabled={isClearing}
              />
            </div>

            {manualWalletAddress && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <p className="text-sm font-semibold mb-2">Selected Wallet:</p>
                <p className="font-mono text-sm break-all mb-3">{manualWalletAddress}</p>
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold mb-1">Note:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Only wallets you own can be cleared</li>
                    <li>This will delete all transaction history for this wallet</li>
                    <li>You can re-sync transactions from blockchain later</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleManualClearTransactions}
              disabled={isClearing || !manualWalletAddress.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isClearing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                'Clear Transactions'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}