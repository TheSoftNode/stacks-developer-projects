# Pre-Deployment Checklist

## ✅ Completed
- [x] Build passes without errors
- [x] All TypeScript errors fixed
- [x] Pino-pretty dependency installed
- [x] Dynamic exports added to prevent prerender errors
- [x] Challenge helper functions properly organized
- [x] .env.example file created with all variables
- [x] vercel.json configuration created
- [x] Deployment guide created (DEPLOYMENT_VERCEL.md)

## 🔧 Required Before Deploying

### 1. Environment Variables Setup
- [ ] MONGODB_URI - Get from MongoDB Atlas
- [ ] JWT_SECRET - Generate strong 32+ character secret
- [ ] ENCRYPTION_KEY - Generate 32 character encryption key
- [ ] EMAIL_USER - Your Gmail address
- [ ] EMAIL_PASS - Gmail app-specific password
- [ ] EMAIL_HOST - smtp.gmail.com (or your provider)
- [ ] NEXTAUTH_URL - Will be your Vercel URL
- [ ] NEXT_PUBLIC_API_URL - Same as NEXTAUTH_URL
- [ ] NEXT_PUBLIC_STACKS_NETWORK - mainnet or testnet

### 2. MongoDB Atlas Setup
- [ ] Create MongoDB Atlas account
- [ ] Create a free M0 cluster
- [ ] Create database user
- [ ] Get connection string
- [ ] Whitelist Vercel IPs (0.0.0.0/0 for simplicity, or Vercel's specific IPs)

### 3. Email Setup (Gmail)
- [ ] Enable 2-Factor Authentication on Google account
- [ ] Generate App Password (Google Account > Security > App passwords)
- [ ] Test email sending locally first (optional but recommended)

### 4. Code Preparation
- [ ] Commit all changes to git
- [ ] Push to GitHub repository
- [ ] Ensure .env.local is in .gitignore (already done)

## 🚀 Deployment Steps

### Via Vercel Dashboard
1. [ ] Go to https://vercel.com/new
2. [ ] Import your GitHub repository
3. [ ] Add all environment variables in the deployment screen
4. [ ] Click "Deploy"
5. [ ] Wait for build to complete
6. [ ] Copy your deployment URL
7. [ ] Update NEXTAUTH_URL and NEXT_PUBLIC_API_URL with your Vercel URL
8. [ ] Redeploy to apply URL changes

### Via Vercel CLI
1. [ ] Install Vercel CLI: `npm install -g vercel`
2. [ ] Login: `vercel login`
3. [ ] Deploy: `vercel --prod`
4. [ ] Add environment variables via CLI or dashboard
5. [ ] Redeploy: `vercel --prod`

## ✨ Post-Deployment Testing

### Authentication Tests
- [ ] Test email/password registration
- [ ] Test email/password login
- [ ] Test wallet-only registration
- [ ] Test wallet-only login
- [ ] Test linking wallet to email account
- [ ] Test linking email to wallet account
- [ ] Test logout

### Wallet Features
- [ ] Add a wallet address
- [ ] Check wallet balance display
- [ ] Test transaction sync
- [ ] Test wallet deletion
- [ ] Test encrypted wallet storage

### Dashboard Features
- [ ] Test analytics page loads correctly
- [ ] Test wallets page CRUD operations
- [ ] Test settings page saves correctly
- [ ] Test profile page updates
- [ ] Test users page (admin features)

### Public Features
- [ ] Test wallet checker page (public wallet lookup)
- [ ] Test docs page loads
- [ ] Test home page

### Scheduler & Notifications
- [ ] Verify auto-update scheduler initializes
- [ ] Test manual balance update trigger
- [ ] Test email notifications send correctly
- [ ] Check scheduler status in settings

## 🔒 Security Verification

- [ ] All secrets are in environment variables (not hardcoded)
- [ ] JWT_SECRET is strong (32+ characters)
- [ ] ENCRYPTION_KEY is exactly 32 characters
- [ ] .env.local is not committed to git
- [ ] MongoDB connection uses SSL
- [ ] HTTPS is enabled (automatic with Vercel)

## 📊 Performance Checks

- [ ] First load JS < 600 KB (currently ~584 KB ✓)
- [ ] Pages load in < 3 seconds
- [ ] API routes respond in < 5 seconds
- [ ] Database queries are optimized

## 🐛 Common Issues & Solutions

### Build Fails
- Check that all dependencies are in package.json
- Ensure Node.js version is 18.x or higher
- Review build logs in Vercel dashboard

### Can't Connect to MongoDB
- Verify connection string format
- Check MongoDB Atlas IP whitelist
- Ensure database user has correct permissions

### Email Not Sending
- Verify Gmail app password is correct
- Check EMAIL_HOST and EMAIL_PORT values
- Ensure 2FA is enabled on Google account

### Scheduler Not Running
- Set AUTO_SYNC_ENABLED=true
- Check Vercel function execution logs
- Consider function execution time limits

### Authentication Issues
- Ensure NEXTAUTH_URL matches your domain
- Check JWT_SECRET is set
- Verify cookies are being set correctly

## 📝 Optional Enhancements

- [ ] Set up custom domain
- [ ] Configure Vercel Analytics
- [ ] Set up error tracking (Sentry)
- [ ] Add monitoring/uptime checks
- [ ] Configure Redis for caching
- [ ] Set up CI/CD pipeline
- [ ] Add automated testing

## 📚 Documentation

- Full deployment guide: `DEPLOYMENT_VERCEL.md`
- Environment variables: `.env.example`
- Vercel configuration: `vercel.json`

---

**Ready to deploy!** 🎉

Follow the steps in `DEPLOYMENT_VERCEL.md` for detailed instructions.
