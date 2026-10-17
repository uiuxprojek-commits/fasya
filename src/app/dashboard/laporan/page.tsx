'use client';

import * as React from 'react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatRupiah, formatDateWIB } from '@/lib/utils';
import {
  Download,
  FileSpreadsheet,
  FileText,
  TrendingDown,
  TrendingUp,
  Wallet,
  Sparkles,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export default function LaporanPage() {
  const [startDate, setStartDate] = React.useState(
    new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = React.useState(
    new Date().toISOString().split('T')[0]
  );

  const [totalIncome, setTotalIncome] = React.useState(5500000);
  const [totalExpense, setTotalExpense] = React.useState(2350000);
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportError, setExportError] = React.useState('');

  const topCategories = [
    { name: 'Makanan & Minuman', amount: 950000, percentage: 40, color: 'bg-orange-500' },
    { name: 'Tagihan & Utilitas', amount: 550000, percentage: 23, color: 'bg-red-500' },
    { name: 'Transportasi', amount: 450000, percentage: 19, color: 'bg-blue-500' },
    { name: 'Belanja Harian', amount: 250000, percentage: 11, color: 'bg-purple-500' },
    { name: 'Hiburan', amount: 150000, percentage: 7, color: 'bg-pink-500' },
  ];

  const handleExport = async (format: 'pdf' | 'xlsx') => {
    setIsExporting(true);
    setExportError('');

    try {
      const res = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          startDate,
          endDate,
        }),
      });

      if (!res.ok) {
        const errorJson = await res.json();
        throw new Error(errorJson.error || 'Gagal mengekspor laporan');
      }

      // Download file blob
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TataDana-Laporan-${startDate}-sd-${endDate}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setExportError(err instanceof Error ? err.message : 'Terjadi kesalahan ekspor');
    } finally {
      setIsExporting(false);
    }
  };

  const netCashflow = totalIncome - totalExpense;

  return (
    <div className="flex-1 pb-16">
      <DashboardHeader
        title="Laporan & Ekspor Finansial"
        subtitle="Analisis mendalam arus kas dan unduh berkas laporan resmi PDF atau Excel."
      />

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Date Filter & Export Action Bar */}
        <Card className="p-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Mulai Tanggal
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
              >
                <FileText className="w-4 h-4 mr-1.5 text-red-500" />
                Unduh PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('xlsx')}
                disabled={isExporting}
              >
                <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
                Unduh XLSX
              </Button>
            </div>
          </div>

          {exportError && (
            <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{exportError}</span>
            </div>
          )}
        </Card>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Pemasukan
            </span>
            <div className="mt-2 text-2xl font-extrabold text-emerald-600 flex items-center gap-1.5">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              {formatRupiah(totalIncome)}
            </div>
            <p className="mt-1 text-xs text-slate-400">Periode terpilih</p>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Pengeluaran
            </span>
            <div className="mt-2 text-2xl font-extrabold text-red-600 flex items-center gap-1.5">
              <TrendingDown className="w-5 h-5 text-red-500" />
              {formatRupiah(totalExpense)}
            </div>
            <p className="mt-1 text-xs text-slate-400">Periode terpilih</p>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Net Cashflow
            </span>
            <div
              className={`mt-2 text-2xl font-extrabold flex items-center gap-1.5 ${
                netCashflow >= 0 ? 'text-slate-900' : 'text-red-600'
              }`}
            >
              <Wallet className="w-5 h-5 text-orange-500" />
              {formatRupiah(netCashflow)}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {netCashflow >= 0 ? 'Surplus keuangan sehat' : 'Pengeluaran melebihi pemasukan'}
            </p>
          </Card>
        </div>

        {/* Top 5 Spending Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Kategori Pengeluaran</CardTitle>
            <CardDescription>
              Kategori yang paling banyak menyerap anggaran belanja kamu.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topCategories.map((cat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>{cat.name}</span>
                  <span>
                    {formatRupiah(cat.amount)}{' '}
                    <span className="text-slate-400 font-normal">({cat.percentage}%)</span>
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${cat.color} rounded-full`}
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pro Plan Banner for Unlimited Export */}
        <Card className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-amber-200" />
                <h4 className="text-base font-extrabold">Ekspor Laporan Tak Terbatas dengan Pro</h4>
              </div>
              <p className="text-xs text-orange-50 max-w-xl leading-relaxed">
                Hanya Rp99.000 sekali bayar (lifetime). Buka fitur ekspor PDF dan Excel tanpa batas, AI Advisor keuangan, OCR struk belanja, dan reminder harian khusus.
              </p>
            </div>
            <a
              href="/dashboard/settings?tab=subscription"
              className="px-5 py-2.5 bg-white text-orange-600 font-bold rounded-xl text-xs hover:bg-orange-50 transition-colors shrink-0 text-center shadow-md"
            >
              Lihat Detail Paket Pro
            </a>
          </div>
        </Card>
      </main>
    </div>
  );
}
