-- ====================================================================
-- ROLLBACK SCRIPT: 20261118000001_multiuser_init_down.sql
-- Description: Cleanly tears down schema, policies, triggers, and functions
-- ====================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TRIGGER IF EXISTS trg_custom_testcases_updated_at ON public.custom_testcases;
DROP TRIGGER IF EXISTS trg_user_progress_updated_at ON public.user_progress;
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
DROP FUNCTION IF EXISTS public.set_updated_at_timestamp();

DROP TABLE IF EXISTS public.custom_testcases;
DROP TABLE IF EXISTS public.submissions;
DROP TABLE IF EXISTS public.user_progress;
DROP TABLE IF EXISTS public.profiles;
