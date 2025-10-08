'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Switch } from '../../../components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Separator } from '../../../components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useToast } from '../../../hooks/use-toast';
import { Bell, Mail, Shield,  Zap, Clock,  Activity,  Wallet, Link, Unlink, UserCircle } from 'lucide-react';
import { walletService } from '../../../lib/wallet-service';

interface UserSettings {
  name: string;
  email: string;
  emailNotifications: boolean;
  balanceThreshold: number;
  autoUpdate: boolean;
  updateFrequency: string; // 'daily', 'every-3-days', 'every-5-days', 'weekly', 'monthly'
  monthlyUpdateDay: number; // 1-28 for monthly updates
  walletAddress?: string;
  authMethod?: string;
  walletLinkedAt?: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    name: '',
    email: '',
    emailNotifications: true,
    balanceThreshold: 1000,
    autoUpdate: true,
    updateFrequency: 'every-5-days',
    monthlyUpdateDay: 15,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggeringUpdate, setTriggeringUpdate] = useState(false);
  const [linkingWallet, setLinkingWallet] = useState(false);
  const [unlinkingWallet, setUnlinkingWallet] = useState(false);
  const [linkingEmail, setLinkingEmail] = useState(false);
  const [emailLinkData, setEmailLinkData] = useState({ email: '', password: '' });
  const [schedulerStatus, setSchedulerStatus] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserSettings();
    fetchSchedulerStatus();
  }, []);

  const fetchSchedulerStatus = async () => {
    try {
      const response = await fetch('/api/scheduler/status');
      if (response.ok) {
        const data = await response.json();
        setSchedulerStatus(data.status);
      }
    } catch (error) {
      console.error('Error fetching scheduler status:', error);
    }
  };

  const fetchUserSettings = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Raw API response:', data); // Debug log
        const userData = data.user || data; // Handle both possible structures
        console.log('🔍 Processed user data:', userData); // Debug log
        setSettings({
          name: userData.name,
          email: userData.email,
          emailNotifications: userData.emailNotifications ?? true,
          balanceThreshold: userData.balanceThreshold ?? 1000,
          autoUpdate: userData.autoUpdate ?? true,
          updateFrequency: userData.updateFrequency ?? 'every-5-days',
          monthlyUpdateDay: userData.monthlyUpdateDay ?? 15,
          walletAddress: userData.walletAddress,
          authMethod: userData.authMethod,
          walletLinkedAt: userData.walletLinkedAt,
        });
        console.log('🔍 Settings state after update:', {
          authMethod: userData.authMethod,
          walletAddress: userData.walletAddress,
          email: userData.email
        }); // Debug log
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/auth/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: 'Settings saved',
          description: 'Your preferences have been updated successfully',
        });
        // Refresh scheduler status after saving settings
        await fetchSchedulerStatus();
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const triggerManualUpdate = async () => {
    setTriggeringUpdate(true);
    try {
      const response = await fetch('/api/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'balance_update' }),
      });

      if (response.ok) {
        toast({
          title: 'Update triggered',
          description: 'Balance and transaction sync has been initiated. You will receive an email notification when complete.',
        });
        await fetchSchedulerStatus();
      } else {
        throw new Error('Failed to trigger update');
      }
    } catch (error) {
      console.error('Error triggering update:', error);
      toast({
        title: 'Error',
        description: 'Failed to trigger balance update',
        variant: 'destructive',
      });
    } finally {
      setTriggeringUpdate(false);
    }
  };

  const triggerTransactionSync = async () => {
    setTriggeringUpdate(true);
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Transaction sync completed',
          description: `Synced ${result.totalSynced} new transactions`,
        });
        await fetchSchedulerStatus();
      } else {
        throw new Error('Failed to sync transactions');
      }
    } catch (error) {
      console.error('Error syncing transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to sync transactions',
        variant: 'destructive',
      });
    } finally {
      setTriggeringUpdate(false);
    }
  };

  const initializeScheduler = async () => {
    setTriggeringUpdate(true);
    try {
      const response = await fetch('/api/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'init_scheduler' }),
      });

      if (response.ok) {
        toast({
          title: 'Scheduler initialized',
          description: 'Auto-update scheduler has been started for all users',
        });
        await fetchSchedulerStatus();
      } else {
        throw new Error('Failed to initialize scheduler');
      }
    } catch (error) {
      console.error('Error initializing scheduler:', error);
      toast({
        title: 'Error',
        description: 'Failed to initialize scheduler',
        variant: 'destructive',
      });
    } finally {
      setTriggeringUpdate(false);
    }
  };

  const handleLinkWallet = async () => {
    setLinkingWallet(true);
    try {
      // Use wallet service to connect and get signature
      const walletData = await walletService.connectWalletForExistingUser();
      
      if (walletData.success) {
        // Call link-wallet API
        const response = await fetch('/api/auth/link-wallet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            address: walletData.address,
            signature: walletData.signature,
            message: walletData.message,
            publicKey: walletData.publicKey,
            walletType: 'stacks',
          }),
        });

        const result = await response.json();
        
        if (result.success) {
          toast({
            title: 'Wallet linked successfully!',
            description: 'You can now login with either your email or wallet.',
          });
          
          // Refresh user settings
          await fetchUserSettings();
        } else {
          throw new Error(result.error || 'Failed to link wallet');
        }
      }
    } catch (error) {
      console.error('Error linking wallet:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to link wallet',
        variant: 'destructive',
      });
    } finally {
      setLinkingWallet(false);
    }
  };

  const handleUnlinkWallet = async () => {
    setUnlinkingWallet(true);
    try {
      const response = await fetch('/api/auth/unlink-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Wallet unlinked successfully',
          description: 'You can now only login with your email and password.',
        });
        
        // Refresh user settings
        await fetchUserSettings();
      } else {
        throw new Error(result.error || 'Failed to unlink wallet');
      }
    } catch (error) {
      console.error('Error unlinking wallet:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to unlink wallet',
        variant: 'destructive',
      });
    } finally {
      setUnlinkingWallet(false);
    }
  };

  const handleLinkEmail = async () => {
    if (!emailLinkData.email || !emailLinkData.password) {
      toast({
        title: 'Error',
        description: 'Please enter both email and password',
        variant: 'destructive',
      });
      return;
    }

    setLinkingEmail(true);
    try {
      const response = await fetch('/api/auth/link-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailLinkData.email,
          password: emailLinkData.password,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Accounts merged successfully!',
          description: 'Your wallet account has been merged with your email account. You can now login with either method.',
        });
        
        // The API returns a new auth token, so we need to refresh the page
        // to pick up the new authentication state
        if (result.redirectToLogin) {
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } else {
        throw new Error(result.error || 'Failed to link email account');
      }
    } catch (error) {
      console.error('Error linking email:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to link email account',
        variant: 'destructive',
      });
    } finally {
      setLinkingEmail(false);
    }
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account preferences and notification settings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Auto Update Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Auto Update Management
            </CardTitle>
            <CardDescription>
              Control automatic balance and transaction updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Enable Auto Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically update balances and sync transactions based on your schedule
                </p>
              </div>
              <Switch
                checked={settings.autoUpdate}
                onCheckedChange={(checked: boolean) =>
                  setSettings({ ...settings, autoUpdate: checked })
                }
              />
            </div>

            {settings.autoUpdate && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="updateFrequency">Update Frequency</Label>
                  <Select
                    value={settings.updateFrequency}
                    onValueChange={(value) =>
                      setSettings({ ...settings, updateFrequency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select update frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="every-3-days">Every 3 Days</SelectItem>
                      <SelectItem value="every-5-days">Every 5 Days</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi-weekly">Every 2 Weeks</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {settings.updateFrequency === 'monthly' && (
                  <div className="space-y-2">
                    <Label htmlFor="monthlyUpdateDay">Monthly Update Day</Label>
                    <Select
                      value={settings.monthlyUpdateDay.toString()}
                      onValueChange={(value) =>
                        setSettings({ ...settings, monthlyUpdateDay: Number(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select day of month" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                          <SelectItem key={day} value={day.toString()}>
                            {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of the month
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how and when you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email updates about your wallet balances
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked: boolean) =>
                  setSettings({ ...settings, emailNotifications: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Auto Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically update balances and sync transactions based on your schedule
                </p>
              </div>
              <Switch
                checked={settings.autoUpdate}
                onCheckedChange={(checked: boolean) =>
                  setSettings({ ...settings, autoUpdate: checked })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="threshold">Balance Threshold (STX)</Label>
              <Input
                id="threshold"
                type="number"
                value={settings.balanceThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, balanceThreshold: Number(e.target.value) })
                }
                placeholder="1000"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Get notified when your total balance exceeds this amount
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>
              Your data security and encryption information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <Shield className="h-4 w-4" />
                <span className="font-medium">Data Encrypted</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                All your wallet addresses and sensitive data are encrypted with AES-256 encryption.
                Even administrators cannot access your private information.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Security Features:</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• End-to-end encryption for all wallet data</li>
                <li>• Secure JWT authentication</li>
                <li>• Password hashing with bcrypt</li>
                <li>• HTTPS-only communication</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Connection / Account Linking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              {settings.authMethod === 'wallet' ? 'Account Linking' : 'Wallet Connection'}
            </CardTitle>
            <CardDescription>
              {settings.authMethod === 'wallet' 
                ? 'Link your wallet account with an existing email account for dual authentication'
                : 'Link your Stacks wallet for easier login and enhanced security'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              console.log('🔍 Wallet card render logic:', {
                authMethod: settings.authMethod,
                walletAddress: settings.walletAddress,
                isWalletOnly: settings.authMethod === 'wallet',
                hasWallet: !!settings.walletAddress
              });
              return null;
            })()}
            {settings.authMethod === 'wallet' ? (
              // Wallet-only user: Show email linking options
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                    <UserCircle className="h-4 w-4" />
                    <span className="font-medium">Wallet-Only Account</span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Your account uses wallet authentication only. You can link it with an existing email account.
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Current wallet: {settings.walletAddress}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium">Link with Existing Email Account</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Enter the credentials of an existing email-based account to merge them:
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="linkEmail" className='mb-2'>Email Address</Label>
                      <Input
                        id="linkEmail"
                        type="email"
                        value={emailLinkData.email}
                        onChange={(e) => setEmailLinkData({...emailLinkData, email: e.target.value})}
                        placeholder="Enter existing account email"
                        disabled={linkingEmail}
                      />
                    </div>
                    <div>
                      <Label htmlFor="linkPassword" className='mb-2'>Password</Label>
                      <Input
                        id="linkPassword"
                        type="password"
                        value={emailLinkData.password}
                        onChange={(e) => setEmailLinkData({...emailLinkData, password: e.target.value})}
                        placeholder="Enter account password"
                        disabled={linkingEmail}
                      />
                    </div>
                  </div>
                  
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded">
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      <strong>Important:</strong> This will merge BOTH accounts into one unified account. 
                      All wallets, transactions, and data from both your wallet account AND the email account will be preserved and combined.
                      No data will be lost from either account.
                    </p>
                  </div>
                  
                  <Button
                    onClick={handleLinkEmail}
                    disabled={linkingEmail || !emailLinkData.email || !emailLinkData.password}
                    className="w-full"
                  >
                    {linkingEmail ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Merging Accounts...
                      </>
                    ) : (
                      <>
                        <Link className="h-4 w-4 mr-2" />
                        Merge with Email Account
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : settings.walletAddress ? (
              // Email user with wallet linked
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <Link className="h-4 w-4" />
                    <span className="font-medium">Wallet Linked</span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Address: {settings.walletAddress}
                  </p>
                  {settings.walletLinkedAt && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Linked on: {new Date(settings.walletLinkedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Benefits:</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Login with either email/password OR wallet signature</li>
                    <li>• Enhanced security with cryptographic authentication</li>
                    <li>• Single account for both authentication methods</li>
                  </ul>
                </div>
                <Button
                  onClick={handleUnlinkWallet}
                  disabled={unlinkingWallet || settings.authMethod === 'wallet'}
                  variant="outline"
                  className="w-full"
                >
                  {unlinkingWallet ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Unlinking...
                    </>
                  ) : (
                    <>
                      <Unlink className="h-4 w-4 mr-2" />
                      Unlink Wallet
                    </>
                  )}
                </Button>
                {settings.authMethod === 'wallet' && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Cannot unlink from wallet-only account
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                    <Wallet className="h-4 w-4" />
                    <span className="font-medium">No Wallet Linked</span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Link a Stacks wallet to enable dual authentication methods
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Why link your wallet?</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Login flexibility: Use email/password OR wallet</li>
                    <li>• Enhanced security with blockchain authentication</li>
                    <li>• Future features and wallet-specific functionality</li>
                    <li>• Maintain single account with multiple login options</li>
                  </ul>
                </div>
                <Button
                  onClick={handleLinkWallet}
                  disabled={linkingWallet}
                  className="w-full"
                >
                  {linkingWallet ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Link className="h-4 w-4 mr-2" />
                      Link Wallet
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scheduler Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Scheduler Status
            </CardTitle>
            <CardDescription>
              Current automatic update schedule and recent activity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`p-4 border rounded-lg ${
              settings.autoUpdate 
                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
                : 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
            }`}>
              <div className={`flex items-center gap-2 ${
                settings.autoUpdate 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-yellow-800 dark:text-yellow-200'
              }`}>
                <Activity className="h-4 w-4" />
                <span className="font-medium">
                  {settings.autoUpdate ? 'Scheduler Active' : 'Scheduler Inactive'}
                </span>
              </div>
              <p className={`text-sm mt-1 ${
                settings.autoUpdate 
                  ? 'text-green-700 dark:text-green-300' 
                  : 'text-yellow-700 dark:text-yellow-300'
              }`}>
                {settings.autoUpdate ? (
                  schedulerStatus?.nextUpdateTime ? 
                    `Next update: ${new Date(schedulerStatus.nextUpdateTime).toLocaleString()}` :
                    `Updates scheduled ${settings.updateFrequency.replace('-', ' ')}`
                ) : (
                  'Enable auto-updates to schedule automatic balance and transaction syncing'
                )}
              </p>
            </div>
            
            {schedulerStatus?.recentActivity && schedulerStatus.recentActivity.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Recent Activity:</h4>
                <div className="space-y-2">
                  {schedulerStatus.recentActivity.slice(0, 3).map((activity: any, index: number) => {
                    const date = new Date(activity.timestamp);
                    const isValidDate = !isNaN(date.getTime());
                    
                    return (
                      <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                        <span className="text-muted-foreground">
                          {activity.updateType === 'scheduled' ? '⏰ Scheduled' : 
                           activity.updateType === 'manual' ? '👤 Manual' :
                           activity.updateType === 'monthly' ? '📅 Monthly' : '🔄'} update
                        </span>
                        <span className="font-medium">
                          {isValidDate ? date.toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            
            {(!schedulerStatus?.recentActivity || schedulerStatus.recentActivity.length === 0) && (
              <div className="text-sm text-muted-foreground text-center py-4">
                No recent activity. Enable auto-updates or trigger a manual update to see activity here.
              </div>
            )}
            
            <div className="space-y-2">
              <h4 className="font-medium">What happens during updates:</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Fetch latest balances for all your wallets</li>
                <li>• Sync new transaction histories (up to 500 recent transactions)</li>
                <li>• Update analytics and charts</li>
                <li>• Send email notification (if enabled)</li>
                <li>• Create balance history records</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Manual Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Manual Actions
            </CardTitle>
            <CardDescription>
              Trigger updates and reports manually
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={triggerManualUpdate}
              disabled={triggeringUpdate}
              className="w-full"
              variant="outline"
            >
              {triggeringUpdate ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Trigger Balance Update
                </>
              )}
            </Button>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Manually trigger a balance update and email notification for all your wallets.
              This will also update your analytics data.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
      </div>
    </DashboardLayout>
  );
}