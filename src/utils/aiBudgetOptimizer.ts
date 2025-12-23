import { Transaction, Budget } from '../types';

/**
 * AI Logic:
 * 1. Filter transactions for the last 3-6 months.
 * 2. Group by category.
 * 3. Calculate average monthly spend.
 * 4. Add a "volatility buffer" (e.g., 10%) for irregular expenses.
 * 5. Round to nearest 50/100 for clean numbers.
 */
export const optimizeBudgets = (
  transactions: Transaction[],
  currentMonth: string,
  currentYear: number
): Budget[] => {
  if (!transactions || transactions.length === 0) return [];

  const categoryTotals: Record<string, number> = {};
  const categoryMonths: Record<string, Set<string>> = {};

  // 1. Aggregate Spending
  transactions.forEach((txn) => {
    if (txn.type === 'expense') {
      const monthKey = txn.date.substring(0, 7); // YYYY-MM
      
      categoryTotals[txn.category] = (categoryTotals[txn.category] || 0) + Math.abs(txn.amount);
      
      if (!categoryMonths[txn.category]) {
        categoryMonths[txn.category] = new Set();
      }
      categoryMonths[txn.category].add(monthKey);
    }
  });

  // 2. Calculate Averages & Create Budgets
  const optimizedBudgets: Budget[] = Object.keys(categoryTotals).map((category) => {
    const totalSpent = categoryTotals[category];
    const monthCount = categoryMonths[category].size || 1; // Avoid divide by zero
    const avgSpend = totalSpent / monthCount;

    // AI "Buffer" - add 10% flexibility
    const recommendedAmount = Math.ceil((avgSpend * 1.1) / 50) * 50; 

    return {
      id: crypto.randomUUID(), // Temp ID, will be replaced by DB
      user_id: '', // Set by caller
      category: category,
      amount: recommendedAmount,
      month: currentMonth,
      year: currentYear,
      spent: 0
    };
  });

  return optimizedBudgets;
};