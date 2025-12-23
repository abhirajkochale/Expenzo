import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { FloatingChatButton } from '@/components/chat/FloatingChatButton';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    // 1. h-[100dvh]: Adapts to mobile address bars better than h-screen
    <div className="h-[100dvh] bg-background flex overflow-hidden w-full">
      
      {/* Sidebar: Explicitly hidden on mobile (hidden), visible on desktop (md:flex) */}
      <div className="hidden md:flex w-64 shrink-0 flex-col border-r bg-card">
        <Sidebar />
      </div>
      
      {/* 2. The right side (Header + Content) takes remaining space */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        
        {/* Header stays at the top */}
        <Header />
        
        {/* 3. Main content area scrolls independently */}
        <main className="flex-1 overflow-y-auto px-4 md:px-6 pt-4 md:pt-6 pb-24 md:pb-8 scroll-smooth no-scrollbar">
          {children}
        </main>
      </div>

      <MobileNav />
      <FloatingChatButton />
    </div>
  );
}