'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wallet } from '@/types';
import { ArrowRightLeft } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  onSuccess: () => void;
}

export function TransferModal({
  isOpen,
  onClose,
  wallets,
  onSuccess,
}: TransferModalProps) {
  const [fromWalletId, setFromWalletId] = React.useState('');
  const [toWalletId, setToWalletId] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  React.useEffect(() => {
    if (wallets.length >= 2) {
      if (!fromWalletId) setFromWalletId(wallets[0].id);
      if (!toWalletId) setToWalletId(wallets[1].id);
    }
  }, [wallets, fromWalletId, toWalletId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const numAmount = parseFloat(amount.replace(/[^0-9]/g, ''));

    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Nominal transfer harus lebih besar dari 0');
      return;
    }

    if (fromWalletId === toWalletId) {
      setErrorMessage('Dompet asal dan tujuan tidak boleh sama');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/wallets/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromWalletId,
          toWalletId,
          amount: numAmount,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses transfer');
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

  const selectedFromWallet = wallets.find((w) => w.id === fromWalletId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer Antar Dompet"
      description="Pindahkan saldo antar dompet atau rekening kamu secara instan dan atomik."
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        {/* Source Wallet */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Dari Dompet (Sumber)
          </label>
          <select
            value={fromWalletId}
            onChange={(e) => setFromWalletId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} (Tersedia: {formatRupiah(w.balance)})
              </option>
            ))}
          </select>
        </div>

        {/* Destination Wallet */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Ke Dompet (Tujuan)
          </label>
          <select
            value={toWalletId}
            onChange={(e) => setToWalletId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            {wallets
              .filter((w) => w.id !== fromWalletId)
              .map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} (Saldo saat ini: {formatRupiah(w.balance)})
                </option>
              ))}
          </select>
        </div>

        {/* Nominal */}
        <div>
          <Input
            label="Nominal Transfer (Rp)"
            type="number"
            placeholder="Contoh: 100000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            helperText={
              selectedFromWallet
                ? `Maksimal transfer: ${formatRupiah(selectedFromWallet.balance)}`
                : undefined
            }
          />
        </div>

        {/* Notes */}
        <div>
          <Input
            label="Catatan (Opsional)"
            placeholder="Contoh: Top up e-wallet dari BCA"
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
            <ArrowRightLeft className="w-4 h-4 mr-1.5" />
            Kirim Transfer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
