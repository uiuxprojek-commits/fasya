import test from 'node:test';
import assert from 'node:assert/strict';
import { parseIndonesianCurrency } from '../src/lib/utils';
import { heuristicFallbackParser } from '../src/lib/ai/router';

test('parseIndonesianCurrency handles Indonesian slang formats correctly', () => {
  assert.equal(parseIndonesianCurrency('15rb'), 15000);
  assert.equal(parseIndonesianCurrency('15k'), 15000);
  assert.equal(parseIndonesianCurrency('15ribu'), 15000);
  assert.equal(parseIndonesianCurrency('50k'), 50000);
  assert.equal(parseIndonesianCurrency('1.5jt'), 1500000);
  assert.equal(parseIndonesianCurrency('1,5jt'), 1500000);
  assert.equal(parseIndonesianCurrency('2.5miliar'), 2500000000);
  assert.equal(parseIndonesianCurrency('Rp 25.000'), 25000);
  assert.equal(parseIndonesianCurrency('50000'), 50000);
});

test('heuristicFallbackParser parses Indonesian natural language transactions accurately', () => {
  // 1. Pengeluaran makanan
  const res1 = heuristicFallbackParser('beli bakso 15rb');
  assert.equal(res1.jenis, 'pengeluaran');
  assert.equal(res1.nominal, 15000);
  assert.equal(res1.kategori, 'Makanan & Minuman');

  // 2. Pemasukan gaji
  const res2 = heuristicFallbackParser('gajian 7.5jt');
  assert.equal(res2.jenis, 'pemasukan');
  assert.equal(res2.nominal, 7500000);
  assert.equal(res2.kategori, 'Gaji Pokok');

  // 3. Pengeluaran transportasi
  const res3 = heuristicFallbackParser('isi bensin 50k');
  assert.equal(res3.jenis, 'pengeluaran');
  assert.equal(res3.nominal, 50000);
  assert.equal(res3.kategori, 'Transportasi');

  // 4. Transfer antar wallet
  const res4 = heuristicFallbackParser('transfer 100rb dari bca ke gopay');
  assert.equal(res4.jenis, 'transfer');
  assert.equal(res4.nominal, 100000);
  assert.equal(res4.wallet_nama, 'BCA');
  assert.equal(res4.transfer_ke_wallet, 'GOPAY');
});
