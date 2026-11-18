import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, ProfileRecord } from '@/lib/supabase';
import { db } from '@/lib/db';
import { syncService } from '@/services/syncService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: ProfileRecord | null;
  isLoading: boolean;
  isConfigured: boolean;
  guestMigrationNeeded: boolean;
  guestCount: number;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null; needConfirmation?: boolean }>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  performGuestMigration: () => Promise<void>;
  dismissGuestMigration: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [guestMigrationNeeded, setGuestMigrationNeeded] = useState(false);
  const [guestCount, setGuestCount] = useState(0);

  // Load user profile
  const fetchProfile = async (userId: string) => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('Failed to fetch profile:', error);
      } else if (data) {
        setProfile(data as ProfileRecord);
      }
    } catch (e) {
      console.warn('Profile fetch exception:', e);
    }
  };

  // Check if guest progress exists in Dexie
  const checkGuestData = async (userId: string) => {
    try {
      const count = await db.problemProgress.count();
      const migrationDismissed = localStorage.getItem(`queryforge-migrated-${userId}`);
      if (count > 0 && !migrationDismissed) {
        setGuestCount(count);
        setGuestMigrationNeeded(true);
      }
    } catch (e) {
      console.warn('Error checking guest progress:', e);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    // 1. Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        checkGuestData(session.user.id);
        syncService.flushOfflineQueue(session.user.id);
      }
      setIsLoading(false);
    });

    // 2. Auth State Change Listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
        await checkGuestData(session.user.id);
        syncService.flushOfflineQueue(session.user.id);
      } else {
        setProfile(null);
        setGuestMigrationNeeded(false);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.') };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  };

  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.') };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: displayName,
          name: displayName,
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) return { error: new Error(error.message) };
    const needConfirmation = !data.session;
    return { error: null, needConfirmation };
  };

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured.') };
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured.') };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error ? new Error(error.message) : null };
  };

  const updatePassword = async (newPassword: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured.') };
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setGuestMigrationNeeded(false);
  };

  const performGuestMigration = async () => {
    if (!user) return;
    try {
      await syncService.mergeGuestProgress(user.id);
      localStorage.setItem(`queryforge-migrated-${user.id}`, 'true');
      setGuestMigrationNeeded(false);
    } catch (err) {
      console.error('Guest migration error:', err);
    }
  };

  const dismissGuestMigration = () => {
    if (user) {
      localStorage.setItem(`queryforge-migrated-${user.id}`, 'true');
    }
    setGuestMigrationNeeded(false);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      isLoading,
      isConfigured: isSupabaseConfigured,
      guestMigrationNeeded,
      guestCount,
      signInWithEmail,
      signUpWithEmail,
      signInWithOAuth,
      resetPassword,
      updatePassword,
      signOut,
      performGuestMigration,
      dismissGuestMigration,
      refreshProfile,
    }),
    [user, session, profile, isLoading, guestMigrationNeeded, guestCount]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
