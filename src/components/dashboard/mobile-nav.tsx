'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ReceiptText,
  Target,
  Wallet,
  Settings,
  PieChart,
  Plus,
  Send,
  X,
  LogOut,
  ShieldAlert,
  Sparkles,
  Menu,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';

interface MobileNavProps {
  userRole?: string;
  planCode?: 'starter' | 'pro';
  userName?: string;
  userEmail?: string;
  onOpenNewTransaction?: () => void;
}

export function MobileBottomNav({ onOpenNewTransaction }: { onOpenNewTransaction?: () => void }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Beranda', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Transaksi', href: '/dashboard/transaksi', icon: ReceiptText },
    { name: 'Catat', action: true, icon: Plus },
    { name: 'Budget', href: '/dashboard/budget', icon: Target },
    { name: 'Menu', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <nav
      aria-label="Navigasi Bawah Mobile"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 safe-bottom"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          if (item.action) {
            return (
              <button
                key="catat-fab"
                onClick={onOpenNewTransaction}
                type="button"
                aria-label="Catat Transaksi Cepat"
                className="flex flex-col items-center justify-center -mt-6 group focus:outline-none"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/40 ring-4 ring-white group-active:scale-95 transition-transform">
                  <Plus className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-bold text-orange-600 mt-1">Catat</span>
              </button>
            );
          }

          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href!);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href!}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 min-w-[56px]',
                isActive ? 'text-orange-600 font-bold' : 'text-slate-400 hover:text-slate-700'
              )}
            >
              <Icon className={cn('w-5 h-5 mb-0.5', isActive ? 'text-orange-600 stroke-[2.3]' : 'text-slate-400')} />
              <span className="text-[10px] leading-tight font-semibold tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileDrawer({
  isOpen,
  onClose,
  userRole = 'user',
  planCode = 'starter',
  userName = 'Pengguna TataDana',
  userEmail = 'user@tatadana.id',
}: {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  planCode?: 'starter' | 'pro';
  userName?: string;
  userEmail?: string;
}) {
  const pathname = usePathname();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Close drawer on route change
  React.useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch {
      window.location.href = '/login';
    }
  };

  const menuItems = [
    { name: 'Beranda', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Transaksi', href: '/dashboard/transaksi', icon: ReceiptText },
    { name: 'Laporan Keuangan', href: '/dashboard/laporan', icon: PieChart },
    { name: 'Anggaran (Budget)', href: '/dashboard/budget', icon: Target },
    { name: 'Dompet & Rekening', href: '/dashboard/wallet', icon: Wallet },
    { name: 'Pengaturan & Bot', href: '/dashboard/settings', icon: Settings },
  ];

  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  if (!isOpen) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Drawer Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu Navigasi Mobile"
        className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-fade-in"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black text-base shadow-sm shadow-orange-500/25">
              T
            </div>
            <div>
              <span className="font-extrabold text-sm text-slate-900 block leading-tight">
                Tata<span className="text-orange-500">Dana</span>
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                Fintech SaaS
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            aria-label="Tutup Menu"
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-3.5 mx-3 mt-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
            <p className="text-[10px] text-slate-500 truncate">{userEmail}</p>
          </div>
          <Badge variant={planCode === 'pro' ? 'pro' : 'secondary'} className="shrink-0 text-[10px]">
            {planCode === 'pro' ? 'PRO' : 'STARTER'}
          </Badge>
        </div>

        {/* Menu Navigation */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Menu Utama
          </div>
          {menuItems.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all',
                  isActive
                    ? 'bg-orange-50 text-orange-600 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-orange-600' : 'text-slate-400')} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {/* Telegram Banner */}
          <div className="pt-3">
            <Link
              href="/dashboard/settings?tab=telegram"
              onClick={onClose}
              className="block p-3 rounded-xl bg-sky-50 border border-sky-100 text-left"
            >
              <div className="flex items-center gap-1.5 text-sky-700 font-bold text-xs">
                <Send className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span>Telegram Bot Aktif</span>
              </div>
              <p className="text-[11px] text-sky-800/80 mt-1 leading-snug">
                Catat transaksi dari chat Telegram.
              </p>
            </Link>
          </div>

          {/* Admin link */}
          {isAdmin && (
            <div className="pt-3 border-t border-slate-100">
              <Link
                href="/admin"
                onClick={onClose}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-amber-800 bg-amber-50/70"
              >
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Konsol Admin</span>
              </Link>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500">TataDana v2.0</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 py-1 px-2.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
