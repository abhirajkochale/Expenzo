import { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { TransactionDialog } from '@/components/transactions/TransactionDialog';
import { SMSParserDialog } from '@/components/transactions/SMSParserDialog';
import { BankStatementUploadDialog } from '@/components/transactions/BankStatementUploadDialog';
import { MerchantInsightSheet } from '@/components/merchants/MerchantInsightSheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Sparkles,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { transactionApi } from '@/db/api';
import { Transaction, CATEGORY_METADATA } from '@/types/types';
import { format, parse } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

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

  /* TABLE CARD SPECIFIC (No Tilt, cleaner bg) */
  .table-glass {
    background: rgba(255, 255, 255, 0.8); /* Light mode opacity */
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.05);
  }
  .dark .table-glass {
    background: rgba(10, 10, 10, 0.6); /* Dark mode opacity */
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.3);
  }

  /* MODAL GLASS (Static) */
  .modal-glass {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }
  .dark .modal-glass {
    background: rgba(15, 15, 15, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  /* 3D Tilt Effect (Only for small cards) */
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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [bankStatementDialogOpen, setBankStatementDialogOpen] = useState(false);
  const [merchantSheetOpen, setMerchantSheetOpen] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<string | null>(null);

  // Pagination / Filter States
  const [allMonths, setAllMonths] = useState<string[]>([]);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  
  // Delete All Transaction States
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [deleteConfirmationCode, setDeleteConfirmationCode] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const REQUIRED_CODE = 'CONFIRM-DELETE';

  const { toast } = useToast();

  /* -------------------- LOAD DATA -------------------- */

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await transactionApi.getAll();
      setTransactions(data);

      const monthSet = new Set<string>();
      data.forEach((txn) => {
        if (txn.date) {
          monthSet.add(format(new Date(txn.date), 'yyyy-MM'));
        }
      });

      const months = Array.from(monthSet).sort();
      setAllMonths(months);

      if (months.length > 0) {
        setCurrentMonthIndex(months.length - 1);
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load transactions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  /* -------------------- INDIVIDUAL DELETE -------------------- */
  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      await transactionApi.delete(id);
      toast({ title: "Deleted", description: "Transaction removed successfully." });
      loadTransactions();
    } catch (error) {
      console.error("Delete failed:", error);
      toast({ title: "Error", description: "Failed to delete transaction.", variant: 'destructive' });
    }
  };

  /* -------------------- DELETE ALL LOGIC -------------------- */
  const handleDeleteAllTransactions = async () => {
    if (deleteConfirmationCode !== REQUIRED_CODE) {
      toast({
        title: 'Incorrect Code',
        description: `Please type ${REQUIRED_CODE} to confirm.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsDeleting(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No user authenticated');

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'All transactions have been deleted.',
      });
      setTransactions([]);
      setAllMonths([]);
      setDeleteAlertOpen(false);
      setDeleteConfirmationCode('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete data.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  /* -------------------- KEYBOARD NAV -------------------- */

  const handleKeyNav = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentMonthIndex > 0) {
        setCurrentMonthIndex((i) => i - 1);
      }
      if (
        e.key === 'ArrowRight' &&
        currentMonthIndex < allMonths.length - 1
      ) {
        setCurrentMonthIndex((i) => i + 1);
      }
    },
    [currentMonthIndex, allMonths.length]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyNav);
    return () => window.removeEventListener('keydown', handleKeyNav);
  }, [handleKeyNav]);

  /* -------------------- DERIVED DATA -------------------- */

  const currentMonth =
    allMonths.length > 0 ? allMonths[currentMonthIndex] : null;

  const filteredTransactions =
    currentMonth === null
      ? []
      : transactions
          .filter(
            (txn) => format(new Date(txn.date), 'yyyy-MM') === currentMonth
          )
          .sort(
            (a, b) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
          );

  const canGoPrev = currentMonthIndex > 0;
  const canGoNext = currentMonthIndex < allMonths.length - 1;

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString('en-IN')}`;

  if (loading) {
    return (
      <MainLayout>
        <Skeleton className="h-10 w-48 mb-4" />
        <Skeleton className="h-96" />
      </MainLayout>
    );
  }

  /* -------------------- RENDER -------------------- */

  return (
    <MainLayout>
      <style>{spatialStyles}</style>
      
      {/* BACKGROUND AMBIENCE */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-200/40 dark:bg-purple-900/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-normal" />
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-200/40 dark:bg-blue-900/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-normal" />
         <div className="absolute inset-0 spatial-grid opacity-60 dark:opacity-30" />
      </div>

      <div className="space-y-6 relative z-10">
        
        {/* HEADER & ACTIONS */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white drop-shadow-sm">Transactions</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
              Manage your income and expenses in <span className="text-emerald-600 dark:text-emerald-400">real-time</span>
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row gap-3">
            <Button
              variant="destructive"
              className="bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 border border-red-500/20 shadow-sm backdrop-blur-sm h-10 w-full sm:w-auto"
              onClick={() => setDeleteAlertOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete All
            </Button>
            
            <div className="h-10 w-px bg-gray-300 dark:bg-white/10 mx-1 hidden lg:block" />

            <Button
              variant="outline"
              className="bg-white/50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-white/10 backdrop-blur-sm h-10 w-full sm:w-auto"
              onClick={() => setBankStatementDialogOpen(true)}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Upload
            </Button>
            <Button
              variant="outline"
              className="bg-white/50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-white/10 backdrop-blur-sm h-10 w-full sm:w-auto"
              onClick={() => setSmsDialogOpen(true)}
            >
              <Sparkles className="mr-2 h-4 w-4 text-purple-500" /> Parse SMS
            </Button>
            <Button 
                onClick={() => setDialogOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 h-10 w-full sm:w-auto sm:col-span-2 lg:col-span-1"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Transaction
            </Button>
          </div>
        </div>

        {/* MAIN TABLE CARD - FIXED OUTLINE */}
        <div className="table-glass rounded-2xl overflow-hidden relative group">
          
          <div className="relative">
            <CardHeader className="border-b border-gray-200 dark:border-white/10 px-4 md:px-6 py-4 bg-white/40 dark:bg-white/5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="text-gray-900 dark:text-white text-lg font-bold flex items-center gap-2">
                    {currentMonth
                    ? format(
                        parse(currentMonth, 'yyyy-MM', new Date()),
                        'MMMM yyyy'
                        )
                    : 'No Transactions'}
                </CardTitle>

                {currentMonth && (
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Button
                        size="icon"
                        variant="outline"
                        disabled={!canGoPrev}
                        onClick={() => setCurrentMonthIndex((i) => i - 1)}
                        className="h-9 w-9 rounded-full border-gray-300 dark:border-white/20 bg-transparent hover:bg-gray-100 dark:hover:bg-white/10 shrink-0"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <Select
                        value={currentMonth}
                        onValueChange={(val) => {
                        const idx = allMonths.indexOf(val);
                        if (idx !== -1) setCurrentMonthIndex(idx);
                        }}
                    >
                        <SelectTrigger className="w-full sm:w-[180px] h-9 bg-transparent border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-200 rounded-lg">
                        <SelectValue>
                            {format(
                            parse(currentMonth, 'yyyy-MM', new Date()),
                            'MMMM yyyy'
                            )}
                        </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                        {allMonths.map((m) => (
                            <SelectItem key={m} value={m}>
                            {format(parse(m, 'yyyy-MM', new Date()), 'MMMM yyyy')}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>

                    <Button
                        size="icon"
                        variant="outline"
                        disabled={!canGoNext}
                        onClick={() => setCurrentMonthIndex((i) => i + 1)}
                        className="h-9 w-9 rounded-full border-gray-300 dark:border-white/20 bg-transparent hover:bg-gray-100 dark:hover:bg-white/10 shrink-0"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    </div>
                )}
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <AnimatePresence mode="wait">
                <motion.div
                    key={currentMonth ?? 'empty'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {filteredTransactions.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        No transactions found for this month.
                    </div>
                    ) : (
                    // WRAPPER FOR HORIZONTAL SCROLLING ON MOBILE
                    <div className="overflow-x-auto">
                        <Table className="min-w-[900px]">
                            <TableHeader className="bg-gray-50/50 dark:bg-black/20">
                            <TableRow className="border-gray-200 dark:border-white/5 hover:bg-transparent">
                                <TableHead className="text-gray-500 dark:text-gray-400 font-semibold pl-6 h-12">Date</TableHead>
                                <TableHead className="text-gray-500 dark:text-gray-400 font-semibold h-12">Description</TableHead>
                                <TableHead className="text-gray-500 dark:text-gray-400 font-semibold h-12">Category</TableHead>
                                <TableHead className="text-gray-500 dark:text-gray-400 font-semibold h-12">Merchant</TableHead>
                                <TableHead className="text-gray-500 dark:text-gray-400 font-semibold h-12">Type</TableHead>
                                <TableHead className="text-right text-gray-500 dark:text-gray-400 font-semibold pr-6 h-12">Amount</TableHead>
                                <TableHead className="w-[50px] h-12"></TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {filteredTransactions.map((txn, idx) => {
                                const meta = CATEGORY_METADATA[txn.category];
                                const isLast = idx === filteredTransactions.length - 1;
                                return (
                                <TableRow 
                                    key={txn.id} 
                                    className={`
                                        hover:bg-emerald-50/50 dark:hover:bg-white/5 transition-colors group
                                        ${isLast ? 'border-b-0' : 'border-gray-200 dark:border-white/5'}
                                    `}
                                >
                                    <TableCell className="pl-6 text-gray-600 dark:text-gray-400 font-medium">
                                    {format(new Date(txn.date), 'dd MMM, yyyy')}
                                    </TableCell>
                                    <TableCell className="font-medium text-gray-900 dark:text-white">{txn.description}</TableCell>
                                    <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg opacity-80">{meta?.icon || '📦'}</span>
                                        <span className="text-gray-700 dark:text-gray-300">{meta.label}</span>
                                    </div>
                                    </TableCell>
                                    <TableCell className="text-gray-600 dark:text-gray-400">{txn.merchant ?? '-'}</TableCell>
                                    <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={`
                                        ${txn.type === 'income' 
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400' 
                                            : 'border-gray-200 bg-gray-50 text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300'}
                                        `}
                                    >
                                        {txn.type}
                                    </Badge>
                                    </TableCell>
                                    <TableCell
                                    className={`text-right font-mono font-bold pr-6 ${
                                        txn.type === 'income'
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-gray-900 dark:text-white'
                                    }`}
                                    >
                                    {txn.type === 'income' ? '+' : '-'}{' '}
                                    {formatCurrency(txn.amount)}
                                    </TableCell>
                                    <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleDeleteTransaction(txn.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    </TableCell>
                                </TableRow>
                                );
                            })}
                            </TableBody>
                        </Table>
                    </div>
                    )}
                </motion.div>
                </AnimatePresence>
            </CardContent>
          </div>
        </div>
      </div>

      {/* Security Dialog for Delete All */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent className="modal-glass border-red-500/20 w-[90%] sm:w-full rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-500">
              <AlertTriangle className="h-5 w-5" /> Danger Zone
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
              This will permanently delete <b>all</b> transactions. This action
              cannot be undone.
              <br />
              <br />
              Type <b>{REQUIRED_CODE}</b> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={deleteConfirmationCode}
            onChange={(e) => setDeleteConfirmationCode(e.target.value)}
            placeholder="Type confirmation code..."
            className="border-red-500/50 bg-transparent"
          />
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-200 dark:border-white/10">Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteAllTransactions}
              disabled={
                deleteConfirmationCode !== REQUIRED_CODE || isDeleting
              }
            >
              {isDeleting ? 'Wiping Data...' : 'Confirm Wipe'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={loadTransactions}
      />
      <SMSParserDialog
        open={smsDialogOpen}
        onOpenChange={setSmsDialogOpen}
        onSuccess={loadTransactions}
      />
      <BankStatementUploadDialog
        open={bankStatementDialogOpen}
        onOpenChange={setBankStatementDialogOpen}
        onSuccess={loadTransactions}
      />
      <MerchantInsightSheet
        merchantName={selectedMerchant}
        open={merchantSheetOpen}
        onOpenChange={setMerchantSheetOpen}
      />
    </MainLayout>
  );
}