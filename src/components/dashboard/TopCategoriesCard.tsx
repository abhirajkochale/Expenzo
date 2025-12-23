import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CategorySpend, CATEGORY_METADATA } from '@/types/types';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopCategoriesCardProps {
  categories: CategorySpend[];
}

export function TopCategoriesCard({ categories }: TopCategoriesCardProps) {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const topCategories = categories.slice(0, 5);
  const maxAmount = topCategories[0]?.total_spent || 1;

  // Minimal color palette for categories
  const categoryColors = [
    { bg: 'bg-primary/5', border: 'border-primary/20', text: 'text-primary', progress: 'bg-primary' },
    { bg: 'bg-accent/5', border: 'border-accent/20', text: 'text-accent', progress: 'bg-accent' },
    { bg: 'bg-secondary/5', border: 'border-secondary/20', text: 'text-secondary', progress: 'bg-secondary' },
    { bg: 'bg-warning/5', border: 'border-warning/20', text: 'text-warning', progress: 'bg-warning' },
    { bg: 'bg-info/5', border: 'border-info/20', text: 'text-info', progress: 'bg-info' },
  ];

  return (
    <Card className="transition-smooth hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold truncate">Where Your Money Goes</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {topCategories.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="text-5xl mb-3">📊</div>
            <p className="text-base font-semibold mb-1">No data yet</p>
            <p className="text-sm text-muted-foreground">
              Add some transactions to see your spending breakdown
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {topCategories.map((cat, index) => {
              const meta = CATEGORY_METADATA[cat.category];
              const percentage = (cat.total_spent / maxAmount) * 100;
              const colors = categoryColors[index % categoryColors.length];

              return (
                <div 
                  key={cat.category} 
                  className={cn(
                    'p-3 sm:p-5 rounded-xl border transition-smooth',
                    colors.bg,
                    colors.border
                  )}
                >
                  <div className="flex items-center justify-between mb-3 gap-3">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div className="text-xl sm:text-2xl shrink-0">{meta.icon}</div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate pr-2">{meta.label}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {cat.transaction_count} purchase{cat.transaction_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn('font-semibold text-sm sm:text-base', colors.text)}>
                        {formatCurrency(cat.total_spent)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Progress 
                      value={percentage} 
                      className="h-1.5 sm:h-2 bg-muted rounded-full"
                    />
                    <p className="text-[10px] sm:text-xs text-muted-foreground text-right">
                      {percentage.toFixed(0)}% of top spending
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