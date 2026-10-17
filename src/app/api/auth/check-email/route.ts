import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body?.email;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: 'Format email tidak valid.' },
        { status: 400 }
      );
    }

    let isRegistered = false;

    // 1. Coba periksa via RPC function check_email_exists (jika sudah di-deploy)
    try {
      const supabase = await createClient();
      const { data: rpcExists, error: rpcError } = await supabase.rpc('check_email_exists', {
        lookup_email: cleanEmail,
      });

      if (!rpcError && typeof rpcExists === 'boolean') {
        isRegistered = rpcExists;
      }
    } catch {
      // Abaikan jika RPC belum di-execute di database, lanjut ke fallback
    }

    // 2. Jika RPC belum menentukan (false atau gagal), periksa via tabel profiles
    if (!isRegistered) {
      try {
        const adminClient = createAdminClient();
        const { data: profile } = await adminClient
          .from('profiles')
          .select('id, email, onboarding_completed')
          .ilike('email', cleanEmail)
          .eq('onboarding_completed', true)
          .maybeSingle();

        if (profile) {
          isRegistered = true;
        }
      } catch {
        // Fallback jika tidak ada admin access
      }
    }

    return NextResponse.json({
      exists: isRegistered,
      message: isRegistered
        ? 'Email sudah terdaftar. Silakan masuk ke akun Anda.'
        : 'Email tersedia untuk pendaftaran.',
    });
  } catch (err: unknown) {
    console.error('Error in /api/auth/check-email:', err);
    return NextResponse.json(
      { error: 'Gagal memeriksa status email. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
