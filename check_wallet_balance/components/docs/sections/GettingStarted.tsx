"use client";

import { DocsSection, SubSection, InfoCard } from "../DocsSection";
import { CodeBlock } from "../CodeBlock";
import { Button } from "@/components/ui/button";
import { ExternalLink, Search, UserPlus, BarChart3 } from "lucide-react";

export function GettingStarted() {
  return (
    <DocsSection 
      title="Getting Started" 
      description="Learn how to use Wallet Monitor to track and analyze Stacks wallets"
    >
      <SubSection title="What is Wallet Monitor?">
        <p>
          Wallet Monitor is a professional tool for tracking and analyzing Stacks (STX) wallet balances. 
          It provides real-time balance monitoring, transaction history analysis, and automated notifications 
          for wallet activity.
        </p>
        
        <InfoCard title="Key Features" variant="info">
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <Search className="h-4 w-4 text-brand-teal" />
              <span>Public wallet explorer - no signup required</span>
            </li>
            <li className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-brand-teal" />
              <span>Account-based wallet tracking with notifications</span>
            </li>
            <li className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-brand-teal" />
              <span>Advanced analytics and transaction insights</span>
            </li>
          </ul>
        </InfoCard>
      </SubSection>

      <SubSection title="Quick Start Guide">
        <div className="grid gap-6 md:grid-cols-3">
          <InfoCard title="1. Try the Explorer">
            <p className="text-sm mb-3">
              Start by exploring any Stacks wallet without creating an account.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => window.location.href = '/wallet-checker'}
            >
              <Search className="mr-2 h-4 w-4" />
              Open Wallet Explorer
            </Button>
          </InfoCard>

          <InfoCard title="2. Create Account">
            <p className="text-sm mb-3">
              Sign up to track multiple wallets and receive notifications.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => window.location.href = '/?auth=signup'}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Sign Up Free
            </Button>
          </InfoCard>

          <InfoCard title="3. Add Wallets">
            <p className="text-sm mb-3">
              Connect your wallets and configure automated tracking.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => window.location.href = '/dashboard/wallets'}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
          </InfoCard>
        </div>
      </SubSection>

      <SubSection title="Supported Address Formats">
        <p>
          Wallet Monitor supports standard Stacks wallet addresses in the following formats:
        </p>

        <CodeBlock
          title="Valid Stacks Address Examples"
          code={`# Mainnet addresses (SP prefix)
SP1ABC123DEFG456HIJKLMNOPQRSTUVWXYZ789ABC123

# Testnet addresses (SM prefix)  
SM1XYZ789ABCD012EFGHIJKLMNOPQRSTUVWXYZ456DEF

# Both formats are 41 characters long (including prefix)`}
          language="text"
        />

        <InfoCard title="Address Validation" variant="warning">
          <p>
            Make sure your address starts with <code className="bg-muted px-1 py-0.5 rounded">SP</code> (mainnet) 
            or <code className="bg-muted px-1 py-0.5 rounded">SM</code> (testnet) and is exactly 41 characters long. 
            Invalid addresses will be rejected by the system.
          </p>
        </InfoCard>
      </SubSection>

      <SubSection title="Account vs Public Access">
        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard title="Public Wallet Explorer">
            <ul className="text-sm space-y-1">
              <li>✅ Free to use</li>
              <li>✅ No registration required</li>
              <li>✅ Real-time balance data</li>
              <li>✅ Transaction history</li>
              <li>❌ No wallet saving</li>
              <li>❌ No notifications</li>
              <li>❌ No analytics</li>
            </ul>
          </InfoCard>

          <InfoCard title="User Account">
            <ul className="text-sm space-y-1">
              <li>✅ All public features</li>
              <li>✅ Save multiple wallets</li>
              <li>✅ Email notifications</li>
              <li>✅ Advanced analytics</li>
              <li>✅ Historical tracking</li>
              <li>✅ Automated updates</li>
              <li>✅ Data export</li>
            </ul>
          </InfoCard>
        </div>
      </SubSection>

      <SubSection title="Next Steps">
        <p>
          Ready to explore? Here are some suggested next steps:
        </p>
        
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/wallet-checker'}
          >
            Try Wallet Explorer
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              const section = document.querySelector('[data-section="wallet-explorer"]');
              section?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Learn About Explorer
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              const section = document.querySelector('[data-section="api-reference"]');
              section?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            View API Docs
          </Button>
        </div>
      </SubSection>
    </DocsSection>
  );
}