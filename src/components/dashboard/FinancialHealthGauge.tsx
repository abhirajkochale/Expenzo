import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { Activity, Sparkles, Loader2 } from 'lucide-react';
import { Transaction } from '@/types/types';
import { calculateHealthScore } from '@/utils/financialHealth';
import { aiService } from '@/services/aiService';

interface FinancialHealthGaugeProps {
  transactions: Transaction[];
  currentMonthKey: string;
}

export function FinancialHealthGauge({ transactions, currentMonthKey }: FinancialHealthGaugeProps) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  // Calculate the score purely mathematically
  const healthData = useMemo(() => calculateHealthScore(transactions, currentMonthKey), [transactions, currentMonthKey]);
  const score = healthData.score;

  // Determine colors based on score tiers
  const getColor = (s: number) => {
    if (s >= 75) return '#10b981'; // emerald-500
    if (s >= 45) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };

  const colorHex = getColor(score);
  const colorClass = score >= 75 ? 'text-emerald-500' : score >= 45 ? 'text-amber-500' : 'text-red-500';
  const bgClass = score >= 75 ? 'border-l-emerald-500' : score >= 45 ? 'border-l-amber-500' : 'border-l-red-500';

  // Data for Recharts
  const data = [
    { name: 'Health', value: score, fill: colorHex }
  ];

  // Fetch AI Insight
  useEffect(() => {
    if (transactions.length === 0) {
      setInsight("Add some transactions so I can analyze your financial health!");
      return;
    }

    const fetchInsight = async () => {
      // Create a cache key based on the exact pure score & transaction count
      const cacheKey = `health_insight_${score}_${transactions.length}`;
      const cached = sessionStorage.getItem(cacheKey);
      
      if (cached) {
        setInsight(cached);
        return;
      }

      setLoadingInsight(true);
      try {
        const prompt = `
          The user has a Financial Health Score of ${score}/100.
          Their metrics are:
          - Savings Rate: ${healthData.savingsRate.toFixed(1)}%
          - Budget Adherence: ${healthData.budgetAdherence.toFixed(1)}% (lower is better, 0-80% is ideal)
          - Emergency Fund Proxy (Savings vs Income): ${healthData.emergencyFundProxy.toFixed(1)}%
          
          Write exactly ONE short, highly engaging, gamified sentence (max 12 words) that acts as an emotional anchor for the dashboard.
          If score > 75, praise them and make them feel elite.
          If score 45-74, encourage them to optimize.
          If score < 45, give a gentle but firm reality check.
          Do NOT use quotes in your response.
        `;
        
        const response = await aiService.generateText(prompt);
        const cleanResponse = response.replace(/^"|"$/g, '').trim();
        
        sessionStorage.setItem(cacheKey, cleanResponse);
        setInsight(cleanResponse);
      } catch (error) {
        console.error('Failed to generate health insight:', error);
        setInsight(score >= 75 ? "You're doing fantastic! Keep up the great financial habits." : 
                   score >= 45 ? "You're on the right track, but there's room to grow." : 
                   "Your financial health needs some immediate attention.");
      } finally {
        setLoadingInsight(false);
      }
    };

    fetchInsight();
  }, [score, transactions.length, healthData]);

  return (
    <Card className={`glass-card border-l-4 ${bgClass} relative overflow-hidden transition-all duration-500`}>
      {/* Background flare based on score */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 pointer-events-none transition-colors duration-1000"
        style={{ backgroundColor: colorHex }}
      />
      
      <CardHeader className="pb-0 z-10 relative">
        <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-white">
          <Activity className={`h-5 w-5 ${colorClass}`} />
          Health Score
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Your overall financial velocity
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-2 z-10 relative flex flex-col items-center">
        
        {/* Animated Gauge */}
        <div className="h-44 w-full flex justify-center items-center relative -mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart 
              cx="50%" 
              cy="70%" 
              innerRadius="70%" 
              outerRadius="100%" 
              barSize={16} 
              data={data} 
              startAngle={180} 
              endAngle={0}
            >
              <PolarAngleAxis
                type="number"
                domain={[0, 100]}
                angleAxisId={0}
                tick={false}
              />
              <RadialBar
                background={{ fill: '#e5e7eb', opacity: 0.3 }}
                dataKey="value"
                cornerRadius={10}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </RadialBarChart>
          </ResponsiveContainer>
          
          {/* Center Text */}
          <div className="absolute top-[65%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center flex flex-col items-center">
            <span className={`text-5xl font-extrabold tabular-nums tracking-tighter ${colorClass} drop-shadow-sm transition-all duration-1000`}>
              {score}
            </span>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mt-1">/ 100</span>
          </div>
        </div>

        {/* AI Insight Bar */}
        <div className="w-full mt-1 p-3 rounded-xl bg-white/60 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-start gap-3 flex-1 min-h-[4rem]">
          <div className={`p-1.5 rounded-full bg-opacity-20 shrink-0 ${score >= 75 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : score >= 45 ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'}`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-snug">
            {loadingInsight ? (
              <span className="flex items-center gap-2 text-gray-400">
                <Loader2 className="w-3 h-3 animate-spin" /> Generating insight...
              </span>
            ) : (
              insight
            )}
          </p>
        </div>

      </CardContent>
    </Card>
  );
}
