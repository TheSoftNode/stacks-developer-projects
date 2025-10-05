"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Droplet,
  BarChart3,
  History,
  Settings,
  ChevronLeft,
  Wallet,
  TrendingUp,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const sidebarLinks = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Swap",
    href: "/dashboard/swap",
    icon: ArrowLeftRight,
  },
  {
    title: "Pools",
    href: "/dashboard/pools",
    icon: Droplet,
  },
  {
    title: "Liquidity",
    href: "/dashboard/liquidity",
    icon: TrendingUp,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Portfolio",
    href: "/dashboard/portfolio",
    icon: Wallet,
  },
  {
    title: "History",
    href: "/dashboard/history",
    icon: History,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "relative flex flex-col border-r border-slate-800/50 bg-slate-950 transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Collapse Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-6 z-50 h-6 w-6 rounded-full border border-slate-700 bg-slate-900 shadow-md hover:bg-slate-800 text-slate-400 hover:text-teal-400"
        onClick={() => setCollapsed(!collapsed)}
      >
        <ChevronLeft
          className={cn(
            "h-4 w-4 transition-transform",
            collapsed && "rotate-180"
          )}
        />
      </Button>

      {/* Logo */}
      <div className="flex h-20 items-center border-b border-slate-800/50 px-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30 group-hover:shadow-orange-500/50 transition-all duration-300">
            <Layers className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-white">Stacks</span>
              <span className="text-xl font-bold text-teal-400">AMM</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 p-3">
        {sidebarLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-teal-400 border border-transparent",
                collapsed && "justify-center"
              )}
              title={collapsed ? link.title : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{link.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-slate-800/50 p-4">
          <div className="rounded-xl bg-gradient-to-br from-teal-500/10 to-orange-500/10 border border-teal-500/20 p-4">
            <p className="text-xs font-semibold text-white">Need Help?</p>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Check our documentation for guides and tutorials.
            </p>
            <Button variant="outline" size="sm" className="mt-3 w-full border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-teal-500/30 text-slate-300 hover:text-teal-400" asChild>
              <Link href="/docs">View Docs</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
