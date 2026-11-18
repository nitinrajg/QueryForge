import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { UploadCloud, Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export const GuestMigrationModal: React.FC = () => {
  const { guestMigrationNeeded, guestCount, performGuestMigration, dismissGuestMigration } = useAuth();
  const [isMigrating, setIsMigrating] = useState(false);

  if (!guestMigrationNeeded) return null;

  const handleMerge = async () => {
    setIsMigrating(true);
    try {
      await performGuestMigration();
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <Dialog.Root open={guestMigrationNeeded} onOpenChange={(open) => !open && dismissGuestMigration()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-2xl transition-all animate-in zoom-in-95 duration-200 focus:outline-none">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <Dialog.Title className="text-lg font-bold tracking-tight text-[var(--ink)]">
                Sync Guest Practice History?
              </Dialog.Title>
              <span className="text-[11px] font-mono text-[var(--positive)]">
                {guestCount} local problem {guestCount === 1 ? 'record' : 'records'} found
              </span>
            </div>
          </div>

          <Dialog.Description className="text-xs text-[var(--muted)] leading-relaxed mb-6">
            You solved problems while practicing as a guest. Would you like to merge these solved problems, draft SQL code, and custom test cases into your cloud account so they are preserved across devices?
          </Dialog.Description>

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={dismissGuestMigration}
              disabled={isMigrating}
              className="text-xs order-2 sm:order-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5 mr-1.5" />
              <span>Start Fresh (Skip)</span>
            </Button>

            <Button
              size="sm"
              onClick={handleMerge}
              disabled={isMigrating}
              className="text-xs order-1 sm:order-2 gap-1.5 cursor-pointer font-semibold"
            >
              {isMigrating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>{isMigrating ? 'Merging...' : 'Merge to My Account'}</span>
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
