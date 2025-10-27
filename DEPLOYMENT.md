# Vercel Deployment Guide

This guide explains how to deploy the Tic Tac Toe application to Vercel with staging, development, and production environments.

## Environment Strategy

### Branch Structure
- `production` - Production environment (main branch)
- `staging` - Staging environment for pre-production testing
- `dev` - Development environment for active development

### Vercel Deployment Mapping
- **Production**: `production` branch → `yourdomain.com` or `tic-tac-toe.vercel.app`
- **Staging**: `staging` branch → `tic-tac-toe-staging.vercel.app`
- **Development**: `dev` branch → `tic-tac-toe-dev.vercel.app`

## Required Environment Variables

Configure these in Vercel Dashboard → Project Settings → Environment Variables

### All Environments (Production, Preview, Development)

```bash
# Database
DATABASE_URL=mysql://user:password@host:port/database?ssl={"rejectUnauthorized":true}

# Authentication
JWT_SECRET=your-random-secret-key-here
COOKIE_SECRET=your-cookie-secret-here

# App Configuration
VITE_APP_TITLE=Tic Tac Toe Game
VITE_APP_LOGO=/logo.svg
```

### Environment-Specific Variables

**Production:**
```bash
NODE_ENV=production
DATABASE_URL=mysql://user:password@prod-db-host:port/tic_tac_toe_prod
```

**Staging:**
```bash
NODE_ENV=staging
DATABASE_URL=mysql://user:password@staging-db-host:port/tic_tac_toe_staging
```

**Development:**
```bash
NODE_ENV=development
DATABASE_URL=mysql://user:password@dev-db-host:port/tic_tac_toe_dev
```

## Deployment Steps

### Initial Setup

1. **Push to GitHub/GitLab** (if using Manus Publish, this is done automatically)
   
2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your Git repository
   - Configure build settings (auto-detected from `vercel.json`)

3. **Configure Environment Variables:**
   - In Vercel Dashboard → Settings → Environment Variables
   - Add all required variables listed above
   - Set appropriate scope (Production, Preview, Development)

4. **Set Production Branch:**
   - In Vercel Dashboard → Settings → Git
   - Set Production Branch to `production` (or `main`)

### Workflow

**Development:**
```bash
git checkout dev
# Make changes
git commit -m "Add new feature"
git push origin dev
# Vercel automatically deploys to dev preview URL
```

**Staging:**
```bash
git checkout staging
git merge dev
git push origin staging
# Vercel automatically deploys to staging preview URL
# Test thoroughly before promoting to production
```

**Production:**
```bash
git checkout production
git merge staging
git push origin production
# Vercel automatically deploys to production domain
```

## Database Setup

### Separate Databases (Recommended)

Create three separate databases:
- `tic_tac_toe_prod` - Production data
- `tic_tac_toe_staging` - Staging data (copy of production for testing)
- `tic_tac_toe_dev` - Development data (test data)

### Run Migrations

After deployment, run migrations for each environment:

```bash
# Production
DATABASE_URL=<prod-url> pnpm db:push

# Staging
DATABASE_URL=<staging-url> pnpm db:push

# Development
DATABASE_URL=<dev-url> pnpm db:push
```

## Build Configuration

The project uses these build commands (configured in `vercel.json`):

- **Build Command**: `pnpm build`
- **Output Directory**: `dist/public`
- **Install Command**: `pnpm install`
- **Dev Command**: `pnpm dev`

## Custom Domains

### Production
- Add your custom domain in Vercel Dashboard → Settings → Domains
- Example: `tictactoe.yourdomain.com`

### Staging
- Use Vercel's auto-generated URL or add a subdomain
- Example: `staging-tictactoe.yourdomain.com`

## Monitoring

After deployment, monitor:
- **Vercel Dashboard** - Deployment logs, analytics
- **Database** - Connection health, query performance
- **Error Tracking** - Check Vercel logs for runtime errors

## Troubleshooting

### Database Connection Issues
- Ensure database allows connections from Vercel IPs
- Check SSL/TLS settings in connection string
- Verify DATABASE_URL format

### Build Failures
- Check Vercel build logs
- Verify all dependencies are in `package.json`
- Ensure environment variables are set

### Authentication Issues
- Verify JWT_SECRET and COOKIE_SECRET are set
- Check cookie domain settings for your deployment URL

## Rollback

If production deployment has issues:

1. In Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"

## Notes

- Vercel automatically creates preview deployments for all branches
- Each pull request gets its own preview URL
- Production deployments are immutable and can be rolled back instantly
- Free tier includes 100GB bandwidth and unlimited deployments

