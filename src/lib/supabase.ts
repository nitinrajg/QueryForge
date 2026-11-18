import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface ProfileRecord {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProgressRow {
  id?: string;
  user_id?: string;
  problem_id: string;
  status: 'not_started' | 'attempted' | 'solved';
  attempts: number;
  time_spent_seconds: number;
  hints_used: number;
  last_code: string;
  created_at?: string;
  updated_at: string;
}

export interface SubmissionRow {
  id?: string;
  user_id?: string;
  problem_id: string;
  verdict: 'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Time Limit Exceeded' | 'Executed' | 'Compilation Error';
  code: string;
  runtime_ms: number;
  row_count: number;
  submitted_at?: string;
}

export interface CustomTestCaseRow {
  id?: string;
  user_id?: string;
  problem_id: string;
  name: string;
  input_data: Record<string, (string | number | boolean | null)[][]>;
  expected_output?: {
    columns: string[];
    rows: (string | number | boolean | null)[][];
  } | null;
  created_at?: string;
  updated_at: string;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
);

/**
 * Singleton Supabase Client.
 * Configured with PKCE flow for secure browser-based OAuth handling.
 * If credentials are not yet configured in .env, falls back cleanly
 * so local guest mode and offline practice run without interruption.
 */
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : (createClient('https://placeholder.supabase.co', 'placeholder-anon-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }));
