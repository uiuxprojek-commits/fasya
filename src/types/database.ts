export type UserRoleType = 'user' | 'admin' | 'superadmin';
export type WalletType = 'cash' | 'bank' | 'ewallet';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionSource = 'web' | 'telegram_text' | 'telegram_voice' | 'receipt_photo';
export type SubscriptionPlanCode = 'starter' | 'pro';
export type BillingType = 'monthly' | 'lifetime';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';
export type PaymentStatus = 'pending' | 'settlement' | 'cancel' | 'expire' | 'failure' | 'manual_verification' | 'rejected';
export type PaymentType = 'midtrans' | 'manual_transfer';
export type AIProviderName = 'gemini' | 'openai' | 'deepseek';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  phone_number?: string | null;
  phone_verified_at?: string | null;
  currency: string;
  monthly_income_estimate?: number;
  financial_goal?: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: UserRoleType;
  assigned_at: string;
  assigned_by?: string | null;
}

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  type: WalletType;
  balance: number;
  is_default: boolean;
  is_archived: boolean;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id?: string | null;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  is_system: boolean;
  is_archived: boolean;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  monthly_amount: number;
  month_year: string;
  alert_80_sent: boolean;
  alert_100_sent: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  category_id?: string | null;
  type: TransactionType;
  amount: number;
  date: string;
  notes?: string | null;
  source: TransactionSource;
  receipt_image_url?: string | null;
  transfer_to_wallet_id?: string | null;
  transfer_pair_id?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  wallet?: Wallet;
  category?: Category;
  items?: TransactionItem[];
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  name: string;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  category_id?: string | null;
  created_at: string;
}

export interface TelegramAccount {
  id: string;
  user_id: string;
  telegram_user_id: number;
  telegram_username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  notifications_enabled?: boolean;
  is_active: boolean;
  linked_at: string;
}

export interface TelegramLinkCode {
  id: string;
  user_id: string;
  code: string;
  expires_at: string;
  used_at?: string | null;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  code: SubscriptionPlanCode;
  name: string;
  price: number;
  billing_type: BillingType;
  max_monthly_transactions: number;
  max_wallets: number;
  max_budgets: number;
  has_receipt_ocr: boolean;
  has_ai_advisor: boolean;
  has_exports: boolean;
  is_active: boolean;
  created_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  start_date: string;
  end_date?: string | null;
  payment_method?: string | null;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
}

export interface Payment {
  id: string;
  user_id: string;
  plan_id: string;
  order_id: string;
  amount: number;
  payment_type: PaymentType;
  status: PaymentStatus;
  midtrans_transaction_id?: string | null;
  midtrans_response?: Record<string, unknown> | null;
  proof_image_url?: string | null;
  admin_notes?: string | null;
  verified_by?: string | null;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
  user_profile?: Profile;
}

export interface AIProvider {
  id: string;
  name: AIProviderName;
  display_name: string;
  model_name: string;
  is_active: boolean;
  priority: number;
  encrypted_api_key?: string | null;
  key_iv?: string | null;
  key_tag?: string | null;
  config?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AIUsageLog {
  id: string;
  user_id?: string | null;
  provider_name: string;
  feature: string;
  input_tokens: number;
  output_tokens: number;
  estimated_cost_idr: number;
  status: 'success' | 'error' | 'fallback';
  error_message?: string | null;
  created_at: string;
}

export interface ReminderSetting {
  id: string;
  user_id: string;
  is_enabled: boolean;
  morning_enabled: boolean;
  morning_time: string;
  evening_enabled: boolean;
  evening_time: string;
  last_morning_sent_date?: string | null;
  last_evening_sent_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportExport {
  id: string;
  user_id: string;
  format: 'pdf' | 'xlsx';
  period_start: string;
  period_end: string;
  file_path: string;
  file_size: number;
  status: 'completed' | 'processing' | 'failed';
  expires_at: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string | null;
  target_user_id?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  details?: Record<string, unknown>;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}
