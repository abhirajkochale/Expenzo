import { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GuardianChatbot } from './GuardianChatbot';

export function FloatingChatButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleOpenChat() {
      setOpen(true);
    }

    window.addEventListener('open-guardian-chat', handleOpenChat);
    return () => window.removeEventListener('open-guardian-chat', handleOpenChat);
  }, []);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed z-50 flex items-center justify-center gap-2 rounded-full shadow-lg transition-all 
                   bottom-20 right-4 h-12 w-12 p-0 
                   md:bottom-6 md:right-6 md:h-auto md:w-auto md:px-6 md:py-6"
      >
        <MessageSquare className="h-5 w-5" />
        <span className="hidden md:inline text-sm font-medium">
          Ask Expenzo
        </span>
      </Button>

      <GuardianChatbot open={open} onOpenChange={setOpen} />
    </>
  );
}