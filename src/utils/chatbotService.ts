import { transactionApi } from '@/db/api';
import { Transaction } from '@/types/types';
import { format } from 'date-fns';

/* ==========================================
   TYPES
   ========================================== */

interface CategorySummary {
  [category: string]: number;
}

interface PeriodSummary {
  income: number;
  expense: number;
  savings: number;
  topCategories: CategorySummary;
  transactionCount: number;
}

export interface FinancialContext {
  monthly: Record<string, PeriodSummary>; // "2025-03"
  yearly: Record<string, PeriodSummary>;  // "2025"
  overall: PeriodSummary;
}

/* ==========================================
   1. DATA AGGREGATION (THE BRAIN)
   ========================================== */

/**
 * ✅ MUST BE EXPORTED (THIS FIXES YOUR ERROR)
 */
export async function buildFinancialContext(): Promise<FinancialContext> {
  const transactions: Transaction[] = await transactionApi.getAll();

  const initPeriod = (): PeriodSummary => ({
    income: 0,
    expense: 0,
    savings: 0,
    topCategories: {},
    transactionCount: 0,
  });

  const ctx: FinancialContext = {
    monthly: {},
    yearly: {},
    overall: initPeriod(),
  };

  for (const t of transactions) {
    if (!t.date) continue;

    const date = new Date(t.date);
    const monthKey = format(date, 'yyyy-MM');
    const yearKey = format(date, 'yyyy');
    const amount = Number(t.amount) || 0;
    const category = t.category || 'Uncategorized';

    if (!ctx.monthly[monthKey]) ctx.monthly[monthKey] = initPeriod();
    if (!ctx.yearly[yearKey]) ctx.yearly[yearKey] = initPeriod();

    // ---------- OVERALL ----------
    ctx.overall.transactionCount++;
    if (t.type === 'income') {
      ctx.overall.income += amount;
      ctx.overall.savings += amount;
    } else {
      ctx.overall.expense += amount;
      ctx.overall.savings -= amount;
      ctx.overall.topCategories[category] =
        (ctx.overall.topCategories[category] || 0) + amount;
    }

    // ---------- MONTHLY ----------
    ctx.monthly[monthKey].transactionCount++;
    if (t.type === 'income') {
      ctx.monthly[monthKey].income += amount;
      ctx.monthly[monthKey].savings += amount;
    } else {
      ctx.monthly[monthKey].expense += amount;
      ctx.monthly[monthKey].savings -= amount;
      ctx.monthly[monthKey].topCategories[category] =
        (ctx.monthly[monthKey].topCategories[category] || 0) + amount;
    }

    // ---------- YEARLY ----------
    ctx.yearly[yearKey].transactionCount++;
    if (t.type === 'income') {
      ctx.yearly[yearKey].income += amount;
      ctx.yearly[yearKey].savings += amount;
    } else {
      ctx.yearly[yearKey].expense += amount;
      ctx.yearly[yearKey].savings -= amount;
      ctx.yearly[yearKey].topCategories[category] =
        (ctx.yearly[yearKey].topCategories[category] || 0) + amount;
    }
  }

  return ctx;
}

/* ==========================================
   2. CONTEXT → PROMPT (TRANSLATOR)
   ========================================== */

function formatTopCategories(cats: CategorySummary): string {
  const entries = Object.entries(cats);
  if (entries.length === 0) return 'No major categories';

  return entries
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name, amt]) => `${name}: ₹${Math.round(amt)}`)
    .join(', ');
}

function generateSystemPrompt(ctx: FinancialContext): string {
  let prompt = `
You are **Expenzo**, a confident AI financial analyst.

You have FULL access to the user's financial history.
You MUST use category-level data when answering questions about "where" money was spent.

🚫 ABSOLUTE RULES (NO EXCEPTIONS):
- NEVER answer "where did I spend the most" using MONTHS
- NEVER say "I lack category data" if topCategories exist
- NEVER switch interpretation unless explicitly asked

INTENT INTERPRETATION (VERY IMPORTANT):

If the user asks:
• "Where did I spend the most this year?"
• "Biggest expense this year"
• "What do I spend most on?"

→ INTERPRET AS:
👉 Highest SPENDING CATEGORY (NOT month)

If the user asks:
• "Which month did I spend the most?"
→ THEN talk about months.

====================
OVERALL DATA
====================
Income: ₹${ctx.overall.income}
Expense: ₹${ctx.overall.expense}
Savings: ₹${ctx.overall.savings}
Top Categories: ${formatTopCategories(ctx.overall.topCategories)}

====================
YEARLY CATEGORY DATA
====================
`;

  Object.keys(ctx.yearly)
    .sort()
    .forEach(year => {
      const y = ctx.yearly[year];
      prompt += `
${year}:
- Income: ₹${y.income}
- Expense: ₹${y.expense}
- Savings: ₹${y.savings}
- Category Breakdown: ${formatTopCategories(y.topCategories) || 'Evenly distributed'}
`;
    });

  prompt += `
====================
MONTHLY CATEGORY DATA
====================
`;

  Object.keys(ctx.monthly)
    .sort()
    .reverse()
    .forEach(month => {
      const m = ctx.monthly[month];
      prompt += `
${month}:
- Income: ₹${m.income}
- Expense: ₹${m.expense}
- Savings: ₹${m.savings}
- Category Breakdown: ${formatTopCategories(m.topCategories) || 'Mixed'}
`;
    });

  prompt += `
====================
HOW TO ANSWER
====================

1. For "Where did I spend the most this year?":
   - Pick the highest category from YEARLY category data
   - Mention the amount
   - Add 1 short insight (habit or concern)

2. For "Where did I spend the most in May 2025?":
   - Use MONTHLY category data for that month

3. If spending is spread:
   - Say "Your spending was spread out, but X was the largest share"

4. NEVER say:
   - "I lack data"
   - "I cannot determine"
   - "Category data is unavailable"

5. Keep answers:
   - 3–5 lines
   - Insightful
   - Confident
   - Human

Currency format: ₹ INR only.
Tone: smart, trustworthy, helpful.
`;

  return prompt;
}



/* ==========================================
   3. MAIN CHAT HANDLER
   ========================================== */

export async function generateChatResponse(userMessage: string): Promise<string> {
  try {
    const context = await buildFinancialContext();
    const systemPrompt = generateSystemPrompt(context);

    const finalPrompt = `
${systemPrompt}

USER QUESTION:
"${userMessage}"
`;

    return await generateAIResponse(finalPrompt);

  } catch (error) {
    console.error('Chatbot Error:', error);
    return 'I’m having trouble analysing your finances right now 😅 Please try again in a moment.';
  }
}
