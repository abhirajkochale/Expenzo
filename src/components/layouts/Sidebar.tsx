import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Target,
  BarChart3,
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext'; 
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Transactions', path: '/transactions', icon: Receipt },
  { name: 'Spending Limits', path: '/budgets', icon: Target },
  { name: 'Patterns', path: '/insights', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function Sidebar() {
  const { user, signOut } = useAuth(); 
  
  const initials = user?.user_metadata?.username
    ? user.user_metadata.username.slice(0, 2).toUpperCase()
    : 'US';

  return (
    // Added 'shrink-0' to prevent the sidebar from getting squashed on smaller laptops
    <aside className="hidden md:flex w-64 flex-col border-r bg-background h-full shrink-0">

      {/* 🔥 BRAND HEADER - Shield Logo + Text */}
      <div className="h-16 flex items-center px-6 border-b shrink-0 gap-3">
        {/* 1. Shield Logo */}
        <img 
          src="/sidebar_logo.png" 
          alt="Expenzo Shield" 
          className="h-8 w-auto object-contain" 
        />
        
        {/* 2. Text */}
        <span className="text-2xl font-extrabold tracking-tight text-emerald-500">
          Expenzo
        </span>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
              ${
                isActive
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-muted-foreground hover:bg-muted'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {name}
          </NavLink>
        ))}
      </nav>

      {/* 👤 USER FOOTER */}
      <div className="p-4 border-t bg-muted/20 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9 border">
            <AvatarImage src={user?.user_metadata?.avatar_url} className="object-cover" />
            <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.user_metadata?.username || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}