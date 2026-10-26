-- ==============================================================================
-- FINORA - AUTO CONFIRM USERS TRIGGER (POSTGRESQL / SUPABASE)
-- Menghilangkan keharusan konfirmasi email & bypass rate-limit SMTP
-- ==============================================================================

CREATE OR REPLACE FUNCTION auth.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_auto_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION auth.auto_confirm_user();
