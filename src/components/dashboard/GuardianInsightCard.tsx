import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  ExplainabilityDialog,
  ConfidenceIndicator,
} from '@/components/common/ExplainabilityDialog';
import type { InsightExplanation } from '@/utils/aiConfidence';

export interface GuardianInsight {
  type: 'success' | 'warning' | 'info' | 'achievement';
  title: string;
  message: string;
  icon: 'sparkles' | 'trending-down' | 'trending-up' | 'alert' | 'check';
  emoji?: string;
  explanation?: InsightExplanation;
}

interface GuardianInsightCardProps {
  insight: GuardianInsight;
}

export function GuardianInsightCard({ insight }: GuardianInsightCardProps) {
  const getIcon = () => {
    switch (insight.icon) {
      case 'trending-down': return <TrendingDown className="h-5 w-5 shrink-0" />;
      case 'trending-up': return <TrendingUp className="h-5 w-5 shrink-0" />;
      case 'alert': return <AlertCircle className="h-5 w-5 shrink-0" />;
      case 'check': return <CheckCircle2 className="h-5 w-5 shrink-0" />;
      default: return <Sparkles className="h-5 w-5 shrink-0" />;
    }
  };

  return (
    <Card className="border-2 border-success/40 bg-gradient-to-br from-success/10 to-background hover:shadow-lg transition">
      <CardHeader className="pb-3">
        {/* Responsive Header: Stacks on mobile, Row on tablet+ */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
          <CardTitle className="flex items-center gap-2 text-base">
            {getIcon()}
            <span className="whitespace-nowrap">Expenzo Insight</span>
          </CardTitle>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {insight.explanation && (
              <ConfidenceIndicator level={insight.explanation.confidence.level} />
            )}
            <Badge className="bg-success/20 text-success border-success/30 whitespace-nowrap">
              AI-Generated
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <h3 className="text-lg font-semibold flex items-start gap-2">
          {insight.emoji && <span className="shrink-0 mt-0.5">{insight.emoji}</span>}
          <span className="break-words">{insight.title}</span>
        </h3>

        <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
          {insight.message}
        </p>

        {insight.explanation && (
          <div className="pt-2 border-t border-border/50">
            <ExplainabilityDialog explanation={insight.explanation} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}