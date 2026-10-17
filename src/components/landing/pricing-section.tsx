'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Sparkles, ArrowRight } from 'lucide-react';

export function PricingSection() {
  const [billingCycle, setBillingCycle] = React.useState<'monthly' | 'lifetime'>('lifetime');

  return (
    <section id="harga" className="py-20 bg-slate-50/60 border-t border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="primary" className="text-xs">
            💰 Investasi Finansial Terbaik
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Pilihan Paket Sederhana & Transparan
          </h2>
          <p className="text-sm text-slate-600">
            Pilih paket yang paling sesuai dengan kebutuhanmu. Tidak ada biaya tersembunyi atau potongan liar.
          </p>

          {/* Pricing Cycle Toggle */}
          <div className="pt-2 flex justify-center">
            <div className="p-1 bg-slate-200/70 rounded-2xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Starter Bulanan
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('lifetime')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  billingCycle === 'lifetime'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Pro Sekali Bayar (Populer)
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Starter Plan */}
          <Card className="p-8 border-slate-200 flex flex-col justify-between bg-white">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">Paket Starter</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Untuk kamu yang ingin mencoba kemudahan mencatat keuangan via Telegram.
                </p>
              </div>

              <div>
                <span className="text-4xl font-black text-slate-900">Rp 49.000</span>
                <span className="text-xs text-slate-500 font-bold"> / bulan</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-700 font-medium border-t border-slate-100 pt-6">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  Catat transaksi via teks Telegram
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  Maksimal 50 transaksi per bulan
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  Maksimal 3 dompet aktif
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  Maksimal 5 kategori budget
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  Ringkasan laporan bulanan web
                </li>
                <li className="flex items-center gap-2.5 text-slate-400">
                  <XCircle className="w-4 h-4 text-slate-300 shrink-0" />
                  Tanpa foto struk AI
                </li>
                <li className="flex items-center gap-2.5 text-slate-400">
                  <XCircle className="w-4 h-4 text-slate-300 shrink-0" />
                  Tanpa AI Financial Advisor
                </li>
                <li className="flex items-center gap-2.5 text-slate-400">
                  <XCircle className="w-4 h-4 text-slate-300 shrink-0" />
                  Tanpa ekspor PDF & XLSX
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <Link href="/register" className="block w-full">
                <Button variant="outline" className="w-full font-bold">
                  Pilih Starter
                </Button>
              </Link>
            </div>
          </Card>

          {/* Pro Plan */}
          <Card className="p-8 border-orange-300 bg-gradient-to-b from-orange-50/60 via-white to-amber-50/40 flex flex-col justify-between relative shadow-xl shadow-orange-500/10">
            <div className="absolute -top-3.5 right-6">
              <Badge variant="pro" className="py-1 px-3 text-xs shadow-md">
                ⭐ LIFETIME — SEKALI BAYAR
              </Badge>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-500" /> Paket Pro
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Solusi komprehensif tanpa pusing tagihan bulanan berulang.
                </p>
              </div>

              <div>
                <span className="text-4xl font-black text-orange-600">Rp 99.000</span>
                <span className="text-xs text-orange-950/70 font-extrabold"> / sekali bayar (aktif selamanya)</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-800 font-semibold border-t border-orange-100 pt-6">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                  <strong>Seluruh fitur paket Starter</strong>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                  Transaksi tak terbatas (Unlimited)
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                  Dompet & Kategori unlimited
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                  Input foto struk belanja dengan AI Vision OCR
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                  Laporan lengkap & filter pencarian lanjutan
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                  Ekspor PDF & XLSX tak terbatas
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                  AI Financial Advisor & pengingat custom
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                  Prioritas dukungan pelanggan
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <Link href="/register" className="block w-full">
                <Button variant="primary" className="w-full font-bold shadow-md shadow-orange-500/25">
                  Dapatkan Akses Pro Sekarang
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
