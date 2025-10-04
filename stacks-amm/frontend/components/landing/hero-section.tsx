"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Shield, Zap, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

// Dynamically import 3D component to avoid SSR issues
const TokenCanvas = dynamic(
  () => import("@/components/3d/token-canvas").then((mod) => mod.TokenCanvas),
  { ssr: false }
);

export function HeroSection() {
  return (
    <section className="relative overflow-hidden w-full bg-slate-950 h-screen flex items-center">
      {/* Background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          {/* Left Section - Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="space-y-6"
          >
            {/* Main Heading - Smaller */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-white">
              Advanced <span className="text-teal-400">Automated Market Maker</span> on Stacks
            </h1>

            <p className="text-base text-slate-400 max-w-xl leading-relaxed">
              Swap SIP-010 tokens instantly with minimal slippage. Provide liquidity to earn trading fees. Built on Bitcoin security with Clarity smart contracts.
            </p>

            {/* CTA Buttons */}
            <div className="flex items-center gap-4 pt-2">
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="gap-2 h-11 px-6 bg-orange-600 hover:bg-orange-700 text-white border-0 shadow-lg shadow-orange-600/30 hover:shadow-orange-600/50 transition-all duration-300 text-sm font-semibold"
                >
                  Launch App
                </Button>
              </Link>
              <Link href="#features">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-11 px-6 border-2 border-slate-700 hover:border-teal-500 hover:bg-slate-900 text-slate-300 hover:text-white text-sm font-semibold"
                >
                  Learn more
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Right Section - 3D Animation */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative h-[350px] lg:h-[400px] hidden lg:flex items-center justify-center"
          >
            {/* 3D Canvas Container */}
            <div className="relative h-full w-full rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-xl">
              <TokenCanvas />

              {/* Compact overlay */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-sm border border-slate-800">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-medium text-slate-300">Live AMM</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
