import { Transaction, CategoryType, CATEGORY_METADATA } from '@/types/types';
import { subDays, isAfter, isBefore } from 'date-fns';
import { GuardianInsight } from '@/components/dashboard/GuardianInsightCard';
import { calculateConfidence, generateExplanation } from './aiConfidence';

// Helper to satisfy strict TypeScript requirements
const getConfidence = (level: 'low' | 'medium' | 'high', score: number) => ({
  level,
  score,
  factors: {
    dataCompleteness: 1.0,
    historicalConsistency: 0.9,
    categoryConsistency: 0.85,
    patternStrength: 0.9
  }
});

interface SpendingAnalysis {
  weeklySpending: Map<CategoryType, number>;
  previousWeeklySpending: Map<CategoryType, number>;
  monthlySpending: Map<CategoryType, number>;
  totalIncome: number;
  totalExpenses: number;
  savingsRate: number;
}

function analyzeTransactions(transactions: Transaction[]): SpendingAnalysis {
  const today = new Date();
  const sevenDaysAgo = subDays(today, 7);
  const fourteenDaysAgo = subDays(today, 14);
  const thirtyDaysAgo = subDays(today, 30);

  const weeklySpending = new Map<CategoryType, number>();
  const previousWeeklySpending = new Map<CategoryType, number>();
  const monthlySpending = new Map<CategoryType, number>();

  let totalIncome = 0;
  let totalExpenses = 0;

  transactions.forEach(txn => {
    const txnDate = new Date(txn.date);

    if (isAfter(txnDate, thirtyDaysAgo)) {
      if (txn.type === 'income') {
        totalIncome += txn.amount;
      } else {
        totalExpenses += txn.amount;
        const current = monthlySpending.get(txn.category) || 0;
        monthlySpending.set(txn.category, current + txn.amount);
      }
    }

    if (txn.type === 'expense' && isAfter(txnDate, sevenDaysAgo)) {
      const current = weeklySpending.get(txn.category) || 0;
      weeklySpending.set(txn.category, current + txn.amount);
    }

    if (
      txn.type === 'expense' &&
      isAfter(txnDate, fourteenDaysAgo) &&
      isBefore(txnDate, sevenDaysAgo)
    ) {
      const current = previousWeeklySpending.get(txn.category) || 0;
      previousWeeklySpending.set(txn.category, current + txn.amount);
    }
  });

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  return {
    weeklySpending,
    previousWeeklySpending,
    monthlySpending,
    totalIncome,
    totalExpenses,
    savingsRate,
  };
}

export function generateGuardianInsight(transactions: Transaction[]): GuardianInsight {
  if (!transactions || transactions.length === 0) {
    return {
      type: 'info',
      title: 'Welcome to Expenzo!',
      message: "Add a few transactions and I'll start noticing patterns that might help you.",
      icon: 'sparkles',
      emoji: '👋',
    };
  }

  const analysis = analyzeTransactions(transactions);
  
  const baseConfidence = calculateConfidence({
    transactionCount: transactions.length,
    daysOfData: 30,
    categoryConsistency: 0.7,
    patternStrength: 0.8,
  });

  // 1. Large Transaction
  const recentBigTxn = transactions.find(t => 
    t.type === 'expense' && 
    Number(t.amount) > 5000 && 
    isAfter(new Date(t.date), subDays(new Date(), 7))
  );

  if (recentBigTxn) {
    const categoryMeta = CATEGORY_METADATA[recentBigTxn.category] || { label: 'General', icon: '💸' };
    return {
      type: 'info',
      title: 'Large Transaction Detected',
      message: `We noticed a payment of ₹${Number(recentBigTxn.amount).toLocaleString()} for "${recentBigTxn.description || categoryMeta.label}".`,
      icon: 'sparkles',
      emoji: '👀',
      explanation: {
          confidence: getConfidence('medium', 0.8),
          dataUsed: ['Recent transactions', 'Amount threshold analysis'],
          patternDetected: 'Single large outlier transaction',
          whyNow: 'This transaction occurred within the last 7 days.'
      }
    };
  }

  // 2. Dangerous Ratio
  for (const [category, amount] of analysis.monthlySpending.entries()) {
    if (analysis.totalExpenses > 0 && (amount / analysis.totalExpenses) > 0.40 && amount > 2000) {
      const categoryMeta = CATEGORY_METADATA[category] || { label: category, icon: '⚠️' };
      return {
        type: 'warning',
        title: `High Spend in ${categoryMeta.label}`,
        message: `You've spent ₹${amount.toLocaleString()} on ${categoryMeta.label.toLowerCase()} this month.`,
        icon: 'alert',
        emoji: '🚨',
        explanation: {
            confidence: getConfidence('high', 0.95),
            dataUsed: ['Monthly category totals', 'Total expense ratio'],
            patternDetected: 'Category dominance > 40%',
            whyNow: 'Spending in this category has exceeded safe diversity limits.'
        }
      };
    }
  }

  // 3. Weekly Spike
  for (const [category, weeklyAmount] of analysis.weeklySpending.entries()) {
    const previousAmount = analysis.previousWeeklySpending.get(category) || 0;
    
    if (previousAmount > 500) { 
      const increase = weeklyAmount - previousAmount;
      const increasePercent = (increase / previousAmount) * 100;

      if (increasePercent > 30) {
        const categoryMeta = CATEGORY_METADATA[category];
        return {
          type: 'warning',
          title: `Your ${categoryMeta.label.toLowerCase()} spending spiked`,
          message: `You spent ₹${Math.round(increase)} more this week compared to last week.`,
          icon: 'trending-up',
          emoji: categoryMeta.icon,
          explanation: {
            confidence: getConfidence('medium', 0.85),
            dataUsed: ['Weekly comparison', 'Category history'],
            patternDetected: 'Sudden velocity increase',
            whyNow: `Spending velocity increased by ${Math.round(increasePercent)}% this week.`
          }
        };
      }
    }
  }

  // 4. Positive Change
  for (const [category, weeklyAmount] of analysis.weeklySpending.entries()) {
    const previousAmount = analysis.previousWeeklySpending.get(category) || 0;
    
    if (previousAmount > 1000) {
      const savings = previousAmount - weeklyAmount;
      const savingsPercent = (savings / previousAmount) * 100;

      if (savingsPercent > 20) {
        const categoryMeta = CATEGORY_METADATA[category];
        return {
          type: 'success',
          title: `Your ${categoryMeta.label.toLowerCase()} spending dropped!`,
          message: `You spent ₹${Math.round(savings)} less this week.`,
          icon: 'trending-down',
          emoji: categoryMeta.icon,
          explanation: {
            confidence: getConfidence('high', 0.9),
            dataUsed: ['Weekly comparison', 'Category history'],
            patternDetected: 'Positive spending reduction',
            whyNow: `You successfully reduced spending by ${Math.round(savingsPercent)}%.`
          }
        };
      }
    }
  }

  // 5. Achievement
  if (analysis.savingsRate > 30) {
    return {
      type: 'achievement',
      title: `You're saving ${Math.round(analysis.savingsRate)}% of your income`,
      message: `That's a surplus of ₹${Math.round(analysis.totalIncome - analysis.totalExpenses)} this month.`,
      icon: 'check',
      emoji: '🏆',
      explanation: {
        confidence: getConfidence('high', 0.95),
        dataUsed: ['Income vs Expense', 'Monthly totals'],
        patternDetected: 'High savings rate',
        whyNow: 'Your income to expense ratio is exceptionally healthy this month.'
      }
    };
  }

  // 6. Frugal Mode
  if (analysis.totalExpenses > 0 && analysis.totalExpenses < 5000 && transactions.length > 5) {
     return {
        type: 'achievement',
        title: 'Frugal Month!',
        message: `Your total spending is remarkably low (₹${analysis.totalExpenses.toLocaleString()}).`,
        icon: 'check',
        emoji: '🛡️',
        explanation: {
            confidence: getConfidence('high', 0.9),
            dataUsed: ['Total monthly outflow'],
            patternDetected: 'Low spending velocity',
            whyNow: 'Your total expenses are significantly below average.'
        }
     };
  }

  // Default
  return {
    type: 'info',
    title: 'All Systems Nominal',
    message: 'No anomalies detected in your recent transactions.',
    icon: 'check',
    emoji: '✅',
  };
}

export function generateMultipleInsights(transactions: Transaction[]): GuardianInsight[] {
  return [generateGuardianInsight(transactions)];
}