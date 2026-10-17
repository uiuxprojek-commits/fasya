'use client';

import * as React from 'react';
import { DashboardHeader } from '@/components/dashboard/header';
import { StatCard } from '@/components/ui/stat-card';
import { DashboardCharts } from '@/components/dashboard/dashboard-charts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TransactionModal } from '@/components/dashboard/transaction-modal';
import { TransferModal } from '@/components/dashboard/transfer-modal';
import { Wallet, Category, Transaction } from '@/types';
import { formatRupiah, formatDateWIB } from '@/lib/utils';
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  CheckCircle2,
  Circle,
  Plus,
  Send,
  Sparkles,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [isTxModalOpen, setIsTxModalOpen] = React.useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = React.useState(false);
  const [filterPeriod, setFilterPeriod] = React.useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  // Dashboard Data State
  const [wallets, setWallets] = React.useState<Wallet[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Computed Financial Metrics
  const [totalBalance, setTotalBalance] = React.useState(0);
  const [monthlyIncome, setMonthlyIncome] = React.useState(0);
  const [monthlyExpense, setMonthlyExpense] = React.useState(0);
  const [budgetRemaining, setBudgetRemaining] = React.useState(0);

  const fetchDashboardData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [walletsRes, txRes, catRes, bgtRes] = await Promise.all([
        fetch('/api/wallets'),
        fetch('/api/transactions?limit=25'),
        fetch('/api/categories'),
        fetch('/api/budgets'),
      ]);

      const [walletsData, txData, catData, bgtData] = await Promise.all([
        walletsRes.json(),
        txRes.json(),
        catRes.json(),
        bgtRes.json(),
      ]);

      // 1. Wallets
      const loadedWallets: Wallet[] = walletsData.wallets || [];
      setWallets(loadedWallets);
      const bal = loadedWallets.reduce((acc, w) => acc + Number(w.balance), 0);
      setTotalBalance(bal);

      // 2. Transactions
      const loadedTxs: Transaction[] = txData.transactions || [];
      setTransactions(loadedTxs);

      // 3. Categories
      setCategories(catData.categories || []);

      // 4. Budgets
      const loadedBudgets = bgtData.budgets || [];
      const totalBgt = loadedBudgets.reduce((acc: number, b: any) => acc + Number(b.monthly_amount), 0);
      const totalBgtSpent = loadedBudgets.reduce((acc: number, b: any) => acc + Number(b.spent_amount), 0);
      setBudgetRemaining(Math.max(totalBgt - totalBgtSpent, 0));

      // Calculate real current month income & expense
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      let inc = 0;
      let exp = 0;
      loadedTxs.forEach((t) => {
        const txDate = new Date(t.date);
        if (txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth) {
          if (t.type === 'income') inc += Number(t.amount);
          if (t.type === 'expense') exp += Number(t.amount);
        }
      });
      setMonthlyIncome(inc);
      setMonthlyExpense(exp);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDashboardData();

    const handleOpenModal = () => setIsTxModalOpen(true);
    window.addEventListener('tatadana:open-tx-modal', handleOpenModal);
    return () => window.removeEventListener('tatadana:open-tx-modal', handleOpenModal);
  }, [fetchDashboardData]);

  // Dynamic Chart aggregations
  const categoryChartData = React.useMemo(() => {
    const map: Record<string, number> = {};
    const colorPalette = ['#F97316', '#3B82F6', '#EF4444', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B'];
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const catName = t.category?.name || 'Pengeluaran Lain';
        map[catName] = (map[catName] || 0) + Number(t.amount);
      });

    return Object.entries(map).map(([name, value], i) => ({
      name,
      value,
      color: colorPalette[i % colorPalette.length],
    }));
  }, [transactions]);

  const monthlyChartData = React.useMemo(() => {
    if (transactions.length === 0) return [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    const map: Record<string, { month: string; pemasukan: number; pengeluaran: number }> = {};

    transactions.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const mName = monthNames[d.getMonth()];
      if (!map[key]) {
        map[key] = { month: mName, pemasukan: 0, pengeluaran: 0 };
      }
      if (t.type === 'income') map[key].pemasukan += Number(t.amount);
      if (t.type === 'expense') map[key].pengeluaran += Number(t.amount);
    });

    return Object.values(map);
  }, [transactions]);

  const dailyChartData = React.useMemo(() => {
    if (transactions.length === 0) return [];
    const map: Record<string, number> = {};
    const recentExpenses = transactions.filter((t) => t.type === 'expense').slice(0, 7);

    recentExpenses.forEach((t) => {
      const d = new Date(t.date);
      const label = `${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'][d.getMonth()]}`;
      map[label] = (map[label] || 0) + Number(t.amount);
    });

    return Object.entries(map).map(([date, pengeluaran]) => ({ date, pengeluaran }));
  }, [transactions]);

  return (
    <div className="flex-1 pb-8">
      <DashboardHeader
        title="Ringkasan Finansial"
        subtitle="Selamat datang kembali di TataDana. Pantau seluruh arus kasmu secara real-time."
        onOpenNewTransaction={() => setIsTxModalOpen(true)}
      />

      <main className="p-3.5 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 min-w-0">
        {/* Period Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0">
              Periode:
            </span>
            <div className="flex p-0.5 sm:p-1 bg-white border border-slate-200 rounded-xl shadow-xs shrink-0">
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setFilterPeriod(period)}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all capitalize whitespace-nowrap ${
                    filterPeriod === period
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {period === 'daily' ? 'Harian' : period === 'weekly' ? 'Mingguan' : period === 'monthly' ? 'Bulanan' : 'Tahunan'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTransferModalOpen(true)}
              className="text-xs font-semibold h-8 sm:h-9"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Transfer Antar Wallet
            </Button>
          </div>
        </div>

        {/* 1. Four Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Saldo Total"
            amount={totalBalance}
            type="balance"
            subtitle={`${wallets.length} dompet aktif`}
            isLoading={isLoading}
          />
          <StatCard
            title="Pemasukan Bulan Ini"
            amount={monthlyIncome}
            type="income"
            subtitle="Pemasukan terverifikasi"
            isLoading={isLoading}
          />
          <StatCard
            title="Pengeluaran Bulan Ini"
            amount={monthlyExpense}
            type="expense"
            subtitle="Pengeluaran tercatat"
            isLoading={isLoading}
          />
          <StatCard
            title="Budget Tersisa"
            amount={budgetRemaining}
            type="budget"
            subtitle="Batas aman pengeluaran"
            isLoading={isLoading}
          />
        </div>

        {/* 2. Onboarding Quick Checklist for New Users */}
        <Card className="bg-gradient-to-r from-orange-50/80 via-white to-amber-50/50 border-orange-200/80">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <h4 className="text-sm font-bold text-slate-900">
                  Langkah Awal Memulai TataDana
                </h4>
              </div>
              <p className="text-xs text-slate-600">
                Selesaikan 4 langkah berikut agar pencatatan keuanganmu otomatis dan terhubung ke Telegram.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Akun Dibuat</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Wallet Awal</span>
              </div>
              <Link
                href="/dashboard/settings?tab=telegram"
                className="flex items-center gap-1.5 text-orange-700 hover:text-orange-800 font-semibold"
              >
                <Circle className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Hubungkan Bot</span>
              </Link>
              <button
                onClick={() => setIsTxModalOpen(true)}
                className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-semibold text-left"
              >
                <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                <span>Catat Transaksi</span>
              </button>
            </div>
          </div>
        </Card>

        {/* 3. Recharts Visualizations */}
        <DashboardCharts
          categoryData={categoryChartData}
          monthlyData={monthlyChartData}
          dailyData={dailyChartData}
        />

        {/* 4. Recent Transactions & Multi-wallet Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Transactions List (2 Cols) */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>10 Transaksi Terbaru</CardTitle>
                <CardDescription>
                  Aktivitas keuangan tercatat melalui Web dan Telegram Bot.
                </CardDescription>
              </div>
              <Link
                href="/dashboard/transaksi"
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <p className="text-sm text-slate-500">Belum ada transaksi di akun kamu.</p>
                  <Button size="sm" onClick={() => setIsTxModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-1.5" />
                    Catat Transaksi Pertama
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            tx.type === 'income'
                              ? 'bg-emerald-50 text-emerald-600'
                              : tx.type === 'expense'
                              ? 'bg-red-50 text-red-600'
                              : 'bg-sky-50 text-sky-600'
                          }`}
                        >
                          {tx.type === 'income' ? (
                            <ArrowDownRight className="w-4 h-4" />
                          ) : tx.type === 'expense' ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowRightLeft className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {tx.notes || tx.category?.name || 'Transaksi Keuangan'}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span>{formatDateWIB(tx.date, 'short')}</span>
                            <span>•</span>
                            <span className="capitalize">{tx.wallet?.name || 'Utama'}</span>
                            <span>•</span>
                            <span className="font-semibold text-slate-500">
                              {tx.source === 'telegram_text'
                                ? 'Telegram'
                                : tx.source === 'receipt_photo'
                                ? 'Struk AI'
                                : 'Web'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`text-xs font-extrabold whitespace-nowrap text-right ${
                          tx.type === 'income'
                            ? 'text-emerald-600'
                            : tx.type === 'expense'
                            ? 'text-slate-900'
                            : 'text-sky-600'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}{' '}
                        {formatRupiah(tx.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Wallets Summary Column (1 Col) */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Dompet & Rekening</CardTitle>
                <Link
                  href="/dashboard/wallet"
                  className="text-xs font-bold text-orange-600 hover:text-orange-700"
                >
                  Kelola
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {wallets.length === 0 ? (
                  <div className="text-center py-6 px-3 bg-slate-50/80 rounded-xl border border-dashed border-slate-200 space-y-2">
                    <p className="text-xs text-slate-500 font-medium">Belum ada dompet dibuat.</p>
                    <Link
                      href="/dashboard/wallet"
                      className="inline-block text-xs font-bold text-orange-600 hover:text-orange-700"
                    >
                      + Buat Dompet Pertama
                    </Link>
                  </div>
                ) : (
                  wallets.map((w) => (
                    <div
                      key={w.id}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">{w.name}</span>
                          {w.is_default && (
                            <Badge variant="primary" className="text-[10px] py-0 px-1.5">
                              Utama
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          {w.type}
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-slate-900">
                        {formatRupiah(w.balance)}
                      </span>
                    </div>
                  ))
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => setIsTransferModalOpen(true)}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5" />
                  Transfer Antar Dompet
                </Button>
              </CardContent>
            </Card>

            {/* Telegram Bot Quick Card */}
            <Card className="bg-gradient-to-br from-sky-50 to-blue-50/60 border-sky-100">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-sky-800 font-bold text-xs">
                  <Send className="w-4 h-4 text-sky-500" />
                  <span>Coba di Telegram Kamu</span>
                </div>
                <p className="text-xs text-sky-950/80 leading-relaxed">
                  Buka bot Telegram, kirim pesan seperti <code className="bg-sky-100 px-1 py-0.5 rounded text-[11px] font-mono">beli makan 25rb</code> dan saldo di sini akan langsung berkurang.
                </p>
                <Link
                  href="/dashboard/settings?tab=telegram"
                  className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-800 pt-1"
                >
                  Panduan Menghubungkan Bot <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        wallets={wallets}
        categories={categories}
        onSuccess={fetchDashboardData}
      />
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        wallets={wallets}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
}
