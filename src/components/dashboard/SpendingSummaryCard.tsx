import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PiggyBank } from 'lucide-react';
import { transactionApi } from '@/db/api';
import { Transaction } from '@/types/types';
import { format } from 'date-fns';

/* ================= TYPES ================= */

type Summary = {
  income: number;
  expense: number;
  savings: number;
};

interface SpendingSummaryCardProps {
  monthlyIncome?: number;
  monthlyExpense?: number;
  netSavings?: number;
}

/* ================= CONSTANTS ================= */

const months = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

/* ================= COMPONENT ================= */

export function SpendingSummaryCard({
  monthlyIncome,
  monthlyExpense,
  netSavings,
}: SpendingSummaryCardProps) {
  const now = new Date();
  const currentYear = String(now.getFullYear());
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

  const [tab, setTab] = useState<'month' | 'year' | 'overall'>('month');
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({
    income: 0,
    expense: 0,
    savings: 0,
  });
  const [loading, setLoading] = useState(true);

  /* ---------- LOAD DATA ---------- */

  useEffect(() => {
    // If values are passed from Dashboard, don't recalc
    if (
      monthlyIncome !== undefined &&
      monthlyExpense !== undefined &&
      netSavings !== undefined
    ) {
      setSummary({
        income: monthlyIncome,
        expense: monthlyExpense,
        savings: netSavings,
      });
      setLoading(false);
      return;
    }

    loadTransactions();
  }, []);

  useEffect(() => {
    if (transactions.length > 0) {
      calculateSummary();
    }
  }, [tab, month, year, transactions]);

  async function loadTransactions() {
    try {
      setLoading(true);
      const data = await transactionApi.getAll();
      setTransactions(data);
    } finally {
      setLoading(false);
    }
  }

  function calculateSummary() {
    let filtered = transactions;

    if (tab === 'month') {
      filtered = transactions.filter(
        txn => format(new Date(txn.date), 'yyyy-MM') === `${year}-${month}`
      );
    }

    if (tab === 'year') {
      filtered = transactions.filter(
        txn => format(new Date(txn.date), 'yyyy') === year
      );
    }

    let income = 0;
    let expense = 0;

    filtered.forEach(txn => {
      if (txn.type === 'income') income += txn.amount;
      if (txn.type === 'expense') expense += txn.amount;
    });

    setSummary({
      income,
      expense,
      savings: income - expense,
    });
  }

  /* ================= UI ================= */

  return (
    <Card className="border-muted/40">
      <CardHeader className="pb-4">
        {/* Responsive Header: Stacks on mobile, Row on tablet/desktop */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-primary" />
            Summary
          </CardTitle>

          <Tabs value={tab} onValueChange={v => setTab(v as any)} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-3 h-9 sm:w-auto">
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
              <TabsTrigger value="overall">Overall</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* CONTROLS - Responsive Layout */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          {tab === 'month' && (
            <>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map(m => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-full sm:w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 6 }).map((_, i) => {
                    const y = String(Number(currentYear) - i);
                    return (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </>
          )}

          {tab === 'year' && (
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 6 }).map((_, i) => {
                  const y = String(Number(currentYear) - i);
                  return (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Metric Grid - 1 Col mobile, 3 Cols desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Metric label="Money In" value={summary.income} loading={loading} />
          <Metric label="Money Out" value={summary.expense} loading={loading} />
          <Metric
            label="You Saved"
            value={summary.savings}
            highlight
            loading={loading}
          />
        </div>
      </CardContent>
    </Card>
  );
}

/* ================= METRIC ================= */

function Metric({
  label,
  value,
  highlight,
  loading,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  loading: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 border transition-colors hover:bg-muted/20 ${
        highlight ? 'border-success/40 bg-success/5' : 'border-muted/40'
      }`}
    >
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-2 truncate">
        {loading ? '—' : `₹${value.toLocaleString('en-IN')}`}
      </p>
    </div>
  );
}