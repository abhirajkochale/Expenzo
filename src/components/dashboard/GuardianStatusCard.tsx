import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, TrendingUp, Eye } from 'lucide-react';
import { GuardianStatus } from '@/types/types';
import { cn } from '@/lib/utils';

interface GuardianStatusCardProps {
  status: GuardianStatus;
  savingsRate: number;
}

export function GuardianStatusCard({ status, savingsRate }: GuardianStatusCardProps) {
  const statusConfig = {
    SAFE: {
      icon: Sparkles,
      accent: 'text-success',
      bg: 'bg-success/10',
      border: 'border-success/40',
      emoji: '✨',
      title: 'You’re in great shape',
      message: 'Your spending and saving habits are well balanced.',
      tip: `Saving ${savingsRate.toFixed(0)}% puts you ahead of most users`,
    },
    CAUTION: {
      icon: TrendingUp,
      accent: 'text-warning',
      bg: 'bg-warning/10',
      border: 'border-warning/40',
      emoji: '📊',
      title: 'Room to improve',
      message: 'You’re doing fine, but there’s potential to save more.',
      tip: 'Small optimizations can boost your savings',
    },
    CRITICAL: {
      icon: Eye,
      accent: 'text-destructive',
      bg: 'bg-destructive/10',
      border: 'border-destructive/40',
      emoji: '⚠️',
      title: 'Spending is elevated',
      message: 'Your expenses are higher than usual this period.',
      tip: 'Review recent transactions to regain control',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card
      className={cn(
        'border-2 transition-all hover:shadow-lg',
        config.border,
        config.bg
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold">
          <div className={cn('p-2 rounded-lg shrink-0', config.bg)}>
            <Icon className={cn('h-5 w-5', config.accent)} />
          </div>
          <span className="gradient-text-primary truncate">Expenzo Status</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0">{config.emoji}</span>
          <div>
            <h3 className={cn('font-semibold text-base', config.accent)}>
              {config.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {config.message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3 sm:p-4">
          <div className="min-w-0 pr-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Savings Rate
            </p>
            {/* Responsive font size: 2xl on mobile, 3xl on tablet/desktop */}
            <p className={cn('text-2xl sm:text-3xl font-bold', config.accent)}>
              {savingsRate.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1 break-words">
              {config.tip}
            </p>
          </div>
          
          {/* Responsive box size: smaller on mobile */}
          <div className={cn(
            'h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center shrink-0',
            config.bg
          )}>
            <span className="text-lg sm:text-xl">
              {status === 'SAFE' && '🎯'}
              {status === 'CAUTION' && '📈'}
              {status === 'CRITICAL' && '🔍'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}