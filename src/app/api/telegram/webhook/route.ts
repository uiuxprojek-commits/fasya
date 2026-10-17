import { NextRequest, NextResponse } from 'next/server';
import { handleTelegramUpdate } from '@/lib/telegram/handler';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Telegram secret token header if configured
    const configuredSecret = process.env.TELEGRAM_BOT_SECRET_TOKEN;
    if (configuredSecret && configuredSecret.trim() !== '') {
      const headerSecret = request.headers.get('x-telegram-bot-api-secret-token');
      if (headerSecret !== configuredSecret) {
        console.warn('[Telegram Webhook] Unauthorized request: secret token mismatch');
        return NextResponse.json({ error: 'Unauthorized secret token' }, { status: 401 });
      }
    }

    const body = await request.json();

    if (!body || !body.update_id) {
      return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 });
    }

    // 2. Process Telegram Update asynchronously/synchronously
    const result = await handleTelegramUpdate(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Telegram Webhook] Error processing update:', error);
    // Telegram will retry if non-200 is returned, return 200 with error log
    return NextResponse.json({ ok: false, error: 'Internal handler error' }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'TataDana Telegram Webhook Endpoint',
    status: 'active',
    instructions: 'Gunakan metode POST dari Telegram Bot API dengan header X-Telegram-Bot-Api-Secret-Token.',
  });
}
