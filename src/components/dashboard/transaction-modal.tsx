'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wallet, Category } from '@/types';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  categories: Category[];
  onSuccess: () => void;
}

export function TransactionModal({
  isOpen,
  onClose,
  wallets,
  categories,
  onSuccess,
}: TransactionModalProps) {
  const [type, setType] = React.useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = React.useState('');
  const [walletId, setWalletId] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 16));
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  React.useEffect(() => {
    if (wallets.length > 0 && !walletId) {
      const defaultW = wallets.find((w) => w.is_default) || wallets[0];
      setWalletId(defaultW.id);
    }
  }, [wallets, walletId]);

  const filteredCategories = categories.filter((c) => c.type === type);

  React.useEffect(() => {
    if (filteredCategories.length > 0) {
      setCategoryId(filteredCategories[0].id);
    } else {
      setCategoryId('');
    }
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const numAmount = parseFloat(amount.replace(/[^0-9]/g, ''));

    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Nominal harus lebih besar dari 0');
      return;
    }

    if (!walletId) {
      setErrorMessage('Pilih dompet tujuan');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          amount: numAmount,
          walletId,
          categoryId: categoryId || null,
          notes,
          date: new Date(date).toISOString(),
          source: 'web',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan transaksi');
      }

      onSuccess();
      onClose();
      setAmount('');
      setNotes('');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catat Transaksi Baru"
      description="Masukkan rincian transaksi pengeluaran atau pemasukan kamu."
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        {/* Type Toggle: Pengeluaran vs Pemasukan */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all min-h-[44px] ${
              type === 'expense'
                ? 'bg-red-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all min-h-[44px] ${
              type === 'income'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            Pemasukan
          </button>
        </div>

        {/* Nominal Input */}
        <div>
          <Input
            label="Nominal (Rp)"
            type="number"
            placeholder="Contoh: 50000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            autoFocus
          />
        </div>

        {/* Wallet Selection */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Dompet
          </label>
          <select
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} (Saldo: Rp {Number(w.balance).toLocaleString('id-ID')})
              </option>
            ))}
          </select>
        </div>

        {/* Category Selection */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Kategori
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Time */}
        <div>
          <Input
            label="Tanggal & Waktu"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {/* Notes */}
        <div>
          <Input
            label="Catatan (Opsional)"
            placeholder="Contoh: Beli makan siang soto betawi"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {errorMessage && (
          <p className="text-xs text-red-500 font-semibold">{errorMessage}</p>
        )}

        <div className="pt-3 flex flex-col-reverse sm:flex-row justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="w-full sm:w-auto min-h-[42px]">
            Batal
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} className="w-full sm:w-auto min-h-[42px]">
            Simpan Transaksi
          </Button>
        </div>
      </form>
    </Modal>
  );
}
