import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, Store, Calendar, CreditCard, Lightbulb } from 'lucide-react';
import { transactionApi } from '@/db/api';
import { calculateMerchantAnalytics, MerchantAnalytics } from '@/utils/merchantAnalytics';
import { format } from 'date-fns';

interface MerchantInsightSheetProps {
  merchantName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MerchantInsightSheet({
  merchantName,
  open,
  onOpenChange,
}: MerchantInsightSheetProps) {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<MerchantAnalytics | null>(null);

  useEffect(() => {
    if (open && merchantName) {
      loadMerchantAnalytics();
    }
  }, [open, merchantName]);

  const loadMerchantAnalytics = async () => {
    if (!merchantName) return;

    try {
      setLoading(true);
      const transactions = await transactionApi.getAll();
      const merchantAnalytics = calculateMerchantAnalytics(merchantName, transactions);
      setAnalytics(merchantAnalytics);
    } catch (error) {
      console.error('Failed to load merchant analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const getTrendIcon = () => {
    if (!analytics) return null;
    
    if (analytics.trend === 'up') {
      return <TrendingUp className="h-4 w-4 text-destructive" />;
    } else if (analytics.trend === 'down') {
      return <TrendingDown className="h-4 w-4 text-primary" />;
    }
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendBadge = () => {
    if (!analytics) return null;

    if (analytics.trend === 'up') {
      return (
        <Badge variant="destructive" className="gap-1">
          <TrendingUp className="h-3 w-3" />
          Up {Math.round(Math.abs(analytics.trendPercent))}%
        </Badge>
      );
    } else if (analytics.trend === 'down') {
      return (
        <Badge variant="default" className="gap-1">
          <TrendingDown className="h-3 w-3" />
          Down {Math.round(Math.abs(analytics.trendPercent))}%
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <Minus className="h-3 w-3" />
        Stable
      </Badge>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-2xl">
            <Store className="h-6 w-6 text-primary" />
            {merchantName || 'Merchant Insights'}
          </SheetTitle>
          <SheetDescription>
            Detailed spending analysis and AI-powered suggestions
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {loading ? (
            <>
              <Skeleton className="h-32 w-full bg-muted" />
              <Skeleton className="h-24 w-full bg-muted" />
              <Skeleton className="h-24 w-full bg-muted" />
              <Skeleton className="h-32 w-full bg-muted" />
            </>
          ) : analytics ? (
            <>
              {/* Total Spending Card */}
              <Card className="border-primary bg-primary/5">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                      <p className="text-4xl font-bold text-primary">
                        {formatCurrency(analytics.totalSpent)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Trend (30 days)</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getTrendIcon()}
                          {getTrendBadge()}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Monthly Avg</p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(analytics.monthlyAverage)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transaction Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Transactions</p>
                        <p className="text-2xl font-bold">{analytics.transactionCount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <TrendingUp className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Amount</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(analytics.averageAmount)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Date Range */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-2">Transaction Period</p>
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p className="text-muted-foreground">First</p>
                          <p className="font-semibold">
                            {format(new Date(analytics.firstTransaction), 'dd MMM yyyy')}
                          </p>
                        </div>
                        <div className="text-muted-foreground">→</div>
                        <div className="text-right">
                          <p className="text-muted-foreground">Latest</p>
                          <p className="font-semibold">
                            {format(new Date(analytics.lastTransaction), 'dd MMM yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Suggestion */}
              <Card className="border-primary bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <Lightbulb className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        AI Suggestion
                        <Badge variant="secondary" className="text-xs">
                          ✨ Powered by Guardian
                        </Badge>
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {analytics.aiSuggestion}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats Summary */}
              <div className="p-4 rounded-lg bg-card/50 space-y-2 text-sm">
                <p className="font-semibold">Quick Summary</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>
                    • You've made <strong>{analytics.transactionCount}</strong> purchases
                  </li>
                  <li>
                    • Average spend per transaction: <strong>{formatCurrency(analytics.averageAmount)}</strong>
                  </li>
                  <li>
                    • Monthly average: <strong>{formatCurrency(analytics.monthlyAverage)}</strong>
                  </li>
                  <li>
                    • Spending trend: <strong className={
                      analytics.trend === 'up' ? 'text-destructive' :
                      analytics.trend === 'down' ? 'text-primary' :
                      ''
                    }>
                      {analytics.trend === 'up' ? 'Increasing' :
                       analytics.trend === 'down' ? 'Decreasing' :
                       'Stable'}
                    </strong>
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No data available for this merchant
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
