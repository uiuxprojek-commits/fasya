import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Sesi login tidak valid' }, { status: 401 });
    }

    // Set is_active = false or delete row so it can be re-linked
    const { error } = await supabase
      .from('telegram_accounts')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (error) {
      // In case updated_at doesn't exist, try updating is_active only
      const { error: fallbackErr } = await supabase
        .from('telegram_accounts')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (fallbackErr) {
        return NextResponse.json({ error: fallbackErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Koneksi Telegram berhasil diputuskan.',
    });
  } catch (err) {
    console.error('[Telegram Disconnect API] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
