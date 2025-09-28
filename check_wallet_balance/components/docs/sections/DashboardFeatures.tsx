"use client";

import { DocsSection, SubSection, InfoCard } from "../DocsSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function DashboardFeatures() {
  return (
    <DocsSection 
      title="Dashboard Features" 
      description="Advanced features available for registered users"
      badge="Account Required"
    >
      <SubSection title="Overview">
        <p>
          Creating an account unlocks powerful features for tracking multiple wallets, 
          receiving notifications, and accessing advanced analytics.
        </p>
        
        <InfoCard title="Account Benefits" variant="success">
          <ul className="text-sm space-y-1">
            <li>✅ Track unlimited wallets</li>
            <li>✅ Automated balance updates</li>
            <li>✅ Email notifications</li>
            <li>✅ Historical data tracking</li>
            <li>✅ Advanced analytics</li>
            <li>✅ Data export options</li>
          </ul>
        </InfoCard>
      </SubSection>

      <SubSection title="Wallet Management">
        <p>Add and manage multiple Stacks wallets from your dashboard.</p>
        
        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard title="Adding Wallets">
            <p className="text-sm">
              Securely add wallet addresses to track. All addresses are encrypted 
              before storage and can only be decrypted by your account.
            </p>
          </InfoCard>

          <InfoCard title="Update Schedules">
            <p className="text-sm">
              Configure how often your wallets are checked for updates:
              daily, every 3/5 days, weekly, bi-weekly, or monthly.
            </p>
          </InfoCard>
        </div>
      </SubSection>

      <SubSection title="Notifications">
        <p>Stay informed about your wallet activity with automated email notifications.</p>
        
        <InfoCard title="Email Alerts" variant="info">
          <p className="text-sm">
            Receive detailed balance update emails on your chosen schedule, 
            including transaction summaries and balance changes.
          </p>
        </InfoCard>
      </SubSection>

      <SubSection title="Get Started">
        <Button 
          onClick={() => window.location.href = '/?auth=signup'}
          className="bg-brand-pink hover:bg-brand-pink/90"
        >
          Create Free Account
        </Button>
      </SubSection>
    </DocsSection>
  );
}