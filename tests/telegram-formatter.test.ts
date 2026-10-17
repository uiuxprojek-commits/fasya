import test from 'node:test';
import assert from 'node:assert/strict';
import {
  makeAsciiProgressBar,
  formatExpenseReply,
  formatIncomeReply,
  formatHelpMessage,
  formatConnectGuideMessage,
  formatTransactionsList,
  formatBudgetList,
  formatReportReply,
  formatStatusReply,
} from '../src/lib/telegram/formatter';

test('makeAsciiProgressBar generates correct bar length and percentage representation', () => {
  const bar0 = makeAsciiProgressBar(0, 10);
  assert.equal(bar0, '░░░░░░░░░░');

  const bar50 = makeAsciiProgressBar(50, 10);
  assert.equal(bar50, '█████░░░░░');

  const bar100 = makeAsciiProgressBar(100, 10);
  assert.equal(bar100, '██████████');
});

test('formatExpenseReply includes proper Indonesian formatting, balance, and budget warning', () => {
  const reply = formatExpenseReply({
    date: new Date('2026-10-17T12:00:00Z'),
    amount: 50000,
    categoryName: 'Makanan & Minuman',
    categoryIcon: '🍜',
    walletName: 'BCA',
    notes: 'makan siang',
    newBalance: 450000,
    budgetTotal: 1000000,
    budgetSpent: 850000, // 85% warning!
  });

  assert.ok(reply.includes('Pengeluaran tercatat!'));
  assert.ok(reply.includes('Rp 50.000'));
  assert.ok(reply.includes('🍜 Makanan & Minuman'));
  assert.ok(reply.includes('BCA'));
  assert.ok(reply.includes('Pengeluaran sudah mencapai 80%'));
});

test('formatIncomeReply contains motivational Indonesian message and Rupiah balance', () => {
  const reply = formatIncomeReply({
    date: new Date('2026-10-17T12:00:00Z'),
    amount: 5000000,
    categoryName: 'Gaji Pokok',
    walletName: 'BCA Utama',
    newBalance: 6500000,
  });

  assert.ok(reply.includes('Pemasukan tercatat!'));
  assert.ok(reply.includes('Rp 5.000.000'));
  assert.ok(reply.includes('Rp 6.500.000'));
  assert.ok(reply.includes('Semangat terus!'));
});

test('formatHelpMessage lists all required bot commands from specification', () => {
  const help = formatHelpMessage();
  assert.ok(help.includes('/start'));
  assert.ok(help.includes('/help'));
  assert.ok(help.includes('/hubungkan'));
  assert.ok(help.includes('/saldo'));
  assert.ok(help.includes('/transaksi'));
  assert.ok(help.includes('/anggaran'));
  assert.ok(help.includes('/tagihan'));
  assert.ok(help.includes('/laporan'));
  assert.ok(help.includes('/status'));
  assert.ok(help.includes('/hari_ini'));
  assert.ok(help.includes('/minggu_ini'));
  assert.ok(help.includes('/bulan_ini'));
  assert.ok(help.includes('/budget'));
  assert.ok(help.includes('/link'));
});

test('formatConnectGuideMessage includes botUsername and instructions', () => {
  const guide = formatConnectGuideMessage('TataDanaApp2026Bot');
  assert.ok(guide.includes('Panduan Menghubungkan'));
  assert.ok(guide.includes('/start KODE'));
  assert.ok(guide.includes('10 menit'));
});

test('formatTransactionsList handles populated transactions and empty list', () => {
  const empty = formatTransactionsList([]);
  assert.ok(empty.includes('Belum ada transaksi'));

  const populated = formatTransactionsList([
    {
      id: 'tx-1',
      type: 'expense',
      amount: 35000,
      date: '2026-10-17T12:00:00Z',
      categoryName: 'Makanan & Minuman',
      walletName: 'GoPay',
      notes: 'Makan siang',
    },
    {
      id: 'tx-2',
      type: 'income',
      amount: 500000,
      date: '2026-10-17T10:00:00Z',
      categoryName: 'Gaji Pokok',
      walletName: 'BCA',
    },
  ]);

  assert.ok(populated.includes('Rp 35.000'));
  assert.ok(populated.includes('Makan siang'));
  assert.ok(populated.includes('GoPay'));
  assert.ok(populated.includes('Rp 500.000'));
});

test('formatBudgetList renders category limit, spent, and remaining', () => {
  const empty = formatBudgetList([], '2026-10');
  assert.ok(empty.includes('belum menetapkan target'));

  const list = formatBudgetList(
    [
      {
        categoryName: 'Makanan & Minuman',
        monthlyAmount: 1000000,
        spentAmount: 600000,
      },
    ],
    '2026-10'
  );

  assert.ok(list.includes('Makanan & Minuman'));
  assert.ok(list.includes('Rp 600.000'));
  assert.ok(list.includes('Rp 1.000.000'));
  assert.ok(list.includes('Rp 400.000'));
});

test('formatReportReply calculates surplus and lists top categories', () => {
  const report = formatReportReply({
    periodName: 'Bulan 2026-10',
    incomeTotal: 10000000,
    expenseTotal: 4000000,
    topCategories: [
      { name: 'Makanan & Minuman', amount: 2000000 },
      { name: 'Transportasi', amount: 1000000 },
    ],
  });

  assert.ok(report.includes('Rp 10.000.000'));
  assert.ok(report.includes('Rp 4.000.000'));
  assert.ok(report.includes('Rp 6.000.000'));
  assert.ok(report.includes('Surplus'));
  assert.ok(report.includes('Makanan & Minuman'));
});

test('formatStatusReply displays connection status and user details', () => {
  const status = formatStatusReply({
    fullName: 'Fasya Pratama',
    email: 'fasya@example.com',
    telegramUserId: 12345678,
    telegramUsername: 'fasyadev',
    notificationsEnabled: true,
    linkedAt: '2026-10-17T10:00:00Z',
  });

  assert.ok(status.includes('Terhubung'));
  assert.ok(status.includes('Fasya Pratama'));
  assert.ok(status.includes('12345678'));
  assert.ok(status.includes('@fasyadev'));
  assert.ok(status.includes('Aktif ✅'));
});
