-- ==============================================================================
-- FINORA MOBILE APP - PHASE 1 BACKEND STABILIZATION MIGRATION
-- Target: Supabase PostgreSQL (ophepwhbraswwuizyssv)
-- Includes:
--   1. Schema & Foreign Key / RLS Performance Indexes (budgets.category_limits, etc.)
--   2. Safe 3-Pillar Account Standardization (Bank, E-Wallet, Investasi — remove Tunai)
--   3. Hardened Triggers (set_updated_at, handle_new_user with username collision safety)
--   4. Optimized & Complete RLS Policies ((select auth.uid()), TO authenticated, WITH CHECK)
--   5. Atomic RPCs (create/update/delete_transaction_atomic, resolve_email_by_username)
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. SCHEMA ENHANCEMENTS & PERFORMANCE INDEXES
-- ==============================================================================

-- Persist custom per-category budget limits (Makan, Transportasi, Tagihan, Belanja, Hiburan)
ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS category_limits JSONB DEFAULT NULL;

-- Prevent duplicate system or custom categories (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS uq_system_category_name
  ON public.categories (LOWER(nama_kategori))
  WHERE user_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_category_name
  ON public.categories (user_id, LOWER(nama_kategori))
  WHERE user_id IS NOT NULL;

-- Missing FK & lookup indexes for RLS subquery and CASCADE performance
CREATE INDEX IF NOT EXISTS idx_scan_results_user
  ON public.scan_results (user_id);

CREATE INDEX IF NOT EXISTS idx_scan_results_tx
  ON public.scan_results (transaction_id);

CREATE INDEX IF NOT EXISTS idx_recommendations_budget
  ON public.recommendations (budget_id);

CREATE INDEX IF NOT EXISTS idx_transactions_account
  ON public.transactions (account_id);

CREATE INDEX IF NOT EXISTS idx_users_username_lower
  ON public.users (LOWER(username));

-- Ensure all 7 default system categories exist
INSERT INTO public.categories (user_id, nama_kategori, tipe, icon, is_default)
VALUES
  (NULL, 'Makan', 'kebutuhan', 'restaurant', true),
  (NULL, 'Transportasi', 'kebutuhan', 'bus', true),
  (NULL, 'Tagihan', 'kebutuhan', 'flash', true),
  (NULL, 'Belanja', 'gaya_hidup', 'bag-handle', true),
  (NULL, 'Hiburan', 'gaya_hidup', 'film', true),
  (NULL, 'Pemasukan', 'tabungan', 'arrow-down-circle', true),
  (NULL, 'Transfer', 'kebutuhan', 'swap-horizontal', true)
ON CONFLICT (LOWER(nama_kategori)) WHERE user_id IS NULL DO NOTHING;

-- ==============================================================================
-- 2. STANDARDIZE 3 FINANCIAL PILLARS (BANK, E-WALLET, INVESTASI)
-- ==============================================================================

-- Re-link any legacy 'tunai' transactions to user's 'bank' account before cleanup
UPDATE public.transactions t
SET account_id = (
  SELECT a2.id
  FROM public.accounts a2
  WHERE a2.user_id = t.user_id
    AND a2.tipe = 'bank'
  LIMIT 1
),
metode_bayar = 'Bank'
WHERE t.account_id IN (
  SELECT id FROM public.accounts WHERE tipe::text = 'tunai'
) OR t.metode_bayar ILIKE 'tunai';

DELETE FROM public.accounts
WHERE tipe::text = 'tunai';

-- ==============================================================================
-- 3. HARDENED TRIGGER FUNCTIONS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_nama TEXT;
  v_username TEXT;
BEGIN
  v_nama := COALESCE(
    NULLIF(pg_catalog.btrim(NEW.raw_user_meta_data->>'nama'), ''),
    pg_catalog.split_part(NEW.email, '@', 1)
  );

  v_username := pg_catalog.lower(
    COALESCE(
      NULLIF(pg_catalog.btrim(NEW.raw_user_meta_data->>'username'), ''),
      pg_catalog.split_part(NEW.email, '@', 1)
    )
  );

  -- Append short UUID suffix if username already exists to prevent registration failure
  IF EXISTS (
    SELECT 1 FROM public.users u WHERE pg_catalog.lower(u.username) = v_username
  ) THEN
    v_username := pg_catalog.left(v_username, 42)
      || '_'
      || pg_catalog.substr(pg_catalog.replace(NEW.id::text, '-', ''), 1, 6);
  END IF;

  -- Insert profile idempotently
  INSERT INTO public.users (id, nama, username, email)
  VALUES (NEW.id, v_nama, v_username, pg_catalog.lower(NEW.email))
  ON CONFLICT (id) DO NOTHING;

  -- Seed initial 3 default financial accounts with 0.00 balance (Bank, E-Wallet, Investasi)
  INSERT INTO public.accounts (user_id, nama_akun, tipe, saldo)
  VALUES
    (NEW.id, 'Bank', 'bank', 0.00),
    (NEW.id, 'E-Wallet', 'ewallet', 0.00),
    (NEW.id, 'Investasi', 'investasi', 0.00)
  ON CONFLICT (user_id, nama_akun) DO NOTHING;

  -- Seed initial budget for current month with 0.00 allocation
  INSERT INTO public.budgets (
    user_id,
    periode,
    total_anggaran,
    persen_kebutuhan,
    persen_gaya_hidup,
    persen_tabungan
  )
  VALUES (
    NEW.id,
    pg_catalog.to_char(NOW(), 'YYYY-MM'),
    0.00,
    60.00,
    20.00,
    20.00
  )
  ON CONFLICT (user_id, periode) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role, supabase_auth_admin;

-- ==============================================================================
-- 4. OPTIMIZED & COMPLETE ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 4.1. Users Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- 4.2. Accounts Policies
DROP POLICY IF EXISTS "Users can manage own accounts" ON public.accounts;

CREATE POLICY "Users can manage own accounts" ON public.accounts
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- 4.3. Categories Policies
DROP POLICY IF EXISTS "Users can view system or own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can manage own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON public.categories;

CREATE POLICY "Users can view system or own categories" ON public.categories
  FOR SELECT TO authenticated
  USING (user_id IS NULL OR (select auth.uid()) = user_id);

CREATE POLICY "Users can insert own categories" ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own categories" ON public.categories
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own categories" ON public.categories
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- 4.4. Transactions Policies
DROP POLICY IF EXISTS "Users can manage own transactions" ON public.transactions;

CREATE POLICY "Users can manage own transactions" ON public.transactions
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- 4.5. Scan Results Policies
DROP POLICY IF EXISTS "Users can manage own scan results" ON public.scan_results;

CREATE POLICY "Users can manage own scan results" ON public.scan_results
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- 4.6. Budgets Policies
DROP POLICY IF EXISTS "Users can manage own budgets" ON public.budgets;

CREATE POLICY "Users can manage own budgets" ON public.budgets
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- 4.7. Recommendations Policies (SELECT + INSERT + UPDATE + DELETE via budget ownership)
DROP POLICY IF EXISTS "Users can view own recommendations" ON public.recommendations;
DROP POLICY IF EXISTS "Users can manage own recommendations" ON public.recommendations;

CREATE POLICY "Users can manage own recommendations" ON public.recommendations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.budgets b
      WHERE b.id = recommendations.budget_id
        AND b.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.budgets b
      WHERE b.id = recommendations.budget_id
        AND b.user_id = (select auth.uid())
    )
  );

-- ==============================================================================
-- 5. ATOMIC RPC FUNCTIONS
-- ==============================================================================

-- 5.1. Username -> Email lookup for login screen
CREATE OR REPLACE FUNCTION public.resolve_email_by_username(p_username TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_clean TEXT;
  v_email TEXT;
BEGIN
  v_clean := pg_catalog.lower(pg_catalog.btrim(COALESCE(p_username, '')));
  IF v_clean = '' THEN
    RETURN NULL;
  END IF;

  SELECT u.email INTO v_email
  FROM public.users u
  WHERE pg_catalog.lower(u.username) = v_clean
  LIMIT 1;

  RETURN v_email;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_email_by_username(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_email_by_username(TEXT) TO anon, authenticated, service_role;

-- 5.2. Atomic Create Transaction + Account Balance Adjustment
CREATE OR REPLACE FUNCTION public.create_transaction_atomic(
  p_nama VARCHAR,
  p_nominal NUMERIC,
  p_jenis public.transaction_type,
  p_tanggal DATE DEFAULT CURRENT_DATE,
  p_category_name VARCHAR DEFAULT NULL,
  p_account_id UUID DEFAULT NULL,
  p_merchant VARCHAR DEFAULT NULL,
  p_metode_bayar VARCHAR DEFAULT NULL,
  p_catatan TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_category_id INT;
  v_target_cat_name TEXT;
  v_old_saldo NUMERIC(15, 2);
  v_new_saldo NUMERIC(15, 2) := NULL;
  v_account_name VARCHAR(50) := NULL;
  v_tx_id UUID;
BEGIN
  v_user_id := (select auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: active user session required';
  END IF;

  IF p_nominal IS NULL OR p_nominal <= 0 THEN
    RAISE EXCEPTION 'Nominal transaksi harus lebih besar dari 0';
  END IF;

  v_target_cat_name := COALESCE(
    NULLIF(pg_catalog.btrim(p_category_name), ''),
    CASE WHEN p_jenis = 'masuk' THEN 'Pemasukan' ELSE 'Belanja' END
  );

  -- Prefer user custom category if present, otherwise system category
  SELECT c.id INTO v_category_id
  FROM public.categories c
  WHERE pg_catalog.lower(c.nama_kategori) = pg_catalog.lower(v_target_cat_name)
    AND (c.user_id = v_user_id OR c.user_id IS NULL)
  ORDER BY (c.user_id IS NULL) ASC, c.id ASC
  LIMIT 1;

  IF v_category_id IS NULL THEN
    SELECT c.id INTO v_category_id
    FROM public.categories c
    WHERE pg_catalog.lower(c.nama_kategori) = CASE WHEN p_jenis = 'masuk' THEN 'pemasukan' ELSE 'belanja' END
      AND c.user_id IS NULL
    LIMIT 1;
  END IF;

  -- Lock & update account balance atomically if account_id is supplied
  IF p_account_id IS NOT NULL THEN
    SELECT a.saldo, a.nama_akun
    INTO v_old_saldo, v_account_name
    FROM public.accounts a
    WHERE a.id = p_account_id
      AND a.user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Akun keuangan tidak ditemukan atau bukan milik pengguna';
    END IF;

    IF p_jenis = 'masuk' THEN
      v_new_saldo := v_old_saldo + p_nominal;
    ELSE
      v_new_saldo := GREATEST(0::numeric, v_old_saldo - p_nominal);
    END IF;

    UPDATE public.accounts
    SET saldo = v_new_saldo,
        updated_at = NOW()
    WHERE id = p_account_id
      AND user_id = v_user_id;
  END IF;

  INSERT INTO public.transactions (
    user_id,
    account_id,
    category_id,
    nama,
    nominal,
    jenis,
    tanggal,
    merchant,
    metode_bayar,
    catatan
  )
  VALUES (
    v_user_id,
    p_account_id,
    v_category_id,
    pg_catalog.btrim(p_nama),
    p_nominal,
    p_jenis,
    COALESCE(p_tanggal, CURRENT_DATE),
    COALESCE(NULLIF(pg_catalog.btrim(p_merchant), ''), pg_catalog.btrim(p_nama)),
    COALESCE(NULLIF(pg_catalog.btrim(p_metode_bayar), ''), v_account_name, 'Bank'),
    p_catatan
  )
  RETURNING id INTO v_tx_id;

  RETURN pg_catalog.jsonb_build_object(
    'transaction_id', v_tx_id,
    'account_id', p_account_id,
    'new_balance', v_new_saldo,
    'category_id', v_category_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_transaction_atomic(
  VARCHAR, NUMERIC, public.transaction_type, DATE, VARCHAR, UUID, VARCHAR, VARCHAR, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_transaction_atomic(
  VARCHAR, NUMERIC, public.transaction_type, DATE, VARCHAR, UUID, VARCHAR, VARCHAR, TEXT
) TO authenticated, service_role;

-- 5.3. Atomic Delete Transaction + Reverse Account Balance
CREATE OR REPLACE FUNCTION public.delete_transaction_atomic(
  p_transaction_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_account_id UUID;
  v_nominal NUMERIC(15, 2);
  v_jenis public.transaction_type;
  v_old_saldo NUMERIC(15, 2);
  v_new_saldo NUMERIC(15, 2) := NULL;
BEGIN
  v_user_id := (select auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: active user session required';
  END IF;

  SELECT t.account_id, t.nominal, t.jenis
  INTO v_account_id, v_nominal, v_jenis
  FROM public.transactions t
  WHERE t.id = p_transaction_id
    AND t.user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaksi tidak ditemukan atau bukan milik pengguna';
  END IF;

  IF v_account_id IS NOT NULL THEN
    SELECT a.saldo INTO v_old_saldo
    FROM public.accounts a
    WHERE a.id = v_account_id
      AND a.user_id = v_user_id
    FOR UPDATE;

    IF FOUND THEN
      IF v_jenis = 'masuk' THEN
        v_new_saldo := GREATEST(0::numeric, v_old_saldo - v_nominal);
      ELSE
        v_new_saldo := v_old_saldo + v_nominal;
      END IF;

      UPDATE public.accounts
      SET saldo = v_new_saldo,
          updated_at = NOW()
      WHERE id = v_account_id
        AND user_id = v_user_id;
    END IF;
  END IF;

  DELETE FROM public.transactions
  WHERE id = p_transaction_id
    AND user_id = v_user_id;

  RETURN pg_catalog.jsonb_build_object(
    'deleted', true,
    'transaction_id', p_transaction_id,
    'account_id', v_account_id,
    'new_balance', v_new_saldo
  );
END;
$$;

REVOKE ALL ON FUNCTION public.delete_transaction_atomic(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_transaction_atomic(UUID) TO authenticated, service_role;

-- 5.4. Atomic Update Transaction + Reconcile Old/New Account Balances
CREATE OR REPLACE FUNCTION public.update_transaction_atomic(
  p_transaction_id UUID,
  p_nama VARCHAR,
  p_nominal NUMERIC,
  p_jenis public.transaction_type,
  p_tanggal DATE,
  p_category_name VARCHAR DEFAULT NULL,
  p_account_id UUID DEFAULT NULL,
  p_merchant VARCHAR DEFAULT NULL,
  p_metode_bayar VARCHAR DEFAULT NULL,
  p_catatan TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_old_account_id UUID;
  v_old_nominal NUMERIC(15, 2);
  v_old_jenis public.transaction_type;
  v_category_id INT;
  v_target_cat_name TEXT;
  v_old_acc_new_saldo NUMERIC(15, 2) := NULL;
  v_new_acc_new_saldo NUMERIC(15, 2) := NULL;
  v_cur_saldo NUMERIC(15, 2);
BEGIN
  v_user_id := (select auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: active user session required';
  END IF;

  IF p_nominal IS NULL OR p_nominal <= 0 THEN
    RAISE EXCEPTION 'Nominal transaksi harus lebih besar dari 0';
  END IF;

  SELECT t.account_id, t.nominal, t.jenis
  INTO v_old_account_id, v_old_nominal, v_old_jenis
  FROM public.transactions t
  WHERE t.id = p_transaction_id
    AND t.user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaksi tidak ditemukan atau bukan milik pengguna';
  END IF;

  -- Lock involved accounts in deterministic UUID order to prevent deadlocks
  PERFORM 1
  FROM public.accounts a
  WHERE a.user_id = v_user_id
    AND a.id IN (v_old_account_id, p_account_id)
  ORDER BY a.id
  FOR UPDATE;

  -- Reverse old balance impact
  IF v_old_account_id IS NOT NULL THEN
    SELECT a.saldo INTO v_cur_saldo
    FROM public.accounts a
    WHERE a.id = v_old_account_id AND a.user_id = v_user_id;

    IF FOUND THEN
      v_old_acc_new_saldo := CASE
        WHEN v_old_jenis = 'masuk' THEN GREATEST(0::numeric, v_cur_saldo - v_old_nominal)
        ELSE v_cur_saldo + v_old_nominal
      END;

      UPDATE public.accounts
      SET saldo = v_old_acc_new_saldo, updated_at = NOW()
      WHERE id = v_old_account_id AND user_id = v_user_id;
    END IF;
  END IF;

  -- Apply new balance impact
  IF p_account_id IS NOT NULL THEN
    SELECT a.saldo INTO v_cur_saldo
    FROM public.accounts a
    WHERE a.id = p_account_id AND a.user_id = v_user_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Akun keuangan tujuan tidak ditemukan';
    END IF;

    v_new_acc_new_saldo := CASE
      WHEN p_jenis = 'masuk' THEN v_cur_saldo + p_nominal
      ELSE GREATEST(0::numeric, v_cur_saldo - p_nominal)
    END;

    UPDATE public.accounts
    SET saldo = v_new_acc_new_saldo, updated_at = NOW()
    WHERE id = p_account_id AND user_id = v_user_id;
  END IF;

  v_target_cat_name := COALESCE(
    NULLIF(pg_catalog.btrim(p_category_name), ''),
    CASE WHEN p_jenis = 'masuk' THEN 'Pemasukan' ELSE 'Belanja' END
  );

  SELECT c.id INTO v_category_id
  FROM public.categories c
  WHERE pg_catalog.lower(c.nama_kategori) = pg_catalog.lower(v_target_cat_name)
    AND (c.user_id = v_user_id OR c.user_id IS NULL)
  ORDER BY (c.user_id IS NULL) ASC, c.id ASC
  LIMIT 1;

  UPDATE public.transactions
  SET account_id = p_account_id,
      category_id = COALESCE(v_category_id, category_id),
      nama = pg_catalog.btrim(p_nama),
      nominal = p_nominal,
      jenis = p_jenis,
      tanggal = COALESCE(p_tanggal, tanggal),
      merchant = COALESCE(NULLIF(pg_catalog.btrim(p_merchant), ''), merchant),
      metode_bayar = COALESCE(NULLIF(pg_catalog.btrim(p_metode_bayar), ''), metode_bayar),
      catatan = COALESCE(p_catatan, catatan)
  WHERE id = p_transaction_id
    AND user_id = v_user_id;

  RETURN pg_catalog.jsonb_build_object(
    'transaction_id', p_transaction_id,
    'old_account_id', v_old_account_id,
    'old_account_balance', CASE WHEN v_old_account_id = p_account_id THEN v_new_acc_new_saldo ELSE v_old_acc_new_saldo END,
    'new_account_id', p_account_id,
    'new_account_balance', v_new_acc_new_saldo,
    'category_id', v_category_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.update_transaction_atomic(
  UUID, VARCHAR, NUMERIC, public.transaction_type, DATE, VARCHAR, UUID, VARCHAR, VARCHAR, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_transaction_atomic(
  UUID, VARCHAR, NUMERIC, public.transaction_type, DATE, VARCHAR, UUID, VARCHAR, VARCHAR, TEXT
) TO authenticated, service_role;

-- Reload PostgREST schema cache so new columns & RPCs are immediately available
NOTIFY pgrst, 'reload schema';

COMMIT;
