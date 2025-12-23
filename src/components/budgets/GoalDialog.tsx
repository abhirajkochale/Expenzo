import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Loader2, Target, CalendarIcon } from 'lucide-react';

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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { goalApi } from '@/db/api';
import { useToast } from '@/hooks/use-toast';

// 1. Simple, clean schema
const goalSchema = z.object({
  name: z.string().min(1, 'Goal name is required'),
  target_amount: z.string().min(1, 'Target amount is required'),
  current_amount: z.string().optional(),
  target_date: z.date().optional(),
});

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function GoalDialog({ open, onOpenChange, onSuccess }: GoalDialogProps) {
  const [loading, setLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof goalSchema>>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: '',
      target_amount: '',
      current_amount: '',
      target_date: undefined, 
    },
  });

  // Reset when opening
  useEffect(() => {
    if (open) {
      form.reset({
        name: '',
        target_amount: '',
        current_amount: '',
        target_date: undefined,
      });
    }
  }, [open, form]);

  const onSubmit = async (values: z.infer<typeof goalSchema>) => {
    try {
      setLoading(true);

      const goalData = {
        name: values.name,
        target_amount: Number(values.target_amount),
        current_amount: values.current_amount ? Number(values.current_amount) : 0,
        // Send undefined if no date is picked, otherwise ISO string
        target_date: values.target_date ? values.target_date.toISOString() : undefined,
      };

      await goalApi.create(goalData);

      toast({
        title: 'Success! 🎯',
        description: 'Goal created successfully',
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Failed to create goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to create goal',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Responsive Width: w-[95vw] for mobile, max-w-[425px] for desktop */}
      <DialogContent className="w-[95vw] sm:max-w-[425px] rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Create Savings Goal
          </DialogTitle>
          <DialogDescription>
            Set a target amount and track your progress
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField
              control={form.control as any}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. New Laptop" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Responsive Grid: Stacks on mobile, Side-by-side on tablet+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
                name="target_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="50000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="current_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* FIXED DATE PICKER SECTION */}
            <FormField
              control={form.control as any}
              name="target_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Target Date (Optional)</FormLabel>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      {/* Removed FormControl wrapper here to prevent interaction bugs */}
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        onClick={() => setCalendarOpen(true)}
                        type="button" 
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          // This directly updates the form value
                          field.onChange(date);
                          setCalendarOpen(false);
                        }}
                        disabled={(date) => date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Goal
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}