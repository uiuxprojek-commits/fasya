'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Receipt,
  Cpu,
  BarChart3,
  Send,
  Download,
  ScrollText,
  Sliders,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

export function AdminSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Ringkasan Sistem', href: '/admin', icon: LayoutDashboard },
    { name: 'Pengguna', href: '/admin/users', icon: Users },
    { name: 'Langganan', href: '/admin/subscriptions', icon: CreditCard },
    { name: 'Pembayaran', href: '/admin/payments', icon: Receipt },
    { name: 'AI Providers', href: '/admin/ai-providers', icon: Cpu },
    { name: 'Log Pemakaian AI', href: '/admin/ai-usage', icon: BarChart3 },
    { name: 'Monitoring Telegram', href: '/admin/telegram', icon: Send },
    { name: 'Ekspor Data Support', href: '/admin/exports', icon: Download },
    { name: 'Audit Logs', href: '/admin/audit-logs', icon: ScrollText },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-amber-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white block leading-tight">
              Admin<span className="text-amber-400">Console</span>
            </span>
            <span className="text-[10px] text-amber-400/90 font-semibold uppercase tracking-wider block">
              TataDana SaaS
            </span>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="p-3 space-y-1 flex-1">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Modul Kontrol
        </div>
        {menuItems.map((item) => {
          const isActive =
            item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all',
                isActive
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0',
                  isActive ? 'text-amber-400' : 'text-slate-500'
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Back to User Dashboard */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke User Dashboard</span>
        </Link>
      </div>
    </aside>
  );
}
