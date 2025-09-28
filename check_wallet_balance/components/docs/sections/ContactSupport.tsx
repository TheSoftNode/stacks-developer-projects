"use client";

import { DocsSection, SubSection, InfoCard } from "../DocsSection";
import { CodeBlock } from "../CodeBlock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageCircle, Bug, Lightbulb, Shield, Clock } from "lucide-react";

export function ContactSupport() {
  return (
    <DocsSection 
      title="Contact & Support" 
      description="Get help, report issues, or suggest improvements"
      badge="Support"
    >
      <SubSection title="Support Channels">
        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard title="Email Support" variant="info">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">thesoftnode@gmail.com</span>
              </div>
              <p className="text-sm">
                Send us detailed information about your issue or question. 
                We typically respond within 24 hours.
              </p>
              <Badge variant="outline" className="text-green-600 border-green-600">
                24 Hour Response
              </Badge>
            </div>
          </InfoCard>

          <InfoCard title="Community" variant="info">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Community Forum</span>
              </div>
              <p className="text-sm">
                Join our community discussions, share tips, and get help from other users.
              </p>
              <Button variant="outline" size="sm">
                Join Community
              </Button>
            </div>
          </InfoCard>
        </div>
      </SubSection>

      <SubSection title="Common Support Topics">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <InfoCard title="Bug Reports">
            <div className="space-y-2">
              <Bug className="h-6 w-6 text-red-500" />
              <p className="text-sm">
                Found a bug? Report it with detailed steps to reproduce the issue.
              </p>
            </div>
          </InfoCard>

          <InfoCard title="Feature Requests">
            <div className="space-y-2">
              <Lightbulb className="h-6 w-6 text-yellow-500" />
              <p className="text-sm">
                Have an idea for improvement? We love hearing feature suggestions!
              </p>
            </div>
          </InfoCard>

          <InfoCard title="Security Issues">
            <div className="space-y-2">
              <Shield className="h-6 w-6 text-green-500" />
              <p className="text-sm">
                Security concerns? Contact us immediately for priority handling.
              </p>
            </div>
          </InfoCard>

          <InfoCard title="Account Help">
            <div className="space-y-2">
              <Clock className="h-6 w-6 text-blue-500" />
              <p className="text-sm">
                Need help with account settings, notifications, or wallet management?
              </p>
            </div>
          </InfoCard>
        </div>
      </SubSection>

      <SubSection title="Before Contacting Support">
        <InfoCard title="Self-Help Checklist" variant="warning">
          <p className="text-sm mb-3">
            Try these steps first to resolve common issues quickly:
          </p>
          <ul className="text-sm space-y-2">
            <li>• Check the FAQ section for common questions and solutions</li>
            <li>• Verify your wallet address format (SP/SM prefix, 41 characters)</li>
            <li>• Clear your browser cache and cookies</li>
            <li>• Try using a different browser or incognito mode</li>
            <li>• Check if the Stacks blockchain network is experiencing issues</li>
            <li>• Ensure your email address is correct for notifications</li>
          </ul>
        </InfoCard>
      </SubSection>

      <SubSection title="Reporting Bugs">
        <InfoCard title="Bug Report Template">
          <p className="text-sm mb-3">
            When reporting bugs, please include the following information:
          </p>
          
          <CodeBlock
            title="Bug Report Format"
            code={`**Bug Description:**
Brief description of the issue

**Steps to Reproduce:**
1. Go to...
2. Click on...
3. Enter...
4. See error

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**
- Browser: (Chrome, Firefox, Safari, etc.)
- Version: (if known)
- Operating System: (Windows, Mac, Linux)
- Device: (Desktop, Mobile, Tablet)

**Additional Information:**
Screenshots, error messages, console logs (if applicable)`}
            language="text"
          />
        </InfoCard>
      </SubSection>

      <SubSection title="Feature Requests">
        <InfoCard title="Request Guidelines" variant="success">
          <p className="text-sm mb-3">
            Help us understand your feature request by providing:
          </p>
          <ul className="text-sm space-y-1">
            <li>• Clear description of the desired feature</li>
            <li>• Use case: How would this feature help you?</li>
            <li>• Priority: How important is this to your workflow?</li>
            <li>• Alternatives: Are there workarounds you currently use?</li>
            <li>• Examples: Similar features in other tools you like</li>
          </ul>
        </InfoCard>
      </SubSection>

      <SubSection title="Response Times">
        <div className="grid gap-4 md:grid-cols-3">
          <InfoCard title="Security Issues">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 mb-1">4 hours</div>
              <p className="text-sm">Critical security issues</p>
            </div>
          </InfoCard>

          <InfoCard title="Bug Reports">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">24 hours</div>
              <p className="text-sm">Functional issues and bugs</p>
            </div>
          </InfoCard>

          <InfoCard title="General Support">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">48 hours</div>
              <p className="text-sm">Questions and feature requests</p>
            </div>
          </InfoCard>
        </div>
      </SubSection>

      <SubSection title="Security Disclosure">
        <InfoCard title="Responsible Disclosure" variant="warning">
          <p className="text-sm mb-3">
            If you discover a security vulnerability, please report it responsibly:
          </p>
          <ul className="text-sm space-y-1">
            <li>• Email security issues to: <strong>thesoftnode@gmail.com</strong></li>
            <li>• Do not publicly disclose the vulnerability</li>
            <li>• Provide detailed information about the issue</li>
            <li>• We will acknowledge receipt within 4 hours</li>
            <li>• We will provide updates on remediation progress</li>
            <li>• Credit will be given for responsible disclosure</li>
          </ul>
        </InfoCard>
      </SubSection>

      <SubSection title="Contact Information">
        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard title="Support Team">
            <div className="space-y-2 text-sm">
              <div><strong>Email:</strong> thesoftnode@gmail.com</div>
              <div><strong>Security:</strong> thesoftnode@gmail.com</div>
              <div><strong>Business:</strong> thesoftnode@gmail.com</div>
              <div><strong>Hours:</strong> Monday-Friday, 9 AM - 6 PM UTC</div>
            </div>
          </InfoCard>

          <InfoCard title="Quick Actions">
            <div className="space-y-3">
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => window.location.href = 'mailto:thesoftnode@gmail.com'}
              >
                <Mail className="mr-2 h-4 w-4" />
                Email Support
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => {
                  const section = document.querySelector('[data-section=\"faq\"]');
                  section?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                View FAQ
              </Button>
            </div>
          </InfoCard>
        </div>
      </SubSection>

      <SubSection title="Stay Updated">
        <InfoCard title="Follow Our Updates" variant="info">
          <p className="text-sm mb-3">
            Stay informed about new features, updates, and maintenance:
          </p>
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline">Status Page</Badge>
            <Badge variant="outline">Release Notes</Badge>
            <Badge variant="outline">Community Updates</Badge>
          </div>
        </InfoCard>
      </SubSection>
    </DocsSection>
  );
}