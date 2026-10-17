import { telegramBot } from './bot';
import {
  formatExpenseReply,
  formatIncomeReply,
  formatTransferReply,
  formatHelpMessage,
  formatConnectGuideMessage,
  formatTransactionsList,
  formatBudgetList,
  formatReportReply,
  formatStatusReply,
} from './formatter';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  parseTransactionWithFailover,
  parseReceiptWithFailover,
  transcribeVoiceNote,
} from '@/lib/ai/router';
import { formatRupiah, formatDateWIB } from '@/lib/utils';

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
    caption?: string;
    voice?: {
      file_id: string;
      duration: number;
      mime_type?: string;
      file_size?: number;
    };
    photo?: Array<{
      file_id: string;
      width: number;
      height: number;
      file_size?: number;
    }>;
  };
}

export async function handleTelegramUpdate(update: TelegramUpdate) {
  const message = update.message;
  if (!message || !message.from) {
    return { ok: true, ignored: true };
  }

  const chatId = message.chat.id;
  const telegramUserId = message.from.id;
  const text = (message.text || message.caption || '').trim();

  const supabase = createAdminClient();

  // 1. Idempotency Check in DB
  try {
    const { error: insertUpdateError } = await supabase.from('telegram_updates').insert({
      update_id: update.update_id,
      telegram_user_id: telegramUserId,
      chat_id: chatId,
      payload: update,
      status: 'pending',
    });

    if (insertUpdateError && insertUpdateError.code === '23505') {
      // 23505 = unique_violation, update already processed
      return { ok: true, duplicate: true };
    }
  } catch (err) {
    console.warn('[TelegramHandler] Idempotency record error:', err);
  }

  // 2. Check Linking Status
  const { data: tgAccount } = await supabase
    .from('telegram_accounts')
    .select('*, profiles:user_id(*)')
    .eq('telegram_user_id', telegramUserId)
    .eq('is_active', true)
    .maybeSingle();

  // Parse Command & Arguments
  const parts = text.split(/\s+/);
  const rawCommand = parts[0] || '';
  const cleanCmd = rawCommand.split('@')[0].toLowerCase();
  const args = parts.slice(1).join(' ').trim();

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'TataDanaApp2026Bot';

  // 3. Handle Linking Flow (/start <code> or /link <code>)
  const isStartWithCode = (cleanCmd === '/start' || cleanCmd === '/link') && args.length > 0;

  if (isStartWithCode) {
    const code = args.toUpperCase();

    // Check code in telegram_link_codes (single-use, max 10 min expiry)
    const { data: linkCodeRecord, error: codeErr } = await supabase
      .from('telegram_link_codes')
      .select('*')
      .eq('code', code)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (codeErr || !linkCodeRecord) {
      await telegramBot.sendMessage({
        chat_id: chatId,
        text: '❌ Kode tautan tidak valid atau sudah kedaluwarsa (berlaku 10 menit).\n\nSilakan generate kode baru melalui menu Pengaturan -> Telegram Bot di dashboard web TataDana.',
      });
      return { ok: true };
    }

    // Link telegram account to user
    const { error: linkError } = await supabase.from('telegram_accounts').upsert(
      {
        user_id: linkCodeRecord.user_id,
        telegram_user_id: telegramUserId,
        telegram_username: message.from.username || null,
        first_name: message.from.first_name,
        last_name: message.from.last_name || null,
        notifications_enabled: true,
        is_active: true,
        linked_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (linkError) {
      console.error('[Telegram] Error linking account:', linkError);
      await telegramBot.sendMessage({
        chat_id: chatId,
        text: 'Terjadi kesalahan sistem saat menautkan akun. Coba lagi dalam beberapa saat.',
      });
      return { ok: false };
    }

    // Mark link code as used (single-use enforcement)
    await supabase
      .from('telegram_link_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', linkCodeRecord.id);

    await telegramBot.sendMessage({
      chat_id: chatId,
      text: `🎉 *Selamat, Akun TataDana Berhasil Terhubung!*\n\nHalo ${message.from.first_name}, sekarang Anda bisa memantau saldo, anggaran, tagihan, dan mencatat transaksi langsung dari chat ini.\n\nCoba ketik sekarang:\n👉 \`/saldo\` — Cek saldo seluruh dompet\n👉 \`/anggaran\` — Pantau limit anggaran\n👉 \`/laporan\` — Rekap keuangan bulan ini\n👉 \`beli kopi 28rb pakai gopay\`\n\nKetik /help untuk panduan perintah lengkap.`,
      parse_mode: 'Markdown',
    });

    return { ok: true, linked: true };
  }

  // 4. Handle Public / Unauthenticated Commands
  if (cleanCmd === '/help' || cleanCmd === '/bantuan') {
    await telegramBot.sendMessage({
      chat_id: chatId,
      text: formatHelpMessage(),
      parse_mode: 'Markdown',
    });
    return { ok: true };
  }

  if (cleanCmd === '/hubungkan') {
    await telegramBot.sendMessage({
      chat_id: chatId,
      text: formatConnectGuideMessage(botUsername),
      parse_mode: 'Markdown',
    });
    return { ok: true };
  }

  if (cleanCmd === '/start' && !args) {
    if (tgAccount) {
      await telegramBot.sendMessage({
        chat_id: chatId,
        text: `👋 *Halo ${message.from.first_name}!*\n\nAkun Telegram Anda sudah terhubung dengan akun TataDana.\n\nKetik /help untuk melihat daftar perintah yang tersedia, atau langsung ketik transaksi Anda (contoh: \`kopi kenangan 28rb bayar pakai gopay\`).`,
        parse_mode: 'Markdown',
      });
    } else {
      await telegramBot.sendMessage({
        chat_id: chatId,
        text: `👋 *Selamat Datang di TataDana Assistant!*\n\nKelola keuangan pribadi Anda semudah mengirim chat di Telegram.\n\nAkun Telegram Anda saat ini *belum terhubung* dengan akun TataDana.\n\nKetik /hubungkan untuk melihat panduan mudah menghubungkan akun Anda!`,
        parse_mode: 'Markdown',
      });
    }
    return { ok: true };
  }

  // 5. Enforce Authentication for Financial Commands
  if (!tgAccount) {
    await telegramBot.sendMessage({
      chat_id: chatId,
      text: `🔒 *Akses Dibatasi*\n\nHalo ${message.from.first_name}! Akun Telegram kamu belum terhubung dengan akun TataDana.\n\nUntuk melindungi keamanan dan privasi data finansial, kamu harus menghubungkan akun terlebih dahulu.\n\nKetik /hubungkan untuk panduan koneksi.`,
      parse_mode: 'Markdown',
    });
    return { ok: true };
  }

  const userId = tgAccount.user_id;

  // 6. Authenticated User Financial Commands

  // /saldo — Ringkasan saldo aktual
  if (cleanCmd === '/saldo') {
    const { data: wallets } = await supabase
      .from('wallets')
      .select('name, balance, type')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('is_default', { ascending: false });

    if (!wallets || wallets.length === 0) {
      await telegramBot.sendMessage({
        chat_id: chatId,
        text: '👛 Anda belum memiliki dompet aktif. Tambahkan dompet baru di dashboard web TataDana.',
      });
      return { ok: true };
    }

    const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
    let reply = `👛 *Daftar Saldo Dompet TataDana*\n\n`;
    wallets.forEach((w) => {
      reply += `• ${w.name}: *${formatRupiah(w.balance)}*\n`;
    });
    reply += `\n━━━━━━━━━━━━━━━\n💰 *Total Saldo: ${formatRupiah(totalBalance)}*`;

    await telegramBot.sendMessage({
      chat_id: chatId,
      text: reply,
      parse_mode: 'Markdown',
    });
    return { ok: true };
  }

  // /transaksi — 5 Transaksi terbaru
  if (cleanCmd === '/transaksi') {
    const { data: txList } = await supabase
      .from('transactions')
      .select('id, type, amount, date, notes, categories(name), wallets(name)')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(5);

    const formattedTx = (txList || []).map((t) => {
      const cat = t.categories as unknown as { name: string } | null;
      const w = t.wallets as unknown as { name: string } | null;
      return {
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        date: t.date,
        notes: t.notes,
        categoryName: cat?.name,
        walletName: w?.name,
      };
    });

    await telegramBot.sendMessage({
      chat_id: chatId,
      text: formatTransactionsList(formattedTx),
      parse_mode: 'Markdown',
    });
    return { ok: true };
  }

  // /anggaran & /budget — Ringkasan anggaran bulan ini
  if (cleanCmd === '/anggaran' || cleanCmd === '/budget') {
    const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
    const firstDayOfMonth = `${currentMonth}-01T00:00:00.000Z`;

    const { data: budgets } = await supabase
      .from('budgets')
      .select('monthly_amount, category_id, categories(name)')
      .eq('user_id', userId)
      .eq('month_year', currentMonth);

    if (!budgets || budgets.length === 0) {
      await telegramBot.sendMessage({
        chat_id: chatId,
        text: `📊 *Anggaran Bulanan (${currentMonth})*\n\nAnda belum menetapkan batas anggaran bulan ini. Tetapkan anggaran per kategori di dashboard web TataDana agar pengeluaran tetap terkontrol.`,
      });
      return { ok: true };
    }

    // Fetch this month's expenses to calculate spent per category
    const { data: txs } = await supabase
      .from('transactions')
      .select('category_id, amount')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', firstDayOfMonth);

    const spentMap: Record<string, number> = {};
    (txs || []).forEach((t) => {
      if (t.category_id) {
        spentMap[t.category_id] = (spentMap[t.category_id] || 0) + Number(t.amount);
      }
    });

    const budgetItems = budgets.map((b) => {
      const cat = b.categories as unknown as { name: string } | null;
      return {
        categoryName: cat?.name || 'Kategori',
        monthlyAmount: Number(b.monthly_amount),
        spentAmount: spentMap[b.category_id] || 0,
      };
    });

    await telegramBot.sendMessage({
      chat_id: chatId,
      text: formatBudgetList(budgetItems, currentMonth),
      parse_mode: 'Markdown',
    });
    return { ok: true };
  }

  // /tagihan — Daftar tagihan mendatang
  if (cleanCmd === '/tagihan') {
    await telegramBot.sendMessage({
      chat_id: chatId,
      text: `📋 *Daftar Tagihan Mendatang*\n\nSaat ini belum ada tagihan berkala aktif yang terdaftar. Anda dapat mengalokasikan pembayaran rutin (listrik, internet, sewa, asuransi) melalui fitur *Anggaran* (/anggaran) atau mencatatnya langsung saat pembayaran tiba di web TataDana.`,
      parse_mode: 'Markdown',
    });
    return { ok: true };
  }

  // /laporan & /bulan_ini — Ringkasan pemasukan dan pengeluaran bulan ini
  if (cleanCmd === '/laporan' || cleanCmd === '/bulan_ini' || cleanCmd === '/bulan ini') {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data: txs } = await supabase
      .from('transactions')
      .select('type, amount, category_id, categories(name)')
      .eq('user_id', userId)
      .gte('date', firstDayOfMonth);

    let incomeTotal = 0;
    let expenseTotal = 0;
    const catSpent: Record<string, { name: string; amount: number }> = {};

    (txs || []).forEach((t) => {
      const amt = Number(t.amount);
      if (t.type === 'income') {
        incomeTotal += amt;
      } else if (t.type === 'expense') {
        expenseTotal += amt;
        const cat = t.categories as unknown as { name: string } | null;
        const catName = cat?.name || 'Lainnya';
        if (!catSpent[catName]) {
          catSpent[catName] = { name: catName, amount: 0 };
        }
        catSpent[catName].amount += amt;
      }
    });

    const topCategories = Object.values(catSpent).sort((a, b) => b.amount - a.amount);

    await telegramBot.sendMessage({
      chat_id: chatId,
      text: formatReportReply({
        periodName: `Bulan ${currentMonth}`,
        incomeTotal,
        expenseTotal,
        topCategories,
      }),
      parse_mode: 'Markdown',
    });
    return { ok: true };
  }

  // /status — Status koneksi Telegram
  if (cleanCmd === '/status') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single();

    await telegramBot.sendMessage({
      chat_id: chatId,
      text: formatStatusReply({
        fullName: profile?.full_name || message.from.first_name,
        email: profile?.email || '-',
        telegramUserId: telegramUserId,
        telegramUsername: message.from.username,
        notificationsEnabled: tgAccount.notifications_enabled !== false,
        linkedAt: tgAccount.linked_at,
      }),
      parse_mode: 'Markdown',
    });
    return { ok: true };
  }

  // /hari_ini — Shortcut rekap hari ini
  if (cleanCmd === '/hari_ini' || cleanCmd === '/hari') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: txs } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', userId)
      .gte('date', today.toISOString());

    let incomeTotal = 0;
    let expenseTotal = 0;
    (txs || []).forEach((t) => {
      if (t.type === 'income') incomeTotal += Number(t.amount);
      if (t.type === 'expense') expenseTotal += Number(t.amount);
    });

    const net = incomeTotal - expenseTotal;
    const reply = `📅 *Rekap Keuangan Hari Ini* (${formatDateWIB(new Date(), 'short')})\n\n📈 Pemasukan: *${formatRupiah(incomeTotal)}*\n📉 Pengeluaran: *${formatRupiah(expenseTotal)}*\n━━━━━━━━━━━━━━━\n${net >= 0 ? '🟢 Net Surplus' : '🔴 Net Defisit'}: *${formatRupiah(net)}*`;

    await telegramBot.sendMessage({
      chat_id: chatId,
      text: reply,
      parse_mode: 'Markdown',
    });
    return { ok: true };
  }

  // /minggu_ini — Shortcut rekap 7 hari
  if (cleanCmd === '/minggu_ini') {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: txs } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', userId)
      .gte('date', sevenDaysAgo.toISOString());

    let expenseTotal = 0;
    let incomeTotal = 0;
    (txs || []).forEach((t) => {
      if (t.type === 'expense') expenseTotal += Number(t.amount);
      if (t.type === 'income') incomeTotal += Number(t.amount);
    });

    const reply = `📅 *Rekap 7 Hari Terakhir*\n\n📈 Pemasukan: *${formatRupiah(incomeTotal)}*\n📉 Pengeluaran: *${formatRupiah(expenseTotal)}*\nNet: *${formatRupiah(incomeTotal - expenseTotal)}*`;

    await telegramBot.sendMessage({
      chat_id: chatId,
      text: reply,
      parse_mode: 'Markdown',
    });
    return { ok: true };
  }

  // 7. Handle Photo / Receipt OCR (Pro Feature)
  if (message.photo && message.photo.length > 0) {
    const { data: sub } = await supabase
      .from('user_subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    const isPro = sub?.plan?.code === 'pro';

    if (!isPro) {
      await telegramBot.sendMessage({
        chat_id: chatId,
        text: `📸 *Fitur Foto Struk AI Tersedia Khusus Pro*\n\nAkun Anda saat ini berada di paket *Starter*. Di paket TataDana Pro, Anda bisa:\n\n✨ Pindai struk belanja otomatis dengan AI Vision\n✨ Ekstrak rincian item, pajak & total belanja\n✨ Laporan lengkap & export tanpa batas\n\nUpgrade sekarang di menu Pengaturan web TataDana!`,
        parse_mode: 'Markdown',
      });
      return { ok: true };
    }

    const bestPhoto = message.photo[message.photo.length - 1];
    const fileUrl = await telegramBot.getFile(bestPhoto.file_id);

    if (!fileUrl) {
      await telegramBot.sendMessage({
        chat_id: chatId,
        text: 'Gagal mengunduh gambar struk dari Telegram. Silakan coba kirim ulang.',
      });
      return { ok: false };
    }

    await telegramBot.sendMessage({
      chat_id: chatId,
      text: '🔍 Sedang memindai struk dengan AI Vision TataDana...',
    });

    const imgBuffer = await telegramBot.downloadFileAsBuffer(fileUrl);
    const base64Img = imgBuffer ? imgBuffer.toString('base64') : '';

    const { result: ocrResult } = await parseReceiptWithFailover(base64Img);

    const { data: defaultWallet } = await supabase
      .from('wallets')
      .select('id, name')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('is_default', { ascending: false })
      .limit(1)
      .single();

    if (!defaultWallet) {
      await telegramBot.sendMessage({
        chat_id: chatId,
        text: 'Belum ada dompet aktif untuk mencatat transaksi struk.',
      });
      return { ok: false };
    }

    const { data: recordRes, error: rpcErr } = await supabase.rpc('record_transaction_atomic', {
      p_user_id: userId,
      p_wallet_id: defaultWallet.id,
      p_category_id: null,
      p_type: 'expense',
      p_amount: ocrResult.totalAmount,
      p_date: new Date().toISOString(),
      p_notes: `Struk: ${ocrResult.merchantName}`,
      p_source: 'receipt_photo',
      p_receipt_image_url: fileUrl,
      p_metadata: { items_count: ocrResult.items.length },
    });

    if (rpcErr) {
      await telegramBot.sendMessage({
        chat_id: chatId,
        text: `Gagal mencatat transaksi struk: ${rpcErr.message}`,
      });
      return { ok: false };
    }

    if (ocrResult.items.length > 0 && recordRes?.transaction_id) {
      const itemsToInsert = ocrResult.items.map((item) => ({
        transaction_id: recordRes.transaction_id,
        name: item.name,
        quantity: item.quantity || 1,
        price_per_unit: item.pricePerUnit || item.totalPrice,
        total_price: item.totalPrice,
      }));
      await supabase.from('transaction_items').insert(itemsToInsert);
    }

    let itemsSummary = '';
    ocrResult.items.slice(0, 5).forEach((item) => {
      itemsSummary += `\n• ${item.name} (${item.quantity}x): ${formatRupiah(item.totalPrice)}`;
    });

    await telegramBot.sendMessage({
      chat_id: chatId,
      text: `🧾 *Struk Berhasil Tercatat!*\n\n🏪 Toko: *${ocrResult.merchantName}*\n💰 Total: *${formatRupiah(ocrResult.totalAmount)}*\n👛 Dompet: ${defaultWallet.name}\n\n*Rincian Item:*${itemsSummary}\n\nSaldomu telah diperbarui secara otomatis.`,
      parse_mode: 'Markdown',
    });

    return { ok: true };
  }

  // 8. Handle Voice Note (Speech-to-Text)
  let voiceTranscript = '';
  if (message.voice) {
    await telegramBot.sendMessage({
      chat_id: chatId,
      text: '🎙️ Sedang mendengarkan dan mentranskripsi pesan suaramu...',
    });

    const fileUrl = await telegramBot.getFile(message.voice.file_id);
    if (fileUrl) {
      const audioBuffer = await telegramBot.downloadFileAsBuffer(fileUrl);
      if (audioBuffer) {
        voiceTranscript = await transcribeVoiceNote(audioBuffer, 'voice.ogg');
      }
    }
  }

  // 9. Handle Natural Language Text Parsing
  const inputToParse = voiceTranscript || text;
  if (!inputToParse) {
    return { ok: true };
  }

  const { result: parsedTx } = await parseTransactionWithFailover(inputToParse);

  if (parsedTx.nominal <= 0 || parsedTx.confidence < 0.4) {
    await telegramBot.sendMessage({
      chat_id: chatId,
      text: '🤔 Maaf, rincian transaksi belum terbaca dengan jelas.\n\nContoh format yang bisa kamu kirim:\n• `beli bakso 25rb`\n• `gajian 5.5jt ke BCA`\n• `isi bensin 50k pakai GoPay`\n• `transfer 100rb dari BCA ke Mandiri`\n\nKetik /help untuk panduan lengkap.',
      parse_mode: 'Markdown',
    });
    return { ok: true };
  }

  // Get User's Wallets
  const { data: userWallets } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', false);

  if (!userWallets || userWallets.length === 0) {
    await telegramBot.sendMessage({
      chat_id: chatId,
      text: 'Anda belum memiliki dompet aktif. Silakan tambahkan dompet terlebih dahulu di dashboard web TataDana.',
    });
    return { ok: true };
  }

  // Match wallet or use default
  let selectedWallet = userWallets.find((w) => w.is_default) || userWallets[0];
  if (parsedTx.wallet_nama) {
    const matched = userWallets.find((w) =>
      w.name.toLowerCase().includes(parsedTx.wallet_nama!.toLowerCase())
    );
    if (matched) selectedWallet = matched;
  }

  // Handle Transfer
  if (parsedTx.jenis === 'transfer') {
    let toWallet = userWallets.find(
      (w) =>
        parsedTx.transfer_ke_wallet &&
        w.name.toLowerCase().includes(parsedTx.transfer_ke_wallet.toLowerCase())
    );

    if (!toWallet) {
      toWallet = userWallets.find((w) => w.id !== selectedWallet.id);
    }

    if (!toWallet || toWallet.id === selectedWallet.id) {
      await telegramBot.sendMessage({
        chat_id: chatId,
        text: 'Untuk transfer, Anda membutuhkan minimal dua dompet aktif yang berbeda.',
      });
      return { ok: true };
    }

    const { data: transferRes, error: transferErr } = await supabase.rpc('transfer_wallet_balance', {
      p_user_id: userId,
      p_from_wallet_id: selectedWallet.id,
      p_to_wallet_id: toWallet.id,
      p_amount: parsedTx.nominal,
      p_notes: parsedTx.catatan,
    });

    if (transferErr) {
      await telegramBot.sendMessage({
        chat_id: chatId,
        text: `❌ Transfer gagal: ${transferErr.message}`,
      });
      return { ok: false };
    }

    const replyMsg = formatTransferReply({
      date: new Date(),
      amount: parsedTx.nominal,
      fromWalletName: selectedWallet.name,
      toWalletName: toWallet.name,
      fromBalance: transferRes.new_from_balance,
      toBalance: transferRes.new_to_balance,
    });

    await telegramBot.sendMessage({
      chat_id: chatId,
      text: replyMsg,
      parse_mode: 'Markdown',
    });
    return { ok: true };
  }

  // Match Category
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .or(`user_id.eq.${userId},is_system.eq.true`)
    .eq('is_archived', false);

  const matchedCategory = (categories || []).find((c) =>
    c.name.toLowerCase().includes(parsedTx.kategori.toLowerCase())
  );

  // Record Transaction Atomically
  const { data: recordRes, error: rpcErr } = await supabase.rpc('record_transaction_atomic', {
    p_user_id: userId,
    p_wallet_id: selectedWallet.id,
    p_category_id: matchedCategory?.id || null,
    p_type: parsedTx.jenis === 'pemasukan' ? 'income' : 'expense',
    p_amount: parsedTx.nominal,
    p_date: new Date().toISOString(),
    p_notes: parsedTx.catatan,
    p_source: message.voice ? 'telegram_voice' : 'telegram_text',
  });

  if (rpcErr) {
    await telegramBot.sendMessage({
      chat_id: chatId,
      text: `⚠️ Gagal mencatat transaksi: ${rpcErr.message}`,
    });
    return { ok: false };
  }

  // Format & Send Reply
  if (parsedTx.jenis === 'pemasukan') {
    const reply = formatIncomeReply({
      date: new Date(),
      amount: parsedTx.nominal,
      categoryName: matchedCategory?.name || parsedTx.kategori || 'Pemasukan',
      walletName: selectedWallet.name,
      newBalance: recordRes.new_balance,
      transcript: voiceTranscript,
    });
    await telegramBot.sendMessage({
      chat_id: chatId,
      text: reply,
      parse_mode: 'Markdown',
    });
  } else {
    // Check category budget
    let budgetTotal = 0;
    if (matchedCategory) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: budget } = await supabase
        .from('budgets')
        .select('monthly_amount')
        .eq('user_id', userId)
        .eq('category_id', matchedCategory.id)
        .eq('month_year', currentMonth)
        .maybeSingle();

      if (budget) {
        budgetTotal = Number(budget.monthly_amount);
      }
    }

    const reply = formatExpenseReply({
      date: new Date(),
      amount: parsedTx.nominal,
      categoryName: matchedCategory?.name || parsedTx.kategori || 'Pengeluaran',
      categoryIcon: matchedCategory?.icon,
      walletName: selectedWallet.name,
      notes: parsedTx.catatan,
      newBalance: recordRes.new_balance,
      budgetTotal,
      transcript: voiceTranscript,
    });

    await telegramBot.sendMessage({
      chat_id: chatId,
      text: reply,
      parse_mode: 'Markdown',
    });
  }

  return { ok: true };
}
