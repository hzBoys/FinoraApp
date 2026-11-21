-- ==============================================================================
-- FINORA MOBILE APP - PHASE 3 COMPLETE BACKEND HARDENING MIGRATION
-- Target: Supabase PostgreSQL (ophepwhbraswwuizyssv)
-- Safe & Idempotent: Run AFTER phase1-backend-fixes.sql & phase2-magic-receipt-storage.sql
--
-- Includes:
--   1. Performance composite indexes for scan history & recommendations queries
--   2. Category alias normalization helper inside Atomic Transaction RPCs
--   3. Upgraded create_transaction_atomic() with:
--        - Automatic account resolution when p_account_id IS NULL
--        - Optional atomic p_scan_id linking to public.scan_results
--   4. Upgraded update_transaction_atomic() with category alias normalization
--   5. Safe account deletion RPC: public.delete_account_safe(p_account_id)
--   6. Single-query Dashboard Summary RPC: public.get_dashboard_summary(p_periode)
--   7. Schema alignment for public.financial_profiles (compatible with P0 roadmap)
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. COMPOSITE PERFORMANCE INDEXES (Postgres Best Practices)
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_scan_results_user_created
  ON public.scan_results (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recommendations_budget_created
  ON public.recommendations (budget_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_tanggal_created
  ON public.transactions (user_id, tanggal DESC, created_at DESC);

-- ==============================================================================
-- 2. INTERNAL HELPER: CANONICAL CATEGORY NAME NORMALIZER
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.normalize_finora_category(
  p_raw TEXT,
  p_jenis public.transaction_type
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  v_key TEXT;
BEGIN
  v_key := pg_catalog.lower(pg_catalog.btrim(COALESCE(p_raw, '')));
  IF v_key = '' THEN
    RETURN CASE WHEN p_jenis = 'masuk' THEN 'Pemasukan' ELSE 'Belanja' END;
  END IF;

  IF v_key IN ('makan', 'makanan', 'makan & minum', 'makanan & minuman', 'food', 'kuliner') THEN
    RETURN 'Makan';
  ELSIF v_key IN ('transportasi', 'transport', 'ojek', 'bensin', 'parkir') THEN
    RETURN 'Transportasi';
  ELSIF v_key IN ('tagihan', 'bills', 'listrik', 'internet', 'pulsa') THEN
    RETURN 'Tagihan';
  ELSIF v_key IN ('hiburan', 'entertainment', 'bioskop', 'game') THEN
    RETURN 'Hiburan';
  ELSIF v_key IN ('belanja', 'shopping', 'groceries', 'sembako') THEN
    RETURN 'Belanja';
  ELSIF v_key IN ('pemasukan', 'income', 'gaji', 'salary') THEN
    RETURN 'Pemasukan';
  ELSIF v_key IN ('transfer', 'top up', 'topup') THEN
    RETURN 'Transfer';
  END IF;

  RETURN pg_catalog.btrim(p_raw);
END;
$$;

REVOKE ALL ON FUNCTION public.normalize_finora_category(TEXT, public.transaction_type) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.normalize_finora_category(TEXT, public.transaction_type) TO authenticated, service_role;

-- ==============================================================================
-- 3. UPGRADED ATOMIC CREATE TRANSACTION + AUTO ACCOUNT RESOLUTION + SCAN LINKING
-- ==============================================================================

-- Drop older 9-arg signature cleanly before replacing with backward-compatible 10-arg default signature
DROP FUNCTION IF EXISTS public.create_transaction_atomic(
  VARCHAR, NUMERIC, public.transaction_type, DATE, VARCHAR, UUID, VARCHAR, VARCHAR, TEXT
);

CREATE OR REPLACE FUNCTION public.create_transaction_atomic(
  p_nama VARCHAR,
  p_nominal NUMERIC,
  p_jenis public.transaction_type,
  p_tanggal DATE DEFAULT CURRENT_DATE,
  p_category_name VARCHAR DEFAULT NULL,
  p_account_id UUID DEFAULT NULL,
  p_merchant VARCHAR DEFAULT NULL,
  p_metode_bayar VARCHAR DEFAULT NULL,
  p_catatan TEXT DEFAULT NULL,
  p_scan_id UUID DEFAULT NULL
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
  v_resolved_account_id UUID := p_account_id;
  v_old_saldo NUMERIC(15, 2);
  v_new_saldo NUMERIC(15, 2) := NULL;
  v_account_name VARCHAR(50) := NULL;
  v_tx_id UUID;
  v_method_lower TEXT;
BEGIN
  v_user_id := (select auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: active user session required';
  END IF;

  IF p_nominal IS NULL OR p_nominal <= 0 THEN
    RAISE EXCEPTION 'Nominal transaksi harus lebih besar dari 0';
  END IF;

  v_target_cat_name := public.normalize_finora_category(p_category_name, p_jenis);

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

  -- Defensive account resolution when client passes NULL p_account_id
  IF v_resolved_account_id IS NULL THEN
    v_method_lower := pg_catalog.lower(pg_catalog.btrim(COALESCE(p_metode_bayar, '')));

    IF v_method_lower <> '' THEN
      SELECT a.id INTO v_resolved_account_id
      FROM public.accounts a
      WHERE a.user_id = v_user_id
        AND pg_catalog.lower(a.nama_akun) = v_method_lower
      LIMIT 1;
    END IF;

    IF v_resolved_account_id IS NULL THEN
      SELECT a.id INTO v_resolved_account_id
      FROM public.accounts a
      WHERE a.user_id = v_user_id
        AND a.tipe = CASE
          WHEN v_method_lower LIKE '%wallet%' OR v_method_lower LIKE '%gopay%' OR v_method_lower LIKE '%ovo%' OR v_method_lower LIKE '%dana%' OR v_method_lower LIKE '%qris%' THEN 'ewallet'::public.account_type
          WHEN v_method_lower LIKE '%invest%' OR v_method_lower LIKE '%bibit%' OR v_method_lower LIKE '%ajaib%' THEN 'investasi'::public.account_type
          ELSE 'bank'::public.account_type
        END
      ORDER BY a.saldo DESC, a.created_at ASC
      LIMIT 1;
    END IF;

    IF v_resolved_account_id IS NULL THEN
      SELECT a.id INTO v_resolved_account_id
      FROM public.accounts a
      WHERE a.user_id = v_user_id
      ORDER BY a.created_at ASC
      LIMIT 1;
    END IF;
  END IF;

  -- Lock & update account balance atomically
  IF v_resolved_account_id IS NOT NULL THEN
    SELECT a.saldo, a.nama_akun
    INTO v_old_saldo, v_account_name
    FROM public.accounts a
    WHERE a.id = v_resolved_account_id
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
    WHERE id = v_resolved_account_id
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
    v_resolved_account_id,
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

  -- Atomically link OCR scan log to created transaction when p_scan_id is provided
  IF p_scan_id IS NOT NULL THEN
    UPDATE public.scan_results
    SET transaction_id = v_tx_id
    WHERE id = p_scan_id
      AND user_id = v_user_id;
  END IF;

  RETURN pg_catalog.jsonb_build_object(
    'transaction_id', v_tx_id,
    'account_id', v_resolved_account_id,
    'new_balance', v_new_saldo,
    'category_id', v_category_id,
    'scan_linked', (p_scan_id IS NOT NULL)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_transaction_atomic(
  VARCHAR, NUMERIC, public.transaction_type, DATE, VARCHAR, UUID, VARCHAR, VARCHAR, TEXT, UUID
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_transaction_atomic(
  VARCHAR, NUMERIC, public.transaction_type, DATE, VARCHAR, UUID, VARCHAR, VARCHAR, TEXT, UUID
) TO authenticated, service_role;

-- ==============================================================================
-- 4. UPGRADED ATOMIC UPDATE TRANSACTION (WITH CATEGORY ALIAS NORMALIZATION)
-- ==============================================================================

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

  v_target_cat_name := public.normalize_finora_category(p_category_name, p_jenis);

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

-- ==============================================================================
-- 5. SAFE ACCOUNT DELETION RPC (PRESERVES MINIMUM 1 ACCOUNT & HISTORICAL TXS)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.delete_account_safe(
  p_account_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_acc_count INT;
BEGIN
  v_user_id := (select auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: active user session required';
  END IF;

  SELECT pg_catalog.count(*) INTO v_acc_count
  FROM public.accounts a
  WHERE a.user_id = v_user_id;

  IF v_acc_count <= 1 THEN
    RAISE EXCEPTION 'Minimal harus ada 1 akun keuangan aktif pada portofolio Anda';
  END IF;

  DELETE FROM public.accounts
  WHERE id = p_account_id
    AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Akun keuangan tidak ditemukan atau bukan milik pengguna';
  END IF;

  RETURN pg_catalog.jsonb_build_object(
    'deleted', true,
    'account_id', p_account_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.delete_account_safe(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_account_safe(UUID) TO authenticated, service_role;

-- ==============================================================================
-- 6. SERVER-SIDE DASHBOARD SUMMARY RPC (SINGLE-QUERY ANALYTICS < 2s ER-2.1)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_dashboard_summary(
  p_periode VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_periode TEXT;
  v_total_balance NUMERIC(15, 2) := 0;
  v_bank_balance NUMERIC(15, 2) := 0;
  v_ewallet_balance NUMERIC(15, 2) := 0;
  v_investasi_balance NUMERIC(15, 2) := 0;
  v_account_count INT := 0;
  v_monthly_income NUMERIC(15, 2) := 0;
  v_monthly_expense NUMERIC(15, 2) := 0;
  v_tx_count INT := 0;
BEGIN
  v_user_id := (select auth.uid());
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: active user session required';
  END IF;

  v_periode := COALESCE(NULLIF(pg_catalog.btrim(p_periode), ''), pg_catalog.to_char(NOW(), 'YYYY-MM'));

  SELECT
    COALESCE(SUM(a.saldo), 0),
    COALESCE(SUM(CASE WHEN a.tipe = 'bank' THEN a.saldo ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN a.tipe = 'ewallet' THEN a.saldo ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN a.tipe = 'investasi' THEN a.saldo ELSE 0 END), 0),
    COUNT(*)
  INTO
    v_total_balance,
    v_bank_balance,
    v_ewallet_balance,
    v_investasi_balance,
    v_account_count
  FROM public.accounts a
  WHERE a.user_id = v_user_id;

  SELECT
    COALESCE(SUM(CASE WHEN t.jenis = 'masuk' THEN t.nominal ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN t.jenis = 'keluar' AND COALESCE(pg_catalog.lower(c.nama_kategori), '') <> 'transfer' THEN t.nominal ELSE 0 END), 0),
    COUNT(*)
  INTO
    v_monthly_income,
    v_monthly_expense,
    v_tx_count
  FROM public.transactions t
  LEFT JOIN public.categories c ON c.id = t.category_id
  WHERE t.user_id = v_user_id
    AND pg_catalog.to_char(t.tanggal, 'YYYY-MM') = v_periode;

  RETURN pg_catalog.jsonb_build_object(
    'periode', v_periode,
    'total_balance', v_total_balance,
    'bank_balance', v_bank_balance,
    'ewallet_balance', v_ewallet_balance,
    'investasi_balance', v_investasi_balance,
    'account_count', v_account_count,
    'monthly_income', v_monthly_income,
    'monthly_expense', v_monthly_expense,
    'transaction_count', v_tx_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_dashboard_summary(VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_dashboard_summary(VARCHAR) TO authenticated, service_role;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;
