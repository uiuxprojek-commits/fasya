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
  return `🤖 *Panduan TataDana Bot*

Catat keuangan semudah chatting! Cukup kirim pesan teks atau voice note:

💬 *Contoh Catat Pengeluaran:*
• \`beli bakso 15rb\`
• \`bayar bensin 50k pakai BCA\`
• \`kopi starbucks 65.000\`

💰 *Contoh Catat Pemasukan:*
• \`gajian 8.5jt\`
• \`dapat transfer freelance 500rb\`

🔄 *Contoh Transfer:*
• \`transfer 100rb dari BCA ke GoPay\`

📸 *Foto Struk (Paket Pro):*
Kirim langsung foto struk belanja untuk dipindai otomatis oleh AI!

📋 *Daftar Perintah:*
/saldo — Cek saldo seluruh wallet kamu
/hari_ini — Rekap pengeluaran & pemasukan hari ini
/minggu_ini — Rekap 7 hari terakhir
/bulan_ini — Ringkasan bulan berjalan & rincian kategori
/budget — Status sisa budget kategori bulan ini
/link <code> — Hubungkan bot dengan akun web TataDana
/bantuan — Menampilkan panduan ini`;
}
