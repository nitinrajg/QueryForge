import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

const passwordSchema = z.object({
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { updatePassword, isConfigured } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      passwordSchema.parse({ password, confirmPassword });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        setErrorMessage(err.issues[0]?.message || 'Invalid input');
        return;
      }
    }

    setIsLoading(true);
    try {
      const { error } = await updatePassword(password);
      if (error) {
        setErrorMessage(error.message);
      } else {
        setIsSuccess(true);
        setTimeout(() => {
          navigate('/practice');
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-[var(--bg)] text-[var(--ink)]">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent)]/30 mx-auto flex items-center justify-center text-[var(--accent)] mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
            Set New Password
          </h1>
          <p className="text-xs text-[var(--muted)]">
            Enter a secure password for your QueryForge account.
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-400 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">Password updated successfully!</p>
              <p className="text-[11px] opacity-80 mt-0.5">Redirecting you to the practice workspace...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[var(--muted)]">New Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--raised)] py-2 px-3 text-xs text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-[var(--muted)]">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--raised)] py-2 px-3 text-xs text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !isConfigured}
              className="w-full gap-2 text-xs font-semibold cursor-pointer mt-2"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Update Password</span>
              {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
