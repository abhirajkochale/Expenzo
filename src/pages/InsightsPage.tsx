import { useEffect, useState, useMemo } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  PieChart, Calendar, DollarSign, Activity, ArrowUpRight, ArrowDownRight, 
  BarChart3, LineChart as LineChartIcon, ChevronLeft, ChevronRight,
  TrendingUp, Layers
} from 'lucide-react';
import { transactionApi } from '@/db/api';
import { CATEGORY_METADATA } from '@/types/types';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subMonths, parseISO, isValid, endOfMonth, eachDayOfInterval, addMonths } from 'date-fns';
import { 
  PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, Sector,
  XAxis, YAxis, CartesianGrid, Brush, Area, ComposedChart
} from 'recharts';

interface CategorySpend {
  category: string;
  total_spent: number;
  transaction_count: number;
}

interface MonthlySummary {
  month: string;
  total_income: number;
  total_expense: number;
  net_savings: number;
}

const COLORS = [
  '#3b82f6', '#22c55e', '#eab308', '#f97316', '#ef4444', 
  '#a855f7', '#ec4899', '#64748b', '#14b8a6',
];

const RADIAN = Math.PI / 180;

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
  
  .glass-card:hover {
    background: rgba(255, 255, 255, 0.85);
    transform: translateY(-2px);
    box-shadow: 
      0 12px 40px -5px rgba(0, 0, 0, 0.1),
      inset 0 0 20px rgba(255, 255, 255, 0.8);
    border-color: rgba(255, 255, 255, 1);
  }

  /* DARK MODE OVERRIDES */
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
    transform: perspective(1000px) rotateX(1deg) translateY(-3px);
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

const safeFormatDate = (dateStr: string, formatStr: string) => {
  try {
    if (!dateStr) return '';
    const date = dateStr.length === 7 ? parseISO(`${dateStr}-01`) : parseISO(dateStr);
    if (!isValid(date)) return dateStr;
    return format(date, formatStr);
  } catch (e) { return dateStr; }
};

// --- Custom Label Renderer ---
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
  if (percent < 0.04) return null; 
  
  const radius = outerRadius * 1.2;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const cos = Math.cos(-midAngle * RADIAN);
  const textAnchor = cos >= 0 ? 'start' : 'end';
  
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * Math.sin(-midAngle * RADIAN);
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * Math.sin(-midAngle * RADIAN);
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;

  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={COLORS[index % COLORS.length]} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={COLORS[index % COLORS.length]} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="currentColor" dominantBaseline="central" className="text-xs font-medium fill-gray-700 dark:fill-gray-200">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    </g>
  );
};

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
  return (
    <g>
      <text x={cx} y={cy} dy={-10} textAnchor="middle" fill={fill} className="text-xl font-bold">
        {payload.name}
      </text>
      <text x={cx} y={cy} dy={15} textAnchor="middle" fill="currentColor" className="text-sm opacity-60 fill-gray-600 dark:fill-gray-400">
        {`₹${value.toLocaleString()}`}
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} cornerRadius={6} />
      <Sector cx={cx} cy={cy} innerRadius={innerRadius - 4} outerRadius={innerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.3} cornerRadius={6} />
    </g>
  );
};

export default function InsightsPage() {
  const [loading, setLoading] = useState(true);
  const [rawTransactions, setRawTransactions] = useState<any[]>([]);
  
  // --- Global States ---
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'MM')); 
  const [graphMode, setGraphMode] = useState<'yearly' | 'monthly'>('monthly'); 
  const [activeIndex, setActiveIndex] = useState(0);
  const [chartKey, setChartKey] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await transactionApi.getAll();
        setRawTransactions(data || []);
        
        if (data && data.length > 0) {
           const latest = data.reduce((a, b) => (a.date > b.date ? a : b));
           if (latest && latest.date) {
             const d = parseISO(latest.date);
             setSelectedYear(d.getFullYear().toString());
             setSelectedMonth(format(d, 'MM'));
           }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // --- 1. Available Years and Months ---
  const availableDates = useMemo(() => {
    const years = new Set<string>();
    const monthsByYear: Record<string, Set<string>> = {};

    rawTransactions.forEach(t => {
      if (t.date && t.date.length >= 7) {
        const d = parseISO(t.date);
        if (isValid(d)) {
          const y = d.getFullYear().toString();
          const m = format(d, 'MM');
          years.add(y);
          if (!monthsByYear[y]) monthsByYear[y] = new Set();
          monthsByYear[y].add(m);
        }
      }
    });

    const sortedYears = Array.from(years).sort().reverse();
    const sortedMonthsByYear: Record<string, string[]> = {};
    Object.keys(monthsByYear).forEach(y => {
        sortedMonthsByYear[y] = Array.from(monthsByYear[y]).sort();
    });

    return { years: sortedYears, months: sortedMonthsByYear };
  }, [rawTransactions]);

  const selectedMonthKey = useMemo(() => `${selectedYear}-${selectedMonth}`, [selectedYear, selectedMonth]);

  // --- 2. Pie Chart Data ---
  const categoryData = useMemo(() => {
    const filtered = rawTransactions.filter(t => t.date && t.date.startsWith(selectedMonthKey) && t.type === 'expense');
    const map = new Map<string, number>();
    filtered.forEach(t => {
      const cat = t.category || 'Other';
      map.set(cat, (map.get(cat) || 0) + Number(t.amount));
    });

    return Array.from(map.entries())
      .map(([category, value]) => ({ 
        category, 
        total_spent: value, 
        name: CATEGORY_METADATA[category as keyof typeof CATEGORY_METADATA]?.label || category 
      }))
      .sort((a, b) => b.total_spent - a.total_spent);
  }, [rawTransactions, selectedMonthKey]);

  // --- 3. Monthly Summary Data ---
  const monthlyData = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    const yearTransactions = rawTransactions.filter(t => t.date && t.date.startsWith(selectedYear));

    yearTransactions.forEach(t => {
      const m = t.date.substring(0, 7); 
      if (!map.has(m)) map.set(m, { income: 0, expense: 0 });
      const entry = map.get(m)!;
      if (t.type === 'income') entry.income += Number(t.amount);
      else entry.expense += Number(t.amount);
    });

    const result: MonthlySummary[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(parseInt(selectedYear), i, 1); 
      const k = format(d, 'yyyy-MM');
      const data = map.get(k) || { income: 0, expense: 0 };
      result.push({ 
        month: k, 
        total_income: data.income, 
        total_expense: data.expense, 
        net_savings: data.income - data.expense 
      });
    }
    return result; 
  }, [rawTransactions, selectedYear]);

  // --- 4. Daily Data ---
  const dailyGraphData = useMemo(() => {
    if (graphMode !== 'monthly') return []; 
    try {
      const start = parseISO(selectedMonthKey + '-01');
      if (!isValid(start)) return [];
      const end = endOfMonth(start);
      return eachDayOfInterval({ start, end }).map(date => {
        const dKey = format(date, 'yyyy-MM-dd');
        const dayTrans = rawTransactions.filter(t => t.date === dKey);
        return {
          date: dKey,
          total_income: dayTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0),
          total_expense: dayTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0),
        };
      });
    } catch { return []; }
  }, [rawTransactions, selectedMonthKey, graphMode]);

  // --- Navigation ---
  const handlePrevMonth = () => {
    const current = parseISO(selectedMonthKey + '-01');
    const prev = subMonths(current, 1);
    const prevYear = prev.getFullYear().toString();
    const prevMonth = format(prev, 'MM');

    if (availableDates.years.includes(prevYear) && availableDates.months[prevYear]?.includes(prevMonth)) {
        setSelectedYear(prevYear);
        setSelectedMonth(prevMonth);
    }
  };

  const handleNextMonth = () => {
    const current = parseISO(selectedMonthKey + '-01');
    const next = addMonths(current, 1);
    const nextYear = next.getFullYear().toString();
    const nextMonth = format(next, 'MM');

    if (availableDates.years.includes(nextYear) && availableDates.months[nextYear]?.includes(nextMonth)) {
        setSelectedYear(nextYear);
        setSelectedMonth(nextMonth);
    }
  };

  const activeGraphData = graphMode === 'yearly' ? monthlyData : dailyGraphData;
  const currentMonthTotal = categoryData.reduce((sum, item) => sum + item.total_spent, 0);
  const currentMonthCount = rawTransactions.filter(t => t.date?.startsWith(selectedMonthKey)).length;
  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  useEffect(() => {
      setChartKey(prev => prev + 1);
  }, [categoryData, activeGraphData]);

  if (loading) return <MainLayout><Skeleton className="h-96 w-full" /></MainLayout>;

  return (
    <MainLayout>
      <style>{spatialStyles}</style>
      
      {/* BACKGROUND AMBIENCE */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-200/40 dark:bg-indigo-900/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-normal" />
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-200/40 dark:bg-pink-900/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-normal" />
         <div className="absolute inset-0 spatial-grid opacity-60 dark:opacity-30" />
      </div>

      <div className="space-y-6 md:space-y-8 relative z-10">
        
        {/* HEADER & CONTROLS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white drop-shadow-sm">
              Patterns
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
              Deep dive into your spending habits
            </p>
          </div>

          {/* --- SPATIAL CONTROL BAR --- */}
          <div className="glass-card rounded-xl p-1.5 flex items-center shadow-lg w-full md:w-auto justify-between md:justify-start">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="rounded-full hover:bg-black/5 dark:hover:bg-white/10 h-8 w-8 text-gray-600 dark:text-gray-300">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center px-2 space-x-2">
                <Select value={selectedYear} onValueChange={(val) => {
                    setSelectedYear(val);
                    const availableForNewYear = availableDates.months[val] || [];
                    if (!availableForNewYear.includes(selectedMonth)) {
                        setSelectedMonth(availableForNewYear[0] || '01');
                    }
                }}>
                <SelectTrigger className="w-[80px] h-8 border-none shadow-none focus:ring-0 font-bold bg-transparent text-gray-800 dark:text-white">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {availableDates.years.map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                </SelectContent>
                </Select>

                <div className="w-px h-4 bg-gray-300 dark:bg-white/20" />

                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[110px] h-8 border-none shadow-none focus:ring-0 bg-transparent text-gray-700 dark:text-gray-200">
                    <SelectValue>
                        {format(new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1), 'MMMM')}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {(availableDates.months[selectedYear] || []).map(m => (
                    <SelectItem key={m} value={m}>
                        {format(new Date(parseInt(selectedYear), parseInt(m) - 1), 'MMMM')}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>

            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="rounded-full hover:bg-black/5 dark:hover:bg-white/10 h-8 w-8 text-gray-600 dark:text-gray-300">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 3D SUMMARY CARDS */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-3">
          <div className="glass-card rounded-2xl p-5 md:p-6 relative overflow-hidden group tilt-card">
            <div className="absolute top-0 right-0 p-16 bg-blue-500/10 blur-3xl group-hover:bg-blue-500/20 transition-all" />
            <div className="flex justify-between items-start mb-4">
               <div>
                 <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Spending</p>
                 <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                   {formatCurrency(currentMonthTotal)}
                 </div>
               </div>
               <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
                 <DollarSign className="h-6 w-6" />
               </div>
            </div>
            <p className="text-xs text-gray-500 font-medium">in {safeFormatDate(selectedMonthKey, 'MMMM')}</p>
          </div>

          <div className="glass-card rounded-2xl p-5 md:p-6 relative overflow-hidden group tilt-card">
            <div className="absolute top-0 right-0 p-16 bg-purple-500/10 blur-3xl group-hover:bg-purple-500/20 transition-all" />
            <div className="flex justify-between items-start mb-4">
               <div>
                 <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categories</p>
                 <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                   {categoryData.length}
                 </div>
               </div>
               <div className="p-3 bg-purple-100 dark:bg-purple-500/20 rounded-xl text-purple-600 dark:text-purple-400">
                 <Layers className="h-6 w-6" />
               </div>
            </div>
            <p className="text-xs text-gray-500 font-medium">Active categories</p>
          </div>

          <div className="glass-card rounded-2xl p-5 md:p-6 relative overflow-hidden group tilt-card">
            <div className="absolute top-0 right-0 p-16 bg-orange-500/10 blur-3xl group-hover:bg-orange-500/20 transition-all" />
            <div className="flex justify-between items-start mb-4">
               <div>
                 <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transactions</p>
                 <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                   {currentMonthCount}
                 </div>
               </div>
               <div className="p-3 bg-orange-100 dark:bg-orange-500/20 rounded-xl text-orange-600 dark:text-orange-400">
                 <Calendar className="h-6 w-6" />
               </div>
            </div>
            <p className="text-xs text-gray-500 font-medium">Total entries</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          
          {/* --- PIE CHART --- */}
          <div className="glass-card rounded-2xl p-4 md:p-6 flex flex-col h-[400px] lg:h-[500px]">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <PieChart className="h-5 w-5 text-purple-500" />
                Spending Breakdown
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Distribution for {safeFormatDate(selectedMonthKey, 'MMMM')}</p>
            </div>
            
            <div className="flex-1 w-full min-h-0">
              {categoryData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <PieChart className="h-12 w-12 mb-4 opacity-20" />
                  <p>No expense data found.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart key={chartKey}>
                    <Pie
                      activeIndex={activeIndex}
                      activeShape={renderActiveShape}
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="total_spent"
                      onMouseEnter={(_, index) => setActiveIndex(index)}
                      paddingAngle={4}
                      label={renderCustomizedLabel}
                      labelLine={false}
                      isAnimationActive={true}
                      animationDuration={1000}
                      animationEasing="ease-out"
                      stroke="none"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* --- TRENDS GRAPH --- */}
          <div className="glass-card rounded-2xl p-4 md:p-6 flex flex-col h-[400px] lg:h-[500px]">
            <Tabs value={graphMode} onValueChange={(val) => setGraphMode(val as 'yearly' | 'monthly')} className="w-full flex-1 flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    Financial Trends
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {graphMode === 'monthly' ? `Daily flow for ${safeFormatDate(selectedMonthKey, 'MMMM')}` : `Monthly flow for ${selectedYear}`}
                  </p>
                </div>
                
                <div className="bg-gray-100 dark:bg-white/10 rounded-lg p-1 flex self-start sm:self-auto">
                  <TabsList className="bg-transparent p-0 h-auto">
                    <TabsTrigger value="monthly" className="h-7 px-3 text-xs rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-white/20 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white shadow-sm">
                       Monthly
                    </TabsTrigger>
                    <TabsTrigger value="yearly" className="h-7 px-3 text-xs rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-white/20 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white shadow-sm">
                       Yearly
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart key={`${selectedMonthKey}-${graphMode}`} data={activeGraphData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.2)" />
                    <XAxis 
                      dataKey={graphMode === 'yearly' ? 'month' : 'date'} 
                      tickFormatter={(v) => safeFormatDate(v, graphMode === 'yearly' ? 'MMM' : 'dd')} 
                      stroke="#888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      dy={10}
                    />
                    <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} dx={-10} />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(20, 20, 20, 0.8)', 
                        borderColor: 'rgba(255,255,255,0.1)', 
                        borderRadius: '12px',
                        backdropFilter: 'blur(10px)',
                        color: '#fff',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                      }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                      labelFormatter={(label) => safeFormatDate(label, graphMode === 'monthly' ? 'MMM dd, yyyy' : 'MMMM yyyy')}
                      cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Area type="monotone" dataKey="total_income" name="Income" stroke="#22c55e" fill="url(#colorIncome)" strokeWidth={3} isAnimationActive={true} />
                    <Area type="monotone" dataKey="total_expense" name="Expense" stroke="#ef4444" fill="url(#colorExpense)" strokeWidth={3} isAnimationActive={true} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}