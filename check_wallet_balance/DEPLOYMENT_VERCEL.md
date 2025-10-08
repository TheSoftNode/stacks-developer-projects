# Deployment Guide for Vercel

This guide will help you deploy your Stacks Wallet Monitor application to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup) (free tier is sufficient)
2. [Vercel CLI](https://vercel.com/docs/cli) installed (optional but recommended)
3. A MongoDB database (MongoDB Atlas recommended for production)
4. Email credentials (Gmail or other SMTP provider)

## Required Environment Variables

Before deploying, you'll need to set up these environment variables in your Vercel project settings:

### Essential Variables (Required)

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/wallet_check

# Security
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
ENCRYPTION_KEY=your-32-character-encryption-key-here

# URLs
NEXTAUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
NEXT_PUBLIC_STACKS_NETWORK=mainnet

# Email (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM=noreply@your-domain.com
```

### Optional Variables (Performance Tuning)

```bash
MAX_TRANSACTIONS_PER_WALLET=2000
API_REQUEST_DELAY=100
WALLET_PROCESSING_DELAY=500
AUTO_SYNC_INTERVAL=1800000
AUTO_SYNC_ENABLED=true
```

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import your repository to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**
   - In the import screen, add all required environment variables
   - Click "Deploy"

4. **After deployment**
   - Vercel will provide a URL like `https://your-app.vercel.app`
   - Update `NEXTAUTH_URL` and `NEXT_PUBLIC_API_URL` to match this URL
   - Redeploy for the changes to take effect

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI** (if not already installed)
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy to production**
   ```bash
   vercel --prod
   ```

4. **Add environment variables**
   ```bash
   vercel env add MONGODB_URI
   vercel env add JWT_SECRET
   vercel env add ENCRYPTION_KEY
   # ... add all other variables
   ```

5. **Redeploy with environment variables**
   ```bash
   vercel --prod
   ```

## Setting Up MongoDB Atlas (Recommended)

1. **Create a free MongoDB Atlas account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Click "Start Free"

2. **Create a cluster**
   - Choose the free tier (M0)
   - Select a region close to your Vercel deployment region

3. **Get your connection string**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password
   - Add this as `MONGODB_URI` in Vercel

4. **Whitelist Vercel IPs**
   - In Network Access, add `0.0.0.0/0` to allow connections from Vercel
   - (Or use Vercel's specific IP ranges for better security)

## Setting Up Email (Gmail)

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate an App Password**
   - Go to Google Account > Security > 2-Step Verification > App passwords
   - Generate a password for "Mail"
   - Use this as `EMAIL_PASS` in Vercel

## Post-Deployment Checklist

- [ ] All environment variables are set in Vercel
- [ ] MongoDB connection is working
- [ ] Email notifications are sending
- [ ] SSL certificate is active (automatic with Vercel)
- [ ] Custom domain configured (optional)
- [ ] Test wallet addition and balance checking
- [ ] Test authentication (email and wallet)
- [ ] Test transaction syncing
- [ ] Check scheduler is running for auto-updates

## Important Security Notes

1. **Never commit `.env.local`** to git (already in .gitignore)
2. **Use strong secrets** for JWT_SECRET and ENCRYPTION_KEY (minimum 32 characters)
3. **Rotate secrets regularly** in production
4. **Use MongoDB IP whitelist** instead of 0.0.0.0/0 in production
5. **Enable Vercel Security Headers** in project settings

## Monitoring and Logs

- View logs in Vercel Dashboard > Your Project > Logs
- Set up Error Tracking (Sentry integration recommended)
- Monitor MongoDB metrics in Atlas dashboard

## Troubleshooting

### Build Fails
- Check Node.js version compatibility (should be 18.x or higher)
- Ensure all dependencies are in `package.json`
- Check build logs in Vercel dashboard

### Runtime Errors
- Verify all environment variables are set
- Check MongoDB connection string format
- Review function logs in Vercel dashboard

### Scheduler Not Working
- Ensure `AUTO_SYNC_ENABLED=true` is set
- Check function execution time limits (Vercel Free: 10s, Pro: 60s)
- Consider using Vercel Cron Jobs for scheduled tasks

## Performance Optimization

1. **Enable Vercel Analytics** for performance insights
2. **Use Edge Functions** for auth routes (optional)
3. **Configure caching** for static assets
4. **Optimize MongoDB queries** with proper indexes
5. **Consider Redis** for caching frequently accessed data

## Scaling Considerations

- **Vercel Free Tier Limits:**
  - 100GB bandwidth/month
  - 100,000 function invocations/month
  - 10s function execution time

- **When to upgrade:**
  - High user traffic
  - Many wallet updates
  - Need longer function execution times

## Support

For issues with:
- **Vercel deployment:** [Vercel Support](https://vercel.com/support)
- **MongoDB Atlas:** [MongoDB Support](https://www.mongodb.com/support)
- **Application bugs:** Create an issue in your GitHub repository

---

## Quick Deploy Button (Optional)

Add this to your README.md for one-click deployment:

```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/your-repo)
```

---

**Good luck with your deployment! 🚀**
