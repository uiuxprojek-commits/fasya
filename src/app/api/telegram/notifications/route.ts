import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Sesi login tidak valid' }, { status: 401 });
    }

    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Parameter "enabled" wajib berupa boolean (true/false)' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('telegram_accounts')
      .update({ notifications_enabled: enabled })
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      notifications_enabled: enabled,
      message: `Notifikasi Telegram berhasil ${enabled ? 'diaktifkan' : 'dinonaktifkan'}.`,
    });
  } catch (err) {
    console.error('[Telegram Notifications API] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
