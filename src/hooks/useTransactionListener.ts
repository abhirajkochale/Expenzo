import { useEffect } from 'react';
import { registerPlugin } from '@capacitor/core';
import { aiService } from '@/services/aiService';
import { transactionApi } from '@/db/api';
import { useToast } from '@/hooks/use-toast';

interface TransactionDetectedEvent {
  source: 'SMS' | 'NOTIFICATION';
  text: string;
  sender: string;
}

interface TransactionListenerPlugin {
  checkNotificationAccess(): Promise<{ granted: boolean }>;
  requestNotificationAccess(): Promise<void>;
  addListener(
    eventName: 'transactionDetected',
    listenerFunc: (event: TransactionDetectedEvent) => void
  ): Promise<any>;
}

const TransactionListener = registerPlugin<TransactionListenerPlugin>('TransactionListener');

export function useTransactionListener(onSuccess?: () => void) {
  const { toast } = useToast();

  useEffect(() => {
    let listener: any;

    const setupListener = async () => {
      try {
        listener = await TransactionListener.addListener('transactionDetected', async (event) => {
          console.log('[Expenzo Bridge] Transaction detected:', event);
          
          toast({
            title: "Analyzing Transaction",
            description: `Processing ${event.source} from ${event.sender}...`,
          });

          const parsed = await aiService.parseTransactionWithAI(event.text);
          
          if (parsed && parsed.amount > 0) {
            try {
              await transactionApi.create({
                amount: parsed.amount,
                description: `Auto-detected via ${event.source}: ${parsed.merchant}`,
                merchant: parsed.merchant,
                category: parsed.category || 'Others',
                type: parsed.type || 'debit',
                date: parsed.timestamp || new Date().toISOString(),
                account_id: '', // Default or primary account could be handled here
              });

              toast({
                title: "Transaction Added",
                description: `₹${parsed.amount} at ${parsed.merchant} saved automatically.`,
              });

              if (onSuccess) onSuccess();
            } catch (dbError) {
              console.error("Failed to save auto-detected transaction:", dbError);
            }
          }
        });
      } catch (err) {
        console.warn("TransactionListener not available (likely running in web browser).");
      }
    };

    setupListener();

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [toast, onSuccess]);

  const checkAccess = async () => {
    try {
      if (typeof TransactionListener.checkNotificationAccess !== 'function') {
        return { granted: false, web: true };
      }
      return await TransactionListener.checkNotificationAccess();
    } catch (e) {
      console.warn('Native checkAccess not available', e);
      return { granted: false, web: true };
    }
  };

  const requestAccess = async () => {
    try {
      if (typeof TransactionListener.requestNotificationAccess !== 'function') {
        return;
      }
      await TransactionListener.requestNotificationAccess();
    } catch (e) {
      console.warn('Native requestAccess not available', e);
    }
  };

  return {
    checkAccess,
    requestAccess,
  };
}
