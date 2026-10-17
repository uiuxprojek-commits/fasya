'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ReceiptText,
  PieChart,
  Target,
  Wallet,
  Settings,
  ShieldAlert,
  LogOut,
  Send,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  userRole?: string;
  planCode?: 'starter' | 'pro';
  userName?: string;
  userEmail?: string;
}

export function DashboardSidebar({
  userRole = 'user',
  planCode = 'starter',
  userName = 'Pengguna TataDana',
  userEmail = 'user@tatadana.id',
}: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Beranda', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Transaksi', href: '/dashboard/transaksi', icon: ReceiptText },
    { name: 'Laporan', href: '/dashboard/laporan', icon: PieChart },
    { name: 'Budget', href: '/dashboard/budget', icon: Target },
    { name: 'Wallet & Saldo', href: '/dashboard/wallet', icon: Wallet },
    { name: 'Pengaturan', href: '/dashboard/settings', icon: Settings },
  ];

  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  return (
    <aside className="hidden md:flex w-60 lg:w-64 border-r border-slate-200/80 bg-white flex-col shrink-0 sticky top-0 h-screen overflow-y-auto">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black text-lg shadow-sm shadow-orange-500/25">
            T
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 block leading-tight">
              Tata<span className="text-orange-500">Dana</span>
            </span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              Fintech SaaS
            </span>
          </div>
        </Link>
        <Badge variant={planCode === 'pro' ? 'pro' : 'secondary'}>
          {planCode === 'pro' ? 'PRO LIFETIME' : 'STARTER'}
        </Badge>
      </div>

      {/* Main Nav Links */}
      <nav className="p-3.5 space-y-1 flex-1">
        <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Menu Utama
        </div>
        {navigation.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150',
                isActive
                  ? 'bg-orange-50 text-orange-600 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0 transition-colors',
                  isActive ? 'text-orange-600' : 'text-slate-400'
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}

        {/* Telegram Direct Link Prompt */}
        <div className="pt-4 pb-2">
          <Link
            href="/dashboard/settings?tab=telegram"
            className="block p-3 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100 hover:border-sky-200 transition-all text-left"
          >
            <div className="flex items-center gap-2 text-sky-700 font-bold text-xs">
              <Send className="w-3.5 h-3.5 text-sky-500" />
              <span>Telegram Bot</span>
            </div>
            <p className="text-[11px] text-sky-900/80 mt-1 leading-snug">
              Catat pengeluaran semudah kirim chat ke bot Telegram.
            </p>
          </Link>
        </div>

        {/* Admin Navigation (If authorized) */}
        {isAdmin && (
          <div className="pt-3 border-t border-slate-100 space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Administrasi
            </div>
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
                pathname.startsWith('/admin')
                  ? 'bg-amber-50 text-amber-900 shadow-xs font-bold'
                  : 'text-amber-800 hover:bg-amber-50/60'
              )}
            >
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Admin Console</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Pro Upgrade CTA if Starter */}
      {planCode === 'starter' && (
        <div className="p-3 mx-3 mb-2 rounded-xl bg-orange-50/70 border border-orange-100">
          <div className="flex items-center gap-1.5 text-orange-800 font-bold text-xs">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>Upgrade ke Pro</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1">
            Rp99.000 sekali bayar. Nikmati OCR struk & export data unlimited!
          </p>
          <Link
            href="/dashboard/settings?tab=subscription"
            className="mt-2 block text-center text-xs font-bold py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            Buka Fitur Pro
          </Link>
        </div>
      )}

      {/* User Profile Footer */}
      <div className="p-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
            <p className="text-[10px] text-slate-400 truncate">{userEmail}</p>
          </div>
        </div>
        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            title="Keluar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}
