'use client';

import * as React from 'react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { ProgressBar } from '@/components/ui/progress-bar';
import { formatRupiah } from '@/lib/utils';
import { Category } from '@/types';
import { Plus, Target, AlertTriangle, CheckCircle, Trash2, Tag, RefreshCw } from 'lucide-react';

interface BudgetItem {
  id: string;
  category_id: string;
  monthly_amount: number;
  spent_amount: number;
  month_year: string;
  category?: Category;
}

export default function BudgetPage() {
  const [budgets, setBudgets] = React.useState<BudgetItem[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState('');

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState('');
  const [newAmount, setNewAmount] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState('');

  const fetchBudgetsAndCategories = React.useCallback(async () => {
    setIsLoading(true);
    setFetchError('');
    try {
      const [budgetsRes, categoriesRes] = await Promise.all([
        fetch('/api/budgets'),
        fetch('/api/categories'),
      ]);

      const budgetsData = await budgetsRes.json();
      const categoriesData = await categoriesRes.json();

      if (!budgetsRes.ok) throw new Error(budgetsData.error || 'Gagal memuat anggaran');
      if (!categoriesRes.ok) throw new Error(categoriesData.error || 'Gagal memuat kategori');

      setBudgets(budgetsData.budgets || []);
      const expenseCats = (categoriesData.categories || []).filter(
        (c: Category) => c.type === 'expense'
      );
      setCategories(expenseCats);
      if (expenseCats.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(expenseCats[0].id);
      }
    } catch (err: unknown) {
      console.error('Error fetching budgets:', err);
      setFetchError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategoryId]);

  React.useEffect(() => {
    fetchBudgetsAndCategories();
  }, [fetchBudgetsAndCategories]);

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const amountNum = parseFloat(newAmount.replace(/[^0-9]/g, ''));

    if (!selectedCategoryId) {
      setFormError('Pilih kategori pengeluaran');
      return;
    }

    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError('Batas budget harus lebih besar dari 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: selectedCategoryId,
          monthlyAmount: amountNum,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan anggaran');
      }

      setIsModalOpen(false);
      setNewAmount('');
      fetchBudgetsAndCategories();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBudget = async (id: string, name: string) => {
    if (!confirm(`Hapus batas budget untuk kategori "${name}"?`)) return;

    try {
      const res = await fetch(`/api/budgets?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Gagal menghapus budget');
      }
      fetchBudgetsAndCategories();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus budget');
    }
  };

  const totalBudget = budgets.reduce((acc, b) => acc + Number(b.monthly_amount), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + Number(b.spent_amount), 0);
  const totalRemaining = Math.max(totalBudget - totalSpent, 0);

  return (
    <div className="flex-1 pb-16">
      <DashboardHeader
        title="Manajemen Budget Bulanan"
        subtitle="Kendalikan pengeluaranmu per kategori dengan sistem peringatan otomatis 80% dan 100%."
      />

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {fetchError && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
            <span>{fetchError}</span>
            <Button size="sm" variant="outline" onClick={fetchBudgetsAndCategories}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Coba Lagi
            </Button>
          </div>
        )}

        {/* Overview Budget Card */}
        <Card className="p-6 bg-gradient-to-br from-white to-slate-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Alokasi Budget Bulan Ini
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

          <ProgressBar value={totalSpent} max={totalBudget > 0 ? totalBudget : 1} showLabel />
        </Card>

        {/* Budget Categories Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-xs text-slate-400 font-medium">
            Memuat daftar anggaran...
          </div>
        ) : budgets.length === 0 ? (
          <Card className="p-10 text-center border-dashed">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Belum Ada Pos Anggaran</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Buat batasan anggaran untuk pos pengeluaran seperti Makanan, Transportasi, atau Belanja agar keuanganmu tetap aman dan terkontrol.
            </p>
            <Button size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Buat Budget Pertama
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.map((b) => {
              const monthly = Number(b.monthly_amount);
              const spent = Number(b.spent_amount);
              const percent = Math.round((spent / (monthly || 1)) * 100);
              const remaining = Math.max(monthly - spent, 0);
              const isOver = percent >= 100;
              const isWarning = percent >= 80 && percent < 100;
              const catName = b.category?.name || 'Kategori Umum';

              return (
                <Card key={b.id} className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-xl flex items-center justify-center shrink-0">
                        <Tag className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{catName}</h4>
                        <p className="text-xs text-slate-400 font-medium">
                          Limit: {formatRupiah(monthly)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
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

                      <button
                        onClick={() => handleDeleteBudget(b.id, catName)}
                        title="Hapus Budget"
                        className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span>Terpakai: {formatRupiah(spent)}</span>
                      <span className={isOver ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-slate-800'}>
                        {percent}% ({formatRupiah(remaining)} tersisa)
                      </span>
                    </div>
                    <ProgressBar value={spent} max={monthly} />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah Batas Budget Kategori"
        description="Tentukan batas anggaran bulanan untuk mengontrol pengeluaran."
      >
        <form onSubmit={handleAddBudget} className="space-y-4 mt-2">
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Kategori Pengeluaran
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Input
              label="Batas Budget Bulanan (Rp)"
              type="number"
              placeholder="Contoh: 1500000"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              required
            />
          </div>

          {formError && (
            <p className="text-xs text-red-500 font-semibold">{formError}</p>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Simpan Budget
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
