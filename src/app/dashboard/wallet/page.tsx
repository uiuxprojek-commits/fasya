'use client';

import * as React from 'react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { TransferModal } from '@/components/dashboard/transfer-modal';
import { Wallet } from '@/types';
import { formatRupiah } from '@/lib/utils';
import {
  Wallet as WalletIcon,
  CreditCard,
  Smartphone,
  Banknote,
  Plus,
  ArrowRightLeft,
  CheckCircle2,
  Archive,
} from 'lucide-react';

export default function WalletPage() {
  const [wallets, setWallets] = React.useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isNewWalletModalOpen, setIsNewWalletModalOpen] = React.useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = React.useState(false);

  // New Wallet Form State
  const [walletName, setWalletName] = React.useState('');
  const [walletType, setWalletType] = React.useState<'cash' | 'bank' | 'ewallet'>('bank');
  const [initialBalance, setInitialBalance] = React.useState('');
  const [isDefault, setIsDefault] = React.useState(false);
  const [formError, setFormError] = React.useState('');

  const fetchWallets = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/wallets');
      const data = await res.json();
      setWallets(data.wallets || []);
    } catch (err) {
      console.error('Error fetching wallets:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const numBal = parseFloat(initialBalance.replace(/[^0-9]/g, '')) || 0;

    try {
      const res = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: walletName,
          type: walletType,
          initialBalance: numBal,
          isDefault,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat dompet');
      }

      setIsNewWalletModalOpen(false);
      setWalletName('');
      setInitialBalance('');
      setIsDefault(false);
      fetchWallets();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
    }
  };

  const getWalletIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return <CreditCard className="w-5 h-5 text-blue-500" />;
      case 'ewallet':
        return <Smartphone className="w-5 h-5 text-emerald-500" />;
      default:
        return <Banknote className="w-5 h-5 text-orange-500" />;
    }
  };

  const totalBalance = wallets.reduce((acc, w) => acc + Number(w.balance), 0);

  return (
    <div className="flex-1 pb-8">
      <DashboardHeader
        title="Dompet & Rekening Keuangan"
        subtitle="Kelola rekening bank, saldo tunai, dan e-wallet kamu dalam satu ekosistem terpadu."
      />

      <main className="p-3.5 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 min-w-0">
        {/* Total Assets Summary */}
        <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-slate-950/10 min-w-0">
          <div className="min-w-0">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Kekayaan Bersih (Net Worth)
            </span>
            <div className="text-2xl sm:text-3xl font-black mt-1 tracking-tight text-white truncate">
              {formatRupiah(totalBalance)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Tersebar di {wallets.length} dompet dan rekening aktif
            </p>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTransferModalOpen(true)}
              className="bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700 text-xs flex-1 sm:flex-initial"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5" />
              Transfer Antar Dompet
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsNewWalletModalOpen(true)}
              className="text-xs font-bold flex-1 sm:flex-initial"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Tambah Dompet
            </Button>
          </div>
        </div>

        {/* Wallets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {wallets.map((wallet) => (
            <Card key={wallet.id} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      {getWalletIcon(wallet.type)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{wallet.name}</h4>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {wallet.type === 'bank'
                          ? 'Rekening Bank'
                          : wallet.type === 'ewallet'
                          ? 'E-Wallet'
                          : 'Uang Tunai'}
                      </span>
                    </div>
                  </div>

                  {wallet.is_default && (
                    <Badge variant="primary" className="text-[10px]">
                      Default
                    </Badge>
                  )}
                </div>

                <div className="mt-6">
                  <span className="text-[11px] font-semibold text-slate-400">Saldo Tersedia:</span>
                  <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                    {formatRupiah(wallet.balance)}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">
                  ID: <code className="font-mono">{wallet.id.slice(0, 8)}</code>
                </span>
                <button
                  onClick={() => setIsTransferModalOpen(true)}
                  className="font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                >
                  Kirim Saldo
                </button>
              </div>
            </Card>
          ))}
        </div>
      </main>

      {/* New Wallet Modal */}
      <Modal
        isOpen={isNewWalletModalOpen}
        onClose={() => setIsNewWalletModalOpen(false)}
        title="Tambah Dompet Baru"
        description="Buat rekening bank, e-wallet, atau pos dompet tunai baru kamu."
      >
        <form onSubmit={handleCreateWallet} className="space-y-4 mt-2">
          <div>
            <Input
              label="Nama Dompet / Bank"
              placeholder="Contoh: BCA Prioritas, GoPay, Dompet Saku"
              value={walletName}
              onChange={(e) => setWalletName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Jenis Dompet
            </label>
            <select
              value={walletType}
              onChange={(e) => setWalletType(e.target.value as 'cash' | 'bank' | 'ewallet')}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
            >
              <option value="bank">Rekening Bank</option>
              <option value="ewallet">E-Wallet</option>
              <option value="cash">Uang Tunai</option>
            </select>
          </div>

          <div>
            <Input
              label="Saldo Awal (Rp)"
              type="number"
              placeholder="Contoh: 500000"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isDefaultWallet"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded text-orange-500 focus:ring-orange-500"
            />
            <label htmlFor="isDefaultWallet" className="text-xs text-slate-700 font-medium cursor-pointer">
              Jadikan sebagai dompet utama default transaksi
            </label>
          </div>

          {formError && (
            <p className="text-xs text-red-500 font-semibold">{formError}</p>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNewWalletModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary">
              Simpan Dompet
            </Button>
          </div>
        </form>
      </Modal>

      {/* Transfer Modal */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        wallets={wallets}
        onSuccess={fetchWallets}
      />
    </div>
  );
}
