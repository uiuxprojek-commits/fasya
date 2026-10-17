import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePdfReport, generateXlsxReport } from '../src/lib/reports/generator';

test('generatePdfReport produces valid binary PDF buffer with %PDF header', () => {
  const sampleData = {
    userName: 'Ahmad Fasya',
    userEmail: 'fasya@tatadana.id',
    startDate: '2026-10-01',
    endDate: '2026-10-17',
    totalIncome: 7500000,
    totalExpense: 2350000,
    netCashflow: 5150000,
    transactions: [
      {
        id: 'tx-1',
        user_id: 'usr-1',
        wallet_id: 'w-1',
        type: 'expense' as const,
        amount: 50000,
        date: '2026-10-15T12:00:00Z',
        notes: 'Makan siang soto',
        source: 'telegram_text' as const,
        created_at: '',
        updated_at: '',
        category: { id: 'c1', name: 'Makanan & Minuman', type: 'expense' as const, icon: 'Utensils', color: '#F97316', is_system: true, is_archived: false, created_at: '' },
        wallet: { id: 'w1', user_id: 'usr-1', name: 'BCA Utama', type: 'bank' as const, balance: 5000000, is_default: true, is_archived: false, color: '#F97316', icon: 'wallet', created_at: '', updated_at: '' },
      },
    ],
  };

  const pdfBuffer = generatePdfReport(sampleData);
  assert.ok(pdfBuffer instanceof Buffer);
  assert.ok(pdfBuffer.length > 500);

  // Check PDF magic bytes '%PDF'
  const header = pdfBuffer.slice(0, 4).toString('utf-8');
  assert.equal(header, '%PDF');
});

test('generateXlsxReport produces valid non-empty XLSX spreadsheet buffer', () => {
  const sampleData = {
    userName: 'Ahmad Fasya',
    userEmail: 'fasya@tatadana.id',
    startDate: '2026-10-01',
    endDate: '2026-10-17',
    totalIncome: 7500000,
    totalExpense: 2350000,
    netCashflow: 5150000,
    transactions: [],
  };

  const xlsxBuffer = generateXlsxReport(sampleData);
  assert.ok(xlsxBuffer instanceof Buffer);
  assert.ok(xlsxBuffer.length > 500);
});
