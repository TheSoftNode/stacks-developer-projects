"use client";

import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, Menu, X, Settings, LogOut, Home, Copy, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

interface User {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  authMethod?: string;
  walletAddress?: string;
  walletType?: string;
}

interface HeaderProps {
  onAuthClick: (type: 'login' | 'signup') => void;
}

export interface HeaderRef {
  refreshAuthStatus: () => void;
}

export const Header = forwardRef<HeaderRef, HeaderProps>(({ onAuthClick }, ref) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const { theme, setTheme } = useTheme();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Format wallet address for display (first 6 + last 4 characters)
  const formatWalletAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Copy wallet address to clipboard with animation
  const copyWalletAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Expose refresh function to parent
  useImperativeHandle(ref, () => ({
    refreshAuthStatus: checkAuthStatus,
  }));

  const checkAuthStatus = async () => {
    try {
      // Use fetch with credentials to include HTTP-only cookies
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // This ensures cookies are sent
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else if (response.status === 401) {
        // Not authenticated or token expired
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              💰
            </div>
            <span className="font-semibold text-foreground">Wallet Monitor</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/wallet-checker"
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              Wallet Explorer
            </Link>
            <Link
              href="/docs"
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              Documentation
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            
            {!isLoading && (
              user ? (
                /* User is logged in - show avatar dropdown */
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-pink-500 text-white">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        {user.authMethod === 'wallet' && user.walletAddress ? (
                          <div className="flex items-center space-x-2 text-xs leading-none text-muted-foreground">
                            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                              {formatWalletAddress(user.walletAddress)}
                            </code>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                copyWalletAddress(user.walletAddress!);
                              }}
                              className="p-1 hover:bg-muted rounded transition-colors"
                              title="Copy wallet address"
                            >
                              <motion.div
                                initial={false}
                                animate={copiedAddress ? { scale: 1.1 } : { scale: 1 }}
                                transition={{ duration: 0.2 }}
                              >
                                {copiedAddress ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </motion.div>
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">
                        <Home className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                /* User is not logged in - show auth buttons */
                <>
                  <Button
                    variant="ghost"
                    onClick={() => onAuthClick('login')}
                    className="text-sm font-medium"
                  >
                    Log in
                  </Button>
                  
                  <Button
                    onClick={() => onAuthClick('signup')}
                    className="bg-pink-500 hover:bg-pink-500/90 text-white text-sm font-medium"
                  >
                    Get Started
                  </Button>
                </>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMenu}
            className="md:hidden h-9 w-9"
          >
            {isMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
                onClick={() => setIsMenuOpen(false)}
              />
              
              {/* Menu */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="md:hidden fixed top-16 left-0 right-0 bg-background/95 backdrop-blur border-b border-border shadow-lg z-40"
              >
                <nav className="container mx-auto px-4 py-6 flex flex-col space-y-4">
                <Link
                  href="/wallet-checker"
                  className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Wallet Explorer
                </Link>
                <Link
                  href="/docs"
                  className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Documentation
                </Link>
                
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="h-9 w-9"
                  >
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  </Button>
                  
                  {!isLoading && (
                    user ? (
                      /* User is logged in - show user info and links */
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-pink-500 text-white text-xs">
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              window.location.href = '/dashboard';
                              setIsMenuOpen(false);
                            }}
                            className="text-xs"
                          >
                            Dashboard
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              handleLogout();
                              setIsMenuOpen(false);
                            }}
                            className="text-xs"
                          >
                            Logout
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* User is not logged in - show auth buttons */
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            onAuthClick('login');
                            setIsMenuOpen(false);
                          }}
                          className="text-sm"
                        >
                          Log in
                        </Button>
                        <Button
                          onClick={() => {
                            onAuthClick('signup');
                            setIsMenuOpen(false);
                          }}
                          className="bg-pink-500 hover:bg-pink-500/90 text-white text-sm"
                        >
                          Sign up
                        </Button>
                      </div>
                    )
                  )}
                </div>
              </nav>
            </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
});

Header.displayName = 'Header';