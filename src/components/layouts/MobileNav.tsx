import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Receipt,
  Target,
  PieChart,
  Bell,
  Settings,
  Zap,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Transactions', href: '/transactions', icon: Receipt },
  { name: 'Spending Limits', href: '/budgets', icon: Target },
  { name: 'Patterns', href: '/insights', icon: PieChart },
  { name: 'Guardian Rules', href: '/rules', icon: Zap },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function MobileNav() {
  const location = useLocation();

  return (
    // Fixed at bottom, hidden on desktop (md), with glassmorphism
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/90 backdrop-blur-xl border-t border-border shadow-lg supports-[backdrop-filter]:bg-background/60">
      
      {/* Flex container with horizontal scroll (no-scrollbar) to handle 7 items gracefully 
        Added pb-safe or pb-5 to account for mobile home indicator bars
      */}
      <nav className="flex items-center justify-between overflow-x-auto no-scrollbar px-2 pt-2 pb-5 sm:pb-2 gap-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center min-w-[60px] flex-1 py-1 rounded-xl transition-all duration-200 select-none",
                isActive 
                  ? "text-emerald-600 dark:text-emerald-400" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              {/* Icon Container - Highlights when active */}
              <div className={cn(
                "relative p-1.5 rounded-full transition-all duration-300",
                isActive && "bg-emerald-100 dark:bg-emerald-500/20 -translate-y-0.5"
              )}>
                <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>

              {/* Label - Visible when active or on slightly larger screens */}
              <span className={cn(
                "text-[10px] font-medium mt-0.5 truncate max-w-[64px] transition-all",
                isActive ? "opacity-100" : "opacity-0 h-0 hidden sm:block sm:opacity-70"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}