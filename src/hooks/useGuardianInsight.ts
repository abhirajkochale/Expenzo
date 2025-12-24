import { useState, useEffect } from 'react';
import { Transaction } from '@/types/types';
import { generateGuardianInsight } from '@/utils/insightGenerator';
import { GuardianInsight } from '@/components/dashboard/GuardianInsightCard';

export function useGuardianInsight(transactions: Transaction[]) {
  const [insight, setInsight] = useState<GuardianInsight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If no transactions, stop loading immediately
    if (!transactions || transactions.length === 0) {
        setLoading(false);
        return;
    }

    setLoading(true);
    // Simulate AI analysis delay
    const timer = setTimeout(() => {
      const result = generateGuardianInsight(transactions);
      setInsight(result);
      setLoading(false);
    }, 1200); 

    return () => clearTimeout(timer);
  }, [transactions]);

  return { insight, loading };
}