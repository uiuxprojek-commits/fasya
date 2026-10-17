import { createClient } from '@supabase/supabase-js';

// Server-side only Supabase client with Service Role privileges
export function createAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Konfigurasi SUPABASE_URL belum tersedia di environment variable.');
  }

  const fallbackKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const finalKey =
    serviceRoleKey && serviceRoleKey.trim() !== '' && !serviceRoleKey.includes('dummy')
      ? serviceRoleKey
      : fallbackKey;

  if (!serviceRoleKey || serviceRoleKey.includes('dummy')) {
    console.warn(
      '[Supabase Admin] SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi. Menggunakan fallback anon key.'
    );
  }

  return createClient(supabaseUrl, finalKey || 'dummy-service-key', {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
