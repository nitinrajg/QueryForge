import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Mail, Lock, User as UserIcon, Loader2, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'signin' | 'signup';
}

const authSchema = z.object({
  email: z.string().trim().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  displayName: z.string().trim().min(2, { message: 'Display name must be at least 2 characters' }).optional(),
});

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'signin',
}) => {
  const { signInWithEmail, signUpWithEmail, signInWithOAuth, resetPassword, isConfigured } = useAuth();

  const [tab, setTab] = useState<'signin' | 'signup' | 'forgot'>(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const resetState = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setErrorMessage(null);
    setSuccessNotice(null);
    setIsLoading(false);
    setOauthLoading(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetState();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    // Zod validation
    try {
      if (tab === 'forgot') {
        z.string().email().parse(email);
      } else if (tab === 'signup') {
        authSchema.parse({ email, password, displayName });
      } else {
        authSchema.omit({ displayName: true }).parse({ email, password });
      }
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        setErrorMessage(err.issues[0]?.message || 'Invalid input');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (tab === 'signin') {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          setErrorMessage(error.message);
        } else {
          onClose();
        }
      } else if (tab === 'signup') {
        const { error, needConfirmation } = await signUpWithEmail(email, password, displayName);
        if (error) {
          setErrorMessage(error.message);
        } else if (needConfirmation) {
          setSuccessNotice('Account created! Please check your email to confirm your account before signing in.');
        } else {
          onClose();
        }
      } else if (tab === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) {
          setErrorMessage(error.message);
        } else {
          setSuccessNotice('Password reset email sent. Please check your inbox for instructions.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setErrorMessage(null);
    setOauthLoading(provider);
    try {
      const { error } = await signInWithOAuth(provider);
      if (error) {
        setErrorMessage(error.message);
      }
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-2xl transition-all animate-in zoom-in-95 duration-200 focus:outline-none">
          {/* Close Button */}
          <Dialog.Close asChild>
            <button
              type="button"
              className="absolute right-4 top-4 rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--raised)] hover:text-[var(--ink)] transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>

          {/* Configuration Warning if Supabase is unconfigured */}
          {!isConfigured && (
            <div className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span>
                <strong>Setup Required:</strong> Supabase credentials are missing. Add <code className="bg-black/30 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_URL</code> and <code className="bg-black/30 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_ANON_KEY</code> to your <code className="bg-black/30 px-1 py-0.5 rounded font-mono">.env</code> to activate cloud auth.
              </span>
            </div>
          )}

          {/* Header */}
          <div className="mb-6 text-center">
            <Dialog.Title className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink)]">
              {tab === 'signin' && 'Welcome back to QueryForge'}
              {tab === 'signup' && 'Create your QueryForge account'}
              {tab === 'forgot' && 'Reset your password'}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-xs text-[var(--muted)]">
              {tab === 'signin' && 'Sign in to access your cloud drafts, history, and test cases'}
              {tab === 'signup' && 'Practice SQL and sync your progress across any device'}
              {tab === 'forgot' && 'Enter your registered email address to receive a recovery link'}
            </Dialog.Description>
          </div>

          {/* Error & Success Alerts */}
          {errorMessage && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successNotice && (
            <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Social OAuth Buttons */}
          {tab !== 'forgot' && (
            <div className="space-y-2 mb-6">
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                disabled={Boolean(oauthLoading)}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--raised)] text-xs font-medium text-[var(--ink)] hover:bg-[var(--control)] hover:border-[var(--muted)] transition-colors cursor-pointer disabled:opacity-50"
              >
                {oauthLoading === 'google' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--muted)]" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleOAuth('github')}
                disabled={Boolean(oauthLoading)}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--raised)] text-xs font-medium text-[var(--ink)] hover:bg-[var(--control)] hover:border-[var(--muted)] transition-colors cursor-pointer disabled:opacity-50"
              >
                {oauthLoading === 'github' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--muted)]" />
                ) : (
                  <svg className="w-4 h-4 fill-current text-[var(--ink)]" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                )}
                <span>Continue with GitHub</span>
              </button>

              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--border)]" />
                </div>
                <span className="relative bg-[var(--surface)] px-3 text-[10px] uppercase font-mono tracking-wider text-[var(--muted)]">
                  or with email
                </span>
              </div>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {tab === 'signup' && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[var(--muted)]">Display Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted)]" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ada Lovelace"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--raised)] py-2 pl-9 pr-3 text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-medium text-[var(--muted)]">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted)]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--raised)] py-2 pl-9 pr-3 text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
            </div>

            {tab !== 'forgot' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-[var(--muted)]">Password</label>
                  {tab === 'signin' && (
                    <button
                      type="button"
                      onClick={() => setTab('forgot')}
                      className="text-[11px] text-[var(--accent)] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted)]" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--raised)] py-2 pl-9 pr-3 text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 gap-2 text-xs font-semibold cursor-pointer"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {tab === 'signin' && 'Sign In'}
                {tab === 'signup' && 'Create Account'}
                {tab === 'forgot' && 'Send Reset Link'}
              </span>
              {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
            </Button>
          </form>

          {/* Toggle Tab Footer */}
          <div className="mt-6 pt-4 border-t border-[var(--border)] text-center text-xs text-[var(--muted)]">
            {tab === 'signin' && (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setTab('signup');
                  }}
                  className="font-medium text-[var(--accent)] hover:underline cursor-pointer"
                >
                  Create one now
                </button>
              </p>
            )}

            {tab === 'signup' && (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setTab('signin');
                  }}
                  className="font-medium text-[var(--accent)] hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            )}

            {tab === 'forgot' && (
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setTab('signin');
                }}
                className="font-medium text-[var(--accent)] hover:underline cursor-pointer"
              >
                ← Return to Sign In
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
