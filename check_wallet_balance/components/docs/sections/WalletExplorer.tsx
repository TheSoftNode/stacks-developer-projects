"use client";

import { DocsSection, SubSection, InfoCard } from "../DocsSection";
import { CodeBlock } from "../CodeBlock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Copy, Share2, Filter, ChevronLeft, ChevronRight } from "lucide-react";

export function WalletExplorer() {
  return (
    <DocsSection 
      title="Wallet Explorer" 
      description="Learn how to use the public wallet explorer to analyze any Stacks address"
      badge="Public Access"
    >
      <SubSection title="Overview">
        <p>
          The Wallet Explorer is a powerful public tool that lets you analyze any Stacks wallet 
          without creating an account. Simply enter a wallet address to view balance information, 
          transaction history, and analytics.
        </p>

        <InfoCard title="Access the Explorer" variant="info">
          <div className="flex items-center justify-between">
            <span>Start exploring wallets instantly</span>
            <Button 
              size="sm"
              onClick={() => window.location.href = '/wallet-checker'}
            >
              <Search className="mr-2 h-4 w-4" />
              Open Explorer
            </Button>
          </div>
        </InfoCard>
      </SubSection>

      <SubSection title="How to Search Wallets">
        <div className="space-y-4">
          <p>Follow these steps to explore any Stacks wallet:</p>
          
          <div className="grid gap-4">
            <div className="border-l-4 border-brand-teal pl-4">
              <h4 className="font-medium">Step 1: Enter Address</h4>
              <p className="text-sm text-muted-foreground">
                Type or paste a valid Stacks address in the search field. Addresses must start with SP (mainnet) or SM (testnet).
              </p>
            </div>

            <div className="border-l-4 border-brand-teal pl-4">
              <h4 className="font-medium">Step 2: Search</h4>
              <p className="text-sm text-muted-foreground">
                Click the search button or press Enter. The system will validate the address and fetch data from the Stacks blockchain.
              </p>
            </div>

            <div className="border-l-4 border-brand-teal pl-4">
              <h4 className="font-medium">Step 3: Analyze</h4>
              <p className="text-sm text-muted-foreground">
                Review the balance information, transaction history, and analytics. Use filters and pagination to explore large datasets.
              </p>
            </div>
          </div>
        </div>

        <CodeBlock
          title="Example Wallet Address"
          code="SP1WEWJKN2D5X2QHENBV5BFRF3EEHXKT35FGNJ5D8"
          language="text"
        />
      </SubSection>

      <SubSection title="Understanding Balance Data">
        <p>The wallet explorer displays several types of balance information:</p>

        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard title="Available Balance">
            <p className="text-sm">
              STX tokens that can be spent immediately. These are unlocked and ready for transactions.
            </p>
            <Badge variant="outline" className="mt-2 text-green-600 border-green-600">
              Spendable
            </Badge>
          </InfoCard>

          <InfoCard title="Locked Balance">
            <p className="text-sm">
              STX tokens that are currently locked (stacking, smart contracts, etc.). These cannot be spent until unlocked.
            </p>
            <Badge variant="outline" className="mt-2 text-yellow-600 border-yellow-600">
              Locked
            </Badge>
          </InfoCard>

          <InfoCard title="Total Balance">
            <p className="text-sm">
              Sum of available and locked balances. Represents the wallet's total STX holdings.
            </p>
            <Badge variant="outline" className="mt-2 text-brand-pink border-brand-pink">
              Complete
            </Badge>
          </InfoCard>

          <InfoCard title="Net Flow">
            <p className="text-sm">
              Difference between total received and total sent. Shows the wallet's overall accumulation or spending pattern.
            </p>
            <Badge variant="outline" className="mt-2 text-blue-600 border-blue-600">
              Historical
            </Badge>
          </InfoCard>
        </div>
      </SubSection>

      <SubSection title="Transaction History">
        <p>The explorer shows detailed transaction history with the following information:</p>

        <InfoCard title="Transaction Types" variant="info">
          <div className="grid gap-2 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm"><strong>Received:</strong> Incoming STX transfers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-sm"><strong>Sent:</strong> Outgoing STX transfers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-sm"><strong>Mining:</strong> Block mining rewards</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span className="text-sm"><strong>Staking:</strong> Stacking-related transactions</span>
            </div>
          </div>
        </InfoCard>

        <div className="space-y-4">
          <h4 className="font-medium">Available Actions</h4>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="flex items-center gap-2 text-sm">
              <Copy className="h-4 w-4 text-muted-foreground" />
              <span>Copy transaction IDs and addresses</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span>Filter by transaction type</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span>Navigate through pages</span>
            </div>
          </div>
        </div>
      </SubSection>

      <SubSection title="Analytics Charts">
        <p>Visual representations help you understand wallet activity patterns:</p>

        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard title="Transaction Type Distribution">
            <p className="text-sm">
              Pie chart showing the proportion of sent vs. received STX based on total amounts, 
              not transaction counts. This gives insight into the wallet's primary usage pattern.
            </p>
          </InfoCard>

          <InfoCard title="Transaction Summary">
            <p className="text-sm">
              Detailed breakdown of total amounts sent, received, and fees paid. 
              Includes USD equivalents when price data is available.
            </p>
          </InfoCard>
        </div>
      </SubSection>

      <SubSection title="Sharing & Bookmarking">
        <p>Easily share wallet analysis or bookmark for later reference:</p>

        <div className="space-y-4">
          <InfoCard title="URL Sharing" variant="success">
            <p className="text-sm mb-2">
              Wallet addresses are automatically added to the URL, making it easy to share specific analyses:
            </p>
            <CodeBlock
              code="https://wallet-monitor.com/wallet-checker?address=SP1ABC..."
              language="text"
            />
          </InfoCard>

          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Use the Share button to copy the direct link to any wallet analysis</span>
          </div>
        </div>
      </SubSection>

      <SubSection title="Limitations & Considerations">
        <InfoCard title="Rate Limits" variant="warning">
          <ul className="text-sm space-y-1">
            <li>• API calls are cached for 30 seconds to improve performance</li>
            <li>• Large wallets with many transactions may take longer to load</li>
            <li>• Transaction history is paginated (20 transactions per page)</li>
            <li>• Price data may occasionally be unavailable</li>
          </ul>
        </InfoCard>
      </SubSection>

      <SubSection title="Next Steps">
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/wallet-checker'}
          >
            Try the Explorer
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/?auth=signup'}
          >
            Create Account for More Features
          </Button>
        </div>
      </SubSection>
    </DocsSection>
  );
}