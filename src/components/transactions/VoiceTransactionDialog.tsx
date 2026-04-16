import { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { transactionApi } from '@/db/api';
import { CategoryType, CATEGORY_METADATA } from '@/types/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mic, AlertCircle, Volume2, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { parseVoiceTransaction, VoiceParsedTransaction } from '@/utils/voiceTransactionParser';

// Reusing same exact Zod schema logic from SMSParserDialog for safety
const voiceParserSchema = z.object({
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

interface VoiceTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function VoiceTransactionDialog({ open, onOpenChange, onSuccess }: VoiceTransactionDialogProps) {
  const [language, setLanguage] = useState('en-US');
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsedData, setParsedData] = useState<VoiceParsedTransaction | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    transcript,
    listening,
    startListening,
    stopListening,
    resetTranscript,
    supported,
    error: speechError
  } = useSpeechRecognition({
    language: language,
    continuous: false, // Turn off when sentence finishes
  });

  const form = useForm<z.infer<typeof voiceParserSchema>>({
    resolver: zodResolver(voiceParserSchema),
    defaultValues: {
      date: new Date().toLocaleDateString('en-CA'),
      amount: '',
      type: 'expense',
      description: '',
      merchant: '',
      category: 'other',
      paymentMethod: '',
    },
  });

  // Automatically parse when listening stops, if there is a transcript perfectly parsed
  useEffect(() => {
    if (!listening && transcript && !parsedData && !parsing) {
      handleParseTranscript(transcript);
    }
  }, [listening, transcript, parsedData, parsing]);

  const handleMicToggle = () => {
    if (listening) {
      stopListening();
    } else {
      setParsedData(null);
      setParseError(null);
      resetTranscript();
      startListening();
    }
  };

  const handleParseTranscript = async (textToParse: string) => {
    if (!textToParse || textToParse.length < 2) return;

    try {
      setParsing(true);
      setParseError(null);
      
      const parsed = await parseVoiceTransaction(textToParse);
      setParsedData(parsed);

      form.setValue('amount', parsed.amount?.toString() || '');
      form.setValue('type', parsed.type || 'expense');
      form.setValue('merchant', parsed.merchant || '');
      form.setValue('category', parsed.category || 'other');
      form.setValue('description', parsed.description || '');
      form.setValue('paymentMethod', parsed.paymentMethod || 'Other');
      
      if (parsed.date) {
        form.setValue('date', parsed.date);
      }

      toast({
        title: 'Voice Understood! ✨',
        description: `Extracted data with ${parsed.confidence}% confidence.`,
      });
    } catch (error) {
      console.error('Failed to parse voice:', error);
      setParseError(error instanceof Error ? error.message : 'Failed to parse voice input');
    } finally {
      setParsing(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof voiceParserSchema>) => {
    try {
      setSaving(true);

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
        source: 'voice_ai',
      };

      // @ts-ignore
      await transactionApi.create(transactionData);

      toast({
        title: 'Success! 🎉',
        description: 'Voice transaction saved',
      });

      handleDialogClose(false);
      onSuccess();
    } catch (error) {
      console.error('Failed to save transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to add transaction',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDialogClose = (newOpen: boolean) => {
    if (!newOpen) {
      stopListening();
      resetTranscript();
      form.reset();
      setParsedData(null);
      setParseError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Volume2 className="h-5 w-5 text-emerald-500" />
            Voice Transaction Entry
          </DialogTitle>
          <DialogDescription>
            Speak naturally and let Gemini AI extract your expense details.
          </DialogDescription>
        </DialogHeader>

        {/* Not Supported Alert */}
        {!supported && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your browser does not support the Web Speech API. Please try Google Chrome or Microsoft Edge.
            </AlertDescription>
          </Alert>
        )}

        {/* Speech Error Alert */}
        {speechError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Microphone error: {speechError}. Please check your permissions.
            </AlertDescription>
          </Alert>
        )}

        {supported && (
          <div className="flex flex-col items-center justify-center space-y-6 pt-4 pb-2">
            
            {/* Language Selector Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 bg-gray-100/50 dark:bg-white/5 p-1.5 rounded-full border border-gray-200 dark:border-white/10">
               {[
                 { code: 'en-US', label: 'English', flag: '🇺🇸' },
                 { code: 'en-IN', label: 'Ind. English', flag: '🇮🇳' },
                 { code: 'hi-IN', label: 'हिन्दी', flag: '🇮🇳' },
                 { code: 'mr-IN', label: 'मराठी', flag: '🇮🇳' },
               ].map((lang) => (
                 <button
                   key={lang.code}
                   type="button"
                   onClick={() => {
                      if (listening) stopListening();
                      setLanguage(lang.code);
                   }}
                   className={`px-3 py-1 text-xs sm:text-sm rounded-full transition-all flex items-center gap-1.5 ${
                     language === lang.code 
                      ? 'bg-emerald-500 text-white shadow-md' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-white/10'
                   }`}
                 >
                   <span>{lang.flag}</span>
                   <span className="font-medium">{lang.label}</span>
                 </button>
               ))}
            </div>

            {/* Mic Button & Visualization */}
            <div className="relative group">
              {/* Outer pulsing ring */}
              {listening && (
                <>
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping scale-150 duration-1000" />
                  <div className="absolute inset-0 bg-emerald-500/30 rounded-full animate-pulse scale-125 duration-700 delay-150" />
                </>
              )}
              
              <button
                type="button"
                onClick={handleMicToggle}
                className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                  listening 
                    ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 scale-105 shadow-emerald-500/40 text-white' 
                    : 'bg-white dark:bg-zinc-800 border-2 border-gray-100 dark:border-zinc-700 text-gray-500 dark:text-gray-400 hover:border-emerald-200 dark:hover:border-emerald-800 hover:text-emerald-500 group-hover:scale-105'
                }`}
              >
                <Mic className={`w-10 h-10 ${listening ? 'animate-pulse' : ''}`} />
              </button>
            </div>

            {/* Status & Live Transcript */}
            <div className="text-center w-full max-w-md space-y-2 min-h-[4rem]">
               {listening ? (
                 <>
                   <p className="text-sm font-medium text-emerald-500 dark:text-emerald-400 animate-pulse">Listening...</p>
                   <p className="text-lg font-medium text-gray-800 dark:text-gray-200 min-h-[1.75rem]">
                     {transcript || <span className="opacity-40 italic">Speak now...</span>}
                   </p>
                 </>
               ) : parsing ? (
                 <div className="flex flex-col items-center gap-2">
                   <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                   <p className="text-sm text-gray-500 font-medium">Extracting transaction with Gemini AI...</p>
                 </div>
               ) : !parsedData ? (
                 <p className="text-sm text-gray-500 dark:text-gray-400">
                   Tap the microphone and say something like:<br/>
                   <span className="italic opacity-80">"Spent 450 rupees on dinner with friends yesterday"</span>
                 </p>
               ) : (
                 <div className="flex flex-col items-center pt-2">
                    <p className="text-xs text-gray-500 mb-1">Raw Transcript:</p>
                    <p className="text-sm italic text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/5 py-1.5 px-3 rounded-md line-clamp-2">
                      "{transcript}"
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" onClick={() => { setParsedData(null); resetTranscript(); }}>
                        Start Over
                      </Button>
                    </div>
                 </div>
               )}
            </div>
            
            {parseError && (
              <Alert variant="destructive" className="w-full">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{parseError}</AlertDescription>
              </Alert>
            )}

          </div>
        )}

        {/* Extracted Data Form */}
        {parsedData && (
          <div className="mt-4 pt-6 border-t border-gray-100 dark:border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center justify-between mb-4">
               <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                 <Sparkles className="w-4 h-4 text-emerald-500" />
                 Review & Save
               </h4>
               <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-100 border-none">
                 {parsedData.confidence}% Confidence
               </Badge>
             </div>

             <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>

                <DialogFooter className="pt-4 flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDialogClose(false)}
                    disabled={saving}
                    className="w-full sm:w-auto mt-2 sm:mt-0"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white">
                    {saving ? (
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
