import { Transaction } from '@/types/types';
import { format, startOfWeek, startOfMonth, startOfYear } from 'date-fns';

type Point = {
  label: string;
  income: number;
  expense: number;
};

export function aggregateByWeek(transactions: Transaction[]): Point[] {
  const map = new Map<string, Point>();

  transactions.forEach(txn => {
    const weekStart = startOfWeek(new Date(txn.date), { weekStartsOn: 1 });
    const key = format(weekStart, 'yyyy-MM-dd');

    if (!map.has(key)) {
      map.set(key, {
        label: format(weekStart, 'dd MMM'),
        income: 0,
        expense: 0,
      });
    }

    const entry = map.get(key)!;
    txn.type === 'income'
      ? (entry.income += txn.amount)
      : (entry.expense += txn.amount);
  });

  return Array.from(map.values());
}

export function aggregateByMonth(transactions: Transaction[]): Point[] {
  const map = new Map<string, Point>();

  transactions.forEach(txn => {
    const monthStart = startOfMonth(new Date(txn.date));
    const key = format(monthStart, 'yyyy-MM');

    if (!map.has(key)) {
      map.set(key, {
        label: format(monthStart, 'MMM yyyy'),
        income: 0,
        expense: 0,
      });
    }

    const entry = map.get(key)!;
    txn.type === 'income'
      ? (entry.income += txn.amount)
      : (entry.expense += txn.amount);
  });

  return Array.from(map.values());
}

export function aggregateByYear(transactions: Transaction[]): Point[] {
  const map = new Map<string, Point>();

  transactions.forEach(txn => {
    const yearStart = startOfYear(new Date(txn.date));
    const key = format(yearStart, 'yyyy');

    if (!map.has(key)) {
      map.set(key, {
        label: key,
        income: 0,
        expense: 0,
      });
    }

    const entry = map.get(key)!;
    txn.type === 'income'
      ? (entry.income += txn.amount)
      : (entry.expense += txn.amount);
  });

  return Array.from(map.values());
}
