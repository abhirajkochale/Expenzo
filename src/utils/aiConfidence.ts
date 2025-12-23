// AI Confidence and Explainability System

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ConfidenceScore {
  level: ConfidenceLevel;
  score: number; // 0-100
  factors: {
    dataCompleteness: number; // 0-100
    historicalConsistency: number; // 0-100
    patternStrength: number; // 0-100
  };
}

export interface InsightExplanation {
  dataUsed: string[];
  patternDetected: string;
  whyNow: string;
  confidence: ConfidenceScore;
}

/**
 * Calculate AI confidence based on data quality and pattern strength
 */
export function calculateConfidence(params: {
  transactionCount: number;
  daysOfData: number;
  categoryConsistency: number; // 0-1
  patternStrength: number; // 0-1
}): ConfidenceScore {
  const { transactionCount, daysOfData, categoryConsistency, patternStrength } = params;

  // Data completeness: based on transaction count and days of data
  const dataCompleteness = Math.min(
    100,
    (transactionCount / 50) * 50 + (daysOfData / 90) * 50
  );

  // Historical consistency: based on category consistency
  const historicalConsistency = categoryConsistency * 100;

  // Pattern strength: direct conversion
  const patternStrengthScore = patternStrength * 100;

  // Overall score: weighted average
  const score = (
    dataCompleteness * 0.3 +
    historicalConsistency * 0.3 +
    patternStrengthScore * 0.4
  );

  // Determine level
  let level: ConfidenceLevel;
  if (score >= 70) {
    level = 'high';
  } else if (score >= 40) {
    level = 'medium';
  } else {
    level = 'low';
  }

  return {
    level,
    score: Math.round(score),
    factors: {
      dataCompleteness: Math.round(dataCompleteness),
      historicalConsistency: Math.round(historicalConsistency),
      patternStrength: Math.round(patternStrengthScore),
    },
  };
}

/**
 * Generate human-readable explanation for an insight
 */
export function generateExplanation(params: {
  insightType: 'overspending' | 'pattern' | 'forecast' | 'category_spike';
  category?: string;
  amount?: number;
  baseline?: number;
  timeframe: string;
  confidence: ConfidenceScore;
}): InsightExplanation {
  const { insightType, category, amount, baseline, timeframe, confidence } = params;

  let dataUsed: string[] = [];
  let patternDetected = '';
  let whyNow = '';

  switch (insightType) {
    case 'overspending':
      dataUsed = [
        `Your spending over the past ${timeframe}`,
        'Your usual spending pace',
        'Recent transaction patterns',
      ];
      patternDetected = `You're spending faster than your normal pace. ${
        baseline
          ? `Usually you spend around ₹${baseline.toLocaleString()} during this period.`
          : ''
      }`;
      whyNow = "I'm letting you know early so you can adjust if needed. Small changes now can help you stay comfortable later.";
      break;

    case 'category_spike':
      dataUsed = [
        `Your ${category} spending this ${timeframe}`,
        `Your typical ${category} spending`,
        'Past 3 months of similar spending',
      ];
      patternDetected = `Your ${category} spending is higher than usual. This often happens, but it's worth noticing.`;
      whyNow = `You still have time to balance things out if you want to. No pressure—just a heads up.`;
      break;

    case 'forecast':
      dataUsed = [
        'Your spending so far this week',
        'How much you usually spend',
        'Days remaining in the week',
      ];
      patternDetected = `Based on how you've been spending, I can see where this week is heading.`;
      whyNow = `It's early enough to make small adjustments if you'd like to. Or you might be totally fine—just wanted you to know.`;
      break;

    case 'pattern':
      dataUsed = [
        'Your transaction history',
        'Spending patterns over time',
        'Category trends',
      ];
      patternDetected = `I noticed a pattern in how you spend. This isn't good or bad—just something that might be useful to know.`;
      whyNow = `Understanding your patterns can help you make choices that feel right for you.`;
      break;
  }

  return {
    dataUsed,
    patternDetected,
    whyNow,
    confidence,
  };
}

/**
 * Get confidence badge text
 */
export function getConfidenceBadgeText(level: ConfidenceLevel): string {
  switch (level) {
    case 'high':
      return 'High confidence';
    case 'medium':
      return 'Medium confidence';
    case 'low':
      return 'Low confidence';
  }
}

/**
 * Get confidence description for users
 */
export function getConfidenceDescription(confidence: ConfidenceScore): string {
  const { level, factors } = confidence;

  if (level === 'high') {
    return "I have enough data to be confident about this insight.";
  } else if (level === 'medium') {
    return "I'm fairly confident, but more data would help me be more certain.";
  } else {
    if (factors.dataCompleteness < 40) {
      return "I don't have much data yet, so take this as a gentle suggestion rather than a strong signal.";
    } else if (factors.patternStrength < 40) {
      return "The pattern isn't very strong yet, so this might change as I learn more about your spending.";
    } else {
      return "I'm still learning your patterns, so this is more of a heads-up than a certainty.";
    }
  }
}
