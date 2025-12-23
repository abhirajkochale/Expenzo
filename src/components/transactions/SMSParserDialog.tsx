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
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { transactionApi } from '@/db/api';
import { CategoryType, CATEGORY_METADATA } from '@/types/types';
import { useToast } from '@/hooks/use-toast';
import { parseSMS, ParsedSMSData } from '@/utils/smsParser';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const smsParserSchema = z.object({
  smsText: z.string().min(10, 'SMS text is too short'),
  date: z.string().min(1, 'Date is required'),
  amount: z.string().min(1, 'Amount is required').refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Amount must be a positive number',
  }),
  type: z.enum(['income', 'expense']),
  description: z.string().min(1, 'Description is required'),
  merchant: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  paymentMethod: z.string().optional(),
});

interface SMSParserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SMSParserDialog({ open, onOpenChange, onSuccess }: SMSParserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedSMSData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof smsParserSchema>>({
    resolver: zodResolver(smsParserSchema),
    defaultValues: {
      smsText: '',
      // FIX: Use local date instead of UTC to avoid getting yesterday's date
      date: new Date().toLocaleDateString('en-CA'), // Returns YYYY-MM-DD in local time
      amount: '',
      type: 'expense',
      description: '',
      merchant: '',
      category: 'other',
      paymentMethod: '',
    },
  });

  const handleParseSMS = async () => {
    const smsText = form.getValues('smsText');
    
    if (!smsText || smsText.length < 10) {
      toast({
        title: 'Error',
        description: 'Please enter a valid SMS text',
        variant: 'destructive',
      });
      return;
    }

    try {
      setParsing(true);
      setParseError(null);
      
      // Use the hybrid AI/Regex parser
      const parsed = await parseSMS(smsText);

      setParsedData(parsed);

      // Auto-fill the form fields
      form.setValue('amount', parsed.amount.toString());
      form.setValue('type', parsed.transactionType);
      form.setValue('merchant', parsed.merchant);
      form.setValue('category', parsed.category);
      form.setValue('description', parsed.description);
      form.setValue('paymentMethod', parsed.paymentMethod);
      
      // FIX: Use extracted date if available, else retain default local date
      if (parsed.date) {
        form.setValue('date', parsed.date);
      }

      toast({
        title: 'SMS Parsed Successfully! ✨',
        description: `Extracted transaction with ${parsed.confidence}% confidence`,
      });
    } catch (error) {
      console.error('Failed to parse SMS:', error);
      setParseError(error instanceof Error ? error.message : 'Failed to parse SMS');
      toast({
        title: 'Parsing Failed',
        description: 'Could not extract transaction details. Please enter manually.',
        variant: 'destructive',
      });
    } finally {
      setParsing(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof smsParserSchema>) => {
    try {
      setLoading(true);

      // FIX: Combine payment method into description since DB doesn't have payment_mode
      const descriptionWithPayment = values.paymentMethod && values.paymentMethod !== 'Other'
        ? `${values.description} (${values.paymentMethod})`
        : values.description;

      const transactionData = {
        date: values.date,
        amount: Number(values.amount),
        type: values.type as 'income' | 'expense',
        description: descriptionWithPayment,
        merchant: values.merchant || undefined,
        category: values.category as CategoryType,
        source: 'sms_parser', // Tag as SMS
      };

      // @ts-ignore - Ignoring TS error for create if strict types don't match exactly
      await transactionApi.create(transactionData);

      toast({
        title: 'Success! 🎉',
        description: 'Transaction added from SMS',
      });

      form.reset();
      setParsedData(null);
      setParseError(null);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Failed to add transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to add transaction',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      form.reset();
      setParsedData(null);
      setParseError(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      {/* Responsive: Full width on mobile, constrained on desktop */}
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            SMS Transaction Parser
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Paste your bank/UPI SMS and let AI extract the transaction details automatically
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* SMS Input */}
            <FormField
              control={form.control}
              name="smsText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SMS Text</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Paste your transaction SMS here...&#10;&#10;Example: Rs.450.00 debited from A/c XX1234 on 20-Dec-25 to VPA swiggy@paytm (UPI Ref No 123456789)"
                      className="min-h-[100px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Parse Button */}
            <Button
              type="button"
              onClick={handleParseSMS}
              disabled={parsing || !form.watch('smsText')}
              className="w-full"
              variant="secondary"
            >
              {parsing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Parsing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Parse SMS with AI
                </>
              )}
            </Button>

            {/* Parse Error */}
            {parseError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{parseError}</AlertDescription>
              </Alert>
            )}

            {/* Parsed Data Preview */}
            {parsedData && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="font-semibold text-sm">Extracted Data</h4>
                  <Badge className="w-fit" variant={parsedData.confidence > 70 ? 'default' : 'secondary'}>
                    {parsedData.confidence}% confidence
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="ml-2 font-medium">₹{parsedData.amount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <span className="ml-2 font-medium capitalize">{parsedData.transactionType}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Merchant:</span>
                    <span className="ml-2 font-medium">{parsedData.merchant}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <span className="ml-2 font-medium capitalize">{parsedData.category}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground">Payment:</span>
                    <span className="ml-2 font-medium">{parsedData.paymentMethod}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(CATEGORY_METADATA).map(([key, meta]) => (
                        <SelectItem key={key} value={key}>
                          <span className="flex items-center gap-2">
                            {meta.icon} {meta.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="merchant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Merchant (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Swiggy, Amazon" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="NetBanking">Net Banking</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogClose(false)}
                disabled={loading}
                className="w-full sm:w-auto mt-2 sm:mt-0"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Transaction'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}