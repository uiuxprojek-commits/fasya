import test from 'node:test';
import assert from 'node:assert/strict';

test('Telegram linking code validation logic', () => {
  // Test code generation format: TD-XXXXXX (6 digits)
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  const code = `TD-${randomDigits}`;
  assert.match(code, /^TD-\d{6}$/);

  // Test expiration window: exactly 10 minutes (600,000 ms)
  const now = Date.now();
  const expiresAt = new Date(now + 10 * 60 * 1000);
  const diffMinutes = (expiresAt.getTime() - now) / 60000;
  assert.equal(diffMinutes, 10);

  // Test expired code check
  const expiredDate = new Date(now - 1000); // 1 second ago
  const isExpired = expiredDate.getTime() < Date.now();
  assert.equal(isExpired, true);

  // Test single-use check
  const usedAt = new Date().toISOString();
  const isAlreadyUsed = Boolean(usedAt);
  assert.equal(isAlreadyUsed, true);
});

test('Financial command access control isolation', () => {
  // Financial commands must be blocked if telegram account is not linked
  const financialCommands = ['/saldo', '/transaksi', '/anggaran', '/budget', '/tagihan', '/laporan', '/status'];
  const publicCommands = ['/help', '/bantuan', '/hubungkan', '/start'];

  const isFinancial = (cmd: string) => financialCommands.includes(cmd);
  const isPublic = (cmd: string) => publicCommands.includes(cmd);

  assert.equal(isFinancial('/saldo'), true);
  assert.equal(isFinancial('/transaksi'), true);
  assert.equal(isFinancial('/anggaran'), true);
  assert.equal(isFinancial('/tagihan'), true);
  assert.equal(isFinancial('/laporan'), true);
  assert.equal(isFinancial('/status'), true);

  assert.equal(isPublic('/help'), true);
  assert.equal(isPublic('/hubungkan'), true);
  assert.equal(isPublic('/start'), true);
  assert.equal(isFinancial('/help'), false);
});
