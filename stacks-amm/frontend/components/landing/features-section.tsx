"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Shield, Coins, Code, Wallet, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Zap,
    title: "Instant Swaps",
    description: "Execute token swaps with minimal slippage using our constant product market maker algorithm.",
    color: "orange",
  },
  {
    icon: Shield,
    title: "Non-Custodial",
    description: "Your keys, your crypto. All transactions are executed on-chain with full transparency and security.",
    color: "blue",
  },
  {
    icon: Coins,
    title: "Liquidity Provision",
    description: "Earn trading fees by providing liquidity to pools. Add or remove liquidity anytime without lock-ups.",
    color: "teal",
  },
  {
    icon: Code,
    title: "Smart Contract Verified",
    description: "Audited Clarity smart contracts deployed on Stacks testnet. Open source and battle-tested.",
    color: "emerald",
  },
  {
    icon: Wallet,
    title: "Multi-Wallet Support",
    description: "Connect with Leather, Xverse, or any Stacks-compatible wallet. Seamless integration guaranteed.",
    color: "orange",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Track pool performance, liquidity positions, and swap history with comprehensive dashboard tools.",
    color: "blue",
  },
];

const colorClasses = {
  orange: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  teal: "text-teal-400 bg-teal-400/10 border-teal-400/20",
  emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
};

export function FeaturesSection() {
  return (
    <section className="relative py-24 w-full bg-slate-900 overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/20 via-slate-900 to-slate-900"></div>
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>

      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="inline-block rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-sm font-medium text-teal-400 mb-6"
          >
            Features
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-6"
          >
            Built for <span className="text-teal-400">DeFi Traders</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-lg text-slate-400 leading-relaxed"
          >
            Enterprise-grade features wrapped in an intuitive interface.
            Everything you need to trade and earn on Stacks.
          </motion.p>
        </div>

        <div className="mx-auto mt-16 grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const colorClass = colorClasses[feature.color as keyof typeof colorClasses];

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border border-slate-800 hover:border-slate-700 bg-slate-950/50 backdrop-blur-sm transition-all duration-300 group hover:shadow-xl hover:shadow-orange-500/10">
                  <CardHeader className="pb-4">
                    <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border ${colorClass} transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <CardTitle className="text-xl text-white group-hover:text-teal-400 transition-colors duration-300">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base text-slate-400 leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
