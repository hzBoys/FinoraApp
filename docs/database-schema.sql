-- ==============================================================================
-- FINORA MOBILE APP - POSTGRESQL / SUPABASE DATABASE SCHEMA
-- Compatible with Supabase Auth, Row Level Security (RLS), and Realtime
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
DO $$ BEGIN
  CREATE TYPE account_type AS ENUM ('bank', 'ewallet', 'investasi', 'tunai');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE category_type AS ENUM ('kebutuhan', 'gaya_hidup', 'tabungan');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('masuk', 'keluar');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE scan_type AS ENUM ('struk', 'saldo');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE theme_mode_type AS ENUM ('light', 'dark', 'system');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 3. TABLES
-- ==============================================================================

-- 3.1. USERS PROFILE TABLE (Linked directly to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  avatar_url TEXT,
  role VARCHAR(30) DEFAULT 'Pengguna Finora',
  theme_mode theme_mode_type DEFAULT 'light',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2. FINANCIAL ACCOUNTS (Auto-Portfolio: Bank, E-Wallet, Investasi, Tunai)
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nama_akun VARCHAR(50) NOT NULL,
  tipe account_type NOT NULL,
  saldo NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (saldo >= 0),
  icon VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_user_account_name UNIQUE (user_id, nama_akun)
);

-- 3.3. TRANSACTION CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- NULL means global system category
  nama_kategori VARCHAR(50) NOT NULL,
  tipe category_type NOT NULL,
  icon VARCHAR(50),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.4. TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  category_id INT REFERENCES public.categories(id) ON DELETE SET NULL,
  nama VARCHAR(120) NOT NULL,
  nominal NUMERIC(15, 2) NOT NULL CHECK (nominal > 0),
  jenis transaction_type NOT NULL,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  merchant VARCHAR(100),
  metode_bayar VARCHAR(50),
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.5. SCAN RESULTS (Magic Receipt & Auto-Portfolio Log)
CREATE TABLE IF NOT EXISTS public.scan_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  jenis_scan scan_type NOT NULL,
  file_url TEXT,
  teks_ocr TEXT,
  merchant_extracted VARCHAR(100),
  nominal_extracted NUMERIC(15, 2),
  status VARCHAR(20) DEFAULT 'success', -- 'pending', 'success', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.6. BUDGETS (Monthly Allocation: Rule 60/20/20)
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  periode VARCHAR(20) NOT NULL, -- e.g. '2026-10' or 'Oktober 2026'
  total_anggaran NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (total_anggaran >= 0),
  persen_kebutuhan NUMERIC(5, 2) NOT NULL DEFAULT 60.00,
  persen_gaya_hidup NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
  persen_tabungan NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_user_budget_period UNIQUE (user_id, periode)
);

-- 3.7. RECOMMENDATIONS (Smart Advisor Financial Advice)
CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  isi_saran TEXT NOT NULL,
  lifestyle_reduction_needed NUMERIC(15, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. PERFORMANCE INDEXES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_cat ON public.transactions(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_periode ON public.budgets(user_id, periode);
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id);

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- 5.1. Users Policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 5.2. Accounts Policies
CREATE POLICY "Users can manage own accounts" ON public.accounts
  FOR ALL USING (auth.uid() = user_id);

-- 5.3. Categories Policies (Global default viewable by all, custom by owner)
CREATE POLICY "Users can view system or own categories" ON public.categories
  FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can manage own categories" ON public.categories
  FOR ALL USING (auth.uid() = user_id);

-- 5.4. Transactions Policies
CREATE POLICY "Users can manage own transactions" ON public.transactions
  FOR ALL USING (auth.uid() = user_id);

-- 5.5. Scan Results Policies
CREATE POLICY "Users can manage own scan results" ON public.scan_results
  FOR ALL USING (auth.uid() = user_id);

-- 5.6. Budgets Policies
CREATE POLICY "Users can manage own budgets" ON public.budgets
  FOR ALL USING (auth.uid() = user_id);

-- 5.7. Recommendations Policies
CREATE POLICY "Users can view own recommendations" ON public.recommendations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.budgets b
      WHERE b.id = recommendations.budget_id AND b.user_id = auth.uid()
    )
  );

-- ==============================================================================
-- 6. AUTOMATION TRIGGERS & PROCEDURES
-- ==============================================================================

-- 6.1. Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6.2. Automatically provision profile & default accounts on new auth.user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_nama TEXT;
  v_username TEXT;
BEGIN
  v_nama := COALESCE(NEW.raw_user_meta_data->>'nama', split_part(NEW.email, '@', 1));
  v_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));

  -- Insert profile
  INSERT INTO public.users (id, nama, username, email)
  VALUES (NEW.id, v_nama, v_username, NEW.email);

  -- Seed initial 4 default financial accounts with 0 balance
  INSERT INTO public.accounts (user_id, nama_akun, tipe, saldo)
  VALUES
    (NEW.id, 'Bank', 'bank', 0.00),
    (NEW.id, 'E-Wallet', 'ewallet', 0.00),
    (NEW.id, 'Investasi', 'investasi', 0.00),
    (NEW.id, 'Tunai', 'tunai', 0.00);

  -- Seed initial budget for current month with 0 allocation
  INSERT INTO public.budgets (user_id, periode, total_anggaran, persen_kebutuhan, persen_gaya_hidup, persen_tabungan)
  VALUES (NEW.id, TO_CHAR(NOW(), 'YYYY-MM'), 0.00, 60.00, 20.00, 20.00);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on Supabase auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 7. SEED SYSTEM CATEGORIES (Default categories available to all users)
-- ==============================================================================

INSERT INTO public.categories (user_id, nama_kategori, tipe, icon, is_default)
VALUES
  (NULL, 'Makan', 'kebutuhan', 'restaurant', true),
  (NULL, 'Transportasi', 'kebutuhan', 'bus', true),
  (NULL, 'Tagihan', 'kebutuhan', 'flash', true),
  (NULL, 'Belanja', 'gaya_hidup', 'bag-handle', true),
  (NULL, 'Hiburan', 'gaya_hidup', 'film', true),
  (NULL, 'Pemasukan', 'tabungan', 'arrow-down-circle', true),
  (NULL, 'Transfer', 'kebutuhan', 'swap-horizontal', true)
ON CONFLICT DO NOTHING;
