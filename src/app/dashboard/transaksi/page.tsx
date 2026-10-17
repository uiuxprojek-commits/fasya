'use client';

import * as React from 'react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TransactionModal } from '@/components/dashboard/transaction-modal';
import { Transaction, Wallet, Category } from '@/types';
import { formatRupiah, formatDateWIB } from '@/lib/utils';
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  Plus,
  Search,
  Filter,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Receipt,
  FileText,
} from 'lucide-react';

export default function TransaksiPage() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [wallets, setWallets] = React.useState<Wallet[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  // Filters
  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<string>('');
  const [walletFilter, setWalletFilter] = React.useState<string>('');
  const [page, setPage] = React.useState(1);
  const limit = 15;

  const [isTxModalOpen, setIsTxModalOpen] = React.useState(false);
  const [expandedTxId, setExpandedTxId] = React.useState<string | null>(null);

  const fetchTransactions = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const offset = (page - 1) * limit;
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });

      if (typeFilter) params.append('type', typeFilter);
      if (walletFilter) params.append('walletId', walletFilter);
      if (search) params.append('search', search);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      const data = await res.json();
      setTransactions(data.transactions || []);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, typeFilter, walletFilter, search]);

  React.useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  React.useEffect(() => {
    fetch('/api/wallets')
      .then((r) => r.json())
      .then((d) => setWallets(d.wallets || []));

    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []));

    const handleOpenModal = () => setIsTxModalOpen(true);
    window.addEventListener('tatadana:open-tx-modal', handleOpenModal);

    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('action') === 'new') {
        setIsTxModalOpen(true);
      }
    }

    return () => window.removeEventListener('tatadana:open-tx-modal', handleOpenModal);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah kamu yakin ingin menghapus transaksi ini? Saldo dompet akan dihitung ulang secara otomatis.')) {
      return;
    }

    try {
      const res = await fetch(`/api/transactions?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal menghapus transaksi');
        return;
      }
      fetchTransactions();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Terjadi kesalahan saat menghapus transaksi');
    }
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="flex-1 pb-16">
      <DashboardHeader
        title="Daftar Transaksi"
        subtitle="Kelola dan telusuri seluruh riwayat pemasukan, pengeluaran, dan transfer kamu."
        onOpenNewTransaction={() => setIsTxModalOpen(true)}
      />

      <main className="p-6 max-w-7xl mx-auto space-y-5">
        {/* Filter and Search Bar */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Cari catatan transaksi..."
                leftIcon={<Search className="w-4 h-4" />}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-orange-500 focus:outline-none"
              >
                <option value="">Semua Tipe</option>
                <option value="expense">Pengeluaran</option>
                <option value="income">Pemasukan</option>
                <option value="transfer">Transfer</option>
              </select>

              <select
                value={walletFilter}
                onChange={(e) => {
                  setWalletFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-orange-500 focus:outline-none"
              >
                <option value="">Semua Dompet</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Transaction Content: Mobile List View (< md) + Desktop Table (>= md) */}
        <Card className="overflow-hidden p-0">
          {/* Mobile Card List View (< md) */}
          <div className="md:hidden divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Memuat daftar transaksi...
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Tidak ada transaksi yang cocok dengan filter.
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="p-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
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
                          {tx.notes || (tx.type === 'income' ? 'Pemasukan' : tx.type === 'expense' ? 'Pengeluaran' : 'Transfer')}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-slate-500 font-medium">
                          <span>{formatDateWIB(tx.date, 'short')}</span>
                          <span>•</span>
                          <span className="font-semibold text-slate-700">{tx.wallet?.name || 'Utama'}</span>
                          {tx.category?.name && (
                            <>
                              <span>•</span>
                              <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                                {tx.category.name}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-xs sm:text-sm font-black ${
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
                      <div className="flex items-center justify-end gap-1.5 mt-1.5">
                        <span className="text-[9px] font-semibold text-slate-400 uppercase px-1.5 py-0.5 rounded bg-slate-100">
                          {tx.source === 'telegram_text'
                            ? 'Bot'
                            : tx.source === 'receipt_photo'
                            ? 'OCR'
                            : tx.source === 'telegram_voice'
                            ? 'VN'
                            : 'Web'}
                        </span>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          aria-label="Hapus Transaksi"
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Receipt Items on Mobile */}
                  {tx.items && tx.items.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setExpandedTxId(expandedTxId === tx.id ? null : tx.id)}
                        className="text-[11px] text-orange-600 font-bold flex items-center gap-1"
                      >
                        <Receipt className="w-3 h-3" />
                        {expandedTxId === tx.id ? 'Sembunyikan' : 'Lihat'} {tx.items.length} rincian struk
                      </button>
                      {expandedTxId === tx.id && (
                        <div className="mt-2 p-2.5 rounded-xl bg-orange-50/50 border border-orange-100 space-y-1 text-xs">
                          {tx.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-slate-700 text-[11px]">
                              <span>{item.name} ({item.quantity}x)</span>
                              <span className="font-semibold">{formatRupiah(item.total_price)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Tanggal (WIB)</th>
                  <th className="py-3 px-4">Tipe</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Dompet</th>
                  <th className="py-3 px-4">Catatan / Detail</th>
                  <th className="py-3 px-4">Sumber</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Memuat daftar transaksi...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      Tidak ada transaksi yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <React.Fragment key={tx.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-600">
                          {formatDateWIB(tx.date, 'short')}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 font-bold ${
                              tx.type === 'income'
                                ? 'text-emerald-600'
                                : tx.type === 'expense'
                                ? 'text-red-600'
                                : 'text-sky-600'
                            }`}
                          >
                            {tx.type === 'income' ? (
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            ) : tx.type === 'expense' ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            )}
                            <span className="capitalize">
                              {tx.type === 'income' ? 'Pemasukan' : tx.type === 'expense' ? 'Pengeluaran' : 'Transfer'}
                            </span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Badge variant="secondary">{tx.category?.name || 'Lain-lain'}</Badge>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-800">
                          {tx.wallet?.name || 'Utama'}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate font-medium">
                          {tx.notes || '-'}
                          {tx.items && tx.items.length > 0 && (
                            <button
                              onClick={() =>
                                setExpandedTxId(expandedTxId === tx.id ? null : tx.id)
                              }
                              className="ml-2 text-[10px] text-orange-600 font-bold underline cursor-pointer"
                            >
                              ({tx.items.length} item)
                            </button>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="text-[10px] font-semibold text-slate-500 uppercase px-2 py-0.5 rounded-md bg-slate-100">
                            {tx.source === 'telegram_text'
                              ? 'Telegram'
                              : tx.source === 'receipt_photo'
                              ? 'Struk AI'
                              : tx.source === 'telegram_voice'
                              ? 'Voice'
                              : 'Web'}
                          </span>
                        </td>
                        <td
                          className={`py-3.5 px-4 whitespace-nowrap text-right font-extrabold ${
                            tx.type === 'income'
                              ? 'text-emerald-600'
                              : tx.type === 'expense'
                              ? 'text-slate-900'
                              : 'text-sky-600'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}{' '}
                          {formatRupiah(tx.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleDelete(tx.id)}
                            title="Hapus Transaksi"
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Receipt Items Row */}
                      {expandedTxId === tx.id && tx.items && tx.items.length > 0 && (
                        <tr className="bg-orange-50/40">
                          <td colSpan={8} className="p-4">
                            <div className="bg-white p-3 rounded-xl border border-orange-200">
                              <h5 className="text-xs font-bold text-orange-800 mb-2 flex items-center gap-1.5">
                                <Receipt className="w-3.5 h-3.5" /> Rincian Item Struk Belanja
                              </h5>
                              <div className="space-y-1 divide-y divide-slate-100 text-xs">
                                {tx.items.map((item, idx) => (
                                  <div key={idx} className="pt-1.5 flex justify-between text-slate-700">
                                    <span>
                                      {item.name} <span className="text-slate-400">({item.quantity}x)</span>
                                    </span>
                                    <span className="font-semibold">{formatRupiah(item.total_price)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Menampilkan {transactions.length} dari {totalCount} transaksi
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="px-2 font-bold text-slate-700">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </Card>
      </main>

      {/* Modal */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        wallets={wallets}
        categories={categories}
        onSuccess={fetchTransactions}
      />
    </div>
  );
}
