-- ==============================================================================
-- CHECK EMAIL EXISTS RPC (SECURITY DEFINER)
-- Digunakan untuk memeriksa apakah suatu email sudah terdaftar sebelum mengirim OTP
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
    SELECT EXISTS (
        SELECT 1 FROM auth.users WHERE LOWER(email) = v_clean_email
    ) INTO v_exists;

    IF v_exists THEN
        RETURN true;
    END IF;

    -- Cek tabel public.profiles sebagai lapisan kedua
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE LOWER(email) = v_clean_email
    ) INTO v_exists;

    RETURN v_exists;
END;
$$;

-- Berikan izin eksekusi ke anon dan authenticated
GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO anon, authenticated, service_role;
