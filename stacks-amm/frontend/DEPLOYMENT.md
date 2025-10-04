# 🚀 Stacks AMM Frontend - Deployment Guide

## Production Checklist

### 1. Environment Setup

Before deploying, ensure the following are properly configured:

#### Contract Configuration

Update `/lib/amm.ts` with your production contract:

```typescript
const AMM_CONTRACT_ADDRESS = "YOUR_PRODUCTION_CONTRACT_ADDRESS";
const AMM_CONTRACT_NAME = "amm";
```

#### Environment Variables

Create `.env.local` for production settings:

```env
# Optional: Analytics
NEXT_PUBLIC_GA_ID=your_google_analytics_id

# Optional: API endpoints
NEXT_PUBLIC_API_URL=https://api.mainnet.hiro.so
```

### 2. Network Configuration

**For Mainnet Deployment:**

- Update network in `/lib/amm.ts`:
  ```typescript
  import { STACKS_MAINNET } from "@stacks/network";
  // Use STACKS_MAINNET instead of STACKS_TESTNET
  ```
- Update explorer URLs in `/lib/stx-utils.ts` to use "mainnet"

### 3. Build Process

```bash
# Install dependencies
npm install

# Type check
npm run build

# Test production build locally
npm run start
```

### 4. Deployment Options

#### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel

# For production
vercel --prod
```

**Configuration:**

- Auto-deploys from GitHub
- Environment variables in Vercel dashboard
- Custom domain configuration
- Edge Functions support

#### Option 2: Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy

# For production
netlify deploy --prod
```

**Configuration:**

- Build command: `npm run build`
- Publish directory: `.next`
- Node version: 18+

#### Option 3: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package*.json ./
RUN npm ci --production
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t stacks-amm .
docker run -p 3000:3000 stacks-amm
```

### 5. Performance Optimization

#### Image Optimization

- Use Next.js Image component for all images
- Compress images before uploading
- Consider using CDN for static assets

#### Code Splitting

- Already handled by Next.js
- Keep client components small
- Use dynamic imports for heavy components

#### Caching Strategy

```typescript
// In fetch calls, add caching
const response = await fetch(url, {
  next: { revalidate: 60 }, // Revalidate every 60 seconds
});
```

### 6. Security Checklist

- [ ] Remove console.log statements
- [ ] Validate all user inputs
- [ ] Enable CORS properly
- [ ] Use HTTPS only
- [ ] Implement rate limiting
- [ ] Add CSP headers
- [ ] Regular dependency updates

### 7. Monitoring

#### Add Error Tracking

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

#### Analytics Setup

```typescript
// Add Google Analytics in layout.tsx
<Script
  src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
  strategy="afterInteractive"
/>
```

### 8. Testing Before Launch

```bash
# Run type checking
npm run build

# Test all features:
# - Connect wallet
# - Create pool
# - Add liquidity
# - Swap tokens
# - Remove liquidity
# - Check all dashboard pages
```

### 9. Post-Deployment

- Monitor error logs
- Check wallet connection works
- Verify all contract interactions
- Test on multiple devices/browsers
- Monitor gas usage and transaction costs

### 10. Domain Setup

#### Custom Domain on Vercel

1. Go to Vercel Dashboard → Settings → Domains
2. Add your domain
3. Configure DNS:
   - Add A record pointing to Vercel IP
   - Or CNAME record pointing to `cname.vercel-dns.com`

#### SSL Certificate

- Automatically provisioned by Vercel/Netlify
- Force HTTPS in next.config.ts

### 11. Continuous Deployment

#### GitHub Actions (Optional)

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run build
      - run: npm test
```

## Quick Deploy Commands

### Vercel

```bash
vercel --prod
```

### Netlify

```bash
netlify deploy --prod --dir=.next
```

### Manual Server

```bash
npm run build
npm start
```

## Troubleshooting

### Build Errors

- Clear `.next` folder: `rm -rf .next`
- Delete `node_modules`: `rm -rf node_modules && npm install`
- Check Node version: `node -v` (should be 18+)

### Runtime Errors

- Check browser console for errors
- Verify contract address is correct
- Ensure wallet is connected to correct network
- Check API rate limits

### Performance Issues

- Enable Next.js Image optimization
- Use production build (not dev mode)
- Enable CDN for static assets
- Implement proper caching strategies

## Support

For deployment issues:

- Check Next.js documentation: https://nextjs.org/docs/deployment
- Vercel support: https://vercel.com/support
- Stacks Discord: https://discord.gg/stacks
