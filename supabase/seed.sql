-- ==============================================================================
-- TATADANA FINTECH SAAS — SEED DATA FOR DEVELOPMENT & SYSTEM PRESETS
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
