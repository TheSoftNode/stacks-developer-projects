"use client";

import { useStacks } from "@/hooks/use-stacks";
import { abbreviateAddress } from "@/lib/stx-utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut, User, Settings, Home } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function DashboardNavbar() {
  const { userData, disconnectWallet } = useStacks();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/50 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">Dashboard</h2>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {userData && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 border-slate-700 bg-slate-900/50 hover:bg-slate-800 hover:border-orange-500/30 text-slate-300">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                      {userData.profile.stxAddress.testnet.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">
                    {abbreviateAddress(userData.profile.stxAddress.testnet)}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800">
                <DropdownMenuLabel className="text-slate-300">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuItem asChild className="text-slate-400 hover:text-teal-400 hover:bg-slate-800 cursor-pointer">
                  <Link href="/dashboard/portfolio">
                    <User className="mr-2 h-4 w-4" />
                    Portfolio
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="text-slate-400 hover:text-teal-400 hover:bg-slate-800 cursor-pointer">
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuItem asChild className="text-slate-400 hover:text-teal-400 hover:bg-slate-800 cursor-pointer">
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Back to Home
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuItem onClick={disconnectWallet} className="text-red-400 hover:text-red-300 hover:bg-slate-800 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Disconnect Wallet
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
