import { Transaction } from '@/types/types';

export interface FinancialHealthResult {
  score: number; // 0-100
  savingsRate: number; // percentage
  budgetAdherence: number; // percentage
  spendingConsistency: number; // arbitrary 0-100
  emergencyFundProxy: number; // arbitrary 0-100
  subscriptionRatio: number; // percentage
}

export function calculateHealthScore(transactions: Transaction[], currentMonthKey: string): FinancialHealthResult {
  if (!transactions || transactions.length === 0) {
    return {
      score: 50, // Default neutral score if no data
      savingsRate: 0,
      budgetAdherence: 0,
      spendingConsistency: 50,
      emergencyFundProxy: 0,
      subscriptionRatio: 0,
    };
  }

  // 1. Filter for current month
  const thisMonth = transactions.filter(t => t.date?.startsWith(currentMonthKey));
  
  // Basic aggregates for this month
  const income = thisMonth.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = thisMonth.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  const savings = income - expense;

  // 2. All-time aggregates
  const totalHistoricalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalHistoricalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  const allTimeSavings = Math.max(0, totalHistoricalIncome - totalHistoricalExpense);

  // --- COMPONENT 1: Savings Rate (30% weight) ---
  // Ideal: 20%+ savings rate gets full points
  let srPercent = 0;
  if (income > 0) {
    srPercent = (savings / income) * 100;
  }
  const srPoints = Math.min(30, Math.max(0, (srPercent / 20) * 30));

  // --- COMPONENT 2: Budget Adherence (25% weight) ---
  // Ideal: Expenses < 80% of income gets full 25 pts. 
  // If expense > income, they get 0 points here.
  let adherencePoints = 0;
  if (income > 0) {
    const expenseRatio = expense / income;
    if (expenseRatio <= 0.8) {
      adherencePoints = 25;
    } else if (expenseRatio <= 1.0) {
      // Scale from 25 to 0 as ratio goes from 0.8 to 1.0
      adherencePoints = 25 - ((expenseRatio - 0.8) / 0.2) * 25;
    }
  } else if (expense === 0) {
    adherencePoints = 25; // No income, no expense = budget adhered
  }

  // --- COMPONENT 3: Spending Consistency (20% weight) ---
  // Proxy: Number of distinct days they spent money. 
  // Less clustering is better. Alternatively, no massive single expenses.
  // We'll use: largest single expense / total expense. Less than 30% gets full points.
  let consistencyPoints = 20;
  const maxSingleExpense = Math.max(...thisMonth.filter(t => t.type === 'expense').map(t => Number(t.amount)), 0);
  if (expense > 0) {
    const maxRatio = maxSingleExpense / expense;
    if (maxRatio > 0.3) {
      consistencyPoints = Math.max(0, 20 - ((maxRatio - 0.3) * 50));
    }
  } else {
    consistencyPoints = 20;
  }

  // --- COMPONENT 4: Emergency Fund Progress (15% weight) ---
  // Proxy: all-time savings >= 2x monthly income
  let emergencyPoints = 0;
  if (income > 0) {
    const efRatio = allTimeSavings / income;
    emergencyPoints = Math.min(15, (efRatio / 2) * 15);
  } else if (allTimeSavings > 0) {
    emergencyPoints = 15;
  }

  // --- COMPONENT 5: Subscription Ratio (10% weight) ---
  // Ideal: Subscriptions are < 5% of expenses
  let subPoints = 10;
  const subExpense = thisMonth.filter(t => t.type === 'expense' && t.category === 'subscriptions').reduce((sum, t) => sum + Number(t.amount), 0);
  if (expense > 0) {
    const subRatio = subExpense / expense;
    if (subRatio > 0.05) {
      // Scale down. If it's 20%, you get 0.
      subPoints = Math.max(0, 10 - ((subRatio - 0.05) / 0.15) * 10);
    }
  }

  // Calculate Final Score
  const rawScore = srPoints + adherencePoints + consistencyPoints + emergencyPoints + subPoints;
  const finalScore = Math.floor(Math.min(100, Math.max(0, rawScore)));

  return {
    score: finalScore,
    savingsRate: srPercent,
    budgetAdherence: income > 0 ? (expense / income) * 100 : 0,
    spendingConsistency: (consistencyPoints / 20) * 100,
    emergencyFundProxy: (emergencyPoints / 15) * 100,
    subscriptionRatio: expense > 0 ? (subExpense / expense) * 100 : 0,
  };
}
