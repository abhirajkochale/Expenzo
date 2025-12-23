# 🚀 Spending Guardian - Production Deployment Guide

This comprehensive guide will walk you through every step needed to deploy your Spending Guardian application to production after downloading the code.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Supabase Backend Setup](#supabase-backend-setup)
4. [Google Gemini AI Setup](#google-gemini-ai-setup)
5. [Environment Configuration](#environment-configuration)
6. [Local Testing](#local-testing)
7. [Production Build](#production-build)
8. [Deployment Options](#deployment-options)
9. [Post-Deployment Configuration](#post-deployment-configuration)
10. [Security Checklist](#security-checklist)
11. [Monitoring & Maintenance](#monitoring--maintenance)
12. [Troubleshooting](#troubleshooting)

---

## 1. Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

- **Node.js** (v18 or higher)
  - Download: https://nodejs.org/
  - Verify: `node --version`

- **pnpm** (v8 or higher)
  - Install: `npm install -g pnpm`
  - Verify: `pnpm --version`

- **Git** (for version control)
  - Download: https://git-scm.com/
  - Verify: `git --version`

### Required Accounts

- **Supabase Account** (Free tier available)
  - Sign up: https://supabase.com/

- **Google AI Studio Account** (Free tier available)
  - Sign up: https://aistudio.google.com/

- **Deployment Platform Account** (Choose one):
  - Vercel: https://vercel.com/ (Recommended)
  - Netlify: https://netlify.com/
  - Cloudflare Pages: https://pages.cloudflare.com/

---

## 2. Initial Setup

### Step 1: Download and Extract Code

1. Download the code from this chat
2. Extract to your desired location
3. Open terminal/command prompt in the project directory

```bash
cd /path/to/spending-guardian
```

### Step 2: Install Dependencies

```bash
# Install all project dependencies
pnpm install
```

This will install all required packages including:
- React, React Router
- Supabase client
- Tailwind CSS
- shadcn/ui components
- Recharts for data visualization
- And all other dependencies

**Expected time:** 2-5 minutes depending on your internet speed

### Step 3: Verify Installation

```bash
# Check if installation was successful
pnpm list --depth=0
```

You should see a list of all installed packages without errors.

---

## 3. Supabase Backend Setup

### Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in project details:
   - **Name:** spending-guardian (or your preferred name)
   - **Database Password:** Create a strong password (save this!) Abhiraj@23
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Free tier is sufficient to start
4. Click **"Create new project"**
5. Wait 2-3 minutes for project initialization

### Step 2: Get Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values (you'll need these later):
   - **Project URL** (looks like: `https://xxxxx.supabase.co`) https://nkjdllvlhuuyxljgxbup.supabase.co
   
   - **anon/public key** (starts with `eyJ...`) eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ramRsbHZsaHV1eXhsamd4YnVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNTY4NTIsImV4cCI6MjA4MTgzMjg1Mn0.TWRLUPwcV8Uc4q1BQ4Q_zLge9Ucogu7IhqYxDqwRhhs

   - **service_role key** (starts with `eyJ...`) - Keep this secret!
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ramRsbHZsaHV1eXhsamd4YnVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjI1Njg1MiwiZXhwIjoyMDgxODMyODUyfQ.GLleu3oLmXiMWnTNw6_JXUMg2r9kWcXrvuFtVtqAa5s

### Step 3: Set Up Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy and paste the following schema:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  income_range TEXT,
  risk_profile TEXT DEFAULT 'moderate',
  locale TEXT DEFAULT 'en-IN',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create accounts table
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'cash',
  name TEXT NOT NULL,
  currency TEXT DEFAULT 'INR',
  balance DECIMAL(15,2) DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT,
  merchant TEXT,
  category TEXT,
  subcategory TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  is_recurring BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create budgets table
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  category TEXT NOT NULL,
  limit_amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month, year, category)
);

-- Create goals table
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) DEFAULT 0,
  target_date DATE,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create rules table
CREATE TABLE rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL,
  params JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  level TEXT DEFAULT 'info',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ai_explanations table
CREATE TABLE ai_explanations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  input_summary TEXT,
  output_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_merchant ON transactions(merchant);
CREATE INDEX idx_budgets_user_period ON budgets(user_id, year, month);
CREATE INDEX idx_goals_user_status ON goals(user_id, status);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_explanations ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Accounts policies
CREATE POLICY "Users can view own accounts" ON accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own accounts" ON accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON accounts FOR DELETE USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- Budgets policies
CREATE POLICY "Users can view own budgets" ON budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budgets" ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON budgets FOR DELETE USING (auth.uid() = user_id);

-- Goals policies
CREATE POLICY "Users can view own goals" ON goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON goals FOR DELETE USING (auth.uid() = user_id);

-- Rules policies
CREATE POLICY "Users can view own rules" ON rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rules" ON rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rules" ON rules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rules" ON rules FOR DELETE USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- AI explanations policies
CREATE POLICY "Users can view own ai_explanations" ON ai_explanations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai_explanations" ON ai_explanations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to automatically create default account
CREATE OR REPLACE FUNCTION public.handle_new_user_account()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.accounts (user_id, type, name, is_default)
  VALUES (NEW.id, 'cash', 'Primary Account', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for default account creation
DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_account();
```

4. Click **"Run"** to execute the schema
5. Verify success: You should see "Success. No rows returned"

### Step 4: Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. **Email Provider:**
   - Enable "Email" provider
   - Disable "Confirm email" for easier testing (enable in production)
   - Click "Save"

3. **Google OAuth (Optional but Recommended):**
   - Enable "Google" provider
   - Follow instructions to get Google OAuth credentials
   - Add credentials and save

### Step 5: Configure Storage (Optional - for future features)

1. Go to **Storage** in Supabase dashboard
2. Click **"Create a new bucket"**
3. Name: `transaction-receipts`
4. Make it **Public** if you want receipts to be accessible
5. Click "Create bucket"

---

## 4. Google Gemini AI Setup

### Step 1: Get Gemini API Key

1. Go to https://aistudio.google.com/
2. Sign in with your Google account
3. Click **"Get API Key"** in the top right
4. Click **"Create API Key"**
5. Select **"Create API key in new project"** or choose existing project
6. Copy the API key (starts with `AIza...`)
7. **Important:** Save this key securely - you won't see it again!
AIzaSyAv5uuviqGeln-7qE3V2wIpnJqKfu5XhbQ

### Step 2: Test API Key (Optional)

You can test your API key using curl:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

Replace `YOUR_API_KEY` with your actual key. You should get a response.

---

## 5. Environment Configuration

### Step 1: Create Environment File

1. In your project root, create a file named `.env`
2. Copy the following template:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Google Gemini AI Configuration
VITE_GEMINI_API_KEY=your-gemini-api-key-here

# Application Configuration
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME=Spending Guardian
```

### Step 2: Fill in Your Credentials

Replace the placeholder values with your actual credentials:

- `VITE_SUPABASE_URL`: Your Supabase project URL (from Step 3.2)
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key (from Step 3.2)
- `VITE_GEMINI_API_KEY`: Your Gemini API key (from Step 4.1)
- `VITE_APP_URL`: Keep as `http://localhost:5173` for local development

### Step 3: Verify Environment File

```bash
# Check if .env file exists and has content
cat .env
```

**Important Security Notes:**
- Never commit `.env` file to Git (it's already in `.gitignore`)
- Never share your API keys publicly
- Use different keys for development and production

---

## 6. Local Testing

### Step 1: Start Development Server

```bash
pnpm run dev
```

You should see output like:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Step 2: Open Application

1. Open your browser
2. Go to http://localhost:5173/
3. You should see the Spending Guardian homepage

### Step 3: Test User Registration

1. Click **"Get Started"** or **"Sign Up"**
2. Create a test account:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `Test123!@#`
3. Click **"Create Account"**
4. You should be redirected to the dashboard

### Step 4: Test Core Features

**Test Transactions:**
1. Go to "Transactions" page
2. Click "Add Transaction"
3. Fill in details and save
4. Verify transaction appears in list

**Test Budgets:**
1. Go to "Spending Limits" page
2. Click "Set Budget"
3. Create a budget for a category
4. Verify it appears and shows progress

**Test AI Chat:**
1. Click the chat icon (bottom right on desktop)
2. Type: "What's my spending this month?"
3. Verify AI responds with relevant information

**Test CSV Upload:**
1. Go to "Transactions" page
2. Click "Upload CSV"
3. Use the sample format provided
4. Verify transactions are imported

### Step 5: Check for Errors

Open browser console (F12) and check for:
- No red errors
- No authentication issues
- No API connection errors

If you see errors, refer to the [Troubleshooting](#troubleshooting) section.

---

## 7. Production Build

### Step 1: Run Linting

```bash
# Check for code quality issues
pnpm run lint
```

Fix any errors or warnings before proceeding.

### Step 2: Build for Production

```bash
# Create optimized production build
pnpm run build
```

This will:
- Compile TypeScript
- Bundle and minify JavaScript
- Optimize CSS
- Generate static assets
- Output to `dist/` directory

**Expected time:** 30-60 seconds

### Step 3: Test Production Build Locally

```bash
# Preview production build
pnpm run preview
```

Open http://localhost:4173/ and test the application again.

### Step 4: Verify Build Output

```bash
# Check build size
du -sh dist/
```

Typical size should be 2-5 MB. If significantly larger, investigate.

---

## 8. Deployment Options

Choose one of the following deployment platforms:

### Option A: Vercel (Recommended)

**Why Vercel:**
- Zero configuration for Vite apps
- Automatic HTTPS
- Global CDN
- Excellent performance
- Free tier generous

**Steps:**

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Choose your account
   - Link to existing project? **N**
   - Project name? `spending-guardian`
   - In which directory is your code? `./`
   - Want to override settings? **N**

4. **Set Environment Variables:**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   vercel env add VITE_GEMINI_API_KEY
   vercel env add VITE_APP_URL
   ```
   
   For each, paste the value and select "Production"

5. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

6. **Get Your URL:**
   - You'll receive a URL like: `https://spending-guardian.vercel.app`
   - Update `VITE_APP_URL` environment variable with this URL
   - Redeploy: `vercel --prod`

### Option B: Netlify

**Steps:**

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login:**
   ```bash
   netlify login
   ```

3. **Initialize:**
   ```bash
   netlify init
   ```

4. **Configure Build Settings:**
   - Build command: `pnpm run build`
   - Publish directory: `dist`

5. **Set Environment Variables:**
   - Go to Netlify dashboard
   - Site settings → Environment variables
   - Add all variables from your `.env` file

6. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

### Option C: Cloudflare Pages

**Steps:**

1. **Login to Cloudflare Dashboard:**
   - Go to https://dash.cloudflare.com/

2. **Create New Project:**
   - Pages → Create a project
   - Connect to Git or Direct Upload

3. **Configure Build:**
   - Build command: `pnpm run build`
   - Build output directory: `dist`
   - Root directory: `/`

4. **Set Environment Variables:**
   - Add all variables from `.env` file

5. **Deploy:**
   - Click "Save and Deploy"

---

## 9. Post-Deployment Configuration

### Step 1: Update Supabase Redirect URLs

1. Go to Supabase dashboard
2. **Authentication** → **URL Configuration**
3. Add your production URL to:
   - **Site URL:** `https://your-app.vercel.app`
   - **Redirect URLs:** `https://your-app.vercel.app/**`
4. Click "Save"

### Step 2: Configure CORS (if needed)

If you encounter CORS errors:

1. In Supabase dashboard, go to **Settings** → **API**
2. Add your domain to allowed origins
3. Save changes

### Step 3: Set Up Custom Domain (Optional)

**For Vercel:**
1. Go to project settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic)

**For Netlify:**
1. Go to Domain settings
2. Add custom domain
3. Configure DNS
4. SSL is automatic

### Step 4: Enable Analytics (Optional)

**Vercel Analytics:**
```bash
pnpm add @vercel/analytics
```

Add to `src/main.tsx`:
```typescript
import { inject } from '@vercel/analytics';
inject();
```

**Google Analytics:**
1. Create GA4 property
2. Add tracking code to `index.html`

---

## 10. Security Checklist

Before going live, verify:

### Authentication Security
- [ ] Email confirmation enabled in Supabase
- [ ] Strong password requirements enforced
- [ ] Rate limiting configured
- [ ] Session timeout configured

### API Security
- [ ] Environment variables properly set
- [ ] No API keys in client-side code
- [ ] CORS properly configured
- [ ] RLS policies tested and working

### Application Security
- [ ] HTTPS enabled (automatic with Vercel/Netlify)
- [ ] Content Security Policy headers set
- [ ] XSS protection enabled
- [ ] SQL injection prevention (using Supabase client)

### Data Security
- [ ] User data encrypted at rest (Supabase default)
- [ ] Sensitive data not logged
- [ ] Regular backups configured
- [ ] GDPR compliance considered

### Monitoring
- [ ] Error tracking set up (Sentry recommended)
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring configured
- [ ] Log aggregation set up

---

## 11. Monitoring & Maintenance

### Set Up Error Tracking

**Recommended: Sentry**

1. Sign up at https://sentry.io/
2. Create new project (React)
3. Install Sentry:
   ```bash
   pnpm add @sentry/react
   ```

4. Configure in `src/main.tsx`:
   ```typescript
   import * as Sentry from "@sentry/react";
   
   Sentry.init({
     dsn: "your-sentry-dsn",
     environment: import.meta.env.MODE,
     tracesSampleRate: 1.0,
   });
   ```

### Monitor Database Performance

1. In Supabase dashboard, go to **Database** → **Query Performance**
2. Check slow queries
3. Add indexes if needed
4. Monitor connection pool usage

### Set Up Uptime Monitoring

**Free Options:**
- UptimeRobot: https://uptimerobot.com/
- Pingdom: https://www.pingdom.com/
- StatusCake: https://www.statuscake.com/

Configure to check your site every 5 minutes.

### Regular Maintenance Tasks

**Weekly:**
- Check error logs
- Review user feedback
- Monitor API usage
- Check database size

**Monthly:**
- Review and optimize slow queries
- Update dependencies: `pnpm update`
- Review security advisories
- Backup database

**Quarterly:**
- Major dependency updates
- Security audit
- Performance optimization
- Feature usage analysis

---

## 12. Troubleshooting

### Common Issues and Solutions

#### Issue: "Failed to fetch" errors

**Cause:** Supabase credentials incorrect or CORS issue

**Solution:**
1. Verify `.env` file has correct Supabase URL and key
2. Check Supabase project is active
3. Verify redirect URLs in Supabase settings
4. Clear browser cache and reload

#### Issue: AI Chat not responding

**Cause:** Gemini API key invalid or quota exceeded

**Solution:**
1. Verify `VITE_GEMINI_API_KEY` in `.env`
2. Check API key is active in Google AI Studio
3. Check quota limits: https://aistudio.google.com/
4. Try regenerating API key

#### Issue: Authentication not working

**Cause:** Email confirmation required or RLS policies

**Solution:**
1. Check Supabase Auth settings
2. Disable email confirmation for testing
3. Verify RLS policies are created
4. Check browser console for specific errors

#### Issue: Transactions not saving

**Cause:** No default account or RLS policy issue

**Solution:**
1. Check if user has a default account
2. Verify RLS policies allow INSERT
3. Check browser console for errors
4. Test with Supabase SQL editor directly

#### Issue: Build fails

**Cause:** TypeScript errors or missing dependencies

**Solution:**
1. Run `pnpm run lint` to find issues
2. Fix TypeScript errors
3. Delete `node_modules` and reinstall: `rm -rf node_modules && pnpm install`
4. Clear build cache: `rm -rf dist`

#### Issue: Slow performance

**Cause:** Large dataset or missing indexes

**Solution:**
1. Add database indexes for frequently queried columns
2. Implement pagination for large lists
3. Optimize images and assets
4. Enable caching in deployment platform

#### Issue: Environment variables not working in production

**Cause:** Not set in deployment platform

**Solution:**
1. Verify all `VITE_*` variables are set in platform
2. Redeploy after setting variables
3. Check variable names match exactly (case-sensitive)
4. Restart deployment if needed

---

## 📞 Support Resources

### Documentation
- **Supabase Docs:** https://supabase.com/docs
- **Vite Docs:** https://vitejs.dev/
- **React Router:** https://reactrouter.com/
- **Tailwind CSS:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com/

### Community
- **Supabase Discord:** https://discord.supabase.com/
- **React Discord:** https://discord.gg/react
- **Stack Overflow:** Tag questions with `supabase`, `react`, `vite`

### Paid Support Options
- **Supabase Pro:** Includes priority support
- **Vercel Pro:** Includes support and advanced features

---

## 🎉 Congratulations!

You've successfully deployed Spending Guardian to production!

### Next Steps

1. **Share with users:** Get feedback and iterate
2. **Monitor usage:** Watch for errors and performance issues
3. **Add features:** Implement additional functionality
4. **Scale:** Upgrade plans as user base grows

### Recommended Enhancements

- **Email notifications:** Set up transactional emails
- **Mobile app:** Consider React Native version
- **Advanced analytics:** Add more insights and reports
- **Integrations:** Connect to banking APIs
- **Premium features:** Implement subscription model

---

## 📝 Deployment Checklist

Print this checklist and check off each item:

- [ ] Node.js and pnpm installed
- [ ] Code downloaded and dependencies installed
- [ ] Supabase project created
- [ ] Database schema executed
- [ ] Supabase credentials obtained
- [ ] Gemini API key obtained
- [ ] `.env` file created and configured
- [ ] Local testing completed successfully
- [ ] All features tested and working
- [ ] Production build created
- [ ] Deployment platform chosen
- [ ] Application deployed
- [ ] Environment variables set in production
- [ ] Supabase redirect URLs updated
- [ ] Custom domain configured (if applicable)
- [ ] Security checklist completed
- [ ] Error tracking set up
- [ ] Uptime monitoring configured
- [ ] Documentation reviewed
- [ ] Backup strategy implemented

---

## 📄 License & Credits

**Spending Guardian** - AI-Powered Personal Finance Management

Built with:
- React + TypeScript
- Supabase (Backend & Auth)
- Google Gemini AI
- Tailwind CSS + shadcn/ui
- Vite

---

**Last Updated:** 2025-12-20

**Version:** 1.0.0

**Need Help?** Review the troubleshooting section or consult the documentation links above.

---

Good luck with your deployment! 🚀
