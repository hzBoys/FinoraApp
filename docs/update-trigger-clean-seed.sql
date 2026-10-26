-- ==============================================================================
-- UPDATE TRIGGER: HANDLE NEW USER (CLEAN ZERO SEED)
-- Menjamin setiap pengguna baru yang mendaftar mulai dari Saldo Rp0 & Anggaran Rp0
-- ==============================================================================

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

  -- Seed initial 4 default financial accounts with 0.00 balance
  INSERT INTO public.accounts (user_id, nama_akun, tipe, saldo)
  VALUES
    (NEW.id, 'Bank', 'bank', 0.00),
    (NEW.id, 'E-Wallet', 'ewallet', 0.00),
    (NEW.id, 'Investasi', 'investasi', 0.00),
    (NEW.id, 'Tunai', 'tunai', 0.00);

  -- Seed initial budget for current month with 0.00 allocation
  INSERT INTO public.budgets (user_id, periode, total_anggaran, persen_kebutuhan, persen_gaya_hidup, persen_tabungan)
  VALUES (NEW.id, TO_CHAR(NOW(), 'YYYY-MM'), 0.00, 60.00, 20.00, 20.00);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
