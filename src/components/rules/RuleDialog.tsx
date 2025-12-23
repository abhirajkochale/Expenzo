import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { ruleApi } from '@/db/api';
import { CATEGORY_METADATA } from '@/types/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const ruleSchema = z.object({
  rule_type: z.enum(['budget_threshold', 'round_up', 'recurring_alert']),
  category: z.string().optional(),
  threshold: z.string().optional(),
  round_to: z.string().optional(),
  merchant: z.string().optional(),
});

interface RuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RuleDialog({ open, onOpenChange, onSuccess }: RuleDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof ruleSchema>>({
    resolver: zodResolver(ruleSchema),
    defaultValues:{
      rule_type: 'budget_threshold',
      category: 'all',
      threshold: '80',
      round_to: '10',
      merchant: '',
    },
  });

  const ruleType = form.watch('rule_type');

  const onSubmit = async (values: z.infer<typeof ruleSchema>) => {
    try {
      setLoading(true);

      let params: any = {};

      switch (values.rule_type) {
        case 'budget_threshold':
          params = {
            category: values.category === 'all' ? null : values.category,
            threshold: Number(values.threshold) || 80,
          };
          break;
        case 'round_up':
          params = {
            round_to: Number(values.round_to) || 10,
          };
          break;
        case 'recurring_alert':
          params = {
            merchant: values.merchant || null,
          };
          break;
      }

      await ruleApi.create({
        rule_type: values.rule_type,
        params,
        is_active: true,
      });

      toast({
        title: 'Success! 🎉',
        description: 'Smart rule created successfully',
      });

      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Failed to create rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to create rule',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Smart Rule</DialogTitle>
          <DialogDescription>
            Automate your financial management with intelligent rules
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rule_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rule Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select rule type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="budget_threshold">Budget Alert</SelectItem>
                      <SelectItem value="round_up">Round-Up Savings</SelectItem>
                      <SelectItem value="recurring_alert">Recurring Payment Alert</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {ruleType === 'budget_threshold' && (
              <>
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="All categories" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">All categories</SelectItem>
                          {Object.entries(CATEGORY_METADATA)
                            .filter(([key]) => !['salary', 'investment'].includes(key))
                            .map(([key, meta]) => (
                              <SelectItem key={key} value={key}>
                                {meta.icon} {meta.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Leave empty to monitor all categories
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="threshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alert Threshold (%)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="100" placeholder="80" {...field} />
                      </FormControl>
                      <FormDescription>
                        Get notified when spending reaches this percentage of budget
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {ruleType === 'round_up' && (
              <FormField
                control={form.control}
                name="round_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Round Up To (₹)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select amount" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="5">₹5</SelectItem>
                        <SelectItem value="10">₹10</SelectItem>
                        <SelectItem value="50">₹50</SelectItem>
                        <SelectItem value="100">₹100</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Round up each transaction to the nearest amount and save the difference
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {ruleType === 'recurring_alert' && (
              <FormField
                control={form.control}
                name="merchant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Merchant Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Netflix, Spotify" {...field} />
                    </FormControl>
                    <FormDescription>
                      Leave empty to track all recurring payments
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Rule'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
