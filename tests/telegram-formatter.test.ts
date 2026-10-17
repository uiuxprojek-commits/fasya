import test from 'node:test';
import assert from 'node:assert/strict';
import {
  makeAsciiProgressBar,
  formatExpenseReply,
  formatIncomeReply,
  formatHelpMessage,
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

test('formatHelpMessage lists all required bot commands', () => {
  const help = formatHelpMessage();
  assert.ok(help.includes('/saldo'));
  assert.ok(help.includes('/hari_ini'));
  assert.ok(help.includes('/minggu_ini'));
  assert.ok(help.includes('/bulan_ini'));
  assert.ok(help.includes('/budget'));
  assert.ok(help.includes('/link'));
});
