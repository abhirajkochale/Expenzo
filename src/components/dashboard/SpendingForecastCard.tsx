import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExplainabilityDialog, ConfidenceIndicator } from '@/components/common/ExplainabilityDialog';
import { calculateConfidence, generateExplanation } from '@/utils/aiConfidence';
import type { ConfidenceLevel } from '@/utils/aiConfidence';

type ForecastStatus = 'comfortable' | 'tight' | 'risky';

interface SpendingForecastCardProps {
  currentSpending: number;
  daysElapsed: number;
  totalDays: number;
  userBaseline: number;
  transactionCount: number;
  daysOfData: number;
}

function calculateForecastStatus(
  currentSpending: number,
  daysElapsed: number,
  totalDays: number,
  baseline: number
): ForecastStatus {
  // Calculate velocity (spending per day)
  const velocity = currentSpending / daysElapsed;
  
  // Project to end of period
  const projected = velocity * totalDays;
  
  // Compare to baseline
  const ratio = projected / baseline;
  
  if (ratio <= 1.1) {
    return 'comfortable';
  } else if (ratio <= 1.3) {
    return 'tight';
  } else {
    return 'risky';
  }
}

function getStatusConfig(status: ForecastStatus) {
  switch (status) {
    case 'comfortable':
      return {
        label: 'Comfortable',
        description: "You're on track. Your spending pace feels steady.",
        icon: Minus,
        color: 'text-success',
        bgColor: 'bg-success/10',
        borderColor: 'border-success/20',
      };
    case 'tight':
      return {
        label: 'Tight',
        description: "You're spending a bit faster than usual. Worth keeping an eye on.",
        icon: TrendingUp,
        color: 'text-warning',
        bgColor: 'bg-warning/10',
        borderColor: 'border-warning/20',
      };
    case 'risky':
      return {
        label: 'Risky',
        description: "At this pace, you might overspend. Small changes now can help.",
        icon: TrendingUp,
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        borderColor: 'border-destructive/20',
      };
  }
}

export function SpendingForecastCard({
  currentSpending,
  daysElapsed,
  totalDays,
  userBaseline,
  transactionCount,
  daysOfData,
}: SpendingForecastCardProps) {
  // Calculate forecast status
  const status = calculateForecastStatus(
    currentSpending,
    daysElapsed,
    totalDays,
    userBaseline
  );
  
  const config = getStatusConfig(status);
  const Icon = config.icon;
  
  // Calculate confidence
  const confidence = calculateConfidence({
    transactionCount,
    daysOfData,
    categoryConsistency: 0.7, // Would be calculated from actual data
    patternStrength: 0.8, // Would be calculated from actual data
  });
  
  // Generate explanation
  const explanation = generateExplanation({
    insightType: 'forecast',
    timeframe: 'week',
    baseline: userBaseline,
    confidence,
  });
  
  // Calculate days remaining
  const daysRemaining = totalDays - daysElapsed;
  
  return (
    <Card className={`border-2 ${config.borderColor}`}>
      <CardHeader className="pb-3">
        {/* Responsive Header: Stacks on mobile, Row on tablet+ */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
          <CardTitle className="text-base font-medium">This Week's Pace</CardTitle>
          <ConfidenceIndicator level={confidence.level} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className={`flex items-start sm:items-center gap-3 p-3 rounded-lg ${config.bgColor}`}>
          <div className={`p-2 rounded-full bg-background/50 shrink-0`}>
            <Icon className={`h-5 w-5 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-lg font-semibold ${config.color}`}>
              {config.label}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 break-words">
              {config.description}
            </p>
          </div>
        </div>
        
        {/* Context (optional, subtle) */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Days into week</span>
            <span className="font-medium">{daysElapsed} of {totalDays}</span>
          </div>
          {daysRemaining > 0 && (
            <div className="flex justify-between">
              <span>Days remaining</span>
              <span className="font-medium">{daysRemaining}</span>
            </div>
          )}
        </div>
        
        {/* Explainability */}
        <div className="pt-2 border-t">
          <ExplainabilityDialog explanation={explanation} />
        </div>
      </CardContent>
    </Card>
  );
}