# Branch Protection Setup

To enforce the proper deployment workflow with pull request requirements for production, configure branch protection rules in GitHub.

## GitHub Branch Protection Configuration

### 1. Go to Repository Settings
- Navigate to: https://github.com/karledward/tic-tac-toe/settings/branches
- Click "Add branch protection rule"

### 2. Protect `main` Branch (Production)

**Branch name pattern:** `main`

**Required settings:**
- ✅ **Require a pull request before merging**
  - ✅ Require approvals: 1
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ✅ Require review from Code Owners (optional)
  
- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - Add status checks: Vercel deployment checks (if available)
  
- ✅ **Require conversation resolution before merging**

- ✅ **Do not allow bypassing the above settings**
  - This ensures even admins must follow the PR process

- ❌ **Allow force pushes** - Keep disabled for production
- ❌ **Allow deletions** - Keep disabled for production

### 3. Branch Workflow

**Development Flow:**
```bash
# Work on dev branch
git checkout dev
# Make changes
git add .
git commit -m "Add feature"
git push github dev

# Vercel automatically deploys dev branch to preview URL
```

**Staging Flow:**
```bash
# Merge dev to staging for testing
git checkout staging
git merge dev
git push github staging

# Vercel automatically deploys staging branch to preview URL
```

**Production Flow:**
```bash
# Create pull request from staging to main
# Go to GitHub: https://github.com/karledward/tic-tac-toe/compare/main...staging
# Click "Create pull request"
# Request review
# After approval, merge PR
# Vercel automatically deploys main branch to production
```

## Vercel Configuration

### Set Production Branch
1. Go to Vercel Dashboard → Project Settings → Git
2. Set **Production Branch** to `main`
3. All other branches (`dev`, `staging`) will get preview deployments

### Environment Variables per Branch

Configure different environment variables for each environment:

**Production (main branch):**
- `DATABASE_URL` → Production database
- `NODE_ENV` → `production`

**Preview (dev, staging branches):**
- `DATABASE_URL` → Staging/dev database  
- `NODE_ENV` → `development` or `staging`

## Current Branch Status

- **`main`** - Production branch (protected, requires PR)
- **`staging`** - Staging environment (preview deployment)
- **`dev`** - Development environment (preview deployment, active development)

## Deployment URLs

After Vercel deployment:
- **Production:** `https://tic-tac-toe.vercel.app` (or custom domain)
- **Staging:** `https://tic-tac-toe-git-staging-yourname.vercel.app`
- **Dev:** `https://tic-tac-toe-git-dev-yourname.vercel.app`

## Best Practices

1. **Always develop on `dev` branch**
2. **Test on `staging` before merging to `main`**
3. **Use pull requests for all merges to `main`**
4. **Require code review for production deployments**
5. **Never force push to `main`**
6. **Use semantic commit messages**
7. **Tag production releases** with version numbers

## Setting Up Branch Protection (Step by Step)

1. **Go to GitHub repository**
2. **Click Settings tab**
3. **Click Branches in left sidebar**
4. **Click "Add branch protection rule"**
5. **Enter `main` as branch name pattern**
6. **Check all the boxes listed above**
7. **Click "Create" at the bottom**

Now the `main` branch is protected and requires pull requests!

