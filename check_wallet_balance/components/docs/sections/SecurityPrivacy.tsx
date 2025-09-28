"use client";

import { DocsSection, SubSection, InfoCard } from "../DocsSection";
import { CodeBlock } from "../CodeBlock";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Eye, Server, AlertTriangle } from "lucide-react";

export function SecurityPrivacy() {
  return (
    <DocsSection 
      title="Security & Privacy" 
      description="Learn how we protect your data and ensure wallet security"
      badge="Secure"
    >
      <SubSection title="Data Protection">
        <p>
          We implement industry-standard security measures to protect your wallet data and personal information.
        </p>
        
        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard title="Wallet Address Encryption" variant="info">
            <div className="space-y-3">
              <p className="text-sm">
                All wallet addresses in user accounts are encrypted using AES-256 encryption before storage.
              </p>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">AES-256 Encryption</span>
              </div>
            </div>
          </InfoCard>

          <InfoCard title="API Security" variant="info">
            <div className="space-y-3">
              <p className="text-sm">
                Public API endpoints are rate-limited and cached to prevent abuse while maintaining performance.
              </p>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Rate Limiting</span>
              </div>
            </div>
          </InfoCard>
        </div>
      </SubSection>

      <SubSection title="Privacy Policy">
        <InfoCard title="Data Collection" variant="warning">
          <ul className="text-sm space-y-2">
            <li>• <strong>Public Explorer:</strong> No personal data collected, no tracking</li>
            <li>• <strong>User Accounts:</strong> Email address and encrypted wallet addresses only</li>
            <li>• <strong>Analytics:</strong> No third-party analytics or tracking scripts</li>
            <li>• <strong>Cookies:</strong> Essential authentication cookies only</li>
          </ul>
        </InfoCard>

        <SubSection title="Data Usage">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">What We See</h4>
                <p className="text-xs text-muted-foreground">
                  Encrypted wallet addresses, email for notifications, usage timestamps
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Server className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Data Storage</h4>
                <p className="text-xs text-muted-foreground">
                  Encrypted database, secure server environment, regular backups
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Data Sharing</h4>
                <p className="text-xs text-muted-foreground">
                  Never shared with third parties, no data sales, no marketing use
                </p>
              </div>
            </div>
          </div>
        </SubSection>
      </SubSection>

      <SubSection title="Wallet Security Best Practices">
        <p>While we securely handle wallet addresses, here are recommendations for wallet security:</p>

        <InfoCard title="Recommended Practices" variant="success">
          <ul className="text-sm space-y-2">
            <li>• Never share your private keys or seed phrases with anyone</li>
            <li>• Use hardware wallets for large amounts of STX</li>
            <li>• Enable two-factor authentication on your wallet applications</li>
            <li>• Regularly update your wallet software</li>
            <li>• Only use this service to monitor addresses, never for transactions</li>
            <li>• Verify wallet addresses carefully before adding them</li>
          </ul>
        </InfoCard>

        <InfoCard title="What We Don't Store" variant="info">
          <ul className="text-sm space-y-1">
            <li>• Private keys or seed phrases</li>
            <li>• Transaction signing capabilities</li>
            <li>• Wallet passwords or credentials</li>
            <li>• Personal financial information</li>
          </ul>
        </InfoCard>
      </SubSection>

      <SubSection title="Data Retention & Deletion">
        <div className="space-y-4">
          <InfoCard title="Account Data">
            <p className="text-sm mb-2">
              User account data is retained as long as the account is active. You can delete your account at any time.
            </p>
            <Badge variant="outline" className="text-green-600 border-green-600">
              User Controlled
            </Badge>
          </InfoCard>

          <InfoCard title="Public API Data">
            <p className="text-sm mb-2">
              Public wallet explorer data is cached temporarily (30 seconds) and not permanently stored.
            </p>
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              Temporary Cache
            </Badge>
          </InfoCard>
        </div>
      </SubSection>

      <SubSection title="Security Measures">
        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard title="Infrastructure Security">
            <ul className="text-sm space-y-1">
              <li>• HTTPS encryption for all connections</li>
              <li>• Secure server configuration</li>
              <li>• Regular security updates</li>
              <li>• Database encryption at rest</li>
            </ul>
          </InfoCard>

          <InfoCard title="Application Security">
            <ul className="text-sm space-y-1">
              <li>• Input validation and sanitization</li>
              <li>• SQL injection prevention</li>
              <li>• XSS protection</li>
              <li>• Secure authentication flows</li>
            </ul>
          </InfoCard>
        </div>
      </SubSection>

      <SubSection title="Incident Response">
        <InfoCard title="Security Incidents" variant="warning">
          <p className="text-sm">
            In the unlikely event of a security incident, we will notify affected users within 24 hours 
            and provide detailed information about the incident and our response measures.
          </p>
        </InfoCard>
      </SubSection>
    </DocsSection>
  );
}