import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Transaction, CATEGORY_METADATA } from '@/types/types';
import { Receipt, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

interface RecentTransactionsCardProps {
  transactions: Transaction[];
}

export function RecentTransactionsCard({ transactions }: RecentTransactionsCardProps) {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
          Recent Transactions
        </CardTitle>
        <Button variant="ghost" size="sm" className="text-xs sm:text-sm h-8 px-2 sm:px-3" asChild>
          <Link to="/transactions">
            View All <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No transactions yet</p>
            <p className="text-sm mt-2">Add your first transaction to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((txn) => {
              const meta = CATEGORY_METADATA[txn.category];
              return (
                <div
                  key={txn.id}
                  className="flex items-center justify-between p-3 sm:p-4 bg-card/50 rounded-lg hover:bg-card/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-xl sm:text-2xl shrink-0">{meta.icon}</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base truncate pr-2">
                        {txn.description}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {format(new Date(txn.date), 'MMM dd, yyyy')} • {meta.label}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-bold text-sm sm:text-base ${txn.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                      {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}