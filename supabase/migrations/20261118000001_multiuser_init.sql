-- ====================================================================
-- MIGRATION: 20261118000001_multiuser_init.sql
-- Description: Core schema, constraints, triggers, and RLS for QueryForge
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE CHECK (char_length(username) >= 3 AND char_length(username) <= 30 AND username ~ '^[a-zA-Z0-9_]+$'),
    display_name TEXT CHECK (char_length(display_name) <= 100),
    avatar_url TEXT CHECK (avatar_url IS NULL OR avatar_url ~* '^https?://'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. USER_PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    problem_id TEXT NOT NULL CHECK (char_length(problem_id) <= 128),
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'attempted', 'solved')),
    attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    time_spent_seconds INTEGER NOT NULL DEFAULT 0 CHECK (time_spent_seconds >= 0),
    hints_used INTEGER NOT NULL DEFAULT 0 CHECK (hints_used >= 0),
    last_code TEXT DEFAULT '' CHECK (char_length(last_code) <= 100000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_problem UNIQUE (user_id, problem_id)
);

-- 4. SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    problem_id TEXT NOT NULL CHECK (char_length(problem_id) <= 128),
    verdict TEXT NOT NULL CHECK (verdict IN ('Accepted', 'Wrong Answer', 'Runtime Error', 'Time Limit Exceeded', 'Executed', 'Compilation Error')),
    code TEXT NOT NULL CHECK (char_length(code) <= 100000),
    runtime_ms REAL NOT NULL DEFAULT 0.0 CHECK (runtime_ms >= 0),
    row_count INTEGER NOT NULL DEFAULT 0 CHECK (row_count >= 0),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. CUSTOM_TESTCASES TABLE
CREATE TABLE IF NOT EXISTS public.custom_testcases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    problem_id TEXT NOT NULL CHECK (char_length(problem_id) <= 128),
    name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
    input_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    expected_output JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. INDEXES FOR HIGH-PERFORMANCE LOOKUPS
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_status ON public.user_progress (user_id, status);
CREATE INDEX IF NOT EXISTS idx_submissions_user_problem ON public.submissions (user_id, problem_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_activity ON public.submissions (user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_testcases_user_problem ON public.custom_testcases (user_id, problem_id);

-- 7. AUTO-TIMESTAMP UPDATE TRIGGER
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

CREATE TRIGGER trg_user_progress_updated_at
    BEFORE UPDATE ON public.user_progress
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

CREATE TRIGGER trg_custom_testcases_updated_at
    BEFORE UPDATE ON public.custom_testcases
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- 8. AUTO-CREATE PROFILE ON AUTH SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    raw_user_name TEXT;
    clean_username TEXT;
BEGIN
    raw_user_name := COALESCE(
        NEW.raw_user_meta_data->>'user_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );
    -- Clean username to alphanumeric and underscore, trim length to 25
    clean_username := regexp_replace(raw_user_name, '[^a-zA-Z0-9_]', '_', 'g');
    IF char_length(clean_username) < 3 THEN
        clean_username := 'user_' || substr(NEW.id::text, 1, 8);
    ELSE
        clean_username := substr(clean_username, 1, 25) || '_' || substr(NEW.id::text, 1, 4);
    END IF;

    INSERT INTO public.profiles (id, username, display_name, avatar_url)
    VALUES (
        NEW.id,
        clean_username,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. ROW-LEVEL SECURITY (RLS) POLICIES
-- Enable RLS on every table (mandatory security gate)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_testcases ENABLE ROW LEVEL SECURITY;

-- Profiles: Public can read basic profile info; user can update their own
CREATE POLICY "Public profiles are viewable by anyone" 
    ON public.profiles FOR SELECT 
    USING (true);

CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);

-- User Progress: Strictly isolated per user
CREATE POLICY "Users can read own progress" 
    ON public.user_progress FOR SELECT 
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own progress" 
    ON public.user_progress FOR INSERT 
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own progress" 
    ON public.user_progress FOR UPDATE 
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own progress" 
    ON public.user_progress FOR DELETE 
    USING ((SELECT auth.uid()) = user_id);

-- Submissions: Strictly isolated per user
CREATE POLICY "Users can read own submissions" 
    ON public.submissions FOR SELECT 
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own submissions" 
    ON public.submissions FOR INSERT 
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own submissions" 
    ON public.submissions FOR DELETE 
    USING ((SELECT auth.uid()) = user_id);

-- Custom Test Cases: Strictly isolated per user
CREATE POLICY "Users can read own custom testcases" 
    ON public.custom_testcases FOR SELECT 
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own custom testcases" 
    ON public.custom_testcases FOR INSERT 
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own custom testcases" 
    ON public.custom_testcases FOR UPDATE 
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own custom testcases" 
    ON public.custom_testcases FOR DELETE 
    USING ((SELECT auth.uid()) = user_id);
