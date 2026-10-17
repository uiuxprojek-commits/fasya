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
  Menu,
  X,
} from 'lucide-react';

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Close mobile drawer on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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

  const renderNavList = () => (
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
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[42px]',
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
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-xs shadow-xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-white">
            Admin<span className="text-amber-400">Console</span>
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Buka menu admin"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[80vw] bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col h-full z-10 animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-white">
                  Admin<span className="text-amber-400">Console</span>
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {renderNavList()}
            </div>
            <div className="p-4 border-t border-slate-800 bg-slate-950/40">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke User Dashboard</span>
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex w-60 lg:w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex-col shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto">
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

        {renderNavList()}

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
    </>
  );
}
