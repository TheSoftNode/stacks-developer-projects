"use client";

import { DocsSection, SubSection, InfoCard } from "../DocsSection";
import { CodeBlock } from "../CodeBlock";
import { Badge } from "@/components/ui/badge";
import { Server, Database, Code, Globe, Shield, Zap } from "lucide-react";

export function TechnicalDetails() {
  return (
    <DocsSection 
      title="Technical Details" 
      description="Architecture, technologies, and implementation details"
      badge="Technical"
    >
      <SubSection title="Technology Stack">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <InfoCard title="Frontend">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Next.js 14</span>
              </div>
              <ul className="text-sm space-y-1">
                <li>• React with TypeScript</li>
                <li>• Tailwind CSS for styling</li>
                <li>• shadcn/ui components</li>
                <li>• Framer Motion animations</li>
              </ul>
            </div>
          </InfoCard>

          <InfoCard title="Backend">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Node.js</span>
              </div>
              <ul className="text-sm space-y-1">
                <li>• Next.js API Routes</li>
                <li>• MongoDB with Mongoose</li>
                <li>• AES-256 encryption</li>
                <li>• Automated email scheduling</li>
              </ul>
            </div>
          </InfoCard>

          <InfoCard title="Blockchain">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Stacks API</span>
              </div>
              <ul className="text-sm space-y-1">
                <li>• Hiro Systems API</li>
                <li>• Real-time blockchain data</li>
                <li>• Transaction history</li>
                <li>• Balance information</li>
              </ul>
            </div>
          </InfoCard>
        </div>
      </SubSection>

      <SubSection title="Architecture Overview">
        <InfoCard title="System Architecture" variant="info">
          <div className="space-y-4">
            <p className="text-sm">
              Wallet Monitor follows a modern full-stack architecture with clear separation 
              between public and authenticated features.
            </p>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Public Features</h4>
                <ul className="text-sm space-y-1">
                  <li>• Stateless wallet explorer</li>
                  <li>• Direct blockchain API calls</li>
                  <li>• Client-side data processing</li>
                  <li>• No data persistence</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Account Features</h4>
                <ul className="text-sm space-y-1">
                  <li>• Encrypted data storage</li>
                  <li>• Background job processing</li>
                  <li>• Email notification system</li>
                  <li>• Historical data tracking</li>
                </ul>
              </div>
            </div>
          </div>
        </InfoCard>
      </SubSection>

      <SubSection title="Data Flow & Processing">
        <div className="space-y-6">
          <InfoCard title="Public Wallet Explorer Flow">
            <div className="space-y-3">
              <CodeBlock
                title="Data Flow"
                code={`1. User enters wallet address
2. Client validates address format
3. API route fetches data from Stacks blockchain
4. Response cached for 30 seconds
5. Client processes and displays data
6. No data stored permanently`}
                language="text"
              />
            </div>
          </InfoCard>

          <InfoCard title="Account Monitoring Flow">
            <div className="space-y-3">
              <CodeBlock
                title="Background Processing"
                code={`1. User adds encrypted wallet to account
2. Scheduler processes wallets based on update frequency
3. Balance data fetched from blockchain
4. Changes detected and email notifications sent
5. Historical data stored for analytics
6. Process repeats on configured schedule`}
                language="text"
              />
            </div>
          </InfoCard>
        </div>
      </SubSection>

      <SubSection title="Database Schema">
        <InfoCard title="Data Models" variant="info">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  User Model
                </h4>
                <CodeBlock
                  code={`{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  isVerified: Boolean,
  createdAt: Date,
  lastLogin: Date
}`}
                  language="json"
                />
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Wallet Model
                </h4>
                <CodeBlock
                  code={`{
  _id: ObjectId,
  userId: ObjectId,
  address: String (encrypted),
  updateType: String,
  lastChecked: Date,
  lastBalance: Number,
  isActive: Boolean
}`}
                  language="json"
                />
              </div>
            </div>
          </div>
        </InfoCard>
      </SubSection>

      <SubSection title="Security Implementation">
        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard title="Encryption" variant="success">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">AES-256 Encryption</span>
              </div>
              <CodeBlock
                title="Encryption Process"
                code={`// Wallet addresses encrypted before storage
const encryptedAddress = encrypt(walletAddress, process.env.ENCRYPTION_KEY);

// Automatic decryption via Mongoose getters
walletSchema.add({
  address: {
    type: String,
    get: function(value) {
      return decrypt(value);
    },
    set: function(value) {
      return encrypt(value);
    }
  }
});`}
                language="javascript"
              />
            </div>
          </InfoCard>

          <InfoCard title="API Security">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Request Validation</span>
              </div>
              <ul className="text-sm space-y-1">
                <li>• Input sanitization and validation</li>
                <li>• Rate limiting and caching</li>
                <li>• HTTPS enforcement</li>
                <li>• CORS configuration</li>
                <li>• SQL injection prevention</li>
              </ul>
            </div>
          </InfoCard>
        </div>
      </SubSection>

      <SubSection title="Performance Optimizations">
        <div className="space-y-4">
          <InfoCard title="Caching Strategy">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <h4 className="font-medium mb-2">API Response Caching</h4>
                <ul className="text-sm space-y-1">
                  <li>• 30-second cache TTL</li>
                  <li>• Reduces blockchain API calls</li>
                  <li>• Improves response times</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Client-Side Optimization</h4>
                <ul className="text-sm space-y-1">
                  <li>• React component memoization</li>
                  <li>• Lazy loading for charts</li>
                  <li>• Debounced search inputs</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Database Optimization</h4>
                <ul className="text-sm space-y-1">
                  <li>• Indexed queries</li>
                  <li>• Pagination for large datasets</li>
                  <li>• Efficient data models</li>
                </ul>
              </div>
            </div>
          </InfoCard>

          <InfoCard title="Scalability Considerations">
            <p className="text-sm">
              The system is designed to handle growth through horizontal scaling, database 
              sharding, and CDN integration. Background job processing is isolated and can 
              be scaled independently based on user growth.
            </p>
          </InfoCard>
        </div>
      </SubSection>

      <SubSection title="Monitoring & Observability">
        <InfoCard title="System Monitoring" variant="info">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Application Metrics</h4>
              <ul className="text-sm space-y-1">
                <li>• API response times</li>
                <li>• Error rates and exceptions</li>
                <li>• Database query performance</li>
                <li>• Background job success rates</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Business Metrics</h4>
              <ul className="text-sm space-y-1">
                <li>• Public explorer usage</li>
                <li>• User registration rates</li>
                <li>• Wallet monitoring volume</li>
                <li>• Email delivery success</li>
              </ul>
            </div>
          </div>
        </InfoCard>
      </SubSection>

      <SubSection title="Deployment & Infrastructure">
        <InfoCard title="Hosting & Deployment">
          <div className="space-y-4">
            <p className="text-sm">
              The application is deployed using modern cloud infrastructure with automated 
              CI/CD pipelines for reliable and secure deployments.
            </p>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Production Environment</h4>
                <ul className="text-sm space-y-1">
                  <li>• Serverless Next.js deployment</li>
                  <li>• MongoDB Atlas database</li>
                  <li>• CDN for static assets</li>
                  <li>• Automated SSL certificates</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Development Workflow</h4>
                <ul className="text-sm space-y-1">
                  <li>• Git-based version control</li>
                  <li>• Automated testing pipelines</li>
                  <li>• Staging environment</li>
                  <li>• Code quality checks</li>
                </ul>
              </div>
            </div>
          </div>
        </InfoCard>
      </SubSection>

      <SubSection title="Future Technical Roadmap">
        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard title="Short-term Improvements">
            <ul className="text-sm space-y-1">
              <li>• WebSocket for real-time updates</li>
              <li>• Advanced charting and analytics</li>
              <li>• Mobile app development</li>
              <li>• Additional blockchain support</li>
            </ul>
          </InfoCard>

          <InfoCard title="Long-term Vision">
            <ul className="text-sm space-y-1">
              <li>• Multi-chain portfolio tracking</li>
              <li>• DeFi protocol integration</li>
              <li>• Advanced alert systems</li>
              <li>• API marketplace features</li>
            </ul>
          </InfoCard>
        </div>
      </SubSection>
    </DocsSection>
  );
}