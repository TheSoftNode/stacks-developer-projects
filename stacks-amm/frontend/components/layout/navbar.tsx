"use client";

import { useStacks } from "@/hooks/use-stacks";
import { abbreviateAddress } from "@/lib/stx-utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Wallet, LogOut, Menu, X, Layers, LayoutDashboard, History, TrendingUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";

export function Navbar() {
  const { userData, connectWallet, disconnectWallet } = useStacks();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/#features", label: "Features" },
    { href: "/#about", label: "About" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30 group-hover:shadow-orange-500/50 transition-all duration-300">
              <Layers className="h-6 w-6 text-white" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">Stacks</span>
              <span className="text-2xl font-bold text-teal-400">AMM</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/" className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200">
              Home
            </Link>
            <Link href="/#features" className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200">
              Features
            </Link>
            <Link href="/dashboard" className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200">
              Pools
            </Link>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {userData ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 bg-slate-900 border-slate-700 hover:bg-slate-800 hover:border-slate-600 text-slate-300 hover:text-white"
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-xs bg-gradient-to-br from-orange-500 to-orange-600 text-white font-semibold">
                        {userData.profile.stxAddress.testnet.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm">
                      {abbreviateAddress(userData.profile.stxAddress.testnet)}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-slate-900 border-slate-800">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-xs text-slate-400">Connected Wallet</p>
                      <p className="text-sm font-semibold text-white">
                        {abbreviateAddress(userData.profile.stxAddress.testnet)}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-800" />
                  <DropdownMenuItem asChild className="cursor-pointer text-slate-300 focus:text-white focus:bg-slate-800">
                    <Link href="/dashboard" className="flex items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4 text-teal-400" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer text-slate-300 focus:text-white focus:bg-slate-800">
                    <Link href="/dashboard/portfolio" className="flex items-center">
                      <TrendingUp className="mr-2 h-4 w-4 text-emerald-400" />
                      <span>Portfolio</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer text-slate-300 focus:text-white focus:bg-slate-800">
                    <Link href="/dashboard/history" className="flex items-center">
                      <History className="mr-2 h-4 w-4 text-blue-400" />
                      <span>Transaction History</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-800" />
                  <DropdownMenuItem
                    onClick={disconnectWallet}
                    className="text-red-400 cursor-pointer focus:text-red-300 focus:bg-red-950/30"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={connectWallet}
                className="gap-2 bg-orange-600 hover:bg-orange-700 text-white border-0 shadow-lg shadow-orange-600/30 hover:shadow-orange-600/50 transition-all duration-300 px-6 h-11 rounded-lg font-medium"
              >
                Get started
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
