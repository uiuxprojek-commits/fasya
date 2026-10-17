'use client';

import * as React from 'react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { ProgressBar } from '@/components/ui/progress-bar';
import { formatRupiah } from '@/lib/utils';
import { Plus, Target, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';

interface BudgetItem {
  id: string;
  categoryName: string;
  categoryIcon: string;
  monthlyAmount: number;
  spentAmount: number;
}

export default function BudgetPage() {
  const [budgets, setBudgets] = React.useState<BudgetItem[]>([
    {
      id: '1',
      categoryName: 'Makanan & Minuman',
      categoryIcon: '🍔',
      monthlyAmount: 1500000,
      spentAmount: 1250000, // 83% - Warning amber
    },
    {
      id: '2',
      categoryName: 'Transportasi',
      categoryIcon: '🚗',
      monthlyAmount: 600000,
      spentAmount: 380000, // 63% - Green
    },
    {
      id: '3',
      categoryName: 'Tagihan & Utilitas',
      categoryIcon: '⚡',
      monthlyAmount: 500000,
      spentAmount: 520000, // 104% - Red alert
    },
    {
      id: '4',
      categoryName: 'Belanja Harian',
      categoryIcon: '🛒',
      monthlyAmount: 800000,
      spentAmount: 350000, // 43% - Green
    },
  ]);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState('');
  const [newAmount, setNewAmount] = React.useState('');

  const handleAddBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(newAmount);
    if (!newCategoryName || isNaN(amountNum) || amountNum <= 0) return;

    setBudgets([
      ...budgets,
      {
        id: String(Date.now()),
        categoryName: newCategoryName,
        categoryIcon: '🏷️',
        monthlyAmount: amountNum,
        spentAmount: 0,
      },
    ]);
    setIsModalOpen(false);
    setNewCategoryName('');
    setNewAmount('');
  };

  const totalBudget = budgets.reduce((acc, b) => acc + b.monthlyAmount, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spentAmount, 0);
  const totalRemaining = Math.max(totalBudget - totalSpent, 0);
  const overallPercentage = Math.round((totalSpent / totalBudget) * 100);

  return (
    <div className="flex-1 pb-16">
      <DashboardHeader
        title="Manajemen Budget Bulanan"
        subtitle="Kendalikan pengeluaranmu per kategori dengan sistem peringatan otomatis 80% dan 100%."
      />

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Overview Budget Card */}
        <Card className="p-6 bg-gradient-to-br from-white to-slate-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Budget Alokasi Bulan Ini
              </span>
              <div className="mt-1 text-2xl font-extrabold text-slate-900">
                {formatRupiah(totalBudget)}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs text-slate-500 font-medium block">Sisa Anggaran:</span>
                <span className="text-base font-extrabold text-emerald-600">
                  {formatRupiah(totalRemaining)}
                </span>
              </div>
              <Button size="sm" onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Tambah Budget
              </Button>
            </div>
          </div>

          <ProgressBar value={totalSpent} max={totalBudget} showLabel />
        </Card>

        {/* Budget Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const percent = Math.round((b.spentAmount / b.monthlyAmount) * 100);
            const remaining = Math.max(b.monthlyAmount - b.spentAmount, 0);
            const isOver = percent >= 100;
            const isWarning = percent >= 80 && percent < 100;

            return (
              <Card key={b.id} className="p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-xl flex items-center justify-center shrink-0">
                      {b.categoryIcon}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{b.categoryName}</h4>
                      <p className="text-xs text-slate-400 font-medium">
                        Limit: {formatRupiah(b.monthlyAmount)}
                      </p>
                    </div>
                  </div>

                  {isOver ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                      <AlertTriangle className="w-3.5 h-3.5" /> Over Budget
                    </span>
                  ) : isWarning ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <AlertTriangle className="w-3.5 h-3.5" /> Capai 80%
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle className="w-3.5 h-3.5" /> Aman
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>Terpakai: {formatRupiah(b.spentAmount)}</span>
                    <span className={isOver ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-slate-800'}>
                      {percent}% ({formatRupiah(remaining)} tersisa)
                    </span>
                  </div>
                  <ProgressBar value={b.spentAmount} max={b.monthlyAmount} />
                </div>
              </Card>
            );
          })}
        </div>
      </main>

      {/* Add Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah Batas Budget Kategori"
        description="Tentukan batas anggaran bulanan untuk mengontrol pengeluaran."
      >
        <form onSubmit={handleAddBudget} className="space-y-4 mt-2">
          <div>
            <Input
              label="Nama Kategori"
              placeholder="Contoh: Belanja Online"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              label="Batas Budget Bulanan (Rp)"
              type="number"
              placeholder="Contoh: 1000000"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              required
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary">
              Simpan Budget
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
