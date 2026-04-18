import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { aiService } from '@/services/aiService';
import { transactionApi } from '@/db/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { MainLayout } from './layouts/MainLayout';
import { logger } from '@/utils/logger';

export default function ShareHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<'idle' | 'parsing' | 'saving' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Broad search for shared text across common keys
    const rawText = searchParams.get('text') || 
                    searchParams.get('title') || 
                    searchParams.get('body') || 
                    searchParams.get('description') || 
                    searchParams.get('link');
    
    logger.log('[ShareHandler] Params detected', { 
      fullUrl: window.location.href,
      keys: Array.from(searchParams.keys()),
      detectedText: rawText 
    });

    if (!rawText) {
      logger.warn('[ShareHandler] No text found in share params');
      navigate('/dashboard');
      return;
    }

    const processSharedText = async () => {
      try {
        setStatus('parsing');
        console.log('[ShareHandler] Processing text:', rawText);

        const parsed = await aiService.parseTransactionWithAI(rawText);
        
        if (!parsed || parsed.amount <= 0) {
          throw new Error("Could not detect a valid transaction in the shared text.");
        }

        setStatus('saving');
        await transactionApi.create({
          amount: parsed.amount,
          description: `Shared via PWA: ${parsed.merchant}`,
          merchant: parsed.merchant,
          category: parsed.category || 'other',
          type: parsed.type || 'expense',
          date: parsed.timestamp || new Date().toISOString(),
          account_id: undefined
        });

        setStatus('success');
        toast({
          title: "Transaction Shared & Saved!",
          description: `Added ₹${parsed.amount} for ${parsed.merchant}.`,
        });

        // Delay redirect slightly to show success state
        setTimeout(() => navigate('/dashboard'), 1500);

      } catch (err: any) {
        console.error('[ShareHandler] Error:', err);
        setStatus('error');
        setErrorMsg(err.message || "Failed to process shared content.");
        toast({
          title: "Share Failed",
          description: err.message,
          variant: "destructive"
        });
        setTimeout(() => navigate('/dashboard'), 3000);
      }
    };

    if (user) {
      processSharedText();
    }
  }, [searchParams, user, navigate, toast]);

  return (
    <MainLayout>
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-6">
        <div className="relative">
          <div className="h-24 w-24 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 animate-pulse">
            {status === 'success' ? (
              <ShieldCheck className="h-12 w-12 text-emerald-500" />
            ) : status === 'error' ? (
              <div className="text-red-500 text-4xl">!</div>
            ) : (
              <Sparkles className="h-12 w-12" />
            )}
          </div>
          {(status === 'parsing' || status === 'saving') && (
             <div className="absolute -bottom-2 -right-2">
               <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
             </div>
          )}
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {status === 'parsing' && "AI is analyzing your share..."}
            {status === 'saving' && "Saving to your ledger..."}
            {status === 'success' && "Got it! Transaction secured."}
            {status === 'error' && "Oops! Processing failed."}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            {status === 'parsing' && "Extracting merchant, amount, and category from the text."}
            {status === 'saving' && "Recording the financial event securely."}
            {status === 'success' && "Redirecting you back to the dashboard..."}
            {status === 'error' && errorMsg}
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
