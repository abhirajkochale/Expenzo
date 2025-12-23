import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Target, TrendingUp, Plus, Trash2, Sparkles, 
  CalendarClock, Calculator, AlertCircle, CheckCircle2, PiggyBank 
} from 'lucide-react';
import { budgetApi, goalApi, transactionApi } from '@/db/api';
import { Budget, Goal, CATEGORY_METADATA, CategoryType, BudgetFormData } from '@/types/types';
import { BudgetDialog } from '@/components/budgets/BudgetDialog';
import { GoalDialog } from '@/components/budgets/GoalDialog';
import { DepositDialog } from '@/components/budgets/DepositDialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { endOfMonth, differenceInDays, addMonths, format, subMonths, differenceInMonths } from 'date-fns';

// --- STYLES FOR SPATIAL UI ---
const spatialStyles = `
  /* BASE (LIGHT MODE) */
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
  .dark .glass-card {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  }

  /* Background Grid Pattern */
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

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [categorySpend, setCategorySpend] = useState<Record<string, number>>({});
  const [averageMonthlySavings, setAverageMonthlySavings] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [generatingAI, setGeneratingAI] = useState(false);
  
  // Dialog States
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const currentMonthKey = format(now, 'yyyy-MM');

      const [budgetsData, goalsData, allTransactions] = await Promise.all([
        budgetApi.getAll(),
        goalApi.getAll(),
        transactionApi.getAll()
      ]);

      setBudgets(budgetsData || []);
      setGoals(goalsData || []);

      const safeTransactions = Array.isArray(allTransactions) ? allTransactions : [];

      const currentSpendMap: Record<string, number> = {};
      const currentTrans = safeTransactions.filter(t => 
        t.date && t.date.startsWith(currentMonthKey) && t.type === 'expense'
      );

      currentTrans.forEach(t => {
        currentSpendMap[t.category] = (currentSpendMap[t.category] || 0) + Number(t.amount);
      });
      setCategorySpend(currentSpendMap);

      let totalSavings = 0;
      let monthsCounted = 0;

      for (let i = 1; i <= 3; i++) {
        const prevDate = subMonths(now, i);
        const prevMonthKey = format(prevDate, 'yyyy-MM');
        const monthlyTrans = safeTransactions.filter(t => t.date && t.date.startsWith(prevMonthKey));
        
        if (monthlyTrans.length > 0) {
          const income = monthlyTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
          const expense = monthlyTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
          
          totalSavings += (income - expense);
          monthsCounted++;
        }
      }

      setAverageMonthlySavings(monthsCounted > 0 ? totalSavings / monthsCounted : 0);

    } catch (error) {
      console.error('Failed to load data:', error);
      toast({ title: 'Error', description: 'Failed to load financial data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const generateAIBudgets = async () => {
    try {
      setGeneratingAI(true);
      const transactions = await transactionApi.getAll();
      
      if (!transactions || transactions.length === 0) {
        toast({ title: "Not Enough Data", description: "Add transactions first so AI can analyze habits." });
        setGeneratingAI(false);
        return;
      }
      
      const catTotals: Record<string, number> = {};
      const catFirstDate: Record<string, Date> = {}; 

      transactions.filter(t => t.type === 'expense').forEach(t => {
        const amt = Number(t.amount) || 0;
        const tDate = new Date(t.date);
        
        if (t.category) {
          catTotals[t.category] = (catTotals[t.category] || 0) + amt;
          if (!catFirstDate[t.category] || tDate < catFirstDate[t.category]) {
            catFirstDate[t.category] = tDate;
          }
        }
      });

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const aiProposals: BudgetFormData[] = Object.keys(catTotals).map(category => {
        const firstDate = catFirstDate[category] || subMonths(now, 1);
        const monthsActive = Math.max(1, differenceInDays(now, firstDate) / 30);
        const avgSpend = catTotals[category] / monthsActive;
        const proposedLimit = Math.ceil((avgSpend * 1.1) / 100) * 100;
        
        return { 
          category: category as CategoryType, 
          limit_amount: Math.max(500, proposedLimit),
          month: currentMonth,
          year: currentYear
        };
      });

      for (const proposal of aiProposals) {
        const existingBudget = budgets.find(b => 
          b.category === proposal.category && 
          Number(b.month) === proposal.month && 
          Number(b.year) === proposal.year
        );

        if (existingBudget) {
          // @ts-ignore
          await budgetApi.update(existingBudget.id, {
            limit_amount: proposal.limit_amount
          });
        } else {
          await budgetApi.create(proposal);
        }
      }

      toast({ title: "Optimized", description: "Budgets updated based on spending." });
      await loadData(); 

    } catch (error) {
      console.error("AI Error:", error);
      toast({ title: "Error", description: "Failed to optimize budgets", variant: "destructive" });
    } finally {
      setGeneratingAI(false);
    }
  };

  const getDailySafeSpend = (limit: number, spent: number) => {
    const now = new Date();
    const end = endOfMonth(now);
    const daysRemaining = differenceInDays(end, now) + 1;
    if (spent >= limit) return 0;
    return Math.floor((limit - spent) / daysRemaining);
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Delete this budget?')) return;
    await budgetApi.delete(id);
    loadData();
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Delete this goal?')) return;
    await goalApi.delete(id);
    loadData();
  };

  const handleOpenDeposit = (goal: Goal) => {
    setSelectedGoal(goal);
    setDepositDialogOpen(true);
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const getProgressColorClass = (percent: number) => {
    if (percent >= 100) return '[&>div]:!bg-red-600';     
    if (percent >= 80) return '[&>div]:!bg-orange-500';   
    if (percent >= 50) return '[&>div]:!bg-yellow-500';   
    return '[&>div]:!bg-green-500';                      
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-6 xl:grid-cols-2">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <style>{spatialStyles}</style>
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-200/40 dark:bg-purple-900/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-normal" />
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-200/40 dark:bg-blue-900/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-normal" />
         <div className="absolute inset-0 spatial-grid opacity-60 dark:opacity-30" />
      </div>

      <div className="space-y-6 relative z-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Spending Limits</h1>
            <p className="text-muted-foreground mt-1 font-medium">
              Set flexible limits and let Guardian track your goals
            </p>
          </div>
          
          {/* Responsive Button: Full width on mobile, auto on desktop */}
          <Button 
            onClick={generateAIBudgets} 
            disabled={generatingAI}
            className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg transition-all"
          >
            {generatingAI ? <Sparkles className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {generatingAI ? 'Optimizing...' : 'AI Optimize Budgets'}
          </Button>
        </div>

        {/* GRID: 2 Columns on Laptops (lg), 1 on mobile/tablet */}
        <div className="grid gap-6 lg:grid-cols-2">
          
          {/* --- BUDGETS CARD --- */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    Your Budgets
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Daily safe spending limit: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(averageMonthlySavings > 0 ? averageMonthlySavings / 30 : 0)}/day</span>
                  </CardDescription>
                </div>
                <Button onClick={() => setBudgetDialogOpen(true)} size="sm" variant="outline" className="bg-transparent border-gray-300 dark:border-white/10">
                  <Plus className="h-4 w-4 mr-2" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {budgets.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No limits set yet</p>
                  <p className="text-sm mt-2">Use 'AI Optimize Budgets' to start instantly</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {budgets.map((budget) => {
                    const meta = CATEGORY_METADATA[budget.category as keyof typeof CATEGORY_METADATA];
                    const spent = categorySpend[budget.category] || 0;
                    const limit = Number(budget.limit_amount);
                    const progress = limit > 0 ? (spent / limit) * 100 : 0;
                    const isOverBudget = spent > limit;
                    const dailySafe = getDailySafeSpend(limit, spent);
                    
                    return (
                      <div key={budget.id} className="space-y-3 p-4 rounded-xl border border-gray-200 dark:border-white/5 bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl p-2 bg-white dark:bg-black/20 rounded-lg">{meta?.icon || '📦'}</span>
                            <span className="font-semibold">{meta?.label || budget.category}</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={() => handleDeleteBudget(budget.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className={isOverBudget ? 'text-red-500 font-bold' : 'text-gray-600 dark:text-gray-400'}>
                              {formatCurrency(spent)} <span className="text-xs font-normal text-muted-foreground">spent</span>
                            </span>
                            <span className="font-bold">{formatCurrency(limit)}</span>
                          </div>
                          
                          <Progress 
                            value={Math.min(progress, 100)} 
                            className={`h-2 ${getProgressColorClass(progress)}`} 
                          />
                        </div>

                        {/* Responsive Badge Row: Stacks on small screens */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-1 gap-2">
                          {!isOverBudget ? (
                            <Badge variant="secondary" className="w-fit flex items-center gap-1 font-normal text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                              <Calculator className="h-3 w-3" /> Safe: {formatCurrency(dailySafe)} / day
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="w-fit flex items-center gap-1 font-normal text-xs">
                              <AlertCircle className="h-3 w-3" /> Limit Exceeded
                            </Badge>
                          )}
                          <span className="text-xs font-medium text-muted-foreground self-end sm:self-auto">{progress.toFixed(0)}% used</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* --- GOALS CARD --- */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5 text-purple-500" />
                    Savings Goals
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Avg. Savings: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(averageMonthlySavings)}/mo</span>
                  </CardDescription>
                </div>
                <Button onClick={() => setGoalDialogOpen(true)} size="sm" variant="outline" className="bg-transparent border-gray-300 dark:border-white/10">
                  <Plus className="h-4 w-4 mr-2" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {goals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No goals yet</p>
                  <p className="text-sm mt-2">What are you saving for?</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {goals.map((goal) => {
                    const current = Number(goal.current_amount);
                    const target = Number(goal.target_amount);
                    const progress = target > 0 ? (current / target) * 100 : 0;
                    const isCompleted = current >= target;
                    
                    let statusNode = null;
                    let adviceText = "";
                    let isOnTrack = true;

                    if (isCompleted) {
                      statusNode = <Badge className="bg-green-500 hover:bg-green-600">Goal Achieved! 🎉</Badge>;
                    } else if (goal.target_date) {
                      const targetDate = new Date(goal.target_date);
                      const monthsLeft = Math.max(1, differenceInMonths(targetDate, new Date()));
                      const remainingAmount = target - current;
                      const requiredMonthly = remainingAmount / monthsLeft;
                      
                      isOnTrack = averageMonthlySavings >= requiredMonthly;
                      
                      adviceText = `Need to save ${formatCurrency(requiredMonthly)}/mo`;
                      
                      statusNode = isOnTrack ? (
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> On Track
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                          <AlertCircle className="h-3 w-3 mr-1" /> {monthsLeft > 0 ? 'Behind Schedule' : 'Overdue'}
                        </Badge>
                      );
                    } else {
                      if (averageMonthlySavings <= 0) {
                        adviceText = "Increase savings to calculate date";
                      } else {
                        const remaining = target - current;
                        const monthsToGo = Math.ceil(remaining / averageMonthlySavings);
                        const projectedDate = addMonths(new Date(), monthsToGo);
                        adviceText = `Est: ${format(projectedDate, 'MMM yyyy')}`;
                      }
                    }

                    return (
                      <div key={goal.id} className="space-y-3 p-4 rounded-xl border border-gray-200 dark:border-white/5 bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
                        
                        {/* Responsive Header: Stack Title and Buttons on Mobile */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-lg">{goal.name}</span>
                            {goal.target_date && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <CalendarClock className="h-3 w-3"/> Due: {format(new Date(goal.target_date), 'MMM yyyy')}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            {!isCompleted && (
                              <Button 
                                size="sm" 
                                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => handleOpenDeposit(goal)}
                              >
                                <Plus className="h-4 w-4 mr-1" /> Add Funds
                              </Button>
                            )}

                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={() => handleDeleteGoal(goal.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{formatCurrency(current)}</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(target)}</span>
                          </div>
                          <Progress 
                            value={Math.min(progress, 100)} 
                            className={`h-2 ${!isOnTrack && !isCompleted && goal.target_date ? '[&>div]:!bg-red-500' : ''}`} 
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-1 gap-2">
                          <div className="flex items-center gap-2">
                            {statusNode || (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-gray-100 dark:bg-white/10 px-2 py-1 rounded">
                                <CalendarClock className="h-3 w-3 text-primary" />
                                <span>{adviceText}</span>
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-medium text-muted-foreground self-end sm:self-auto">{progress.toFixed(0)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <BudgetDialog
        open={budgetDialogOpen}
        onOpenChange={setBudgetDialogOpen}
        onSuccess={loadData}
      />

      <GoalDialog
        open={goalDialogOpen}
        onOpenChange={setGoalDialogOpen}
        onSuccess={loadData}
      />

      <DepositDialog 
        open={depositDialogOpen} 
        onOpenChange={setDepositDialogOpen} 
        goal={selectedGoal}
        onSuccess={loadData} 
      />
    </MainLayout>
  );
}