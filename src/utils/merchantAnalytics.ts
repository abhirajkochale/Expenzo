/**
 * Merchant Analytics Utility
 * Analyzes spending patterns for specific merchants
 */

import { Transaction } from '@/types/types';
import { subDays, isAfter } from 'date-fns';

export interface MerchantAnalytics {
  merchantName: string;
  totalSpent: number;
  transactionCount: number;
  averageAmount: number;
  firstTransaction: string;
  lastTransaction: string;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  monthlyAverage: number;
  aiSuggestion: string;
}

/**
 * Calculate analytics for a specific merchant
 */
export function calculateMerchantAnalytics(
  merchantName: string,
  allTransactions: Transaction[]
): MerchantAnalytics {
  // Filter transactions for this merchant
  const merchantTransactions = allTransactions.filter(
    txn =>
      txn.type === 'expense' &&
      (txn.merchant?.toLowerCase() === merchantName.toLowerCase() ||
        txn.description?.toLowerCase().includes(merchantName.toLowerCase()))
  );

  if (merchantTransactions.length === 0) {
    return {
      merchantName,
      totalSpent: 0,
      transactionCount: 0,
      averageAmount: 0,
      firstTransaction: '',
      lastTransaction: '',
      trend: 'stable',
      trendPercent: 0,
      monthlyAverage: 0,
      aiSuggestion: 'No transactions found for this merchant.',
    };
  }

  // Sort by date
  const sorted = [...merchantTransactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const totalSpent = merchantTransactions.reduce((sum, txn) => sum + txn.amount, 0);
  const transactionCount = merchantTransactions.length;
  const averageAmount = totalSpent / transactionCount;
  const firstTransaction = sorted[0].date;
  const lastTransaction = sorted[sorted.length - 1].date;

  // Calculate trend (last 30 days vs previous 30 days)
  const today = new Date();
  const thirtyDaysAgo = subDays(today, 30);
  const sixtyDaysAgo = subDays(today, 60);

  const last30Days = merchantTransactions.filter(
    txn => isAfter(new Date(txn.date), thirtyDaysAgo)
  );
  const previous30Days = merchantTransactions.filter(
    txn =>
      isAfter(new Date(txn.date), sixtyDaysAgo) &&
      !isAfter(new Date(txn.date), thirtyDaysAgo)
  );

  const last30DaysSpend = last30Days.reduce((sum, txn) => sum + txn.amount, 0);
  const previous30DaysSpend = previous30Days.reduce((sum, txn) => sum + txn.amount, 0);

  let trend: 'up' | 'down' | 'stable' = 'stable';
  let trendPercent = 0;

  if (previous30DaysSpend > 0) {
    const change = last30DaysSpend - previous30DaysSpend;
    trendPercent = (change / previous30DaysSpend) * 100;

    if (trendPercent > 10) trend = 'up';
    else if (trendPercent < -10) trend = 'down';
  }

  // Calculate monthly average
  const daysSinceFirst =
    (today.getTime() - new Date(firstTransaction).getTime()) / (1000 * 60 * 60 * 24);
  const monthsSinceFirst = Math.max(daysSinceFirst / 30, 1);
  const monthlyAverage = totalSpent / monthsSinceFirst;

  // Generate AI suggestion
  const aiSuggestion = generateMerchantSuggestion(
    merchantName,
    totalSpent,
    transactionCount,
    averageAmount,
    trend,
    trendPercent,
    monthlyAverage
  );

  return {
    merchantName,
    totalSpent,
    transactionCount,
    averageAmount,
    firstTransaction,
    lastTransaction,
    trend,
    trendPercent,
    monthlyAverage,
    aiSuggestion,
  };
}

/**
 * Generate AI-powered suggestion for a merchant
 */
function generateMerchantSuggestion(
  merchantName: string,
  totalSpent: number,
  transactionCount: number,
  averageAmount: number,
  trend: 'up' | 'down' | 'stable',
  trendPercent: number,
  monthlyAverage: number
): string {
  const merchant = merchantName.toLowerCase();

  // Food delivery services
  if (merchant.includes('swiggy') || merchant.includes('zomato')) {
    if (transactionCount > 15) {
      return `You order from ${merchantName} quite often (${transactionCount} times). Consider meal prepping or cooking at home 2-3 times a week to save ₹${Math.round(monthlyAverage * 0.3)}/month.`;
    }
    if (averageAmount > 500) {
      return `Your average ${merchantName} order is ₹${Math.round(averageAmount)}. Try setting a ₹400 limit per order to reduce spending.`;
    }
    if (trend === 'up') {
      return `Your ${merchantName} spending is trending up. Consider alternating with home-cooked meals to balance your food budget.`;
    }
    return `You're spending ₹${Math.round(monthlyAverage)}/month on ${merchantName}. This seems reasonable for occasional food delivery.`;
  }

  // Ride-sharing
  if (merchant.includes('uber') || merchant.includes('ola') || merchant.includes('rapido')) {
    if (transactionCount > 20) {
      return `You take ${transactionCount} ${merchantName} rides. Consider public transport or carpooling for regular commutes to save money.`;
    }
    if (monthlyAverage > 2000) {
      return `You're spending ₹${Math.round(monthlyAverage)}/month on ${merchantName}. A monthly metro/bus pass might be more economical.`;
    }
    return `Your ${merchantName} usage looks moderate. Continue using it for convenience when needed.`;
  }

  // E-commerce
  if (
    merchant.includes('amazon') ||
    merchant.includes('flipkart') ||
    merchant.includes('myntra')
  ) {
    if (transactionCount > 10) {
      return `You shop on ${merchantName} frequently (${transactionCount} times). Try the "24-hour rule" - wait a day before purchasing to avoid impulse buys.`;
    }
    if (averageAmount > 2000) {
      return `Your average ${merchantName} purchase is ₹${Math.round(averageAmount)}. Consider making a wishlist and shopping during sales to save more.`;
    }
    if (trend === 'up') {
      return `Your ${merchantName} spending is increasing. Set a monthly shopping budget to keep expenses in check.`;
    }
    return `Your ${merchantName} shopping habits look balanced. Keep tracking to maintain control.`;
  }

  // Subscriptions
  if (
    merchant.includes('netflix') ||
    merchant.includes('spotify') ||
    merchant.includes('prime') ||
    merchant.includes('hotstar')
  ) {
    return `You're paying ₹${Math.round(totalSpent)} for ${merchantName}. Review if you're actively using this subscription or consider sharing with family.`;
  }

  // Coffee shops
  if (
    merchant.includes('starbucks') ||
    merchant.includes('cafe') ||
    merchant.includes('coffee')
  ) {
    if (transactionCount > 10) {
      return `You visit ${merchantName} ${transactionCount} times. Brewing coffee at home could save you ₹${Math.round(monthlyAverage * 0.7)}/month.`;
    }
    return `Your ${merchantName} visits are occasional. Enjoy your coffee treats guilt-free!`;
  }

  // Generic suggestions based on spending patterns
  if (trend === 'up' && trendPercent > 30) {
    return `Your ${merchantName} spending is up ${Math.round(Math.abs(trendPercent))}% this month. Consider setting a monthly limit to control expenses.`;
  }

  if (trend === 'down') {
    return `Great job! You've reduced ${merchantName} spending by ${Math.round(Math.abs(trendPercent))}%. Keep up the good work!`;
  }

  if (transactionCount > 20) {
    return `You transact with ${merchantName} very frequently (${transactionCount} times). Look for bulk deals or loyalty programs to maximize value.`;
  }

  if (monthlyAverage > 5000) {
    return `You spend ₹${Math.round(monthlyAverage)}/month on ${merchantName}. This is a significant expense - consider if there are cheaper alternatives.`;
  }

  return `You've spent ₹${Math.round(totalSpent)} on ${merchantName} over ${transactionCount} transactions. Your spending pattern looks reasonable.`;
}

/**
 * Get top merchants by spending
 */
export function getTopMerchants(
  transactions: Transaction[],
  limit: number = 10
): Array<{ merchant: string; totalSpent: number; count: number }> {
  const merchantMap = new Map<string, { totalSpent: number; count: number }>();

  transactions
    .filter(txn => txn.type === 'expense' && txn.merchant)
    .forEach(txn => {
      const merchant = txn.merchant!;
      const current = merchantMap.get(merchant) || { totalSpent: 0, count: 0 };
      merchantMap.set(merchant, {
        totalSpent: current.totalSpent + txn.amount,
        count: current.count + 1,
      });
    });

  return Array.from(merchantMap.entries())
    .map(([merchant, data]) => ({ merchant, ...data }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, limit);
}
