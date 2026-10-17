import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Transaction } from '@/types';
import { formatRupiah, formatDateWIB } from '@/lib/utils';

export interface ReportData {
  userName: string;
  userEmail: string;
  startDate: string;
  endDate: string;
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
}

/**
 * Generate Real Branded PDF Report for TataDana
 */
export function generatePdfReport(data: ReportData): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Header Brand
  doc.setFillColor(249, 115, 22); // Orange #F97316
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('TATADANA', 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Laporan Keuangan Pribadi Resmi', 196, 15, { align: 'right' });

  // Metadata Section
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMASI LAPORAN', 14, 34);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nama Pengguna : ${data.userName} (${data.userEmail})`, 14, 40);
  doc.text(`Periode Laporan: ${formatDateWIB(data.startDate, 'short')} s/d ${formatDateWIB(data.endDate, 'short')}`, 14, 45);
  doc.text(`Waktu Cetak    : ${formatDateWIB(new Date(), 'full')}`, 14, 50);

  // Financial Summary Cards in PDF
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);

  // Income Card
  doc.roundedRect(14, 56, 56, 18, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL PEMASUKAN', 18, 62);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text(formatRupiah(data.totalIncome), 18, 70);

  // Expense Card
  doc.roundedRect(77, 56, 56, 18, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL PENGELUARAN', 81, 62);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(239, 68, 68); // Red
  doc.text(formatRupiah(data.totalExpense), 81, 70);

  // Net Cashflow Card
  doc.roundedRect(140, 56, 56, 18, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('NET CASHFLOW', 144, 62);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(data.netCashflow >= 0 ? 16 : 239, data.netCashflow >= 0 ? 185 : 68, data.netCashflow >= 0 ? 129 : 68);
  doc.text(formatRupiah(data.netCashflow), 144, 70);

  // Table of Transactions
  const tableRows = data.transactions.map((tx) => [
    formatDateWIB(tx.date, 'short'),
    tx.type === 'income' ? 'Pemasukan' : tx.type === 'expense' ? 'Pengeluaran' : 'Transfer',
    tx.category?.name || 'Lain-lain',
    tx.wallet?.name || 'Utama',
    tx.notes || '-',
    (tx.type === 'income' ? '+ ' : '- ') + formatRupiah(tx.amount),
  ]);

  autoTable(doc, {
    startY: 80,
    head: [['Tanggal', 'Tipe', 'Kategori', 'Dompet', 'Catatan', 'Nominal']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [249, 115, 22],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 24 },
      2: { cellWidth: 34 },
      3: { cellWidth: 26 },
      4: { cellWidth: 44 },
      5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
  });

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

/**
 * Generate Real XLSX Report with multiple styled worksheets
 */
export function generateXlsxReport(data: ReportData): Buffer {
  const workbook = XLSX.utils.book_new();

  // 1. Worksheet Data Transaksi
  const txSheetData = data.transactions.map((tx) => ({
    Tanggal: formatDateWIB(tx.date, 'short'),
    Tipe: tx.type === 'income' ? 'Pemasukan' : tx.type === 'expense' ? 'Pengeluaran' : 'Transfer',
    Kategori: tx.category?.name || 'Lain-lain',
    Dompet: tx.wallet?.name || 'Utama',
    Catatan: tx.notes || '',
    Nominal: Number(tx.amount),
    'Sumber Transaksi': tx.source,
  }));

  const txSheet = XLSX.utils.json_to_sheet(txSheetData);
  XLSX.utils.book_append_sheet(workbook, txSheet, 'Daftar Transaksi');

  // 2. Worksheet Ringkasan Keuangan
  const summarySheetData = [
    { Parameter: 'Nama Pengguna', Nilai: data.userName },
    { Parameter: 'Email', Nilai: data.userEmail },
    { Parameter: 'Periode Mulai', Nilai: data.startDate },
    { Parameter: 'Periode Selesai', Nilai: data.endDate },
    { Parameter: 'Total Pemasukan', Nilai: data.totalIncome },
    { Parameter: 'Total Pengeluaran', Nilai: data.totalExpense },
    { Parameter: 'Net Cashflow', Nilai: data.netCashflow },
    { Parameter: 'Jumlah Transaksi', Nilai: data.transactions.length },
    { Parameter: 'Tanggal Generate', Nilai: new Date().toISOString() },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summarySheetData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan Eksekutif');

  const xlsxBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return Buffer.from(xlsxBuffer);
}
