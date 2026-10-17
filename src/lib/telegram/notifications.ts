import { telegramBot } from './bot';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatRupiah } from '@/lib/utils';

export interface SendTransactionNotificationParams {
  userId: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  categoryName?: string;
  notes?: string;
  walletName?: string;
  transactionId?: string;
}

/**
 * Send real-time notification to user's connected Telegram when a transaction is recorded.
 * Failures are logged and silently handled to prevent blocking transaction creation.
 */
export async function sendTransactionNotification(
  params: SendTransactionNotificationParams
): Promise<boolean> {
  try {
    if (!telegramBot.isConfigured()) {
      return false;
    }

    const supabase = createAdminClient();

    // Find active telegram account for this specific user only
    const { data: tgAccount, error } = await supabase
      .from('telegram_accounts')
      .select('telegram_user_id, is_active, notifications_enabled')
      .eq('user_id', params.userId)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !tgAccount || !tgAccount.is_active || tgAccount.notifications_enabled === false) {
      return false;
    }

    const jenisLabel =
      params.type === 'expense'
        ? 'Pengeluaran'
        : params.type === 'income'
        ? 'Pemasukan'
        : 'Transfer';

    const text = `🔔 *Transaksi Baru — TataDana*\n\nJenis: ${jenisLabel}\nKategori: ${
      params.categoryName || '-'
    }\nJumlah: *${formatRupiah(params.amount)}*\nCatatan: ${params.notes || '-'}${
      params.walletName ? `\nDompet: 👛 ${params.walletName}` : ''
    }`;

    const res = await telegramBot.sendMessage({
      chat_id: tgAccount.telegram_user_id,
      text,
      parse_mode: 'Markdown',
    });

    return Boolean(res.ok);
  } catch (err) {
    console.error('[Telegram Notification] Non-blocking delivery error:', err);
    return false;
  }
}
