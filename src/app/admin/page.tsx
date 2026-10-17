'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatRupiah, formatDateWIB } from '@/lib/utils';
import {
  Users,
  CreditCard,
  Cpu,
  Send,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminOverviewPage() {
  const [stats, setStats] = React.useState({
    totalUsers: 1420,
    activeUsers: 890,
    starterCount: 1180,
    proCount: 240,
    totalRevenue: 23760000,
    pendingPayments: 3,
    telegramLinkedCount: 780,
    aiRequestsToday: 4120,
  });

  return (
    <div className="flex-1 pb-16">
      {/* Admin Top Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
        <div>
          <h1 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Pusat Kontrol TataDana SaaS
          </h1>
          <p className="text-[11px] text-slate-400">
            Monitoring pengguna, status Telegram, integrasi AI, dan validasi transaksi keuangan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="bg-emerald-950/60 text-emerald-400 border-emerald-800">
            Sistem Normal (WIB)
          </Badge>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* 4 Core Admin Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Pengguna</span>
              <Users className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white mt-2">
              {stats.totalUsers.toLocaleString('id-ID')}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              <span className="text-emerald-400 font-semibold">{stats.activeUsers} aktif</span> bulan ini
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Akun Pro (Lifetime)</span>
              <CreditCard className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 mt-2">
              {stats.proCount}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Starter: {stats.starterCount} pengguna
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Omset</span>
              <span className="text-xs font-extrabold text-emerald-400">IDR</span>
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-2">
              {formatRupiah(stats.totalRevenue)}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {stats.pendingPayments} pembayaran manual verifikasi
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Telegram Terhubung</span>
              <Send className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black text-white mt-2">
              {stats.telegramLinkedCount}
            </div>
            <div className="mt-1 text-xs text-sky-400 font-semibold">
              {( (stats.telegramLinkedCount / stats.totalUsers) * 100 ).toFixed(1)}% penetrasi bot
            </div>
          </div>
        </div>

        {/* AI Multi-Provider Status & Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  Status Integrasi AI Multi-Provider
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Routing mode: <span className="text-amber-400 font-bold">Failover Otomatis</span> (Gemini ➔ OpenAI ➔ DeepSeek ➔ Heuristik)
                </p>
              </div>
              <Link href="/admin/ai-providers">
                <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs">
                  Kelola Provider
                </Button>
              </Link>
            </div>

            <div className="space-y-3 pt-2">
              {[
                { name: 'Google Gemini 1.5 Flash', status: 'Aktif (Primary)', priority: 'P1', cost: 'Rp 45.000 / bln', latency: '650ms' },
                { name: 'OpenAI GPT-4o mini & Whisper', status: 'Aktif (Failover 1)', priority: 'P2', cost: 'Rp 110.000 / bln', latency: '820ms' },
                { name: 'DeepSeek Chat V3', status: 'Siaga (Failover 2)', priority: 'P3', cost: 'Rp 20.000 / bln', latency: '1200ms' },
              ].map((prov, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold text-white">{prov.name}</span>
                      <span className="ml-2 text-[10px] text-amber-400/90 font-mono font-semibold">{prov.priority}</span>
                      <p className="text-[11px] text-slate-400">{prov.status}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-300 font-medium block">{prov.cost}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Avg Latency: {prov.latency}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Support Actions */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white">Aksi Cepat Admin</h3>
            <div className="space-y-2.5">
              <Link href="/admin/payments" className="block">
                <div className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors">
                  <div className="flex justify-between items-center text-xs font-bold text-white">
                    <span>Verifikasi Transfer Manual</span>
                    <Badge variant="warning">{stats.pendingPayments} Menunggu</Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tinjau bukti transfer bank dan setujui aktivasi Pro.
                  </p>
                </div>
              </Link>

              <Link href="/admin/users" className="block">
                <div className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors">
                  <div className="flex justify-between items-center text-xs font-bold text-white">
                    <span>Pencarian Akun Pengguna</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Cari pengguna, audit saldo, dan troubleshooting via impersonation mode.
                  </p>
                </div>
              </Link>

              <Link href="/admin/audit-logs" className="block">
                <div className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors">
                  <div className="flex justify-between items-center text-xs font-bold text-white">
                    <span>Lihat Rekam Jejak Audit</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Setiap tindakan administratif dicatat secara permanen.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
