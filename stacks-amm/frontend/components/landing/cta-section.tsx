"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap, Lock, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export function CTASection() {
  return (
    <section className="relative py-24 w-full bg-slate-950 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-900/20 via-slate-950 to-slate-950"></div>
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>

      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl border-2 border-orange-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 px-8 py-20 text-center shadow-2xl shadow-orange-500/20 sm:px-16"
        >
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]"></div>

          {/* Glowing orbs */}
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl"></div>

          <div className="mx-auto max-w-3xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-2 text-sm font-medium text-teal-400 mb-6"
            >
              <Zap className="h-4 w-4" />
              <span>Ready to Trade</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight"
            >
              Start Trading on the
              <br />
              <span className="bg-gradient-to-r from-orange-500 via-teal-400 to-orange-500 bg-clip-text text-transparent">
                Most Secure DEX
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400"
            >
              Join the future of decentralized finance on Bitcoin. Connect your wallet and start trading with institutional-grade smart contracts.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              viewport={{ once: true }}
              className="mt-10 flex items-center justify-center gap-4 flex-wrap"
            >
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="gap-2 h-12 px-8 bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300"
                >
                  Launch App Now
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 gap-2 border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-white hover:border-slate-600 transition-all duration-300"
              >
                <Shield className="h-4 w-4" />
                View Documentation
              </Button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              viewport={{ once: true }}
              className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8"
            >
              <div className="flex flex-col items-center group">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Lock className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="text-3xl font-bold text-white">100%</div>
                <div className="mt-1 text-sm text-slate-400">Open Source</div>
              </div>

              <div className="flex flex-col items-center group">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-3 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-6 w-6 text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-white">0%</div>
                <div className="mt-1 text-sm text-slate-400">Platform Fees</div>
              </div>

              <div className="flex flex-col items-center group">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-6 w-6 text-orange-400" />
                </div>
                <div className="text-3xl font-bold text-white">24/7</div>
                <div className="mt-1 text-sm text-slate-400">Available</div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
