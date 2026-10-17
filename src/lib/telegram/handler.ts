import { telegramBot } from './bot';
import {
  formatExpenseReply,
  formatIncomeReply,
  formatTransferReply,
  formatHelpMessage,
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
      // 23505 = unique_violation, update already received
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
    .single();

  // 3. Handle Linking Commands (/start <code> or /link <code>)
  const isStartWithCode = text.startsWith('/start ') && text.length > 7;
  const isLinkCommand = text.startsWith('/link ') && text.length > 6;

  if (isStartWithCode || isLinkCommand) {
    const code = (isStartWithCode ? text.replace('/start ', '') : text.replace('/link ', '')).trim().toUpperCase();

    // Check code in telegram_link_codes
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
        text: '❌ Kode tautan tidak valid atau sudah kedaluwarsa. Silakan buat kode baru melalui menu Settings di dashboard web TataDana.',
      });
      return { ok: true };
    }

    // Link telegram account
    const { error: linkError } = await supabase.from('telegram_accounts').upsert(
      {
        user_id: linkCodeRecord.user_id,
        telegram_user_id: telegramUserId,
        telegram_username: message.from.username || null,
        first_name: message.from.first_name,
        last_name: message.from.last_name || null,
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

    // Mark link code as used
    await supabase
      .from('telegram_link_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', linkCodeRecord.id);

    await telegramBot.sendMessage({
      chat_id: chatId,
      text: `🎉 *Selamat, Akun TataDana Berhasil Terhubung!*\n\nHalo ${message.from.first_name}, sekarang kamu bisa mencatat pengeluaran dan pemasukan langsung dari chat ini.\n\nCoba ketik sekarang:\n👉 \`beli bakso 15rb\`\n👉 \`gajian 5jt\`\n\nKetik /bantuan untuk melihat daftar fitur lengkap.`,
      parse_mode: 'Markdown',
    });

    return { ok: true, linked: true };
  }

  // If user is not linked yet
  if (!tgAccount) {
    await telegramBot.sendMessage({
      chat_id: chatId,
      text: `👋 Halo ${message.from.first_name}!\n\nAkun Telegram kamu belum terhubung dengan akun TataDana.\n\n*Cara Menghubungkan:*
1. Buka dashboard TataDana di web
2. Masuk ke menu *Settings* -> *Telegram Bot*
3. Salin kode tautan (contoh: \`TD-9821\`)
4. Kirim ke bot ini: \`/link TD-9821\`

Atau klik link langsung yang ada di dashboard!`,
      parse_mode: 'Markdown',
    });
    return { ok: true };
  }

  const userId = tgAccount.user_id;

  // 4. Handle System Commands
  const lowerText = text.toLowerCase();

  if (lowerText === '/bantuan' || lowerText === '/help' || lowerText === '/start') {
    await telegramBot.sendMessage({
      chat_id: chatId,
      text: formatHelpMessage(),
      parse_mode: 'Markdown',
    });
    return { ok: true };
  }

  if (lowerText === '/saldo') {
    const { data: wallets } = await supabase
      .from('wallets')
      .select('name, balance, type')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('is_default', { ascending: false });

    if (!wallets || wallets.length === 0) {
      await telegramBot.sendMessage({
        chat_id: chatId,
        text: '👛 Kamu belum memiliki dompet aktif. Tambahkan dompet di dashboard web.',
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

  if (lowerText === '/hari_ini' || lowerText === '/hari ini') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: txs } = await supabase
      .from('transactions')
      .select('type, amount, notes, categories(name)')
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

  if (lowerText === '/minggu_ini' || lowerText === '/minggu ini') {
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

  if (lowerText === '/budget') {
    const currentMonth = new Date().toISOString().slice(0, 7); // e.g. '2026-10'
    const { data: budgets } = await supabase
      .from('budgets')
      .select('monthly_amount, categories(id, name, icon)')
      .eq('user_id', userId)
      .eq('month_year', currentMonth);

    if (!budgets || budgets.length === 0) {
      await telegramBot.sendMessage({
        chat_id: chatId,
        text: '📊 Kamu belum menyetel budget bulanan. Atur budget di menu Dashboard Web untuk memantau pengeluaran.',
      });
      return { ok: true };
    }

    let reply = `📊 *Status Budget Bulan Ini (${currentMonth})*\n\n`;
    for (const b of budgets) {
      const cat = b.categories as unknown as { id: string; name: string; icon: string } | null;
      reply += `🏷️ ${cat?.name || 'Kategori'}: Limit *${formatRupiah(b.monthly_amount)}*\n`;
    }

    await telegramBot.sendMessage({
      chat_id: chatId,
      text: reply,
      parse_mode: 'Markdown',
    });
    return { ok: true };
  }

  // 5. Handle Photo / Receipt OCR (Pro Feature)
  if (message.photo && message.photo.length > 0) {
    // Check subscription plan entitlement
    const { data: sub } = await supabase
      .from('user_subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    const isPro = sub?.plan?.code === 'pro';

    if (!isPro) {
      await telegramBot.sendMessage({
        chat_id: chatId,
        text: `📸 *Fitur Foto Struk AI Tersedia Khusus Pro*\n\nAkun kamu saat ini berada di paket *Starter*. Di paket TataDana Pro (Rp99.000 sekali bayar), kamu bisa:\n\n✨ Pindai struk belanja otomatis dengan AI OCR\n✨ Ekstrak rincian item, pajak & total belanja\n✨ Laporan lengkap & export PDF/Excel unlimited\n\nUpgrade sekarang di menu Dashboard Web kamu!`,
        parse_mode: 'Markdown',
      });
      return { ok: true };
    }

    // Get highest resolution photo
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

    // Get default wallet
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

    // Call atomic procedure
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

    // Insert items into transaction_items
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
      text: `🧾 *Struk Berhasil Tercatat!*\n\n🏪 Merchant: *${ocrResult.merchantName}*\n💰 Total: *${formatRupiah(ocrResult.totalAmount)}*\n👛 Dompet: ${defaultWallet.name}\n\n*Rincian Item:*${itemsSummary}\n\nSaldomu telah diperbarui secara otomatis.`,
      parse_mode: 'Markdown',
    });

    return { ok: true };
  }

  // 6. Handle Voice Note (Speech-to-Text)
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

  // 7. Handle Natural Language Text Parsing
  const inputToParse = voiceTranscript || text;
  if (!inputToParse) {
    return { ok: true };
  }

  const { result: parsedTx } = await parseTransactionWithFailover(inputToParse);

  if (parsedTx.nominal <= 0 || parsedTx.confidence < 0.4) {
    await telegramBot.sendMessage({
      chat_id: chatId,
      text: '🤔 Maaf, nominal transaksi belum terbaca dengan jelas.\n\nContoh yang bisa kamu kirim:\n• `beli kopi 25rb`\n• `gajian 5.5jt`\n• `isi bensin 50k pakai BCA`\n• `transfer 100rb dari BCA ke GoPay`',
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
      text: 'Kamu belum memiliki wallet aktif. Silakan buat wallet terlebih dahulu di dashboard web TataDana.',
    });
    return { ok: true };
  }

  // Match wallet from parsed text or use default
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
        text: 'Untuk transfer, kamu membutuhkan minimal dua wallet aktif yang berbeda.',
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
        .single();

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
