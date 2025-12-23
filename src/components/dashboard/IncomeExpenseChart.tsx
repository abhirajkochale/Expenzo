import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { transactionApi } from '@/db/api';
import { format, startOfWeek, addWeeks, addMonths, addYears } from 'date-fns';
import { Transaction } from '@/types/types';

type Mode = 'week' | 'month' | 'year';

export default function IncomeExpenseChart() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [mode, setMode] = useState<Mode>('month');
  const [cursor, setCursor] = useState(new Date());

  /* ---------------- LOAD TRANSACTIONS ---------------- */

  useEffect(() => {
    transactionApi.getAll().then(setTransactions);
  }, []);

  /* ---------------- AGGREGATION ---------------- */

  const data = useMemo(() => {
    if (!transactions.length) return [];

    const map = new Map<string, { income: number; expense: number }>();

    transactions.forEach(txn => {
      const date = new Date(txn.date);

      let key = '';
      if (mode === 'week') key = format(startOfWeek(date), 'yyyy-MM-dd');
      if (mode === 'month') key = format(date, 'yyyy-MM');
      if (mode === 'year') key = format(date, 'yyyy');

      if (!map.has(key)) map.set(key, { income: 0, expense: 0 });

      const entry = map.get(key)!;
      txn.type === 'income'
        ? (entry.income += txn.amount)
        : (entry.expense += txn.amount);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({
        label:
          mode === 'week'
            ? format(new Date(key), 'dd MMM')
            : mode === 'month'
            ? format(new Date(key + '-01'), 'MMM yy')
            : key,
        income: value.income,
        expense: value.expense,
      }));
  }, [transactions, mode]);

  /* ---------------- NAVIGATION ---------------- */

  const goPrevious = () => {
    setCursor(d =>
      mode === 'week'
        ? addWeeks(d, -1)
        : mode === 'month'
        ? addMonths(d, -1)
        : addYears(d, -1)
    );
  };

  const goNext = () => {
    setCursor(d =>
      mode === 'week'
        ? addWeeks(d, 1)
        : mode === 'month'
        ? addMonths(d, 1)
        : addYears(d, 1)
    );
  };

  /* ---------------- RENDER ---------------- */

  return (
    <Card>
      {/* Responsive Header: Stacks on mobile, Row on tablet/desktop */}
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 space-y-0 pb-4">
        <CardTitle className="text-lg font-bold">Income vs Expenses</CardTitle>

        {/* Controls Container: Full width on mobile, auto on desktop */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-2">
          <Button size="icon" variant="outline" onClick={goPrevious} className="shrink-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Tabs 
            value={mode} 
            onValueChange={v => setMode(v as Mode)} 
            className="flex-1 sm:flex-none sm:w-auto"
          >
            <TabsList className="grid w-full grid-cols-3 sm:w-auto">
              <TabsTrigger value="week">Weekly</TabsTrigger>
              <TabsTrigger value="month">Monthly</TabsTrigger>
              <TabsTrigger value="year">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button size="icon" variant="outline" onClick={goNext} className="shrink-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="h-[300px] sm:h-[320px] w-full px-0 sm:px-6">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 10 }} 
                axisLine={false} 
                tickLine={false}
                dy={10}
              />
              <YAxis 
                tick={{ fontSize: 10 }} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />

              <Line
                type="monotone"
                dataKey="income"
                stroke="#22c55e"
                strokeWidth={3}
                dot={false}
                name="Income"
                activeDot={{ r: 6 }}
              />

              <Line
                type="monotone"
                dataKey="expense"
                stroke="#ef4444"
                strokeWidth={3}
                dot={false}
                name="Expense"
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}