-- ==============================================================================
-- FINORA: MIGRATION SCRIPT - REMOVE TUNAI & UPDATE HANDLE_NEW_USER
-- ==============================================================================

-- 1. Re-link transactions from 'tunai' account to 'bank' account
UPDATE public.transactions t
SET account_id = (
  SELECT a2.id FROM public.accounts a2
  WHERE a2.user_id = t.user_id AND a2.tipe = 'bank' LIMIT 1
),
metode_bayar = 'Bank'
WHERE t.account_id IN (
  SELECT id FROM public.accounts WHERE tipe = 'tunai'
) OR t.metode_bayar ILIKE 'tunai';

-- 2. Delete all accounts with tipe = 'tunai'
DELETE FROM public.accounts WHERE tipe = 'tunai';

-- 3. Update trigger handle_new_user() to only provision 3 accounts (Bank, E-Wallet, Investasi)
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

  -- Seed initial 3 default financial accounts with 0.00 balance
  INSERT INTO public.accounts (user_id, nama_akun, tipe, saldo)
  VALUES
    (NEW.id, 'Bank', 'bank', 0.00),
    (NEW.id, 'E-Wallet', 'ewallet', 0.00),
    (NEW.id, 'Investasi', 'investasi', 0.00);

  -- Seed initial budget for current month with 0.00 allocation
  INSERT INTO public.budgets (user_id, periode, total_anggaran, persen_kebutuhan, persen_gaya_hidup, persen_tabungan)
  VALUES (NEW.id, TO_CHAR(NOW(), 'YYYY-MM'), 0.00, 60.00, 20.00, 20.00);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
