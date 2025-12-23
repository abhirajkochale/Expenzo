import { HelpCircle, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { InsightExplanation, ConfidenceLevel } from '@/utils/aiConfidence';
import { getConfidenceBadgeText, getConfidenceDescription } from '@/utils/aiConfidence';

interface ExplainabilityDialogProps {
  explanation: InsightExplanation;
  trigger?: 'link' | 'icon';
}

function getConfidenceColor(level: ConfidenceLevel): string {
  switch (level) {
    case 'high':
      return 'bg-success/10 text-success border-success/20';
    case 'medium':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'low':
      return 'bg-muted text-muted-foreground border-border';
  }
}

export function ExplainabilityDialog({ explanation, trigger = 'link' }: ExplainabilityDialogProps) {
  const { dataUsed, patternDetected, whyNow, confidence } = explanation;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger === 'link' ? (
          <button className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors underline decoration-dotted underline-offset-4">
            <HelpCircle className="h-3.5 w-3.5" />
            Why am I seeing this?
          </button>
        ) : (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Info className="h-4 w-4" />
            <span className="sr-only">Why am I seeing this?</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Why you're seeing this</DialogTitle>
          <DialogDescription className="text-base">
            Here's how I arrived at this insight
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Confidence Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getConfidenceColor(confidence.level)}>
              {getConfidenceBadgeText(confidence.level)}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {getConfidenceDescription(confidence)}
            </p>
          </div>

          {/* What data was used */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">What I looked at</h4>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {dataUsed.map((data, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{data}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* What pattern was detected */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">What I noticed</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {patternDetected}
            </p>
          </div>

          {/* Why this matters now */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Why this matters</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {whyNow}
            </p>
          </div>

          {/* Confidence breakdown (optional, collapsed by default) */}
          {confidence.level !== 'high' && (
            <div className="pt-4 border-t space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Confidence factors
              </h4>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Data completeness</span>
                  <span className="font-medium">{confidence.factors.dataCompleteness}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Historical consistency</span>
                  <span className="font-medium">{confidence.factors.historicalConsistency}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Pattern strength</span>
                  <span className="font-medium">{confidence.factors.patternStrength}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Inline confidence indicator (subtle)
 */
interface ConfidenceIndicatorProps {
  level: ConfidenceLevel;
  showText?: boolean;
}

export function ConfidenceIndicator({ level, showText = false }: ConfidenceIndicatorProps) {
  const colors = {
    high: 'text-success',
    medium: 'text-warning',
    low: 'text-muted-foreground',
  };

  const dots = {
    high: 3,
    medium: 2,
    low: 1,
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${
              i < dots[level] ? colors[level] : 'text-muted/30'
            } bg-current`}
          />
        ))}
      </div>
      {showText && (
        <span className={`text-xs ${colors[level]}`}>
          {getConfidenceBadgeText(level)}
        </span>
      )}
    </div>
  );
}
