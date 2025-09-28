"use client";

import { DocsSection, SubSection, InfoCard } from "../DocsSection";
import { CodeBlock } from "../CodeBlock";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, CheckCircle, AlertCircle, Clock } from "lucide-react";

export function FAQ() {
  return (
    <DocsSection 
      title="Frequently Asked Questions" 
      description="Common questions and answers about Wallet Monitor"
      badge="Help"
    >
      <SubSection title="General Questions">
        <div className="space-y-6">
          <InfoCard title="What is Wallet Monitor?">
            <p className="text-sm">
              Wallet Monitor is a tool for tracking and analyzing Stacks (STX) wallet balances. 
              It provides both a public wallet explorer and private account features for monitoring 
              multiple wallets with notifications.
            </p>
          </InfoCard>

          <InfoCard title="Is it free to use?">
            <p className="text-sm">
              Yes! The public wallet explorer is completely free and requires no registration. 
              Creating an account for advanced features is also free, though we may introduce 
              premium features in the future.
            </p>
          </InfoCard>

          <InfoCard title="Do I need to connect my wallet?">
            <p className="text-sm">
              No wallet connection required. You only need to provide wallet addresses to monitor. 
              We never ask for private keys, seed phrases, or wallet passwords. This is a read-only 
              monitoring service.
            </p>
          </InfoCard>
        </div>
      </SubSection>

      <SubSection title="Wallet Explorer">
        <div className="space-y-6">
          <InfoCard title="Which wallet addresses are supported?" variant="info">
            <div className="space-y-2">
              <p className="text-sm">
                We support all standard Stacks wallet addresses:
              </p>
              <ul className="text-sm space-y-1">
                <li>• <strong>Mainnet:</strong> Addresses starting with "SP" (41 characters total)</li>
                <li>• <strong>Testnet:</strong> Addresses starting with "SM" (41 characters total)</li>
              </ul>
            </div>
          </InfoCard>

          <InfoCard title="How accurate is the balance data?">
            <p className="text-sm">
              Balance data is fetched directly from the Stacks blockchain via the Hiro API. 
              Data is real-time and accurate as of the last confirmed block. Public API responses 
              are cached for 30 seconds to improve performance.
            </p>
          </InfoCard>

          <InfoCard title="Why can't I see all transactions at once?">
            <p className="text-sm">
              Transaction history is paginated (20 per page) to ensure fast loading times. 
              For wallets with thousands of transactions, loading all at once would be slow. 
              Use the navigation controls to browse through transaction history.
            </p>
          </InfoCard>

          <InfoCard title="Can I bookmark or share wallet analyses?">
            <p className="text-sm">
              Yes! Wallet addresses are automatically added to the URL, making it easy to bookmark 
              or share specific wallet analyses. The URL format is: 
              <code className="bg-muted px-1 py-0.5 rounded mx-1">/wallet-checker?address=SP...</code>
            </p>
          </InfoCard>
        </div>
      </SubSection>

      <SubSection title="User Accounts">
        <div className="space-y-6">
          <InfoCard title="What are the benefits of creating an account?" variant="success">
            <ul className="text-sm space-y-1">
              <li>• Track multiple wallets from one dashboard</li>
              <li>• Automated balance update emails</li>
              <li>• Historical data tracking</li>
              <li>• Advanced analytics and insights</li>
              <li>• Customizable update schedules</li>
              <li>• Data export capabilities</li>
            </ul>
          </InfoCard>

          <InfoCard title="How are my wallet addresses protected?">
            <p className="text-sm">
              All wallet addresses in user accounts are encrypted using AES-256 encryption before 
              being stored in our database. Only your account can decrypt and access your wallet list. 
              We never store private keys or any transaction-signing capabilities.
            </p>
          </InfoCard>

          <InfoCard title="How often are wallet balances updated?">
            <p className="text-sm">
              You can configure update schedules when adding wallets: daily, every 3 days, 
              every 5 days, weekly, bi-weekly, or monthly. Automated emails will be sent on 
              your chosen schedule with balance updates and transaction summaries.
            </p>
          </InfoCard>

          <InfoCard title="Can I export my wallet data?">
            <p className="text-sm">
              Yes, account holders can export their tracked wallet data in various formats. 
              This includes historical balance data, transaction summaries, and analytics reports.
            </p>
          </InfoCard>
        </div>
      </SubSection>

      <SubSection title="Technical Questions">
        <div className="space-y-6">
          <InfoCard title="What blockchain network do you support?">
            <p className="text-sm">
              We currently support the Stacks blockchain (STX) exclusively. Both mainnet and 
              testnet addresses are supported. We may add support for other networks in the future.
            </p>
          </InfoCard>

          <InfoCard title="Do you have an API for developers?">
            <p className="text-sm">
              Yes! We provide a public REST API for accessing wallet balance and transaction data. 
              Check the API Reference section for detailed documentation, endpoints, and examples.
            </p>
          </InfoCard>

          <InfoCard title="Are there rate limits on the API?">
            <p className="text-sm">
              Currently, there are no strict rate limits, but we operate under a fair use policy. 
              API responses are cached for 30 seconds to improve performance. If you need high-volume 
              access, please contact us to discuss options.
            </p>
          </InfoCard>

          <InfoCard title="What happens if the Stacks network is down?">
            <p className="text-sm">
              If the Stacks blockchain or Hiro API is unavailable, wallet data cannot be fetched. 
              You'll see an error message indicating the service is temporarily unavailable. 
              We don't store blockchain data ourselves - all data is fetched in real-time.
            </p>
          </InfoCard>
        </div>
      </SubSection>

      <SubSection title="Troubleshooting">
        <div className="space-y-6">
          <InfoCard title="Why is my wallet address being rejected?" variant="warning">
            <div className="space-y-2">
              <p className="text-sm">Common reasons for address validation errors:</p>
              <ul className="text-sm space-y-1">
                <li>• Address doesn't start with "SP" (mainnet) or "SM" (testnet)</li>
                <li>• Address is not exactly 41 characters long</li>
                <li>• Contains invalid characters (only alphanumeric allowed)</li>
                <li>• Copy/paste errors or extra spaces</li>
              </ul>
            </div>
          </InfoCard>

          <InfoCard title="Why is wallet data loading slowly?">
            <p className="text-sm">
              Large wallets with many transactions may take longer to load. The Stacks blockchain 
              API may also experience high traffic. Try refreshing after a few seconds, or check 
              if the blockchain network is experiencing issues.
            </p>
          </InfoCard>

          <InfoCard title="I'm not receiving email notifications">
            <div className="space-y-2">
              <p className="text-sm">Check the following:</p>
              <ul className="text-sm space-y-1">
                <li>• Verify your email address is correct in account settings</li>
                <li>• Check spam/junk folders</li>
                <li>• Ensure update schedules are configured for your wallets</li>
                <li>• Contact support if issues persist</li>
              </ul>
            </div>
          </InfoCard>

          <InfoCard title="Can I delete my account and data?">
            <p className="text-sm">
              Yes, you can delete your account at any time from the account settings page. 
              This will permanently remove all your data, including tracked wallets and historical 
              information. This action cannot be undone.
            </p>
          </InfoCard>
        </div>
      </SubSection>

      <SubSection title="Contact & Support">
        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard title="Need More Help?" variant="info">
            <p className="text-sm mb-3">
              Can't find the answer you're looking for? We're here to help!
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                <span>Check our technical documentation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Try the public wallet explorer</span>
              </div>
            </div>
          </InfoCard>

          <InfoCard title="Report Issues">
            <p className="text-sm">
              Found a bug or have a feature request? Please contact our support team 
              with detailed information about the issue you're experiencing.
            </p>
          </InfoCard>
        </div>
      </SubSection>
    </DocsSection>
  );
}