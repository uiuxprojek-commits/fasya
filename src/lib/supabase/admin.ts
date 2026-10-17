import { createClient } from '@supabase/supabase-js';

// Server-side only Supabase client with Service Role privileges
export function createAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Konfigurasi SUPABASE_URL belum tersedia di environment variable.');
  }

  if (!serviceRoleKey || serviceRoleKey.includes('dummy')) {
    // Log helpful diagnostic without throwing in build/mock stages
    console.warn('[Supabase Admin] SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi dengan key produksi asli.');
  }

  return createClient(supabaseUrl, serviceRoleKey || 'dummy-service-key', {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
