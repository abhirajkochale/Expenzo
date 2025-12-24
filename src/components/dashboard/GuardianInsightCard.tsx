import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sparkles,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import {
  ExplainabilityDialog,
  ConfidenceIndicator,
} from '@/components/common/ExplainabilityDialog';
import type { InsightExplanation } from '@/utils/aiConfidence';
import { cn } from '@/lib/utils';

export interface GuardianInsight {
  type: 'success' | 'warning' | 'info' | 'achievement';
  title: string;
  message: string;
  icon: 'sparkles' | 'trending-down' | 'trending-up' | 'alert' | 'check';
  emoji?: string;
  explanation?: InsightExplanation;
}

interface GuardianInsightCardProps {
  insight?: GuardianInsight | null;
  isLoading?: boolean;
}

export function GuardianInsightCard({ insight, isLoading }: GuardianInsightCardProps) {
  
  if (isLoading) {
    return (
      <Card className="glass-card h-full border-l-4 border-l-gray-300 dark:border-l-gray-700">
        <CardHeader className="pb-3">
            <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (!insight) {
      return (
        <Card className="glass-card h-full border-l-4 border-l-gray-300 dark:border-l-gray-700 flex flex-col justify-center items-center p-6 text-center text-gray-500">
             <ShieldCheck className="h-8 w-8 mb-2 opacity-50" />
             <p className="text-sm font-medium">Gathering data for Guardian Insights...</p>
        </Card>
      );
  }

  const getStyles = () => {
    switch (insight.type) {
      case 'warning':
        return {
          border: 'border-l-red-500',
          badge: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
          iconColor: 'text-red-600 dark:text-red-400'
        };
      case 'achievement':
      case 'success':
        return {
          border: 'border-l-emerald-500',
          badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
          iconColor: 'text-emerald-600 dark:text-emerald-400'
        };
      default:
        return {
          border: 'border-l-blue-500',
          badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
          iconColor: 'text-blue-600 dark:text-blue-400'
        };
    }
  };

  const styles = getStyles();

  const getIcon = () => {
    switch (insight.icon) {
      case 'trending-down': return <TrendingDown className={cn("h-5 w-5 shrink-0", styles.iconColor)} />;
      case 'trending-up': return <TrendingUp className={cn("h-5 w-5 shrink-0", styles.iconColor)} />;
      case 'alert': return <AlertCircle className={cn("h-5 w-5 shrink-0", styles.iconColor)} />;
      case 'check': return <CheckCircle2 className={cn("h-5 w-5 shrink-0", styles.iconColor)} />;
      default: return <Sparkles className={cn("h-5 w-5 shrink-0", styles.iconColor)} />;
    }
  };

  return (
    <Card className={cn("glass-card h-full border-l-4 transition-all duration-300", styles.border)}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
          <CardTitle className="flex items-center gap-2 text-base text-gray-900 dark:text-white">
            {getIcon()}
            <span className="whitespace-nowrap font-bold">Guardian Insight</span>
          </CardTitle>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {insight.explanation && (
              <ConfidenceIndicator level={insight.explanation.confidence.level} />
            )}
            <Badge variant="outline" className={cn("border-0", styles.badge)}>
              AI Detected
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <h3 className="text-lg font-bold flex items-start gap-2 text-gray-900 dark:text-white">
          {insight.emoji && <span className="shrink-0 mt-0.5 text-xl">{insight.emoji}</span>}
          <span className="break-words leading-tight">{insight.title}</span>
        </h3>

        <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm font-medium">
          {insight.message}
        </p>

        {/* SAFE RENDER: Only render if explanation exists to prevent crash */}
        {insight.explanation && (
          <div className="pt-3 mt-1 border-t border-gray-200 dark:border-white/10">
            <ExplainabilityDialog explanation={insight.explanation} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}