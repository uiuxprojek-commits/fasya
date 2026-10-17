import { formatRupiah, formatDateWIB } from '@/lib/utils';

export function makeAsciiProgressBar(percentage: number, length = 10): string {
  const clamped = Math.min(Math.max(percentage, 0), 100);
  const filledCount = Math.round((clamped / 100) * length);
  const emptyCount = length - filledCount;
  return '█'.repeat(filledCount) + '░'.repeat(emptyCount);
}

export interface ExpenseReplyParams {
  date: Date | string;
  amount: number;
  categoryName: string;
  categoryIcon?: string;
  walletName: string;
  notes?: string;
  newBalance: number;
  budgetTotal?: number;
  budgetSpent?: number;
  transcript?: string;
}

export function formatExpenseReply(params: ExpenseReplyParams): string {
  const dateStr = formatDateWIB(params.date, 'full');
  const catEmoji = params.categoryIcon || '🏷️';
  let message = `📅 ${dateStr}\n\n💸 *Pengeluaran tercatat!*\n\n├ Nominal: *${formatRupiah(params.amount)}*\n├ Kategori: ${catEmoji} ${params.categoryName}\n├ Dompet: 👛 ${params.walletName}\n├ Catatan: ${params.notes || '-'}\n└ Saldo: *${formatRupiah(params.newBalance)}*`;

  if (params.transcript) {
    message += `\n\n🎙️ Transkrip: "_${params.transcript}_"`;
  }

  if (params.budgetTotal && params.budgetTotal > 0) {
    const spent = params.budgetSpent || params.amount;
    const remaining = Math.max(params.budgetTotal - spent, 0);
    const percentage = Math.round((spent / params.budgetTotal) * 100);
    const bar = makeAsciiProgressBar(percentage);

    message += `\n\n📊 *Budget ${params.categoryName} bulan ini:*\n[${bar}] ${percentage}% — sisa *${formatRupiah(remaining)}*`;

    if (percentage >= 100) {
      message += `\n\n⚠️ *Perhatian:* Budget kategori ini sudah melebihi batas 100%! Rem dulu pengeluaranmu ya.`;
    } else if (percentage >= 80) {
      message += `\n\n⚠️ *Peringatan:* Pengeluaran sudah mencapai 80% dari batas budget bulanan.`;
    } else {
      message += `\n\n👍 Pengeluaran masih dalam batas aman. Tetap bijak berbelanja!`;
    }
  }

  return message;
}

export interface IncomeReplyParams {
  date: Date | string;
  amount: number;
  categoryName: string;
  walletName: string;
  newBalance: number;
  transcript?: string;
}

export function formatIncomeReply(params: IncomeReplyParams): string {
  const dateStr = formatDateWIB(params.date, 'full');
  let message = `📅 ${dateStr}\n\n💰 *Pemasukan tercatat!*\n\n├ Nominal: *${formatRupiah(params.amount)}*\n├ Kategori: ${params.categoryName}\n├ Dompet: 👛 ${params.walletName}\n└ Saldo baru: *${formatRupiah(params.newBalance)}*\n\n💪 Semangat terus! Jangan lupa sisihkan untuk tabungan ya.`;

  if (params.transcript) {
    message += `\n\n🎙️ Transkrip: "_${params.transcript}_"`;
  }

  return message;
}

export interface TransferReplyParams {
  date: Date | string;
  amount: number;
  fromWalletName: string;
  toWalletName: string;
  fromBalance: number;
  toBalance: number;
}

export function formatTransferReply(params: TransferReplyParams): string {
  const dateStr = formatDateWIB(params.date, 'full');
  return `📅 ${dateStr}\n\n🔄 *Transfer Antar Wallet Berhasil!*\n\n├ Nominal: *${formatRupiah(params.amount)}*\n├ Dari: 👛 ${params.fromWalletName} (Sisa: ${formatRupiah(params.fromBalance)})\n└ Ke: 👛 ${params.toWalletName} (Total: ${formatRupiah(params.toBalance)})`;
}

export function formatHelpMessage(): string {
  return `🤖 *TataDana Assistant — Panduan Perintah*

Catat keuangan semudah chatting! Cukup ketik teks biasa atau kirim voice note:

💬 *Contoh Catat Otomatis:*
• \`beli kopi 28rb pakai gopay\`
• \`makan siang padang 35k\`
• \`gajian bulan ini 8.5jt ke BCA\`
• \`transfer 200rb dari BCA ke ShopeePay\`

📸 *Foto Struk Belanja (Paket Pro):*
Kirim langsung foto struk fisik, AI akan mengekstrak nominal, toko, dan item otomatis!

📋 *Daftar Perintah Bot:*
/saldo — Ringkasan saldo aktual semua dompet
/transaksi — Daftar 5 transaksi terbaru
/anggaran — Ringkasan batas anggaran & sisa budget (alias: /budget)
/tagihan — Daftar tagihan mendatang
/laporan — Rekap pemasukan & pengeluaran bulan ini
/status — Status koneksi Telegram & notifikasi
/hubungkan — Panduan menghubungkan akun web TataDana
/help — Menampilkan panduan perintah ini (alias: /bantuan, /start)

🕒 *Shortcut Rekap Cepat:*
/hari_ini — Rekap transaksi hari ini
/minggu_ini — Rekap 7 hari terakhir
/bulan_ini — Rekap 30 hari berjalan
/link <code> — Tautkan akun via kode unik`;
}

export function formatConnectGuideMessage(botUsername: string): string {
  return `🔗 *Panduan Menghubungkan Akun TataDana*

Untuk menghubungkan bot ini dengan akun TataDana kamu:

1. Buka aplikasi web TataDana di browser kamu
2. Masuk ke menu *Pengaturan (Settings)* -> tab *Telegram Bot*
3. Klik tombol *'Generate Kode Tautan'*
4. Salin kode yang muncul (contoh: \`TD-849201\`)
5. Kirimkan perintah berikut ke chat ini:
   \`/start KODE\` atau \`/link KODE\`

*(Kode berlaku selama 10 menit dan hanya dapat digunakan 1 kali).*

Jika kamu belum memiliki akun, daftar gratis di website TataDana!`;
}

export interface FormattedTransactionItem {
  id: string;
  type: string;
  amount: number;
  date: string;
  notes?: string | null;
  categoryName?: string;
  walletName?: string;
}

export function formatTransactionsList(transactions: FormattedTransactionItem[]): string {
  if (!transactions || transactions.length === 0) {
    return '📝 *Riwayat Transaksi*\n\nBelum ada transaksi yang tercatat di akun TataDana kamu. Mulai catat sekarang dengan mengetik langsung (contoh: `kopi 25rb`).';
  }

  let text = `📝 *5 Transaksi Terakhir Kamu:*\n\n`;
  transactions.forEach((tx, idx) => {
    const isExpense = tx.type === 'expense';
    const sign = isExpense ? '🔴 -' : '🟢 +';
    const dateFormatted = formatDateWIB(tx.date, 'short');
    const label = tx.notes || tx.categoryName || (isExpense ? 'Pengeluaran' : 'Pemasukan');

    text += `${idx + 1}. ${sign}${formatRupiah(tx.amount)}\n`;
    text += `   ├ ${label} (${tx.categoryName || 'Umum'})\n`;
    text += `   ├ 👛 ${tx.walletName || 'Dompet Utama'}\n`;
    text += `   └ 📅 ${dateFormatted}\n\n`;
  });

  text += `_Lihat riwayat lengkap dan filter transaksi di dashboard web TataDana._`;
  return text;
}

export interface BudgetSummaryItem {
  categoryName: string;
  monthlyAmount: number;
  spentAmount: number;
}

export function formatBudgetList(budgets: BudgetSummaryItem[], monthYear: string): string {
  if (!budgets || budgets.length === 0) {
    return `📊 *Anggaran Bulanan (${monthYear})*\n\nKamu belum menetapkan target anggaran bulan ini. Buka dashboard web TataDana menu *Anggaran* untuk menetapkan limit belanja per kategori agar keuanganmu tetap terkendali!`;
  }

  let text = `📊 *Ringkasan Anggaran (${monthYear})*\n\n`;
  budgets.forEach((b) => {
    const remaining = Math.max(b.monthlyAmount - b.spentAmount, 0);
    const percentage = b.monthlyAmount > 0 ? Math.round((b.spentAmount / b.monthlyAmount) * 100) : 0;
    const bar = makeAsciiProgressBar(percentage, 8);
    const statusIcon = percentage >= 100 ? '🚨' : percentage >= 80 ? '⚠️' : '✅';

    text += `🏷️ *${b.categoryName}* ${statusIcon}\n`;
    text += `[${bar}] ${percentage}%\n`;
    text += `Terpakai: ${formatRupiah(b.spentAmount)} / Limit: ${formatRupiah(b.monthlyAmount)}\n`;
    text += `Sisa: *${formatRupiah(remaining)}*\n\n`;
  });

  return text;
}

export interface ReportSummaryParams {
  periodName: string;
  incomeTotal: number;
  expenseTotal: number;
  topCategories: Array<{ name: string; amount: number }>;
}

export function formatReportReply(params: ReportSummaryParams): string {
  const net = params.incomeTotal - params.expenseTotal;
  const isSurplus = net >= 0;

  let text = `📈 *Laporan Keuangan — ${params.periodName}*\n\n`;
  text += `💰 Pemasukan: *${formatRupiah(params.incomeTotal)}*\n`;
  text += `💸 Pengeluaran: *${formatRupiah(params.expenseTotal)}*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `${isSurplus ? '🟢 Net Cashflow (Surplus)' : '🔴 Net Cashflow (Defisit)'}: *${formatRupiah(net)}*\n\n`;

  if (params.topCategories && params.topCategories.length > 0) {
    text += `🏷️ *Top Pengeluaran Terbesar:*\n`;
    params.topCategories.slice(0, 3).forEach((cat, idx) => {
      text += `${idx + 1}. ${cat.name}: *${formatRupiah(cat.amount)}*\n`;
    });
    text += `\n`;
  }

  if (isSurplus) {
    text += `💡 *Kondisi Keuangan:* Arus kas kamu positif! Pertahankan dan pertimbangkan untuk menambah tabungan/investasi.`;
  } else {
    text += `💡 *Kondisi Keuangan:* Pengeluaran melebihi pemasukan bulan ini. Periksa kembali anggaran dan prioritaskan kebutuhan esensial.`;
  }

  return text;
}

export interface StatusReplyParams {
  fullName: string;
  email: string;
  telegramUserId: number;
  telegramUsername?: string | null;
  notificationsEnabled: boolean;
  linkedAt: string;
}

export function formatStatusReply(params: StatusReplyParams): string {
  const dateFormatted = formatDateWIB(params.linkedAt, 'full');
  return `🛡️ *Status Akun TataDana & Telegram*

✅ *Status Koneksi:* Terhubung
👤 *Pengguna:* ${params.fullName} (${params.email})
🆔 *ID Telegram:* \`${params.telegramUserId}\`
📱 *Username:* ${params.telegramUsername ? `@${params.telegramUsername}` : '-'}
🔔 *Notifikasi Transaksi:* ${params.notificationsEnabled ? 'Aktif ✅' : 'Nonaktif ❌'}
📅 *Terhubung Sejak:* ${dateFormatted}

_Pengaturan notifikasi dan pemutusan akun dapat dikelola melalui menu Settings di web TataDana._`;
}
