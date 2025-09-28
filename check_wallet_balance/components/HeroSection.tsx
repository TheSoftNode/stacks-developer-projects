"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  Shield, 
  TrendingUp, 
  Bell, 
  Lock, 
  BarChart3, 
  Smartphone,
  CheckCircle,
  ArrowRight
} from "lucide-react";

interface HeroSectionProps {
  onGetStarted: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <section className="relative py-14 lg:py-20 overflow-hidden bg-background">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-foreground/5 bg-grid-16 [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]" />
      
      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge 
              variant="outline" 
              className="mb-6 border-pink-500/20 text-pink-500 hover:bg-pink-500/10"
            >
              <Shield className="w-3 h-3 mr-1" />
              Bank-level Security
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl lg:text-6xl font-bold mb-6 text-foreground"
          >
            Professional Crypto
            <br />
            <span className="text-pink-500">Portfolio Manager</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Securely manage and monitor your Stacks (STX) wallet balances with 
            advanced analytics, automated tracking, and encrypted data protection.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Button
              onClick={onGetStarted}
              size="lg"
              className="bg-brand-pink hover:bg-brand-pink/90 text-white font-semibold px-8 py-3 text-lg group"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white px-8 py-3 text-lg"
              onClick={() => window.location.href = '/wallet-checker'}
            >
              Try Wallet Explorer
            </Button>
          </motion.div>

          {/* Quick Access Hint */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-12"
          >
            <div className="bg-gradient-to-r from-brand-teal/10 to-brand-pink/10 border border-brand-teal/20 rounded-lg p-4 max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-sm text-center sm:text-left">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-brand-teal flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Don't want to sign up?
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-wrap justify-center sm:justify-start">
                  <span className="text-muted-foreground">Try our</span>
                  <button
                    onClick={() => window.location.href = '/wallet-checker'}
                    className="text-brand-teal font-medium hover:underline transition-colors whitespace-nowrap"
                  >
                    public wallet explorer
                  </button>
                  <span className="text-muted-foreground">
                    to check any Stacks address instantly.
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto"
          >
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-brand-teal" />
              <span>End-to-End Encryption</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-brand-teal" />
              <span>Automated Updates</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-brand-teal" />
              <span>Real-time Analytics</span>
            </div>
          </motion.div>
        </div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-20 max-w-6xl mx-auto"
        >
          <FeatureCard
            icon={<Lock className="h-6 w-6" />}
            title="Military-Grade Security"
            description="Your wallet data is encrypted with AES-256 encryption. Even admins can't access your information."
            gradient="from-brand-pink/20 to-brand-pink/5"
          />
          
          <FeatureCard
            icon={<BarChart3 className="h-6 w-6" />}
            title="Advanced Analytics"
            description="Beautiful charts and insights to track your portfolio performance over time."
            gradient="from-brand-teal/20 to-brand-teal/5"
          />
          
          <FeatureCard
            icon={<Bell className="h-6 w-6" />}
            title="Smart Notifications"
            description="Get email alerts for balance changes on your schedule - every 5 days plus monthly updates."
            gradient="from-brand-slate/20 to-brand-slate/5"
          />
        </motion.div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}

function FeatureCard({ icon, title, description, gradient }: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="group"
    >
      <div className={`bg-gradient-to-br ${gradient} backdrop-blur-sm border border-border/50 rounded-xl p-6 h-full`}>
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-background/80 rounded-lg">
            {icon}
          </div>
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}