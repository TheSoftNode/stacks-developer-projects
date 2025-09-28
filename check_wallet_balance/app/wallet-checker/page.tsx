"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Loader2,
  Search, 
  Copy, 
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Clock,
  TrendingUp,
  Activity,
  Share2,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface WalletBalance {
  available: number;
  locked: number;
  total: number;
  totalSent: number;
  totalReceived: number;
  totalFees: number;
}

interface Transaction {
  txId: string;
  type: 'sent' | 'received' | 'staking' | 'mining';
  amount: number;
  fee: number;
  fromAddress: string;
  toAddress: string;
  blockHeight: number;
  blockHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  memo: string;
}

interface WalletData {
  address: string;
  balance: WalletBalance;
  transactions?: Transaction[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

export default function WalletCheckerPage() {
  const [walletAddress, setWalletAddress] = useState('');
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [stxToUsd, setStxToUsd] = useState<number>(0);
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    itemsPerPage: 20,
    totalItems: 0,
  });

  // Fetch STX price on component mount
  useEffect(() => {
    fetchStxPrice();
  }, []);

  // Load wallet from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const addressFromUrl = urlParams.get('address');
    if (addressFromUrl && isValidStacksAddress(addressFromUrl)) {
      setWalletAddress(addressFromUrl);
      fetchWalletData(addressFromUrl);
    }
  }, []);

  const fetchStxPrice = async () => {
    try {
      const response = await fetch('https://api.diadata.org/v1/assetQuotation/Stacks/0x0000000000000000000000000000000000000000');
      const data = await response.json();
      setStxToUsd(data.Price || 0);
    } catch (error) {
      console.error('Failed to fetch STX price:', error);
      setStxToUsd(0);
    }
  };

  const isValidStacksAddress = (address: string): boolean => {
    return /^SP[0-9A-HJKMNP-TV-Z]{39}$|^SM[0-9A-HJKMNP-TV-Z]{39}$/.test(address);
  };

  const fetchWalletData = useCallback(async (address: string, page = 1) => {
    if (!isValidStacksAddress(address)) {
      setError('Please enter a valid Stacks address (starts with SP or SM)');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const offset = (page - 1) * pagination.itemsPerPage;
      const response = await fetch(
        `/api/public/wallet/${address}?limit=${pagination.itemsPerPage}&offset=${offset}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch wallet data');
      }

      const data: WalletData = await response.json();
      setWalletData(data);
      
      if (data.pagination) {
        setPagination(prev => ({
          ...prev,
          currentPage: page,
          totalItems: data.pagination!.total,
        }));
      }


      // Update URL with wallet address
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('address', address);
      window.history.replaceState({}, '', newUrl.toString());

    } catch (err) {
      setError('Failed to fetch wallet data. Please try again.');
      console.error('Error fetching wallet data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.itemsPerPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (walletAddress.trim()) {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
      fetchWalletData(walletAddress.trim());
    }
  };

  const handlePageChange = (newPage: number) => {
    if (walletData) {
      fetchWalletData(walletData.address, newPage);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const shareWallet = () => {
    const url = `${window.location.origin}/wallet-checker?address=${walletData?.address}`;
    copyToClipboard(url, 'Wallet link');
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatStxAmount = (stxAmount: number, showUsd: boolean = true) => {
    const stxValue = Number(stxAmount);
    if (isNaN(stxValue)) return '0.000000 STX';
    
    const stx = Math.abs(stxValue).toFixed(6);
    if (!showUsd || !stxToUsd || isNaN(stxToUsd)) {
      return `${stx} STX`;
    }
    const usd = (Math.abs(stxValue) * stxToUsd).toFixed(2);
    return `${stx} STX ($${usd})`;
  };

  const formatUsdEquivalent = (stxAmount: number) => {
    const stxValue = Number(stxAmount);
    if (!stxToUsd || isNaN(stxToUsd) || isNaN(stxValue)) return '$0.00';
    const usd = (Math.abs(stxValue) * stxToUsd).toFixed(2);
    return `$${usd}`;
  };

  const getFilteredTransactions = () => {
    if (!walletData?.transactions) return [];
    
    if (transactionFilter === 'all') return walletData.transactions;
    return walletData.transactions.filter(tx => tx.type === transactionFilter);
  };

  const getChartData = () => {
    if (!walletData?.balance) return [];
    
    // Use the balance data which represents the entire wallet history
    const chartData = [];
    
    if (walletData.balance.totalSent > 0) {
      chartData.push({ name: 'Sent', value: walletData.balance.totalSent, color: '#ef4444' });
    }
    if (walletData.balance.totalReceived > 0) {
      chartData.push({ name: 'Received', value: walletData.balance.totalReceived, color: '#10b981' });
    }
    
    return chartData;
  };

  const totalPages = Math.ceil(pagination.totalItems / pagination.itemsPerPage);
  const filteredTransactions = getFilteredTransactions();

  const handleAuthClick = (type: 'login' | 'signup') => {
    // Redirect to home page with auth modal
    window.location.href = `/?auth=${type}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onAuthClick={handleAuthClick} />
      
      <main className="pt-16 min-h-[90vh]">
        <div className="container mx-auto px-4 py-6">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl lg:text-4xl font-bold mb-3">
              Stacks Wallet <span className="text-brand-pink">Explorer</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Enter any Stacks wallet address to view its balance, transaction history, and analytics in real-time.
            </p>
          </motion.div>

          {/* Search Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-2xl mx-auto mb-8"
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Search Wallet</CardTitle>
                <CardDescription>
                  Enter a Stacks address (starting with SP or SM) to explore
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <form onSubmit={handleSearch} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="wallet-address">Wallet Address</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="wallet-address"
                        placeholder="SP1ABC123..."
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        className="flex-1"
                        disabled={isLoading}
                      />
                      <Button 
                        type="submit" 
                        disabled={isLoading || !walletAddress.trim()}
                        className="bg-brand-pink hover:bg-brand-pink/90 text-white"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {error && (
                    <div className="flex items-center space-x-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>{error}</span>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Wallet Data Display */}
          <AnimatePresence>
            {walletData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                {/* Wallet Header */}
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2 text-lg">
                          <Wallet className="h-4 w-4" />
                          <span>Wallet Details</span>
                        </CardTitle>
                        <CardDescription className="mt-1">
                          <div className="flex items-center space-x-2">
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {walletData.address}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(walletData.address, 'Address')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        onClick={shareWallet}
                        className="gap-2"
                        size="sm"
                      >
                        <Share2 className="h-4 w-4" />
                        Share
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                {/* Balance Overview */}
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-1">
                      <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="text-xl font-bold text-brand-teal">
                        {walletData.balance.available.toFixed(6)} STX
                      </div>
                      {stxToUsd > 0 && (
                        <p className="text-xs text-muted-foreground">
                          ≈ {formatUsdEquivalent(walletData.balance.available)}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-1">
                      <CardTitle className="text-sm font-medium">Locked Balance</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="text-xl font-bold">
                        {walletData.balance.locked.toFixed(6)} STX
                      </div>
                      {stxToUsd > 0 && (
                        <p className="text-xs text-muted-foreground">
                          ≈ {formatUsdEquivalent(walletData.balance.locked)}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-1">
                      <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="text-xl font-bold text-brand-pink">
                        {walletData.balance.total.toFixed(6)} STX
                      </div>
                      {stxToUsd > 0 && (
                        <p className="text-xs text-muted-foreground">
                          ≈ {formatUsdEquivalent(walletData.balance.total)}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-1">
                      <CardTitle className="text-sm font-medium">Net Flow</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="text-xl font-bold">
                        {(walletData.balance.totalReceived - walletData.balance.totalSent).toFixed(6)} STX
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Received - Sent
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Transaction Analytics */}
                {walletData.transactions && walletData.transactions.length > 0 && (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {/* Transaction Type Distribution */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Transaction Types</CardTitle>
                        <CardDescription>Distribution of transaction types</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="h-48">
                          {getChartData().length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={getChartData()}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={40}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  {getChartData().map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center">
                                <Activity className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">No transaction activity yet</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Transaction Summary */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Transaction Summary</CardTitle>
                        <CardDescription>Overview of wallet activity</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        <div className="grid gap-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <ArrowDownRight className="h-4 w-4 text-green-600" />
                              <span className="text-sm">Total Received</span>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-sm">{walletData.balance.totalReceived.toFixed(6)} STX</div>
                              {stxToUsd > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  {formatUsdEquivalent(walletData.balance.totalReceived)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <ArrowUpRight className="h-4 w-4 text-red-600" />
                              <span className="text-sm">Total Sent</span>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-sm">{walletData.balance.totalSent.toFixed(6)} STX</div>
                              {stxToUsd > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  {formatUsdEquivalent(walletData.balance.totalSent)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Activity className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">Total Fees</span>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-sm">{walletData.balance.totalFees.toFixed(6)} STX</div>
                              {stxToUsd > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  {formatUsdEquivalent(walletData.balance.totalFees)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Transaction History */}
                {walletData.transactions && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Transaction History</CardTitle>
                          <CardDescription>
                            {pagination.totalItems} total transactions
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="filter">Filter:</Label>
                          <Select value={transactionFilter} onValueChange={setTransactionFilter}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="sent">Sent</SelectItem>
                              <SelectItem value="received">Received</SelectItem>
                              <SelectItem value="mining">Mining</SelectItem>
                              <SelectItem value="staking">Staking</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {filteredTransactions.length === 0 ? (
                        <div className="text-center py-8">
                          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-muted-foreground">No transactions found matching the current filter.</p>
                        </div>
                      ) : (
                        <>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Amount</TableHead>
                                  <TableHead>From/To</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredTransactions.map((tx) => (
                                  <TableRow key={tx.txId}>
                                    <TableCell>
                                      <div className="flex items-center space-x-2">
                                        <div className={`p-1 rounded-full ${
                                          tx.type === 'received' 
                                            ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                                            : tx.type === 'sent'
                                            ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                                            : 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                                        }`}>
                                          {tx.type === 'received' ? (
                                            <ArrowDownRight className="h-3 w-3" />
                                          ) : tx.type === 'sent' ? (
                                            <ArrowUpRight className="h-3 w-3" />
                                          ) : (
                                            <Activity className="h-3 w-3" />
                                          )}
                                        </div>
                                        <span className="capitalize font-medium">{tx.type}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="text-right">
                                        <div className={`font-mono font-semibold ${
                                          tx.amount >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                          {tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(6)} STX
                                        </div>
                                        {stxToUsd > 0 && (
                                          <div className="text-xs text-muted-foreground">
                                            ≈ {formatUsdEquivalent(tx.amount)}
                                          </div>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="space-y-1">
                                        <div className="text-sm">
                                          <span className="text-muted-foreground">
                                            {tx.type === 'received' ? 'From: ' : 'To: '}
                                          </span>
                                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                            {formatAddress(
                                              tx.type === 'received' ? tx.fromAddress : tx.toAddress
                                            )}
                                          </code>
                                        </div>
                                        {tx.fee > 0 && (
                                          <div className="text-xs text-muted-foreground">
                                            Fee: {tx.fee.toFixed(6)} STX
                                          </div>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={tx.status === 'confirmed' ? 'default' : 'secondary'}>
                                        {tx.status === 'confirmed' ? (
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                        ) : (
                                          <Clock className="h-3 w-3 mr-1" />
                                        )}
                                        {tx.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="text-sm">
                                        {formatDate(tx.timestamp)}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Block {tx.blockHeight}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center space-x-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6"
                                          onClick={() => copyToClipboard(tx.txId, 'Transaction ID')}
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6"
                                          onClick={() => window.open(`https://explorer.stacks.co/txid/${tx.txId}`, '_blank')}
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>

                          {/* Pagination */}
                          {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6">
                              <div className="text-sm text-muted-foreground">
                                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                                {pagination.totalItems} transactions
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                                  disabled={pagination.currentPage === 1 || isLoading}
                                >
                                  <ChevronLeft className="h-4 w-4 mr-1" />
                                  Previous
                                </Button>
                                <div className="flex items-center space-x-1">
                                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const page = i + 1;
                                    return (
                                      <Button
                                        key={page}
                                        variant={page === pagination.currentPage ? "default" : "outline"}
                                        size="sm"
                                        className="w-8 h-8 p-0"
                                        onClick={() => handlePageChange(page)}
                                        disabled={isLoading}
                                      >
                                        {page}
                                      </Button>
                                    );
                                  })}
                                  {totalPages > 5 && (
                                    <>
                                      <span className="text-muted-foreground">...</span>
                                      <Button
                                        variant={totalPages === pagination.currentPage ? "default" : "outline"}
                                        size="sm"
                                        className="w-8 h-8 p-0"
                                        onClick={() => handlePageChange(totalPages)}
                                        disabled={isLoading}
                                      >
                                        {totalPages}
                                      </Button>
                                    </>
                                  )}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                                  disabled={pagination.currentPage === totalPages || isLoading}
                                >
                                  Next
                                  <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
}