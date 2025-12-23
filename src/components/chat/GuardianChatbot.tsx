import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Send, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { aiService } from '@/services/aiService';
import { transactionApi } from '@/db/api';
import { Transaction } from '@/types/types';
import { format } from 'date-fns';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface GuardianChatbotProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GuardianChatbot({ open, onOpenChange }: GuardianChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hey 👋 I’m Expenzo.\n\nI already understand your spending patterns. Ask me anything!",
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const streamIdRef = useRef<string | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, isLoading]);

  async function buildFinancialContext() {
    const transactions: Transaction[] = await transactionApi.getAll();

    const monthly: Record<string, any> = {};
    const yearly: Record<string, any> = {};
    const overallCategories: Record<string, number> = {};

    let overallIncome = 0;
    let overallExpense = 0;

    transactions.forEach(t => {
      const month = format(new Date(t.date), 'yyyy-MM');
      const year = format(new Date(t.date), 'yyyy');
      const amount = Number(t.amount);
      const category = t.category || 'Other';

      monthly[month] ??= { income: 0, expense: 0, categories: {} };
      yearly[year] ??= { income: 0, expense: 0, categories: {} };

      if (t.type === 'income') {
        monthly[month].income += amount;
        yearly[year].income += amount;
        overallIncome += amount;
      } else {
        monthly[month].expense += amount;
        yearly[year].expense += amount;

        monthly[month].categories[category] =
          (monthly[month].categories[category] || 0) + amount;

        yearly[year].categories[category] =
          (yearly[year].categories[category] || 0) + amount;

        overallCategories[category] =
          (overallCategories[category] || 0) + amount;

        overallExpense += amount;
      }
    });

    return {
      monthly,
      yearly,
      overall: {
        income: overallIncome,
        expense: overallExpense,
        categories: overallCategories,
      },
    };
  }

  async function handleSend() {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    setIsLoading(true);

    const userMessageId = crypto.randomUUID();
    streamIdRef.current = crypto.randomUUID();

    setMessages(prev => [
      ...prev,
      { id: userMessageId, role: 'user', content: userText },
    ]);

    try {
      const context = await buildFinancialContext();
      let aiReply = '';

      await aiService.sendMessageWithContext(
        userText,
        context,
        chunk => {
          aiReply += chunk;
          setMessages(prev => {
            const idx = prev.findIndex(m => m.id === streamIdRef.current);
            if (idx !== -1) {
              const copy = [...prev];
              copy[idx] = { ...copy[idx], content: aiReply };
              return copy;
            }
            return [
              ...prev,
              {
                id: streamIdRef.current!,
                role: 'assistant',
                content: aiReply,
              },
            ];
          });
        },
        () => {},
        err => {
          throw new Error(err);
        }
      );
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Something went wrong 😅 Try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
      streamIdRef.current = null;
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* Responsive Width: w-[100vw] ensures full width on mobile.
        sm:max-w-lg restrains it on tablets/desktops.
      */}
      <SheetContent side="right" className="w-[100vw] sm:max-w-lg p-0 flex flex-col border-l border-border h-full">
        
        {/* Header */}
        <SheetHeader className="p-4 sm:p-6 border-b shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              Ask Expenzo
            </SheetTitle>
            {/* Close button is typically handled by SheetPrimitive, but if you have a custom one: */}
            {/* <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="sm:hidden"><X className="h-5 w-5" /></Button> */}
          </div>
          <SheetDescription className="text-xs sm:text-sm">
            Your AI partner for smarter spending decisions
          </SheetDescription>
        </SheetHeader>

        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map(m => (
            <div
              key={m.id}
              className={cn(
                'max-w-[85%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap break-words shadow-sm',
                m.role === 'user'
                  ? 'ml-auto bg-primary text-primary-foreground rounded-tr-none'
                  : 'bg-muted rounded-tl-none'
              )}
            >
              <ReactMarkdown
                components={{
                  strong: ({ children }) => (
                    <strong className="font-semibold">{children}</strong>
                  ),
                }}
              >
                {m.content}
              </ReactMarkdown>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm pl-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Expenzo is thinking…
            </div>
          )}
        </div>

        {/* Input Area - with safe area padding for mobile */}
        <div className="p-4 border-t bg-background shrink-0 pb-safe">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about your spending…"
              className="flex-1"
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <Button size="icon" onClick={handleSend} disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}