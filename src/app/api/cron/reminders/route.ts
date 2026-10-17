import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { telegramBot } from '@/lib/telegram/bot';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Verify CRON_SECRET to protect scheduler endpoint
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization') || '';
    const incomingSecret = authHeader.replace(/^Bearer\s+/i, '') || request.nextUrl.searchParams.get('secret');

    if (cronSecret && incomingSecret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized cron trigger' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Current time in Asia/Jakarta (WIB)
    const nowWIB = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })
    );
    const currentHour = nowWIB.getHours();
    const todayDateStr = nowWIB.toISOString().split('T')[0];

    // Morning reminders (typically 08:00 WIB, window 07-09)
    const isMorning = currentHour >= 7 && currentHour <= 10;
    // Evening reminders (typically 20:00 WIB, window 19-22)
    const isEvening = currentHour >= 19 && currentHour <= 22;

    const { data: reminders, error } = await supabase
      .from('reminder_settings')
      .select('*, telegram_accounts!inner(telegram_user_id, is_active)')
      .eq('is_enabled', true)
      .eq('telegram_accounts.is_active', true);

    if (error || !reminders) {
      return NextResponse.json({ processed: 0, message: 'No active reminders found' });
    }

    let sentCount = 0;

    for (const r of reminders) {
      const tgUserId = r.telegram_accounts?.telegram_user_id;
      if (!tgUserId) continue;

      if (isMorning && r.morning_enabled && r.last_morning_sent_date !== todayDateStr) {
        await telegramBot.sendMessage({
          chat_id: tgUserId,
          text: `🌅 *Selamat Pagi!*\n\nAwali hari dengan keuangan yang tertata. Jangan lupa catat sarapan, ongkos, atau kopi pagimu di TataDana ya!\n\n_Ketik langsung pengeluaranmu di sini._`,
          parse_mode: 'Markdown',
        });

        await supabase
          .from('reminder_settings')
          .update({ last_morning_sent_date: todayDateStr })
          .eq('id', r.id);

        sentCount++;
      } else if (isEvening && r.evening_enabled && r.last_evening_sent_date !== todayDateStr) {
        await telegramBot.sendMessage({
          chat_id: tgUserId,
          text: `🌙 *Evaluasi Keuangan Malam Ini*\n\nSudahkah kamu mencatat seluruh pengeluaran hari ini? Yuk luangkan 10 detik agar dompet dan budgetmu tetap aman!\n\n_Ketik rekap pengeluaran atau ketik /hari_ini untuk melihat total belanja._`,
          parse_mode: 'Markdown',
        });

        await supabase
          .from('reminder_settings')
          .update({ last_evening_sent_date: todayDateStr })
          .eq('id', r.id);

        sentCount++;
      }
    }

    return NextResponse.json({
      success: true,
      timeZone: 'Asia/Jakarta',
      currentHour,
      sentCount,
    });
  } catch (error) {
    console.error('[Reminder Cron] Error running reminders:', error);
    return NextResponse.json({ error: 'Internal cron error' }, { status: 500 });
  }
}
