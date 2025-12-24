import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Send, Loader2, X, Bot, User, TrendingUp, PieChart, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { aiService } from '@/services/aiService';
import { transactionApi } from '@/db/api';
import { Transaction } from '@/types/types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface GuardianChatbotProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SUGGESTIONS = [
  { label: "Analyze my spending", icon: PieChart, prompt: "Analyze my spending patterns for this month." },
  { label: "Can I afford it?", icon: Wallet, prompt: "Based on my current balance, can I afford a purchase of ₹5,000?" },
  { label: "Savings advice", icon: TrendingUp, prompt: "How can I save more money next month?" },
];

export function GuardianChatbot({ open, onOpenChange }: GuardianChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "**Hey 👋 I’m Expenzo.**\n\nI have access to your dashboard data. Ask me to analyze your trends, suggest budgets, or find wasteful subscriptions!",
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs for logic stability
  const scrollRef = useRef<HTMLDivElement>(null);
  const isSubmittingRef = useRef(false); // Prevents double submission
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
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
      currentDate: new Date().toISOString(),
    };
  }

  async function handleSend(overrideInput?: string) {
    const textToSend = overrideInput || input;
    
    // STRICT CHECK: Prevent double submission
    if (!textToSend.trim() || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setIsLoading(true);
    setInput(''); // Clear input immediately

    const userMessageId = crypto.randomUUID();
    const aiMessageId = crypto.randomUUID();

    // 1. Add User Message
    setMessages(prev => [
      ...prev,
      { id: userMessageId, role: 'user', content: textToSend },
    ]);

    try {
      // 2. Add Placeholder AI Message immediately (Prevents "popping" effect)
      setMessages(prev => [
        ...prev,
        { id: aiMessageId, role: 'assistant', content: '' }, // Empty content initially
      ]);

      const context = await buildFinancialContext();
      let accumulatedResponse = '';

      await aiService.sendMessageWithContext(
        textToSend,
        context,
        (chunk) => {
          accumulatedResponse += chunk;
          
          // Efficiently update only the last message
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMsgIndex = newMessages.findIndex(m => m.id === aiMessageId);
            if (lastMsgIndex !== -1) {
                newMessages[lastMsgIndex] = { 
                    ...newMessages[lastMsgIndex], 
                    content: accumulatedResponse 
                };
            }
            return newMessages;
          });
        },
        () => {
          // On Complete
          isSubmittingRef.current = false;
          setIsLoading(false);
        },
        (err) => {
           console.error("Stream error", err);
           accumulatedResponse += "\n\n*(I encountered an error while processing that. Please try again.)*";
           setMessages(prev => {
              const newMessages = [...prev];
              const idx = newMessages.findIndex(m => m.id === aiMessageId);
              if (idx !== -1) newMessages[idx].content = accumulatedResponse;
              return newMessages;
           });
           throw new Error(err);
        }
      );

    } catch (error) {
      console.error("Chat Error:", error);
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-[100vw] sm:max-w-md md:max-w-lg p-0 flex flex-col border-l border-border h-full focus:outline-none z-[100]"
      >
        
        {/* Header Section */}
        <SheetHeader className="px-6 py-4 border-b shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              Ask Expenzo
            </SheetTitle>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onOpenChange(false)}
              className="rounded-full hover:bg-muted transition-colors h-8 w-8"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
          <SheetDescription className="text-xs text-muted-foreground text-left">
            Your personal AI financial analyst
          </SheetDescription>
        </SheetHeader>

        {/* Messages Area */}
        <div 
            ref={scrollRef} 
            className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 dark:bg-zinc-950 scroll-smooth"
        >
          {messages.map((m, index) => (
            <div
              key={m.id}
              className={cn(
                'flex gap-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-300',
                m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              {/* Avatar */}
              <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm",
                  m.role === 'assistant' 
                    ? "bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-200 text-white" 
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              )}>
                 {m.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
              </div>

              {/* Bubble */}
              <div
                className={cn(
                  'relative max-w-[85%] px-4 py-3 text-sm shadow-sm',
                  m.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-2xl rounded-tr-none'
                    : 'bg-white dark:bg-zinc-900 border border-border/50 text-foreground rounded-2xl rounded-tl-none'
                )}
              >
                {/* Loader for empty bot message (waiting for first chunk) */}
                {m.role === 'assistant' && m.content === '' && (
                    <div className="flex gap-1 items-center h-5">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                    </div>
                )}

                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Style Tables for financial data
                    table: ({node, ...props}) => <div className="my-4 w-full overflow-x-auto rounded-lg border border-border"><table className="w-full text-left text-sm" {...props} /></div>,
                    thead: ({node, ...props}) => <thead className="bg-muted/50 text-muted-foreground font-medium" {...props} />,
                    tr: ({node, ...props}) => <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors" {...props} />,
                    th: ({node, ...props}) => <th className="p-2 font-medium" {...props} />,
                    td: ({node, ...props}) => <td className="p-2 align-top" {...props} />,
                    
                    // Style other elements
                    strong: ({node, ...props}) => <span className="font-bold text-emerald-700 dark:text-emerald-400" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1 my-2" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-4 space-y-1 my-2" {...props} />,
                    p: ({node, ...props}) => <p className="leading-relaxed last:mb-0 mb-2" {...props} />,
                  }}
                >
                  {m.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}

          {/* Invisible padding for scrolling */}
          <div className="h-4" />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-background border-t shrink-0">
          
          {/* Suggestion Chips (Only show if chat is empty or idle) */}
          {messages.length < 3 && !isLoading && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
              {SUGGESTIONS.map((s) => (
                <Badge 
                    key={s.label} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 hover:border-emerald-200 transition-all py-1.5 px-3 whitespace-nowrap gap-1.5"
                    onClick={() => handleSend(s.prompt)}
                >
                    <s.icon className="h-3 w-3" />
                    {s.label}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-end">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about spending, budgets, or savings..."
              className="flex-1 min-h-[44px] rounded-xl focus-visible:ring-emerald-500 bg-muted/30 border-muted-foreground/20"
              onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                  }
              }}
              disabled={isLoading}
            />
            <Button 
              size="icon" 
              onClick={() => handleSend()} 
              disabled={isLoading || !input.trim()}
              className={cn(
                  "h-11 w-11 rounded-xl shrink-0 transition-all",
                  isLoading ? "bg-muted text-muted-foreground" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg"
              )}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-0.5" />}
            </Button>
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-2">
            AI can make mistakes. Check important info.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}