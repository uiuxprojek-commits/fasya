import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Sesi login tidak valid' }, { status: 401 });
    }

    const { data: tgAccount, error } = await supabase
      .from('telegram_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('[Telegram Status API] DB Error:', error);
    }

    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'TataDanaApp2026Bot';

    return NextResponse.json({
      connected: Boolean(tgAccount && tgAccount.is_active),
      account: tgAccount
        ? {
            telegram_user_id: tgAccount.telegram_user_id,
            telegram_username: tgAccount.telegram_username,
            first_name: tgAccount.first_name,
            last_name: tgAccount.last_name,
            linked_at: tgAccount.linked_at,
            is_active: tgAccount.is_active,
            notifications_enabled: tgAccount.notifications_enabled !== false,
          }
        : null,
      botUsername,
      botUrl: `https://t.me/${botUsername}`,
    });
  } catch (err) {
    console.error('[Telegram Status API] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
