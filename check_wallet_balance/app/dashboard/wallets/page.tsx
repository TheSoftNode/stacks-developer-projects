"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  RefreshCw, 
  Pencil, 
  Trash2, 
  Loader2,
  Copy,
  CheckCircle,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

export default function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [newWallet, setNewWallet] = useState({ email: '', address: '' });

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      const response = await fetch('/api/wallets');
      if (response.ok) {
        const data = await response.json();
        setWallets(data.wallets);
      } else {
        toast.error('Failed to fetch wallets');
      }
    } catch (error) {
      toast.error('Network error occurred');
    }
    setIsLoading(false);
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
        setWallets([data.wallet, ...wallets]);
        setNewWallet({ email: '', address: '' });
        setIsAddModalOpen(false);
      } else {
        toast.error(data.error || 'Failed to add wallet');
      }
    } catch (error) {
      toast.error('Network error occurred');
    }
  };

  const handleUpdateBalances = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/wallets/update-balances', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Balances updated successfully!');
        fetchWallets(); // Refresh wallet data
      } else {
        toast.error(data.error || 'Failed to update balances');
      }
    } catch (error) {
      toast.error('Network error occurred');
    }
    setIsUpdating(false);
  };

  const handleEditWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingWallet) return;

    try {
      const response = await fetch(`/api/wallets/${editingWallet._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: editingWallet.email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Wallet updated successfully!');
        setWallets(wallets.map(w => w._id === editingWallet._id ? data.wallet : w));
        setIsEditModalOpen(false);
        setEditingWallet(null);
      } else {
        toast.error(data.error || 'Failed to update wallet');
      }
    } catch (error) {
      toast.error('Network error occurred');
    }
  };

  const handleDeleteWallet = async (walletId: string) => {
    try {
      const response = await fetch(`/api/wallets/${walletId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Wallet removed successfully!');
        setWallets(wallets.filter(w => w._id !== walletId));
      } else {
        toast.error('Failed to remove wallet');
      }
    } catch (error) {
      toast.error('Network error occurred');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
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

  const getTotalBalance = () => {
    return wallets.reduce((sum, wallet) => sum + wallet.balance.total, 0);
  };

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
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Wallet Management</h1>
            <p className="text-muted-foreground">
              Manage your Stacks wallets and monitor their balances
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={handleUpdateBalances}
              disabled={isUpdating}
              className="border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white"
            >
              {isUpdating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Update Balances
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
                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddModalOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 bg-brand-pink hover:bg-brand-pink/90 text-white"
                    >
                      Add Wallet
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold brand-teal">
                {getTotalBalance().toFixed(6)} STX
              </div>
              <p className="text-xs text-muted-foreground">
                Across {wallets.length} wallets
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Wallets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{wallets.length}</div>
              <p className="text-xs text-muted-foreground">
                Monitoring enabled
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Last Update</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {wallets.length > 0 ? 'Recently' : 'Never'}
              </div>
              <p className="text-xs text-muted-foreground">
                Auto-sync enabled
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Wallets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Your Wallets</CardTitle>
            <CardDescription>
              Monitor and manage your Stacks wallet addresses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {wallets.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">
                  <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No wallets added yet</p>
                  <p className="text-sm">Add your first wallet to start monitoring</p>
                </div>
                <Button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-brand-pink hover:bg-brand-pink/90 text-white"
                >
                  Add Your First Wallet
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead className="text-right">Available</TableHead>
                      <TableHead className="text-right">Locked</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {wallets.map((wallet, index) => (
                        <motion.tr
                          key={wallet._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className="group"
                        >
                          <TableCell className="font-medium">
                            {wallet.email}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <code className="text-sm bg-muted px-2 py-1 rounded">
                                {formatAddress(wallet.address)}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => copyToClipboard(wallet.address)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {wallet.balance.available.toFixed(6)} STX
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {wallet.balance.locked.toFixed(6)} STX
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold brand-teal">
                            {wallet.balance.total.toFixed(6)} STX
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {formatDate(wallet.lastUpdated)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <Dialog open={isEditModalOpen && editingWallet?._id === wallet._id} onOpenChange={setIsEditModalOpen}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setEditingWallet(wallet)}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Wallet</DialogTitle>
                                    <DialogDescription>
                                      Update the email associated with this wallet
                                    </DialogDescription>
                                  </DialogHeader>
                                  {editingWallet && (
                                    <form onSubmit={handleEditWallet} className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-email">Email</Label>
                                        <Input
                                          id="edit-email"
                                          type="email"
                                          value={editingWallet.email}
                                          onChange={(e) => setEditingWallet({
                                            ...editingWallet,
                                            email: e.target.value
                                          })}
                                          required
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Wallet Address (Read-only)</Label>
                                        <Input
                                          value={editingWallet.address}
                                          disabled
                                          className="bg-muted"
                                        />
                                      </div>
                                      <div className="flex gap-3 pt-4">
                                        <Button 
                                          type="button" 
                                          variant="outline" 
                                          onClick={() => setIsEditModalOpen(false)}
                                          className="flex-1"
                                        >
                                          Cancel
                                        </Button>
                                        <Button 
                                          type="submit" 
                                          className="flex-1 bg-brand-pink hover:bg-brand-pink/90 text-white"
                                        >
                                          Update
                                        </Button>
                                      </div>
                                    </form>
                                  )}
                                </DialogContent>
                              </Dialog>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove Wallet</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to remove this wallet? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteWallet(wallet._id)}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      Remove
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}