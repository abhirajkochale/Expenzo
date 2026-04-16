import { useState } from 'react';
import { Mic } from 'lucide-react';
import { VoiceTransactionDialog } from './VoiceTransactionDialog';

export function FloatingVoiceButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 md:bottom-8 md:right-24 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full p-4 shadow-lg shadow-emerald-500/30 transition-all hover:scale-110 active:scale-95 z-40 group flex items-center justify-center border border-emerald-400"
        aria-label="Add transaction with voice"
      >
        <Mic className="h-6 w-6" />
        <span className="absolute -top-3 -right-3 flex h-5 w-5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-400 border border-white text-[9px] font-bold items-center justify-center text-white">AI</span>
        </span>
      </button>

      <VoiceTransactionDialog
        open={open}
        onOpenChange={setOpen}
        onSuccess={() => {
          // If we are on the transactions page, it will auto-reload via its own local state.
          // Since this is global, if they are on another page, they will just see the toast.
        }}
      />
    </>
  );
}
