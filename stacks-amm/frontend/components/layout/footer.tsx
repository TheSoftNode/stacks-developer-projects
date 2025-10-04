"use client";

import Link from "next/link";
import { Github, Twitter, MessageCircle, Layers } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: "Swap", href: "/dashboard/swap" },
      { label: "Pools", href: "/dashboard/pools" },
      { label: "Analytics", href: "/dashboard/analytics" },
      { label: "Documentation", href: "#docs" },
    ],
    community: [
      { label: "Discord", href: "#discord" },
      { label: "Twitter", href: "#twitter" },
      { label: "GitHub", href: "#github" },
      { label: "Blog", href: "#blog" },
    ],
    developers: [
      { label: "API Docs", href: "#api-docs" },
      { label: "Smart Contracts", href: "#contracts" },
      { label: "GitHub", href: "#dev-github" },
      { label: "Bug Bounty", href: "#bug-bounty" },
    ],
  };

  return (
    <footer className="border-t border-slate-800/50 bg-slate-950">
      <div className="container mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4 lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30 group-hover:shadow-orange-500/50 transition-all duration-300">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-white">Stacks</span>
                <span className="text-xl font-bold text-teal-400">AMM</span>
              </div>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              The leading decentralized exchange on Stacks blockchain. Trade, earn, and build on Bitcoin DeFi.
            </p>
            <div className="flex gap-4 pt-2">
              <a
                href="#twitter"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 text-slate-400 hover:text-teal-400 hover:border-teal-500/30 hover:bg-teal-500/10 transition-all duration-300"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#github-main"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 text-slate-400 hover:text-teal-400 hover:border-teal-500/30 hover:bg-teal-500/10 transition-all duration-300"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="#discord-main"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 text-slate-400 hover:text-teal-400 hover:border-teal-500/30 hover:bg-teal-500/10 transition-all duration-300"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="mb-5 text-sm font-semibold text-white uppercase tracking-wider">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-teal-400 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community Links */}
          <div>
            <h3 className="mb-5 text-sm font-semibold text-white uppercase tracking-wider">Community</h3>
            <ul className="space-y-3">
              {footerLinks.community.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-teal-400 transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Developers Links */}
          <div>
            <h3 className="mb-5 text-sm font-semibold text-white uppercase tracking-wider">Developers</h3>
            <ul className="space-y-3">
              {footerLinks.developers.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-teal-400 transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 border-t border-slate-800/50 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-slate-500">
              © {currentYear} Stacks AMM. All rights reserved.
            </p>
            <div className="flex gap-8">
              <Link href="#privacy" className="text-sm text-slate-500 hover:text-teal-400 transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link href="#terms" className="text-sm text-slate-500 hover:text-teal-400 transition-colors duration-200">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
