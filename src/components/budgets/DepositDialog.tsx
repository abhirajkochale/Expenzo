import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, PiggyBank, ArrowUpRight, Wallet } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { goalApi, transactionApi, accountApi } from '@/db/api'; // Added transactionApi & accountApi
import { useToast } from '@/hooks/use-toast';
import { Goal, Account } from '@/types/types';

const depositSchema = z.object({
  amount: z.string().min(1, 'Amount is required').refine((val) => Number(val) > 0, {
    message: 'Amount must be positive',
  }),
  accountId: z.string().min(1, 'Source account is required'),
});

interface DepositDialogProps {
  goal: Goal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DepositDialog({ goal, open, onOpenChange, onSuccess }: DepositDialogProps) {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof depositSchema>>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: '',
      accountId: '',
    },
  });

  // Fetch Accounts when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({ amount: '', accountId: '' });
      loadAccounts();
    }
  }, [open, form]);

  const loadAccounts = async () => {
    try {
      // @ts-ignore - Assuming accountApi exists in your API helper
      const data = await accountApi.getAll();
      if (data) setAccounts(data);
    } catch (e) {
      console.error("Failed to load accounts", e);
      // Fallback/Mock data if API fails or doesn't exist yet
      setAccounts([
        { id: '1', name: 'Cash', type: 'cash', balance: 0, user_id: '', currency: 'INR', created_at: '', updated_at: '' },
        { id: '2', name: 'Bank Account', type: 'bank', balance: 0, user_id: '', currency: 'INR', created_at: '', updated_at: '' }
      ]);
    }
  };

  const onSubmit = async (values: z.infer<typeof depositSchema>) => {
    if (!goal) return;

    try {
      setLoading(true);
      
      const addedAmount = Number(values.amount);
      const newTotal = (Number(goal.current_amount) || 0) + addedAmount;
      const selectedAccount = accounts.find(a => a.id === values.accountId);

      // 1. Update the Goal (Increase Savings)
      // @ts-ignore
      await goalApi.update(goal.id, {
        current_amount: newTotal
      });

      // 2. Create an Expense Transaction (Decrease Source Account)
      // This records that money has "left" your daily spending pool
      // @ts-ignore
      await transactionApi.create({
        amount: addedAmount,
        type: 'expense', 
        category: 'investment', // Categorize as Investment/Savings
        description: `Deposit to: ${goal.name}`,
        date: new Date().toISOString(),
        account_id: values.accountId,
        source: 'manual_deposit'
      });

      // Trigger global update so charts & balances refresh
      window.dispatchEvent(new Event('transaction-updated'));

      toast({
        title: 'Deposit Successful! 💰',
        description: `Transferred ₹${addedAmount} from ${selectedAccount?.name || 'Account'} to ${goal.name}.`,
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Deposit failed:', error);
      toast({ title: 'Error', description: 'Failed to process deposit', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Responsive Width: w-[95vw] ensures full width on mobile, sm:max-w-[425px] constraints on desktop */}
      <DialogContent className="w-[95vw] sm:max-w-[425px] rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <PiggyBank className="h-5 w-5 text-green-600 shrink-0" />
            <span className="truncate">Add Funds to "{goal?.name}"</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Move money from an account into this savings goal.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Source Account Dropdown */}
            <FormField
              control={form.control as any}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deduct From</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Source Account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          <span className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="truncate">{acc.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount Input */}
            <FormField
              control={form.control as any}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deposit Amount (₹)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <ArrowUpRight className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground shrink-0" />
                      <Input type="number" placeholder="1000" className="pl-9 w-full" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Transfer & Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}