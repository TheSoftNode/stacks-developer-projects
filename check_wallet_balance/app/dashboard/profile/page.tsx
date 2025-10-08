'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Separator } from '../../../components/ui/separator';
import { Badge } from '../../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../../components/ui/avatar';
import { useToast } from '../../../hooks/use-toast';
import { 
  User, 
  Mail, 
  Shield, 
  Activity, 
  Clock, 
  Wallet, 
  BarChart3,
  Calendar,
  CheckCircle,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  authMethod?: 'email' | 'wallet' | 'both';
  walletAddress?: string;
  walletType?: 'stacks';
  createdAt?: string;
  lastLogin?: string;
  emailNotifications: boolean;
  autoUpdate: boolean;
  updateFrequency: string;
  balanceThreshold: number;
  profileComplete?: boolean;
  monthlyUpdateDay?: number;
}

interface UserStats {
  totalWallets: number;
  totalBalance: number;
  totalTransactions: number;
  lastSyncDate: string;
  accountAge: number;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      let userData = null;
      
      // Fetch user profile
      const profileResponse = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        userData = profileData.user;
        
        setProfile({
          id: userData._id || userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          isVerified: userData.isVerified,
          authMethod: userData.authMethod,
          walletAddress: userData.walletAddress,
          walletType: userData.walletType,
          createdAt: userData.createdAt,
          lastLogin: userData.lastLogin,
          emailNotifications: userData.emailNotifications,
          autoUpdate: userData.autoUpdate,
          updateFrequency: userData.updateFrequency,
          balanceThreshold: userData.balanceThreshold,
          profileComplete: userData.profileComplete,
          monthlyUpdateDay: userData.monthlyUpdateDay,
        });
      }

      // Fetch user statistics
      const statsResponse = await fetch('/api/wallets');
      const walletsData = await statsResponse.json();
      
      const transactionsResponse = await fetch('/api/transactions?limit=1');
      const transactionsData = await transactionsResponse.json();

      if (walletsData.wallets) {
        const totalBalance = walletsData.wallets.reduce((sum: number, wallet: any) => {
          return sum + (wallet.balance?.total || 0);
        }, 0);

        // Calculate account age using the userData we have
        const accountCreated = userData?.createdAt ? new Date(userData.createdAt) : new Date();
        const accountAge = Math.floor((Date.now() - accountCreated.getTime()) / (1000 * 60 * 60 * 24));

        setStats({
          totalWallets: walletsData.wallets.length,
          totalBalance,
          totalTransactions: transactionsData.pagination?.total || 0,
          lastSyncDate: walletsData.wallets[0]?.lastUpdated || new Date().toISOString(),
          accountAge,
        });
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/auth/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Profile updated',
          description: 'Your profile has been updated successfully',
        });
        setEditing(false);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const copyWalletAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
      toast({
        title: 'Copied',
        description: 'Wallet address copied to clipboard',
      });
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Failed to load profile data</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account information and view your activity
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your account details and authentication information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-brand-pink text-white text-xl">
                    {profile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{profile.name}</h3>
                  <p className="text-muted-foreground">{profile.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {profile.isVerified ? (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Unverified
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {profile.role === 'admin' ? 'Administrator' : 'User'}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {editing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Account Created</p>
                      <p className="font-medium">{profile.createdAt ? formatDate(profile.createdAt) : 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Login</p>
                      <p className="font-medium">
                        {profile.lastLogin ? formatRelativeTime(profile.lastLogin) : 'Never'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Authentication</p>
                      <p className="font-medium capitalize">
                        {profile.authMethod ? profile.authMethod.charAt(0).toUpperCase() + profile.authMethod.slice(1) : 'Email'} Login
                      </p>
                    </div>
                    {profile.walletType && (
                      <div>
                        <p className="text-muted-foreground">Wallet Type</p>
                        <p className="font-medium">{profile.walletType}</p>
                      </div>
                    )}
                  </div>
                  
                  {profile.walletAddress && (
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">Connected Wallet</p>
                      <div className="flex items-center gap-2 p-2 bg-muted rounded">
                        <code className="text-xs font-mono flex-1">{profile.walletAddress}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyWalletAddress(profile.walletAddress!)}
                        >
                          {copiedAddress ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  <Button onClick={() => setEditing(true)}>
                    Edit Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Account Statistics
              </CardTitle>
              <CardDescription>
                Overview of your wallet monitoring activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                    <Wallet className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-2xl font-bold text-blue-600">{stats.totalWallets}</p>
                    <p className="text-xs text-blue-600">Total Wallets</p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
                    <Activity className="h-6 w-6 mx-auto mb-2 text-green-600" />
                    <p className="text-2xl font-bold text-green-600">{stats.totalTransactions}</p>
                    <p className="text-xs text-green-600">Transactions</p>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                    <BarChart3 className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                    <p className="text-2xl font-bold text-purple-600">{stats.totalBalance.toFixed(2)}</p>
                    <p className="text-xs text-purple-600">Total STX</p>
                  </div>
                  
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                    <Calendar className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                    <p className="text-2xl font-bold text-orange-600">{stats.accountAge}</p>
                    <p className="text-xs text-orange-600">Days Active</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-300 mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading statistics...</p>
                </div>
              )}
              
              <Separator />
              
              <div className="space-y-2">
                <h4 className="font-medium">Recent Activity</h4>
                <div className="space-y-2 text-sm">
                  {stats && (
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Last wallet sync</span>
                      </div>
                      <span className="text-muted-foreground">
                        {formatRelativeTime(stats.lastSyncDate)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Settings Summary
              </CardTitle>
              <CardDescription>
                Current configuration and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email Notifications</span>
                  <Badge variant={profile.emailNotifications !== false ? "default" : "secondary"}>
                    {profile.emailNotifications !== false ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Auto Updates</span>
                  <Badge variant={profile.autoUpdate !== false ? "default" : "secondary"}>
                    {profile.autoUpdate !== false ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Update Frequency</span>
                  <Badge variant="outline">
                    {profile.updateFrequency ? 
                      profile.updateFrequency.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) :
                      'Every 5 Days'
                    }
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Balance Threshold</span>
                  <Badge variant="outline">
                    {profile.balanceThreshold || 1000} STX
                  </Badge>
                </div>
              </div>
              
              <Separator />
              
              <Button variant="outline" className="w-full" asChild>
                <a href="/dashboard/settings">
                  Manage Settings
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Security Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>
                Your account security status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Account Secured</span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Your account is protected with industry-standard security measures.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Security Features:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Encrypted wallet addresses
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    JWT authentication
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    HTTPS-only communication
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Secure password hashing
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}