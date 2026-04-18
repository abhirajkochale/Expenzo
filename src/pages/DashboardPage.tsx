import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FinancialHealthGauge } from '@/components/dashboard/FinancialHealthGauge';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Bot, Sparkles, Filter, CalendarDays,
  AlertTriangle, TrendingUp, Calendar, Lightbulb, ShieldCheck, Target,
  Search, ArrowRight, Wallet, Activity
} from 'lucide-react';
import { transactionApi } from '@/db/api';
import { format, parseISO, isValid, subMonths, getDaysInMonth, getDate } from 'date-fns';
import { useTransactionListener } from '@/hooks/useTransactionListener';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Transaction, CategorySpend, CategoryType, CATEGORY_METADATA } from '@/types/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Smartphone } from 'lucide-react';

// --- TYPES ---
interface AIInsight {
  type: 'alert' | 'trend' | 'savings' | 'forecast';
  title: string;
  description: string;
  amount?: number;
  icon: any;
  color: string;
}

interface ActionPlanItem {
  id: string;
  text: string;
  subtext: string;
  icon: any;
  color: string;
}

// --- STYLES FOR ADAPTIVE SPATIAL UI (Light & Dark) ---
const dashboardStyles = `
  /* BASE (LIGHT MODE) - Premium Frosted Glass */
  .glass-card {
    background: rgba(255, 255, 255, 0.65);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    box-shadow: 
      0 4px 24px -1px rgba(0, 0, 0, 0.05),
      inset 0 0 20px rgba(255, 255, 255, 0.5);
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }
  
  .glass-card:hover {
    background: rgba(255, 255, 255, 0.85);
    transform: translateY(-4px);
    box-shadow: 
      0 12px 40px -5px rgba(0, 0, 0, 0.1),
      inset 0 0 20px rgba(255, 255, 255, 0.8);
    border-color: rgba(255, 255, 255, 1);
  }

  /* DARK MODE OVERRIDES - Deep Space Glass */
  .dark .glass-card {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  }
  
  .dark .glass-card:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5);
  }

  /* 3D Tilt Effect */
  .tilt-card {
    transition: transform 0.4s ease;
  }
  .tilt-card:hover {
    transform: perspective(1000px) rotateX(2deg) translateY(-5px);
  }

  /* Background Grid Pattern for Depth */
  .spatial-grid {
    background-image: 
      linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    mask-image: radial-gradient(circle at center, black 60%, transparent 100%);
  }
  .dark .spatial-grid {
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  }
`;

// --- HELPER: Generate Insights ---
const generateAIInsights = (transactions: Transaction[], categoryData: CategorySpend[]): AIInsight[] => {
  const insights: AIInsight[] = [];
  const now = new Date();
  const currentMonthKey = format(now, 'yyyy-MM');
  const lastMonthKey = format(subMonths(now, 1), 'yyyy-MM');

  // 1. ANOMALY DETECTION
  const topCategory = categoryData[0];
  if (topCategory && topCategory.total_spent > 5000) {
    insights.push({
      type: 'alert',
      title: 'High Spending Alert',
      description: `Your spending in ${topCategory.category} is unusually high.`,
      amount: topCategory.total_spent,
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/20'
    });
  }

  // 2. TREND ANALYSIS
  const thisMonthTotal = transactions
    .filter(t => t.date?.startsWith(currentMonthKey) && t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const lastMonthTotal = transactions
    .filter(t => t.date?.startsWith(lastMonthKey) && t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  if (lastMonthTotal > 0) {
    const percentChange = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
    if (percentChange > 10) {
      insights.push({
        type: 'trend',
        title: 'Spending Spike',
        description: `Spending is up ${percentChange.toFixed(0)}% compared to last month.`,
        amount: thisMonthTotal - lastMonthTotal,
        icon: TrendingUp,
        color: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/20'
      });
    }
  }

  return insights;
};

// --- HELPER: Generate Action Plan ---
const generateActionPlan = (transactions: Transaction[], income: number, expense: number): ActionPlanItem[] => {
  const actions: ActionPlanItem[] = [];
  const now = new Date();
  const daysInMonth = getDaysInMonth(now);
  const currentDay = getDate(now);
  const daysLeft = daysInMonth - currentDay + 1;

  // 1. Daily Safe Spend
  const remainingBudget = Math.max(0, income - expense);
  const safeDaily = remainingBudget > 0 ? remainingBudget / daysLeft : 0;
  
  if (safeDaily > 0) {
    actions.push({
      id: 'daily_safe',
      text: `You can safely spend ₹${Math.floor(safeDaily).toLocaleString()} today`,
      subtext: `Based on your ₹${remainingBudget.toLocaleString()} remaining budget`,
      icon: ShieldCheck,
      color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20'
    });
  } else {
    actions.push({
      id: 'daily_strict',
      text: `Avoid non-essential spending for ${daysLeft} days`,
      subtext: `You have exceeded your monthly income by ₹${Math.abs(income - expense).toLocaleString()}`,
      icon: AlertTriangle,
      color: 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-500/20'
    });
  }

  // 2. Category Reduction
  const currentMonthKey = format(now, 'yyyy-MM');
  const catMap = new Map<string, number>();
  transactions
    .filter(t => t.date?.startsWith(currentMonthKey) && t.type === 'expense')
    .forEach(t => catMap.set(t.category, (catMap.get(t.category) || 0) + Number(t.amount)));
  
  const sortedCats = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]);
  if (sortedCats.length > 0) {
    const [topCat, amount] = sortedCats[0];
    const cutAmount = Math.ceil((amount * 0.1) / 100) * 100;
    actions.push({
      id: 'cat_cut',
      text: `Reduce ${topCat} by ₹${cutAmount} to stay safe`,
      subtext: `${topCat} is your highest spend (₹${amount.toLocaleString()})`,
      icon: Target,
      color: 'text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20'
    });
  }

  // 3. Upcoming Risk
  const potentialBills = transactions.filter(t => {
    const tDate = parseISO(t.date);
    return t.type === 'expense' && getDate(tDate) > currentDay && Number(t.amount) > 1000;
  });
  
  if (potentialBills.length > 0) {
    const nextBill = potentialBills[0];
    const billDate = getDate(parseISO(nextBill.date));
    actions.push({
      id: 'future_risk',
      text: `Next risk: ~${billDate}th (${nextBill.description})`,
      subtext: `Recurring bill detected from history`,
      icon: Calendar,
      color: 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20'
    });
  } else {
    actions.push({
      id: 'generic_save',
      text: `Transfer ₹${Math.floor(income * 0.05)} to savings now`,
      subtext: `Pay yourself first principle`,
      icon: Lightbulb,
      color: 'text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/20'
    });
  }

  return actions.slice(0, 3);
};

export default function DashboardPage() {
  const { user } = useAuth();

  // --- State ---
  const [loading, setLoading] = useState(true);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIInsight[]>([]);
  const [actionPlan, setActionPlan] = useState<ActionPlanItem[]>([]);

  // --- Filter State ---
  const [filterType, setFilterType] = useState<'month' | 'year' | 'all'>('month');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  
  // --- Transaction List Filter ---
  const [txCategoryFilter, setTxCategoryFilter] = useState<string>('all');
  const [autoDetect, setAutoDetect] = useState(() => {
    return localStorage.getItem('auto_detect_transactions') === 'true';
  });

  const { toast } = useToast();

  const displayName = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Friend';

  const handleRefresh = () => {
    fetchData();
  };

  const { checkAccess, requestAccess } = useTransactionListener(handleRefresh);

  // 1. Load Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await transactionApi.getAll();
      const safeData = data || [];
      setAllTransactions(safeData);

      // Generate Insights & Actions
      const currentMonthKey = format(new Date(), 'yyyy-MM');
      const thisMonthTrans = safeData.filter(t => t.date && t.date.startsWith(currentMonthKey));
      
      const categoryMap = new Map<string, CategorySpend>();
      
      thisMonthTrans.forEach(t => {
        if (t.type === 'expense') {
          const cat = (t.category || 'other') as CategoryType; 
          
          const existing = categoryMap.get(cat) || { 
              category: cat, 
              total_spent: 0, 
              transaction_count: 0,
              user_id: user?.id || 'current', 
              month: currentMonthKey          
          };
          
          existing.total_spent += Number(t.amount);
          existing.transaction_count += 1;
          categoryMap.set(cat, existing);
        }
      });
      
      const catData = Array.from(categoryMap.values()).sort((a, b) => b.total_spent - a.total_spent);
      
      setAiAnalysis(generateAIInsights(safeData, catData));
      const income = thisMonthTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
      const expense = thisMonthTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
      setActionPlan(generateActionPlan(safeData, income, expense));

    } catch (e) {
      console.error("Failed to load transactions", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleToggleAutoDetect = async (checked: boolean) => {
    // 1. Update UI state immediately for responsive feel
    setAutoDetect(checked);
    localStorage.setItem('auto_detect_transactions', checked.toString());

    if (checked) {
      try {
        const access = await checkAccess();
        
        // Handle web/unsupported platforms
        if ((access as any).web) {
          toast({
            title: "Simulated Mode",
            description: "Running in browser. You can simulate detections via console.",
          });
          return;
        }

        if (!access.granted) {
          toast({
            title: "Permission Required",
            description: "Please enable Notification Access for Expenzo in the next screen.",
          });
          await requestAccess();
        } else {
          toast({
            title: "Auto-Detect Active",
            description: "Expenzo is now listening for transaction signals.",
          });
        }
      } catch (err) {
        console.warn("Failed to trigger native permissions:", err);
      }
    }
  };

  // 2. Filter Transactions (View Filter)
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(t => {
      if (!t.date) return false;
      if (filterType === 'all') return true;
      if (filterType === 'year') return t.date.startsWith(selectedYear);
      if (filterType === 'month') return t.date.startsWith(selectedMonth);
      return true;
    });
  }, [allTransactions, filterType, selectedYear, selectedMonth]);

  // 3. Summaries & Prediction
  const summaryData = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') income += amt;
      else expense += amt;
    });

    let projectedExpense = 0;
    let expenseStatus: 'safe' | 'warning' | 'danger' = 'safe';
    let predictionText = '';

    if (filterType === 'month') {
      const now = new Date();
      const currentDay = getDate(now);
      const totalDays = getDaysInMonth(now);
      const isCurrentMonth = selectedMonth === format(now, 'yyyy-MM');
      
      if (isCurrentMonth && currentDay > 1) {
        const dailyAvg = expense / currentDay;
        projectedExpense = dailyAvg * totalDays;
        
        if (projectedExpense > income) {
          expenseStatus = 'danger';
          predictionText = `At this pace, you'll overspend by ₹${Math.floor(projectedExpense - income).toLocaleString()}`;
        } else if (projectedExpense > income * 0.9) {
          expenseStatus = 'warning';
          predictionText = `On track to use 100% of income`;
        } else {
          expenseStatus = 'safe';
          predictionText = `Safe! Projected savings: ₹${Math.floor(income - projectedExpense).toLocaleString()}`;
        }
      }
    }

    return { income, expense, savings: income - expense, projectedExpense, expenseStatus, predictionText };
  }, [filteredTransactions, filterType, selectedMonth]);

  // 4. Transaction List Logic (Filtered by Category)
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    allTransactions.forEach(t => t.category && cats.add(t.category));
    return Array.from(cats).sort();
  }, [allTransactions]);

  const recentTransactionsList = useMemo(() => {
    let list = [...filteredTransactions];
    if (txCategoryFilter !== 'all') {
      list = list.filter(t => t.category === txCategoryFilter);
    }
    return list
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10); 
  }, [filteredTransactions, txCategoryFilter]);


  // --- HELPERS ---
  const safeFormatDate = (dateStr: string, formatStr: string) => {
    try {
      if (!dateStr) return '';
      const date = parseISO(`${dateStr}-01`);
      if (!isValid(date)) return dateStr;
      return format(date, formatStr);
    } catch (e) { return dateStr; }
  };

  const formatCurrency = (amount: number) => 
    `₹${(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const filterOptions = useMemo(() => {
    const years = new Set<string>();
    const months = new Set<string>();
    allTransactions.forEach(t => {
      if (!t.date) return;
      try {
        const date = parseISO(t.date);
        if (isValid(date)) {
          years.add(date.getFullYear().toString());
          months.add(format(date, 'yyyy-MM'));
        }
      } catch (e) {}
    });
    return {
      years: Array.from(years).sort().reverse(),
      months: Array.from(months).sort().reverse()
    };
  }, [allTransactions]);

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-full rounded-xl" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <style>{dashboardStyles}</style>
      <style>{`
        button[class*="fixed"], 
        div[class*="fixed"] > button {
          display: none !important;
        }
      `}</style>

      {/* BACKGROUND AMBIENCE (Theme Aware) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-200/40 rounded-full blur-[120px] dark:opacity-0 mix-blend-multiply" />
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-200/40 rounded-full blur-[100px] dark:opacity-0 mix-blend-multiply" />
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] opacity-0 dark:opacity-100 transition-opacity" />
         <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] opacity-0 dark:opacity-100 transition-opacity" />
         <div className="absolute inset-0 spatial-grid opacity-60 dark:opacity-30" />
      </div>

      <div className="space-y-8 relative z-10">

        {/* HEADER & FILTERS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white drop-shadow-sm">
              Hey, <span className="text-emerald-600 dark:text-emerald-400 capitalize">{displayName}</span>!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">Your <span className="text-emerald-600 dark:text-emerald-500">spatial financial overview</span> is ready.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="glass-card rounded-lg flex items-center p-1 bg-white/50 dark:bg-white/5">
                <Select value={filterType} onValueChange={(v) => setFilterType(v as 'month' | 'year' | 'all')}>
                  <SelectTrigger className="w-[110px] md:w-[120px] border-none bg-transparent focus:ring-0 text-gray-700 dark:text-white font-medium text-xs md:text-sm">
                    <Filter className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                    <SelectValue placeholder="View" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="year">Yearly</SelectItem>
                    <SelectItem value="all">Overall</SelectItem>
                  </SelectContent>
                </Select>

                {filterType === 'month' && (
                  <>
                    <div className="w-px h-4 bg-gray-300 dark:bg-white/20 mx-1" />
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[140px] md:w-[150px] border-none bg-transparent focus:ring-0 text-gray-700 dark:text-white font-medium text-xs md:text-sm">
                        <CalendarDays className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                        <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                        {filterOptions.months.map(m => (
                            <SelectItem key={m} value={m}>{safeFormatDate(m, 'MMMM yyyy')}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                  </>
                )}

                {filterType === 'year' && (
                  <>
                    <div className="w-px h-4 bg-gray-300 dark:bg-white/20 mx-1" />
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-[100px] md:w-[110px] border-none bg-transparent focus:ring-0 text-gray-700 dark:text-white font-medium text-xs md:text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                        <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                        {filterOptions.years.map(y => (
                            <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                  </>
                )}
            </div>
          </div>
        </div>

        {/* 1. 3D SUMMARY CARDS */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden group tilt-card">
            <div className="absolute top-0 right-0 p-16 bg-emerald-500/10 blur-3xl group-hover:bg-emerald-500/20 transition-all" />
            <div className="flex justify-between items-start mb-4">
               <div>
                 <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Income</p>
                 <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors uppercaseTracking-wider">{formatCurrency(summaryData.income)}</div>
               </div>
               <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
                 <TrendingUp className="h-6 w-6" />
               </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 relative overflow-hidden group tilt-card">
            <div className="absolute top-0 right-0 p-16 bg-red-500/10 blur-3xl group-hover:bg-red-500/20 transition-all" />
            <div className="flex justify-between items-start mb-4">
               <div>
                 <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Expense</p>
                 <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{formatCurrency(summaryData.expense)}</div>
               </div>
               <div className="p-3 bg-red-100 dark:bg-red-500/20 rounded-xl text-red-600 dark:text-red-400">
                 <Activity className="h-6 w-6" />
               </div>
            </div>
            {filterType === 'month' && summaryData.predictionText ? (
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500 mb-1">
                    <span>Pace</span>
                    <span className={summaryData.expenseStatus === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}>
                      {summaryData.expenseStatus === 'danger' ? 'High Risk' : 'Safe'}
                    </span>
                  </div>
                  <Progress value={Math.min(100, (summaryData.expense / (summaryData.projectedExpense || 1)) * 100)} className={`h-1.5 bg-gray-200 dark:bg-white/10 ${summaryData.expenseStatus === 'danger' ? '[&>*]:bg-red-500' : '[&>*]:bg-emerald-500'}`} />
                </div>
            ) : <p className="text-xs text-gray-500 font-medium font-medium uppercase tracking-wider">Total Output</p>}
          </div>

          <div className="glass-card rounded-2xl p-6 relative overflow-hidden group tilt-card">
            <div className="absolute top-0 right-0 p-16 bg-blue-500/10 blur-3xl group-hover:bg-blue-500/20 transition-all" />
            <div className="flex justify-between items-start mb-4">
               <div>
                 <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Net Savings</p>
                 <div className={`text-3xl font-bold mt-1 ${summaryData.savings >= 0 ? 'text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(summaryData.savings)}</div>
               </div>
               <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
                 <Wallet className="h-6 w-6" />
               </div>
            </div>
            <p className="text-xs text-gray-500 font-medium">{summaryData.income > 0 ? ((summaryData.savings / summaryData.income) * 100).toFixed(1) : 0}% Savings Rate</p>
          </div>
        </div>

        {/* 2. QUICK ACTIONS & AUTO-DETECT */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <div onClick={() => window.dispatchEvent(new CustomEvent('open-guardian-chat'))} className="cursor-pointer relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gray-900 dark:bg-black/40 backdrop-blur-xl px-6 py-6 text-white shadow-xl hover:scale-[1.01] transition-all group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-transparent to-blue-500/20 opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex items-center justify-between gap-4">
                 <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                       <Bot className="h-6 w-6 text-white" />
                    </div>
                    <div>
                       <h2 className="text-xl font-bold text-white">Ask Expenzo</h2>
                       <p className="text-gray-400 text-xs">Analyze my spending...</p>
                    </div>
                 </div>
                 <Search className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="glass-card rounded-3xl p-6 flex items-center justify-between border-l-4 border-l-emerald-500">
               <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">Auto-Detect Transactions</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Detect UPI SMS & Notifications</p>
                  </div>
               </div>
               <Switch 
                  id="auto-detect" 
                  checked={autoDetect}
                  onCheckedChange={handleToggleAutoDetect}
                  className="data-[state=checked]:bg-emerald-600"
               />
            </div>
        </div>

        {/* 3. GRID: GAUGE & INSIGHTS */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <FinancialHealthGauge transactions={allTransactions} currentMonthKey={selectedMonth} />
            
            <Card className="glass-card border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-white">
                  <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Smart Action Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 mt-2">
                {actionPlan.length === 0 ? <p className="text-sm text-gray-500">No data.</p> : actionPlan.map(action => (
                    <div key={action.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                      <div className={`p-2 rounded-lg ${action.color}`}><action.icon className="h-5 w-5" /></div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{action.text}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">{action.subtext}</p>
                      </div>
                    </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass-card border-l-4 border-l-emerald-500 text-gray-900 dark:text-white">
               <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                {aiAnalysis.length === 0 ? <p className="text-sm text-gray-500">All systems good.</p> : (
                  <div className="space-y-3">
                    {aiAnalysis.map((insight, index) => (
                      <div key={index} className="flex items-start gap-4 p-3 rounded-xl bg-white/60 dark:bg-white/5 border border-white/5">
                         <div className={`p-2 rounded-lg shrink-0 ${insight.color}`}><insight.icon className="h-5 w-5" /></div>
                         <div className="flex-1">
                           <p className="text-sm font-bold">{insight.title}</p>
                           <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{insight.description}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
        </div>

        {/* 4. ACTIVITY TABLE */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
             <div className="flex items-center gap-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity</h3>
                <Select value={txCategoryFilter} onValueChange={setTxCategoryFilter}>
                  <SelectTrigger className="w-[140px] h-8 text-xs bg-white/50 dark:bg-white/5 border-none focus:ring-0">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {availableCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>
             <Button variant="ghost" size="sm" asChild className="text-emerald-700 dark:text-emerald-400">
               <Link to="/transactions">View All <ArrowRight className="ml-1 h-3 w-3" /></Link>
             </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 dark:border-white/5">
                  <TableHead className="font-semibold text-gray-500 dark:text-gray-400">Description</TableHead>
                  <TableHead className="font-semibold text-gray-500 dark:text-gray-400">Category</TableHead>
                  <TableHead className="text-right font-semibold text-gray-500 dark:text-gray-400">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactionsList.map((t) => (
                  <TableRow key={t.id} className="border-gray-200 dark:border-white/5">
                    <TableCell className="font-medium text-gray-900 dark:text-white">{t.description}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs uppercase tracking-wider bg-transparent">{t.category}</Badge></TableCell>
                    <TableCell className={`text-right font-mono font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-gray-900 dark:text-white'}`}>
                      {t.type === 'income' ? '+' : ''}{formatCurrency(t.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

      </div>
    </MainLayout>
  );
}