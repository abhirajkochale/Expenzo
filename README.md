

# Spending Guardian

**"Predict overspending early and guide users with calm, empathetic, explainable insights before regret happens."**

An AI-powered personal finance web application that focuses on **prediction over reporting** and **guidance over judgment**. Built for Google Developer Hackathon with Responsible AI principles at its core.

## 🏆 Hackathon Ready

Spending Guardian is now optimized for hackathon demo with:
- ✅ **Explainable AI** - Every insight includes "Why am I seeing this?"
- ✅ **AI Confidence Indicators** - Transparent confidence levels (High/Medium/Low)
- ✅ **Spending Forecast** - Predictive "Comfortable/Tight/Risky" status
- ✅ **Calm Language** - Supportive, non-judgmental tone throughout
- ✅ **Production Ready** - Professional UI, full responsiveness, complete features

### 🎯 What Makes This Different

**Traditional Finance Apps** focus on reporting what happened. **Spending Guardian** predicts what's ahead and helps you adjust before regret happens.

| Traditional Apps | Spending Guardian |
|-----------------|-------------------|
| "You overspent by ₹500" | "You're ₹500 over your usual limit" |
| Black-box insights | "Why am I seeing this?" explainability |
| Strict budgets | Flexible spending limits |
| Peer comparisons | Personal baselines only |
| Judgmental tone | Calm, supportive guidance |

## ✨ Key Features

### 1. **Explainable AI System**
Every AI-generated insight includes a detailed explanation:
- What data was analyzed
- What pattern was detected
- Why this insight matters now
- Confidence level and factors

### 2. **Spending Forecast Card**
Lightweight prediction showing where your week is heading:
- **Comfortable**: On track with your normal pace
- **Tight**: Spending a bit faster than usual
- **Risky**: At this pace, you might overspend

### 3. **AI Confidence Indicators**
Transparent confidence levels on every insight:
- **High**: "I have enough data to be confident"
- **Medium**: "I'm fairly confident, but more data would help"
- **Low**: "I'm still learning your patterns"

### 4. **Calm, Supportive Language**
- No judgment, no shame
- "This often happens" instead of "You should"
- "Small changes could help" instead of "You must"
- Optional limits, not strict budgets

## Features

### ✅ Implemented
- **Pre-Login Experience**
  - Professional homepage with clear value proposition
  - "How It Works" section explaining the process
  - Privacy & trust messaging
  - Dark/Light mode toggle

- **Authentication System**
  - Simplified signup (username + password only)
  - Friendly error messages in plain English
  - Sign-out confirmation dialog
  - Secure authentication via Supabase
  - Role-based access control (user/admin)

- **Dashboard**
  - **Spending Forecast Card** (NEW) - Predictive weekly status
  - **Guardian Insight** with explainability (UPGRADED)
  - Collapsible "Your Numbers" section (reduced density)
  - Monthly financial overview
  - Top spending categories
  - Recent transactions feed

- **Transaction Management**
  - Add, view, and delete transactions
  - SMS parsing with AI
  - CSV import support
  - Category-based organization
  - Income and expense tracking
  - Merchant tagging
  - Payment mode tracking

- **Spending Limits** (formerly "Budgets & Goals")
  - Optional spending limits per category
  - Flexible, non-judgmental language
  - Savings goals tracking
  - Progress visualization
  - Gentle over-limit notifications
  - Savings goals with progress tracking
  - Visual progress indicators
  - Overspend warnings

- **Patterns** (formerly "Insights & Reports")
  - Monthly spending breakdown
  - Category analysis
  - Trend visualization
  - AI-generated summaries with explanations

- **Guardian Rules** (formerly "Smart Rules")
  - Budget threshold warnings
  - Custom spending rules
  - Automated notifications
  - Advisory tone, not mechanical

- **AI Guardian Chat**
  - Conversational financial advisor
  - Natural language queries
  - Spending pattern explanations
  - Budget adjustment suggestions

- **Admin Panel**
  - User management
  - Role assignment
  - System overview

- **Settings**
  - Profile information
  - Preferences management
  - Theme toggle (light/dark mode)

## 🎯 Responsible AI Principles

Spending Guardian follows Google's Responsible AI principles:

1. **Explainability**: Every AI insight can be explained in plain English
2. **Transparency**: Confidence levels shown, data sources disclosed
3. **Fairness**: Personal baselines only, no peer comparisons
4. **Privacy**: No external data sharing, user-controlled
5. **Accountability**: Clear about what AI can and cannot do
6. **Honesty**: Low confidence insights explicitly say so

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI Framework**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **AI Integration**: Google Gemini API (with explainability)
- **State Management**: React Context + Hooks
- **Forms**: React Hook Form + Zod validation
- **Date Handling**: date-fns

## Color Philosophy

**Guidance-Focused Palette**:
- **Purple**: Guidance and navigation
- **Amber/Orange**: Attention (not alarm)
- **Green**: Positive reinforcement
- **Red**: Reserved for critical actions only

## Getting Started

### Quick Start

For a complete step-by-step deployment guide, see:
- **📘 [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md)** - Comprehensive deployment instructions
- **⚡ [QUICK_DEPLOYMENT_CHECKLIST.md](./QUICK_DEPLOYMENT_CHECKLIST.md)** - Quick reference checklist

### Prerequisites

- Node.js 18+ and pnpm
- Supabase account
- Google Gemini API key

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME=Spending Guardian
```

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Start the development server:
```bash
pnpm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### First Time Setup

1. Sign up with a username and password
2. Complete the onboarding questionnaire
3. The first user will automatically become an admin
4. Start adding transactions to see your financial overview

## Project Structure

```
src/
├── components/
│   ├── common/          # Shared components (RouteGuard, ThemeToggle)
│   ├── dashboard/       # Dashboard-specific components
│   ├── layouts/         # Layout components (Header, Sidebar, MainLayout)
│   ├── transactions/    # Transaction management components
│   └── ui/             # shadcn/ui components
├── contexts/           # React contexts (AuthContext)
├── db/                 # Database API layer
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # External services (AI service)
├── types/              # TypeScript type definitions
└── lib/                # Utility functions

supabase/
└── migrations/         # Database migrations
```

## Database Schema

### Tables
- `profiles` - User profiles and preferences
- `accounts` - User financial accounts
- `transactions` - Income and expense records
- `budgets` - Monthly budget limits per category
- `goals` - Savings goals with targets
- `rules` - Smart spending rules
- `notifications` - System notifications
- `ai_explanations` - AI-generated insights

### Views
- `v_monthly_summary` - Aggregated monthly financial data
- `v_category_spend` - Category-wise spending analysis
- `v_recurring_merchants` - Recurring transaction detection

## Security

- Row Level Security (RLS) policies on all tables
- Users can only access their own data
- Admins have full read/write access
- Secure authentication via Supabase Auth
- Environment variables for sensitive keys

## Development

### Running Linter
```bash
pnpm run lint
```

### Building for Production
```bash
pnpm run build
```

## Contributing

This is a personal finance application. Contributions are welcome!

## License

MIT License - See LICENSE file for details

## Support

For issues and questions, please open an issue on the repository.

---

Built with ❤️ using React, Supabase, and shadcn/ui
