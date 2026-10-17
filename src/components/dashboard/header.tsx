'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, Plus, Clock } from 'lucide-react';
import { formatDateWIB } from '@/lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenNewTransaction?: () => void;
}

export function DashboardHeader({ title, subtitle, onOpenNewTransaction }: HeaderProps) {
  const [timeStr, setTimeStr] = React.useState('');

  React.useEffect(() => {
    const updateTime = () => {
      setTimeStr(formatDateWIB(new Date(), 'time'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  const handleToggleDrawer = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tatadana:toggle-drawer'));
    }
  };

  return (
    <header className="h-14 sm:h-16 border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-3.5 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
        {/* Mobile Hamburger Drawer Trigger */}
        <button
          onClick={handleToggleDrawer}
          type="button"
          aria-label="Buka Menu Navigasi"
          className="md:hidden p-2 -ml-1 rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95 transition-all shrink-0"
        >
          <Menu className="w-5 h-5 text-slate-700" />
        </button>

        {/* Mobile Mini Brand Badge */}
        <Link href="/dashboard" className="md:hidden shrink-0 flex items-center">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black text-xs shadow-xs">
            T
          </div>
        </Link>

        {/* Title and Subtitle */}
        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* WIB Clock Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{timeStr || 'WIB'}</span>
        </div>

        {/* Quick Action: Catat Transaksi */}
        {onOpenNewTransaction && (
          <Button
            onClick={onOpenNewTransaction}
            size="sm"
            variant="primary"
            className="text-xs font-bold px-2.5 sm:px-3.5 h-8 sm:h-9"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1.5" />
            <span className="hidden xs:inline sm:inline">Catat Transaksi</span>
            <span className="inline xs:hidden sm:hidden">Catat</span>
          </Button>
        )}
      </div>
    </header>
  );
}
