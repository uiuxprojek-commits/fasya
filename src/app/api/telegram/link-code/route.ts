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

    // Generate random 6-character alphanumeric code, e.g. TD-9281
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const code = `TD-${randomDigits}`;

    // Code expires in 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

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

    return NextResponse.json({
      success: true,
      code,
      expiresAt,
      botUsername: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'TataDanaBot',
    });
  } catch (err) {
    console.error('[Link Code API] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
