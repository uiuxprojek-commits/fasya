-- ==============================================================================
-- TATADANA FINTECH SAAS — CORE DATABASE SCHEMA & SECURITY POLICIES
-- PostgreSQL + Supabase RLS + Atomic Financial Stored Procedures
-- Timezone: Asia/Jakarta (WIB)
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. PROFILES & ROLES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone_number TEXT,
    phone_verified_at TIMESTAMPTZ,
    currency VARCHAR(10) NOT NULL DEFAULT 'IDR',
    monthly_income_estimate NUMERIC(15, 2) DEFAULT 0,
    financial_goal TEXT,
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    assigned_by UUID REFERENCES auth.users(id),
    CONSTRAINT unique_user_role UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.phone_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    otp_code_hash TEXT NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 2. WALLETS (MULTI-WALLET & ATOMIC BALANCES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'cash' CHECK (type IN ('cash', 'bank', 'ewallet')),
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    color VARCHAR(20) DEFAULT '#F97316',
    icon VARCHAR(50) DEFAULT 'wallet',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. CATEGORIES & BUDGETS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL if global system category
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    icon VARCHAR(50) NOT NULL DEFAULT 'tag',
    color VARCHAR(20) NOT NULL DEFAULT '#F97316',
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    monthly_amount NUMERIC(15, 2) NOT NULL CHECK (monthly_amount > 0),
    month_year VARCHAR(7) NOT NULL, -- e.g. '2026-10'
    alert_80_sent BOOLEAN NOT NULL DEFAULT FALSE,
    alert_100_sent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_category_month UNIQUE (user_id, category_id, month_year)
);

-- ==============================================================================
-- 4. TRANSACTIONS & RECEIPT ITEMS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    notes TEXT,
    source VARCHAR(30) NOT NULL DEFAULT 'web' CHECK (source IN ('web', 'telegram_text', 'telegram_voice', 'receipt_photo')),
    receipt_image_url TEXT,
    transfer_to_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
    transfer_pair_id UUID, -- Links source & target ledger entries
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    price_per_unit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 5. TELEGRAM INTEGRATION & ACCOUNT LINKING
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.telegram_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    telegram_user_id BIGINT NOT NULL,
    telegram_username TEXT,
    first_name TEXT,
    last_name TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    linked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_telegram_account UNIQUE (user_id),
    CONSTRAINT unique_telegram_user_id UNIQUE (telegram_user_id)
);

CREATE TABLE IF NOT EXISTS public.telegram_link_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_link_code UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS public.telegram_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    update_id BIGINT NOT NULL,
    telegram_user_id BIGINT,
    chat_id BIGINT,
    payload JSONB NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed', 'ignored')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    processed_at TIMESTAMPTZ,
    CONSTRAINT unique_telegram_update_id UNIQUE (update_id)
);

-- ==============================================================================
-- 6. SUBSCRIPTIONS, ENTITLEMENT & PAYMENTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) NOT NULL UNIQUE CHECK (code IN ('starter', 'pro')),
    name VARCHAR(100) NOT NULL,
    price NUMERIC(15, 2) NOT NULL,
    billing_type VARCHAR(20) NOT NULL CHECK (billing_type IN ('monthly', 'lifetime')),
    max_monthly_transactions INT NOT NULL DEFAULT 50, -- -1 for unlimited
    max_wallets INT NOT NULL DEFAULT 3, -- -1 for unlimited
    max_budgets INT NOT NULL DEFAULT 5, -- -1 for unlimited
    has_receipt_ocr BOOLEAN NOT NULL DEFAULT FALSE,
    has_ai_advisor BOOLEAN NOT NULL DEFAULT FALSE,
    has_exports BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
    start_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    end_date TIMESTAMPTZ, -- NULL for lifetime plans
    payment_method VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_subscription UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    order_id VARCHAR(100) NOT NULL UNIQUE,
    amount NUMERIC(15, 2) NOT NULL,
    payment_type VARCHAR(30) NOT NULL CHECK (payment_type IN ('midtrans', 'manual_transfer')),
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'settlement', 'cancel', 'expire', 'failure', 'manual_verification', 'rejected')),
    midtrans_transaction_id TEXT,
    midtrans_response JSONB,
    proof_image_url TEXT,
    admin_notes TEXT,
    verified_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 7. AI CONFIGURATION & USAGE AUDIT
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ai_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE CHECK (name IN ('gemini', 'openai', 'deepseek')),
    display_name VARCHAR(100) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    priority INT NOT NULL DEFAULT 1,
    encrypted_api_key TEXT,
    key_iv TEXT,
    key_tag TEXT,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    provider_name VARCHAR(50) NOT NULL,
    feature VARCHAR(50) NOT NULL,
    input_tokens INT NOT NULL DEFAULT 0,
    output_tokens INT NOT NULL DEFAULT 0,
    estimated_cost_idr NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'error', 'fallback')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 8. SETTINGS, REMINDERS, EXPORTS & AUDIT
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reminder_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    morning_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    morning_time TIME NOT NULL DEFAULT '08:00:00',
    evening_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    evening_time TIME NOT NULL DEFAULT '20:00:00',
    last_morning_sent_date DATE,
    last_evening_sent_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_reminder UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.report_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    format VARCHAR(10) NOT NULL CHECK (format IN ('pdf', 'xlsx')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    file_path TEXT NOT NULL,
    file_size INT DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'completed',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.idempotency_keys (
    key VARCHAR(255) PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    response_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL
);

-- ==============================================================================
-- 9. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON public.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON public.budgets(user_id, month_year);
CREATE INDEX IF NOT EXISTS idx_telegram_accounts_tg_id ON public.telegram_accounts(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user ON public.audit_logs(target_user_id);

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_link_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Helper function: Is user admin or superadmin?
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = p_user_id AND role IN ('admin', 'superadmin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users view/update their own profile. Admins can view all profiles.
CREATE POLICY profiles_user_policy ON public.profiles
    FOR ALL
    USING (auth.uid() = id OR public.is_admin(auth.uid()))
    WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));

-- User roles: Only admins can manage roles. Users can view their own roles.
CREATE POLICY user_roles_read_policy ON public.user_roles
    FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY user_roles_admin_policy ON public.user_roles
    FOR ALL
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- Wallets: Only owner can access and manage
CREATE POLICY wallets_owner_policy ON public.wallets
    FOR ALL
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
    WITH CHECK (auth.uid() = user_id);

-- Categories: Read if system category OR owned by user
CREATE POLICY categories_read_policy ON public.categories
    FOR SELECT
    USING (is_system = TRUE OR auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY categories_write_policy ON public.categories
    FOR INSERT
    WITH CHECK (auth.uid() = user_id AND is_system = FALSE);

CREATE POLICY categories_update_delete_policy ON public.categories
    FOR ALL
    USING ((auth.uid() = user_id AND is_system = FALSE) OR public.is_admin(auth.uid()))
    WITH CHECK ((auth.uid() = user_id AND is_system = FALSE) OR public.is_admin(auth.uid()));

-- Budgets: Only owner
CREATE POLICY budgets_owner_policy ON public.budgets
    FOR ALL
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
    WITH CHECK (auth.uid() = user_id);

-- Transactions: Only owner
CREATE POLICY transactions_owner_policy ON public.transactions
    FOR ALL
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
    WITH CHECK (auth.uid() = user_id);

-- Transaction Items: Via parent transaction ownership
CREATE POLICY transaction_items_owner_policy ON public.transaction_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.transactions t
            WHERE t.id = transaction_id AND (t.user_id = auth.uid() OR public.is_admin(auth.uid()))
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.transactions t
            WHERE t.id = transaction_id AND t.user_id = auth.uid()
        )
    );

-- Telegram Accounts & Link Codes
CREATE POLICY telegram_accounts_owner_policy ON public.telegram_accounts
    FOR ALL
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY telegram_link_codes_owner_policy ON public.telegram_link_codes
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Telegram Updates: Only service role / admin
CREATE POLICY telegram_updates_admin_policy ON public.telegram_updates
    FOR ALL
    USING (public.is_admin(auth.uid()));

-- Subscription Plans: Public read for active plans
CREATE POLICY subscription_plans_read_policy ON public.subscription_plans
    FOR SELECT
    USING (is_active = TRUE OR public.is_admin(auth.uid()));

CREATE POLICY subscription_plans_admin_policy ON public.subscription_plans
    FOR ALL
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- User Subscriptions: User reads own, Admin manages
CREATE POLICY user_subscriptions_read_policy ON public.user_subscriptions
    FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY user_subscriptions_admin_policy ON public.user_subscriptions
    FOR ALL
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- Payments: User reads own, Admin manages all
CREATE POLICY payments_user_policy ON public.payments
    FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY payments_insert_policy ON public.payments
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY payments_admin_update ON public.payments
    FOR UPDATE
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- AI Providers: Only Admins can view/edit
CREATE POLICY ai_providers_admin_policy ON public.ai_providers
    FOR ALL
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- AI Usage Logs: User sees own logs, Admin sees all
CREATE POLICY ai_usage_logs_policy ON public.ai_usage_logs
    FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Reminders & Exports: Owner only
CREATE POLICY reminder_settings_owner_policy ON public.reminder_settings
    FOR ALL
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY report_exports_owner_policy ON public.report_exports
    FOR ALL
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
    WITH CHECK (auth.uid() = user_id);

-- Audit logs: Read only by Admins, users cannot modify
CREATE POLICY audit_logs_admin_read ON public.audit_logs
    FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY audit_logs_insert ON public.audit_logs
    FOR INSERT
    WITH CHECK (TRUE);

-- ==============================================================================
-- 11. ATOMIC FINANCIAL STORED PROCEDURES (LEDGER INTEGRITY)
-- ==============================================================================

-- Stored Procedure: Atomic Inter-Wallet Transfer
CREATE OR REPLACE FUNCTION public.transfer_wallet_balance(
    p_user_id UUID,
    p_from_wallet_id UUID,
    p_to_wallet_id UUID,
    p_amount NUMERIC(15, 2),
    p_notes TEXT DEFAULT NULL,
    p_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
)
RETURNS JSONB AS $$
DECLARE
    v_from_balance NUMERIC(15, 2);
    v_to_balance NUMERIC(15, 2);
    v_from_name TEXT;
    v_to_name TEXT;
    v_transfer_pair_id UUID := gen_random_uuid();
    v_tx_out_id UUID;
    v_tx_in_id UUID;
BEGIN
    IF p_from_wallet_id = p_to_wallet_id THEN
        RAISE EXCEPTION 'Wallet sumber dan tujuan tidak boleh sama.';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Nominal transfer harus lebih besar dari 0.';
    END IF;

    -- Lock both wallets with SELECT FOR UPDATE to prevent race conditions
    SELECT balance, name INTO v_from_balance, v_from_name
    FROM public.wallets
    WHERE id = p_from_wallet_id AND user_id = p_user_id AND is_archived = FALSE
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet sumber tidak ditemukan atau telah diarsipkan.';
    END IF;

    SELECT balance, name INTO v_to_balance, v_to_name
    FROM public.wallets
    WHERE id = p_to_wallet_id AND user_id = p_user_id AND is_archived = FALSE
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet tujuan tidak ditemukan atau telah diarsipkan.';
    END IF;

    -- Atomic balance updates
    UPDATE public.wallets
    SET balance = balance - p_amount, updated_at = timezone('utc'::text, now())
    WHERE id = p_from_wallet_id;

    UPDATE public.wallets
    SET balance = balance + p_amount, updated_at = timezone('utc'::text, now())
    WHERE id = p_to_wallet_id;

    -- Record outgoing transaction
    INSERT INTO public.transactions (
        user_id, wallet_id, type, amount, date, notes, source, transfer_to_wallet_id, transfer_pair_id
    ) VALUES (
        p_user_id, p_from_wallet_id, 'transfer', p_amount, p_date,
        COALESCE(p_notes, 'Transfer ke ' || v_to_name), 'web', p_to_wallet_id, v_transfer_pair_id
    ) RETURNING id INTO v_tx_out_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'transfer_pair_id', v_transfer_pair_id,
        'from_wallet_name', v_from_name,
        'to_wallet_name', v_to_name,
        'amount', p_amount,
        'new_from_balance', v_from_balance - p_amount,
        'new_to_balance', v_to_balance + p_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Stored Procedure: Atomic Transaction Recording with Wallet Balance Update
CREATE OR REPLACE FUNCTION public.record_transaction_atomic(
    p_user_id UUID,
    p_wallet_id UUID,
    p_category_id UUID,
    p_type VARCHAR(20),
    p_amount NUMERIC(15, 2),
    p_date TIMESTAMPTZ,
    p_notes TEXT,
    p_source VARCHAR(30),
    p_receipt_image_url TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    v_wallet_balance NUMERIC(15, 2);
    v_new_balance NUMERIC(15, 2);
    v_tx_id UUID;
    v_user_plan_code VARCHAR(30);
    v_monthly_tx_count INT;
    v_max_monthly_tx INT;
    v_month_start TIMESTAMPTZ;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Nominal transaksi harus lebih besar dari 0.';
    END IF;

    IF p_type NOT IN ('income', 'expense') THEN
        RAISE EXCEPTION 'Tipe transaksi tidak valid. Gunakan income atau expense.';
    END IF;

    -- Check Subscription Limits for Current Month
    SELECT p.code, p.max_monthly_transactions INTO v_user_plan_code, v_max_monthly_tx
    FROM public.user_subscriptions us
    JOIN public.subscription_plans p ON p.id = us.plan_id
    WHERE us.user_id = p_user_id AND us.status = 'active';

    IF NOT FOUND THEN
        -- Default to Starter limit if no active subscription record
        v_user_plan_code := 'starter';
        v_max_monthly_tx := 50;
    END IF;

    IF v_max_monthly_tx > 0 THEN
        v_month_start := date_trunc('month', p_date);
        SELECT COUNT(*) INTO v_monthly_tx_count
        FROM public.transactions
        WHERE user_id = p_user_id AND date >= v_month_start AND date < v_month_start + INTERVAL '1 month';

        IF v_monthly_tx_count >= v_max_monthly_tx THEN
            RAISE EXCEPTION 'Batas transaksi bulanan paket Anda (% transaksi) telah tercapai. Upgrade ke Pro untuk transaksi unlimited.', v_max_monthly_tx;
        END IF;
    END IF;

    -- Lock target wallet row
    SELECT balance INTO v_wallet_balance
    FROM public.wallets
    WHERE id = p_wallet_id AND user_id = p_user_id AND is_archived = FALSE
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet tidak ditemukan atau telah diarsipkan.';
    END IF;

    IF p_type = 'income' THEN
        v_new_balance := v_wallet_balance + p_amount;
    ELSE
        v_new_balance := v_wallet_balance - p_amount;
    END IF;

    -- Update wallet balance
    UPDATE public.wallets
    SET balance = v_new_balance, updated_at = timezone('utc'::text, now())
    WHERE id = p_wallet_id;

    -- Insert transaction
    INSERT INTO public.transactions (
        user_id, wallet_id, category_id, type, amount, date, notes, source, receipt_image_url, metadata
    ) VALUES (
        p_user_id, p_wallet_id, p_category_id, p_type, p_amount, p_date, p_notes, p_source, p_receipt_image_url, p_metadata
    ) RETURNING id INTO v_tx_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'transaction_id', v_tx_id,
        'previous_balance', v_wallet_balance,
        'new_balance', v_new_balance,
        'type', p_type,
        'amount', p_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Stored Procedure: Safely Delete Transaction & Revert Balance
CREATE OR REPLACE FUNCTION public.delete_transaction_atomic(
    p_user_id UUID,
    p_transaction_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_tx RECORD;
    v_wallet_balance NUMERIC(15, 2);
    v_reverted_balance NUMERIC(15, 2);
BEGIN
    SELECT * INTO v_tx
    FROM public.transactions
    WHERE id = p_transaction_id AND (user_id = p_user_id OR public.is_admin(p_user_id));

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transaksi tidak ditemukan.';
    END IF;

    IF v_tx.type = 'transfer' THEN
        RAISE EXCEPTION 'Transaksi transfer tidak dapat dihapus secara langsung dari satu sisi.';
    END IF;

    -- Lock wallet
    SELECT balance INTO v_wallet_balance
    FROM public.wallets
    WHERE id = v_tx.wallet_id
    FOR UPDATE;

    -- Revert balance
    IF v_tx.type = 'income' THEN
        v_reverted_balance := v_wallet_balance - v_tx.amount;
    ELSE
        v_reverted_balance := v_wallet_balance + v_tx.amount;
    END IF;

    UPDATE public.wallets
    SET balance = v_reverted_balance, updated_at = timezone('utc'::text, now())
    WHERE id = v_tx.wallet_id;

    DELETE FROM public.transactions WHERE id = p_transaction_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'deleted_transaction_id', p_transaction_id,
        'reverted_wallet_balance', v_reverted_balance
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 12. AUTOMATIC USER PROVISIONING TRIGGER (AUTH.USERS HOOK)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_phone TEXT;
    v_starter_plan_id UUID;
BEGIN
    v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
    v_phone := new.raw_user_meta_data->>'phone_number';

    -- 1. Create Profile
    INSERT INTO public.profiles (
        id, email, full_name, avatar_url, phone_number, currency, onboarding_completed
    ) VALUES (
        new.id,
        new.email,
        v_full_name,
        new.raw_user_meta_data->>'avatar_url',
        v_phone,
        'IDR',
        FALSE
    ) ON CONFLICT (id) DO NOTHING;

    -- 2. Assign Default Role (user)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- 3. Assign Default Starter Plan
    SELECT id INTO v_starter_plan_id FROM public.subscription_plans WHERE code = 'starter' LIMIT 1;
    IF v_starter_plan_id IS NOT NULL THEN
        INSERT INTO public.user_subscriptions (user_id, plan_id, status)
        VALUES (new.id, v_starter_plan_id, 'active')
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    -- 4. Create Initial Default Wallet
    INSERT INTO public.wallets (
        user_id, name, type, balance, is_default, color, icon
    ) VALUES (
        new.id, 'Dompet Utama', 'cash', 0.00, TRUE, '#F97316', 'wallet'
    ) ON CONFLICT DO NOTHING;

    -- 5. Initialize Reminder Settings
    INSERT INTO public.reminder_settings (user_id)
    VALUES (new.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 13. SYSTEM INITIAL SEED DATA
-- ==============================================================================

-- 1. Subscription Plans (Starter & Pro)
INSERT INTO public.subscription_plans (id, code, name, price, billing_type, max_monthly_transactions, max_wallets, max_budgets, has_receipt_ocr, has_ai_advisor, has_exports, is_active)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'starter', 'Starter', 49000.00, 'monthly', 50, 3, 5, FALSE, FALSE, FALSE, TRUE),
    ('a0000000-0000-0000-0000-000000000002', 'pro', 'Pro (Sekali Bayar)', 99000.00, 'lifetime', -1, -1, -1, TRUE, TRUE, TRUE, TRUE)
ON CONFLICT (code) DO UPDATE SET
    price = EXCLUDED.price,
    billing_type = EXCLUDED.billing_type,
    max_monthly_transactions = EXCLUDED.max_monthly_transactions,
    max_wallets = EXCLUDED.max_wallets,
    max_budgets = EXCLUDED.max_budgets,
    has_receipt_ocr = EXCLUDED.has_receipt_ocr,
    has_ai_advisor = EXCLUDED.has_ai_advisor,
    has_exports = EXCLUDED.has_exports;

-- 2. System Preset Categories (Indonesian Financial Habits)
INSERT INTO public.categories (id, user_id, name, type, icon, color, is_system)
VALUES
    ('c0000000-0000-0000-0000-000000000001', NULL, 'Makanan & Minuman', 'expense', 'Utensils', '#F97316', TRUE),
    ('c0000000-0000-0000-0000-000000000002', NULL, 'Transportasi', 'expense', 'Car', '#3B82F6', TRUE),
    ('c0000000-0000-0000-0000-000000000003', NULL, 'Tagihan & Utilitas', 'expense', 'Receipt', '#EF4444', TRUE),
    ('c0000000-0000-0000-0000-000000000004', NULL, 'Hiburan & Liburan', 'expense', 'Film', '#EC4899', TRUE),
    ('c0000000-0000-0000-0000-000000000005', NULL, 'Belanja Harian', 'expense', 'ShoppingBag', '#8B5CF6', TRUE),
    ('c0000000-0000-0000-0000-000000000006', NULL, 'Kesehatan & Obat', 'expense', 'HeartPulse', '#10B981', TRUE),
    ('c0000000-0000-0000-0000-000000000007', NULL, 'Pendidikan & Kursus', 'expense', 'GraduationCap', '#F59E0B', TRUE),
    ('c0000000-0000-0000-0000-000000000008', NULL, 'Gaji Pokok', 'income', 'Briefcase', '#10B981', TRUE),
    ('c0000000-0000-0000-0000-000000000009', NULL, 'Freelance & Side Job', 'income', 'Laptop', '#06B6D4', TRUE),
    ('c0000000-0000-0000-0000-000000000010', NULL, 'Investasi & Bunga', 'income', 'TrendingUp', '#6366F1', TRUE)
ON CONFLICT DO NOTHING;

-- 3. AI Providers Registry (Configurable via Admin Console)
INSERT INTO public.ai_providers (id, name, display_name, model_name, is_active, priority, config)
VALUES
    ('e0000000-0000-0000-0000-000000000001', 'gemini', 'Google Gemini 1.5 Flash', 'gemini-1.5-flash', TRUE, 1, '{"temperature": 0.1, "max_tokens": 1024}'::jsonb),
    ('e0000000-0000-0000-0000-000000000002', 'openai', 'OpenAI GPT-4o mini', 'gpt-4o-mini', TRUE, 2, '{"temperature": 0.1, "max_tokens": 1024}'::jsonb),
    ('e0000000-0000-0000-0000-000000000003', 'deepseek', 'DeepSeek Chat V3', 'deepseek-chat', FALSE, 3, '{"temperature": 0.1, "max_tokens": 1024}'::jsonb)
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    model_name = EXCLUDED.model_name,
    priority = EXCLUDED.priority,
    config = EXCLUDED.config;

