# ⚡ Quick Deployment Checklist

Use this as a quick reference while deploying. For detailed instructions, see `PRODUCTION_DEPLOYMENT_GUIDE.md`.

---

## 🔧 Prerequisites Setup

```bash
# 1. Install Node.js (v18+)
node --version

# 2. Install pnpm
npm install -g pnpm
pnpm --version

# 3. Install dependencies
pnpm install
```

---

## 🗄️ Supabase Setup

1. **Create Project:** https://supabase.com/dashboard
   - Name: `spending-guardian`
   - Save database password!

2. **Get Credentials:** Settings → API
   - Copy Project URL
   - Copy anon/public key
   - Copy service_role key (keep secret!)

3. **Run SQL Schema:** SQL Editor → New Query
   - Copy entire schema from `PRODUCTION_DEPLOYMENT_GUIDE.md` section 3.3
   - Click "Run"

4. **Configure Auth:** Authentication → Providers
   - Enable Email provider
   - (Optional) Enable Google OAuth

---

## 🤖 Gemini AI Setup

1. **Get API Key:** https://aistudio.google.com/
   - Click "Get API Key"
   - Create API key
   - Copy and save securely

---

## ⚙️ Environment Configuration

Create `.env` file in project root:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_GEMINI_API_KEY=AIzaxxx...
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME=Spending Guardian
```

---

## 🧪 Local Testing

```bash
# Start dev server
pnpm run dev

# Open browser
# http://localhost:5173/

# Test:
# - Sign up new user
# - Add transaction
# - Create budget
# - Test AI chat
# - Upload CSV
```

---

## 🏗️ Production Build

```bash
# Lint code
pnpm run lint

# Build for production
pnpm run build

# Preview build
pnpm run preview
```

---

## 🚀 Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_GEMINI_API_KEY
vercel env add VITE_APP_URL

# Deploy to production
vercel --prod
```

---

## 🔒 Post-Deployment

1. **Update Supabase URLs:**
   - Authentication → URL Configuration
   - Add production URL: `https://your-app.vercel.app`
   - Add redirect: `https://your-app.vercel.app/**`

2. **Update Environment:**
   - Change `VITE_APP_URL` to production URL
   - Redeploy: `vercel --prod`

3. **Test Production:**
   - Sign up new user
   - Test all features
   - Check browser console for errors

---

## ✅ Security Checklist

- [ ] Email confirmation enabled
- [ ] Environment variables set correctly
- [ ] No API keys in code
- [ ] HTTPS enabled
- [ ] RLS policies working
- [ ] CORS configured
- [ ] Error tracking set up
- [ ] Uptime monitoring configured

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "Failed to fetch" | Check Supabase credentials in `.env` |
| AI not responding | Verify Gemini API key |
| Auth not working | Check Supabase Auth settings |
| Build fails | Run `pnpm run lint` and fix errors |
| Env vars not working | Set in deployment platform, redeploy |

---

## 📚 Full Documentation

For detailed step-by-step instructions, see:
- **`PRODUCTION_DEPLOYMENT_GUIDE.md`** - Complete deployment guide
- **`README.md`** - Project overview and features

---

## 🎯 Deployment Time Estimate

- **Prerequisites:** 10 minutes
- **Supabase Setup:** 15 minutes
- **Gemini Setup:** 5 minutes
- **Local Testing:** 10 minutes
- **Deployment:** 10 minutes
- **Post-Deployment:** 5 minutes

**Total:** ~55 minutes (first time)

---

**Quick Links:**
- Supabase: https://supabase.com/dashboard
- Google AI Studio: https://aistudio.google.com/
- Vercel: https://vercel.com/dashboard

---

Good luck! 🚀
