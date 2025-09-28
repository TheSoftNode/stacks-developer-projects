"use client";

import { DocsSection, SubSection, InfoCard } from "../DocsSection";
import { CodeBlock } from "../CodeBlock";
import { Badge } from "@/components/ui/badge";

export function ApiReference() {
  return (
    <DocsSection 
      title="API Reference" 
      description="Public API endpoints for integrating wallet data into your applications"
      badge="Public API"
    >
      <SubSection title="Base URL">
        <CodeBlock
          title="API Base URL"
          code="https://wallet-monitor.com/api/public"
          language="text"
        />
      </SubSection>

      <SubSection title="Get Wallet Data">
        <p>Retrieve balance and transaction information for any Stacks wallet address.</p>

        <CodeBlock
          title="Endpoint"
          code="GET /api/public/wallet/{address}"
          language="http"
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <InfoCard title="Parameters">
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">path</Badge>
                  <code className="text-sm">address</code>
                  <Badge variant="destructive" className="text-xs">required</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Stacks wallet address (SP... or SM...)
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">query</Badge>
                  <code className="text-sm">limit</code>
                  <Badge variant="secondary" className="text-xs">optional</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Number of transactions to return (default: 50, max: 100)
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">query</Badge>
                  <code className="text-sm">offset</code>
                  <Badge variant="secondary" className="text-xs">optional</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Number of transactions to skip (default: 0)
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">query</Badge>
                  <code className="text-sm">transactions</code>
                  <Badge variant="secondary" className="text-xs">optional</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Include transaction data (default: true)
                </p>
              </div>
            </div>
          </InfoCard>

          <InfoCard title="Response Headers">
            <div className="space-y-2 text-sm">
              <div><code>Content-Type: application/json</code></div>
              <div><code>Cache-Control: public, max-age=30</code></div>
            </div>
          </InfoCard>
        </div>

        <SubSection title="Example Request">
          <CodeBlock
            title="cURL Example"
            code={`curl -X GET "https://wallet-monitor.com/api/public/wallet/SP1WEWJKN2D5X2QHENBV5BFRF3EEHXKT35FGNJ5D8?limit=20&offset=0" \\
  -H "Accept: application/json"`}
            language="bash"
          />

          <CodeBlock
            title="JavaScript Example"
            code={`const response = await fetch(
  'https://wallet-monitor.com/api/public/wallet/SP1WEWJKN2D5X2QHENBV5BFRF3EEHXKT35FGNJ5D8?limit=20&offset=0'
);

if (response.ok) {
  const data = await response.json();
  console.log('Wallet Balance:', data.balance.total);
  console.log('Transaction Count:', data.transactions.length);
} else {
  console.error('Error:', response.status);
}`}
            language="javascript"
          />
        </SubSection>

        <SubSection title="Response Format">
          <CodeBlock
            title="Success Response (200 OK)"
            code={`{
  "address": "SP1WEWJKN2D5X2QHENBV5BFRF3EEHXKT35FGNJ5D8",
  "balance": {
    "available": 1234.567890,
    "locked": 500.000000,
    "total": 1734.567890,
    "totalSent": 2500.000000,
    "totalReceived": 4234.567890,
    "totalFees": 12.345678
  },
  "transactions": [
    {
      "txId": "0xabc123...",
      "type": "received",
      "amount": 100.000000,
      "fee": 0.001000,
      "fromAddress": "SP2ABC...",
      "toAddress": "SP1WEWJKN2D5X2QHENBV5BFRF3EEHXKT35FGNJ5D8",
      "blockHeight": 123456,
      "blockHash": "0xdef456...",
      "status": "confirmed",
      "timestamp": "2024-01-15T10:30:00Z",
      "memo": ""
    }
  ],
  "pagination": {
    "total": 1250,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}`}
            language="json"
          />
        </SubSection>
      </SubSection>

      <SubSection title="Error Responses">
        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard title="400 Bad Request" variant="warning">
            <CodeBlock
              code={`{
  "error": "Invalid Stacks address format"
}`}
              language="json"
            />
          </InfoCard>

          <InfoCard title="500 Internal Server Error" variant="warning">
            <CodeBlock
              code={`{
  "error": "Failed to fetch wallet data"
}`}
              language="json"
            />
          </InfoCard>
        </div>
      </SubSection>

      <SubSection title="Rate Limits">
        <InfoCard title="Usage Limits" variant="info">
          <ul className="text-sm space-y-1">
            <li>• No authentication required for public API</li>
            <li>• Responses are cached for 30 seconds</li>
            <li>• Maximum 100 transactions per request</li>
            <li>• No rate limiting currently enforced</li>
            <li>• Fair use policy applies</li>
          </ul>
        </InfoCard>
      </SubSection>

      <SubSection title="Data Types">
        <div className="space-y-4">
          <InfoCard title="Transaction Types">
            <div className="grid gap-2 text-sm">
              <div><code>"sent"</code> - Outgoing STX transfer</div>
              <div><code>"received"</code> - Incoming STX transfer</div>
              <div><code>"mining"</code> - Block mining reward</div>
              <div><code>"staking"</code> - Stacking-related transaction</div>
            </div>
          </InfoCard>

          <InfoCard title="Transaction Status">
            <div className="grid gap-2 text-sm">
              <div><code>"confirmed"</code> - Transaction confirmed on blockchain</div>
              <div><code>"pending"</code> - Transaction pending confirmation</div>
              <div><code>"failed"</code> - Transaction failed</div>
            </div>
          </InfoCard>
        </div>
      </SubSection>

      <SubSection title="SDKs and Libraries">
        <p>Currently, no official SDKs are available. The API uses standard REST principles and can be integrated with any HTTP client.</p>

        <InfoCard title="Community Libraries" variant="info">
          <p className="text-sm">
            If you create a library or wrapper for this API, please let us know and we'll list it here!
          </p>
        </InfoCard>
      </SubSection>
    </DocsSection>
  );
}