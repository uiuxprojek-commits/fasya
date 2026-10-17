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

    // Clean up old unused codes for this user
    await supabase
      .from('telegram_link_codes')
      .delete()
      .eq('user_id', user.id)
      .is('used_at', null);

    // Generate random 6-digit code, e.g. TD-839201
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const code = `TD-${randomDigits}`;

    // Code expires in exactly 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('telegram_link_codes')
      .insert({
        user_id: user.id,
        code,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'TataDanaApp2026Bot';

    return NextResponse.json({
      success: true,
      code,
      expiresAt,
      botUsername,
      directUrl: `https://t.me/${botUsername}?start=${code}`,
    });
  } catch (err) {
    console.error('[Link Code API] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
