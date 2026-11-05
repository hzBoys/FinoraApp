-- ==============================================================================
-- FINORA FINANCIAL INTELLIGENCE — P0.1 MIGRATION
-- Table: public.financial_profiles
-- Run this in Supabase SQL Editor AFTER the base schema is applied.
-- ==============================================================================

BEGIN;

-- ENUM TYPES (idempotent)
DO $$ BEGIN
  CREATE TYPE employment_status_type AS ENUM (
    'mahasiswa', 'karyawan', 'freelancer', 'wirausaha', 'lainnya'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE income_stability_type AS ENUM (
    'tetap', 'relatif_stabil', 'fluktuatif'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE risk_tolerance_type AS ENUM (
    'konservatif', 'moderat', 'agresif'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE investment_experience_type AS ENUM (
    'belum_pernah', 'pemula', 'menengah', 'berpengalaman'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==============================================================================
-- FINANCIAL PROFILES TABLE
-- 1:1 with public.users. Separated from account profile by design.
-- Progressive profiling: most fields nullable/defaulted.
-- Extensible for P2–P8 roadmap without ALTER users.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.financial_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,

  -- === PERSONAL CONTEXT (P0.1 — Step 1 of progressive profiling) ===
  employment_status employment_status_type DEFAULT 'lainnya',

  -- === INCOME (P0.1 — Required for most calculations) ===
  -- Declared recurring monthly income. Semantically distinct from transaction inflow.
  -- If null: metric requiring income returns null (insufficient data), not 0.
  monthly_income NUMERIC(15, 2) DEFAULT NULL CHECK (monthly_income >= 0),
  income_stability income_stability_type DEFAULT NULL,

  -- === EXPENSES & OBLIGATIONS (P0.1 — Step 2) ===
  -- Budgeted essential expenses (denominator for emergency fund coverage).
  -- Semantically distinct from actual category spending from transactions.
  monthly_essential_expenses NUMERIC(15, 2) DEFAULT NULL CHECK (monthly_essential_expenses >= 0),
  -- Explicit debt/cicilan payments (KPR, kendaraan, pinjaman).
  -- Semantically distinct from 'Tagihan' transaction category.
  monthly_debt_payments NUMERIC(15, 2) DEFAULT 0.00 CHECK (monthly_debt_payments >= 0),

  -- === SAFETY (P0.1 — Step 2) ===
  -- Declared emergency fund amount (cash/liquid). NOT derived from account saldo.
  emergency_fund NUMERIC(15, 2) DEFAULT NULL CHECK (emergency_fund >= 0),
  dependents SMALLINT DEFAULT 0 CHECK (dependents >= 0),

  -- === GOALS — minimal P0 fields, full goals at P2 ===
  primary_goal VARCHAR(50) DEFAULT NULL,
  -- e.g. 'Dana Darurat', 'Gadget', 'Pendidikan', 'Modal Usaha', 'Investasi', 'Custom'
  goal_target_amount NUMERIC(15, 2) DEFAULT NULL CHECK (goal_target_amount >= 0),
  goal_target_date DATE DEFAULT NULL,                 -- P2 full goal system
  goal_monthly_allocation NUMERIC(15, 2) DEFAULT 0.00 CHECK (goal_monthly_allocation >= 0),

  -- === RISK & INVESTMENT PROFILE — collected now, used at P6/P7 ===
  risk_tolerance risk_tolerance_type DEFAULT NULL,
  investment_experience investment_experience_type DEFAULT NULL,

  -- === PROGRESSIVE PROFILING TRACKING ===
  -- Tracks which onboarding steps have been completed. Computed at save, stored for CTA logic.
  -- step_1: employment_status + monthly_income filled
  -- step_2: monthly_essential_expenses + emergency_fund filled
  -- step_3: goals filled
  profile_step_completed SMALLINT DEFAULT 0 CHECK (profile_step_completed BETWEEN 0 AND 3),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY
-- ==============================================================================
ALTER TABLE public.financial_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own financial profile" ON public.financial_profiles;

CREATE POLICY "Users can manage own financial profile"
  ON public.financial_profiles
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
REVOKE ALL ON TABLE public.financial_profiles FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.financial_profiles TO authenticated;


-- ==============================================================================
-- INDEX
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_financial_profiles_user_id
  ON public.financial_profiles(user_id);

-- ==============================================================================
-- updated_at TRIGGER (reuses existing set_updated_at() function)
-- ==============================================================================
DROP TRIGGER IF EXISTS trg_financial_profiles_updated_at ON public.financial_profiles;
CREATE TRIGGER trg_financial_profiles_updated_at
  BEFORE UPDATE ON public.financial_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- AUTO-PROVISION WITHOUT REPLACING public.handle_new_user()
-- A dedicated trigger on public.users avoids coupling this migration to the
-- current auth trigger implementation and preserves existing signup behavior.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.provision_financial_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.financial_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.provision_financial_profile() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.provision_financial_profile() TO postgres, service_role;

DROP TRIGGER IF EXISTS trg_provision_financial_profile ON public.users;
CREATE TRIGGER trg_provision_financial_profile
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.provision_financial_profile();

-- Backfill every existing user exactly once.
INSERT INTO public.financial_profiles (user_id)
SELECT u.id FROM public.users u
ON CONFLICT (user_id) DO NOTHING;

COMMIT;
