import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Settings } from 'lucide-react';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { NotificationsPopover } from '@/components/notifications/NotificationsPopover';

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const initials =
    user.user_metadata?.username?.slice(0, 2).toUpperCase() ||
    user.email?.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      
      {/* Responsive Layout:
         - Mobile: 'justify-between' (Logo on left, Actions on right)
         - Desktop: 'md:justify-end' (Sidebar handles Logo, Header just shows Actions)
      */}
      <div className="flex h-16 items-center justify-between md:justify-end px-4 md:px-6">
        
        {/* MOBILE BRANDING (Hidden on Desktop) */}
        <div className="flex items-center gap-2 md:hidden">
          <img 
            src="/sidebar_logo.png" 
            alt="Expenzo" 
            className="h-6 w-auto object-contain" 
          />
          <span className="font-bold text-lg tracking-tight text-emerald-600 dark:text-emerald-500">
            Expenzo
          </span>
        </div>

        {/* RIGHT SIDE ACTIONS */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <NotificationsPopover />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 rounded-full p-0 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all">
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                  <AvatarImage src={user.user_metadata?.avatar_url} className="object-cover" />
                  <AvatarFallback className="bg-emerald-500 text-white font-semibold text-xs sm:text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center justify-start gap-2 p-2 md:hidden">
                 <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.user_metadata?.username || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">{user.email}</p>
                 </div>
              </div>
              <DropdownMenuSeparator className="md:hidden" />
              
              <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={signOut}
                className="text-red-600 dark:text-red-400 cursor-pointer focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10"
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}