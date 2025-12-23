/**
 * Guardian Insight Generator
 * Generates proactive AI insights based on transaction data
 * Focus: Prediction over reporting, guidance over judgment
 */

import { Transaction, CategoryType, CATEGORY_METADATA } from '@/types/types';
import { subDays, isAfter, isBefore } from 'date-fns';
import { GuardianInsight } from '@/components/dashboard/GuardianInsightCard';
import { calculateConfidence, generateExplanation } from './aiConfidence';

interface SpendingAnalysis {
  weeklySpending: Map<CategoryType, number>;
  previousWeeklySpending: Map<CategoryType, number>;
  monthlySpending: Map<CategoryType, number>;
  totalIncome: number;
  totalExpenses: number;
  savingsRate: number;
}

/**
 * Analyze transactions for the past 30 days
 */
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

    // Monthly totals
    if (isAfter(txnDate, thirtyDaysAgo)) {
      if (txn.type === 'income') {
        totalIncome += txn.amount;
      } else {
        totalExpenses += txn.amount;
        const current = monthlySpending.get(txn.category) || 0;
        monthlySpending.set(txn.category, current + txn.amount);
      }
    }

    // Weekly spending (last 7 days)
    if (txn.type === 'expense' && isAfter(txnDate, sevenDaysAgo)) {
      const current = weeklySpending.get(txn.category) || 0;
      weeklySpending.set(txn.category, current + txn.amount);
    }

    // Previous week spending (7-14 days ago)
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

/**
 * Generate a guardian insight based on transaction analysis
 * Uses calm, supportive, non-judgmental language
 */
export function generateGuardianInsight(transactions: Transaction[]): GuardianInsight {
  if (transactions.length === 0) {
    return {
      type: 'info',
      title: 'Welcome to Expenso!',
      message: "Add a few transactions and I'll start noticing patterns that might help you.",
      icon: 'sparkles',
      emoji: '👋',
    };
  }

  const analysis = analyzeTransactions(transactions);
  
  // Calculate confidence
  const confidence = calculateConfidence({
    transactionCount: transactions.length,
    daysOfData: 30,
    categoryConsistency: 0.7,
    patternStrength: 0.8,
  });

  // Priority 1: Check for positive changes (celebrate, don't judge)
  for (const [category, weeklyAmount] of analysis.weeklySpending.entries()) {
    const previousAmount = analysis.previousWeeklySpending.get(category) || 0;
    
    if (previousAmount > 0) {
      const savings = previousAmount - weeklyAmount;
      const savingsPercent = (savings / previousAmount) * 100;

      // If spending is lower than usual
      if (savingsPercent > 20 && savings > 200) {
        const categoryMeta = CATEGORY_METADATA[category];
        const explanation = generateExplanation({
          insightType: 'pattern',
          category: categoryMeta.label,
          amount: weeklyAmount,
          baseline: previousAmount,
          timeframe: 'week',
          confidence,
        });
        
        return {
          type: 'success',
          title: `Your ${categoryMeta.label.toLowerCase()} spending is lower than usual`,
          message: `You spent ₹${Math.round(savings)} less this week. Whatever you're doing, it's working!`,
          icon: 'trending-down',
          emoji: categoryMeta.icon,
          explanation,
        };
      }
    }
  }

  // Priority 2: Gentle heads-up about spending increases
  for (const [category, weeklyAmount] of analysis.weeklySpending.entries()) {
    const previousAmount = analysis.previousWeeklySpending.get(category) || 0;
    
    if (previousAmount > 0) {
      const increase = weeklyAmount - previousAmount;
      const increasePercent = (increase / previousAmount) * 100;

      // If spending increased significantly
      if (increasePercent > 30 && increase > 300) {
        const categoryMeta = CATEGORY_METADATA[category];
        const explanation = generateExplanation({
          insightType: 'category_spike',
          category: categoryMeta.label,
          amount: weeklyAmount,
          baseline: previousAmount,
          timeframe: 'week',
          confidence,
        });
        
        return {
          type: 'warning',
          title: `Your ${categoryMeta.label.toLowerCase()} spending is higher than usual`,
          message: `You spent ₹${Math.round(increase)} more this week. This often happens—just wanted you to know.`,
          icon: 'trending-up',
          emoji: categoryMeta.icon,
          explanation,
        };
      }
    }
  }

  // Priority 3: Positive reinforcement for good savings
  if (analysis.savingsRate > 30) {
    const explanation = generateExplanation({
      insightType: 'pattern',
      timeframe: 'month',
      confidence,
    });
    
    return {
      type: 'achievement',
      title: `You're saving ${Math.round(analysis.savingsRate)}% of your income`,
      message: `That's ₹${Math.round(analysis.totalIncome - analysis.totalExpenses)} this month. You're doing great!`,
      icon: 'check',
      emoji: '🎉',
      explanation,
    };
  }

  // Priority 4: Gentle nudge about low savings (not judgmental)
  if (analysis.savingsRate < 10 && analysis.totalIncome > 0) {
    const explanation = generateExplanation({
      insightType: 'overspending',
      timeframe: 'month',
      baseline: analysis.totalIncome * 0.2,
      confidence,
    });
    
    return {
      type: 'warning',
      title: 'Your spending is close to your income',
      message: `You're saving about ${Math.round(analysis.savingsRate)}% right now. Small changes could help you build a cushion.`,
      icon: 'alert',
      emoji: '💡',
      explanation,
    };
  }

  // Priority 5: Neutral observation about top category
  const topCategory = Array.from(analysis.monthlySpending.entries()).sort((a, b) => b[1] - a[1])[0];
  if (topCategory) {
    const [category, amount] = topCategory;
    const categoryMeta = CATEGORY_METADATA[category];
    const percentOfExpenses = (amount / analysis.totalExpenses) * 100;
    
    const explanation = generateExplanation({
      insightType: 'pattern',
      category: categoryMeta.label,
      amount,
      timeframe: 'month',
      confidence,
    });

    return {
      type: 'info',
      title: `Most of your spending goes to ${categoryMeta.label.toLowerCase()}`,
      message: `That's ₹${Math.round(amount)} this month, or about ${Math.round(percentOfExpenses)}% of what you spend. Just so you know.`,
      icon: 'sparkles',
      emoji: categoryMeta.icon,
      explanation,
    };
  }

  // Default insight
  return {
    type: 'info',
    title: "I'm learning your patterns",
    message: `You've logged ${transactions.length} transactions. The more data I have, the better I can help you spot things early.`,
    icon: 'sparkles',
    emoji: '📊',
  };
}

/**
 * Generate multiple insights for variety
 */
export function generateMultipleInsights(transactions: Transaction[]): GuardianInsight[] {
  const insights: GuardianInsight[] = [];
  const analysis = analyzeTransactions(transactions);

  // Savings achievements
  for (const [category, weeklyAmount] of analysis.weeklySpending.entries()) {
    const previousAmount = analysis.previousWeeklySpending.get(category) || 0;
    
    if (previousAmount > 0) {
      const savings = previousAmount - weeklyAmount;
      const savingsPercent = (savings / previousAmount) * 100;

      if (savingsPercent > 15 && savings > 150) {
        const categoryMeta = CATEGORY_METADATA[category];
        insights.push({
          type: 'success',
          title: `Saved ₹${Math.round(savings)} on ${categoryMeta.label}`,
          message: `Down ${Math.round(savingsPercent)}% from last week!`,
          icon: 'trending-down',
          emoji: categoryMeta.icon,
        });
      }
    }
  }

  // Spending warnings
  for (const [category, weeklyAmount] of analysis.weeklySpending.entries()) {
    const previousAmount = analysis.previousWeeklySpending.get(category) || 0;
    
    if (previousAmount > 0) {
      const increase = weeklyAmount - previousAmount;
      const increasePercent = (increase / previousAmount) * 100;

      if (increasePercent > 25 && increase > 250) {
        const categoryMeta = CATEGORY_METADATA[category];
        insights.push({
          type: 'warning',
          title: `${categoryMeta.label} up ${Math.round(increasePercent)}%`,
          message: `₹${Math.round(increase)} more than last week`,
          icon: 'trending-up',
          emoji: categoryMeta.icon,
        });
      }
    }
  }

  // Savings rate
  if (analysis.savingsRate > 25) {
    insights.push({
      type: 'achievement',
      title: `${Math.round(analysis.savingsRate)}% savings rate!`,
      message: 'You\'re doing great!',
      icon: 'check',
      emoji: '🎉',
    });
  }

  return insights.length > 0 ? insights : [generateGuardianInsight(transactions)];
}
