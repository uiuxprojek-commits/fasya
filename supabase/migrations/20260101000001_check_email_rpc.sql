-- ==============================================================================
-- CHECK EMAIL EXISTS & USER CONFIRMATION STATUS (SECURITY DEFINER)
-- Hanya menganggap email "terdaftar" jika email SUDAH diverifikasi (OTP sudah diisi)
-- DAN user sudah memiliki kata sandi aktif.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.check_email_exists(lookup_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_email text;
    v_exists boolean := false;
BEGIN
    v_clean_email := LOWER(TRIM(lookup_email));
    
    -- Cek tabel auth.users
    -- Hanya anggap SUDAH TERDAFTAR jika:
    -- 1. email_confirmed_at sudah terisi (sudah verifikasi OTP)
    -- 2. encrypted_password sudah terisi (sudah buat password di Langkah 3)
    SELECT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE LOWER(email) = v_clean_email 
          AND (email_confirmed_at IS NOT NULL OR confirmed_at IS NOT NULL)
          AND encrypted_password IS NOT NULL 
          AND encrypted_password != ''
    ) INTO v_exists;

    RETURN v_exists;
END;
$$;

-- Berikan izin eksekusi ke anon, authenticated, dan service_role
GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO anon, authenticated, service_role;

-- ==============================================================================
-- UPDATE USER PROVISIONING TRIGGER: HANYA BUAT PROFIL SETELAH OTP TERKONFIRMASI
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_phone TEXT;
    v_starter_plan_id UUID;
BEGIN
    -- JANGAN buat profil jika email belum diverifikasi (OTP belum diisi)
    -- Kecuali jika akun dari provider OAuth (misal Google) yang otomatis terkonfirmasi
    IF (NEW.email_confirmed_at IS NULL AND NEW.confirmed_at IS NULL) THEN
        RETURN NEW;
    END IF;

    -- Cegah duplikasi jika profil sudah pernah dibuat
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
        RETURN NEW;
    END IF;

    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    v_phone := NEW.raw_user_meta_data->>'phone_number';

    -- 1. Create Profile
    INSERT INTO public.profiles (
        id, email, full_name, avatar_url, phone_number, currency, onboarding_completed
    ) VALUES (
        NEW.id,
        NEW.email,
        v_full_name,
        NEW.raw_user_meta_data->>'avatar_url',
        v_phone,
        'IDR',
        FALSE
    ) ON CONFLICT (id) DO NOTHING;

    -- 2. Assign Default Role (user)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- 3. Assign Default Starter Plan
    SELECT id INTO v_starter_plan_id FROM public.subscription_plans WHERE code = 'starter' LIMIT 1;
    IF v_starter_plan_id IS NOT NULL THEN
        INSERT INTO public.user_subscriptions (user_id, plan_id, status)
        VALUES (NEW.id, v_starter_plan_id, 'active')
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    -- 4. Create Initial Default Wallet
    INSERT INTO public.wallets (
        user_id, name, type, balance, is_default, color, icon
    ) VALUES (
        NEW.id, 'Dompet Utama', 'cash', 0.00, TRUE, '#F97316', 'wallet'
    ) ON CONFLICT DO NOTHING;

    -- 5. Initialize Reminder Settings
    INSERT INTO public.reminder_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger agar berjalan saat INSERT dan UPDATE email_confirmed_at
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
