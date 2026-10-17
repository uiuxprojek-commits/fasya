'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Bell, Clock } from 'lucide-react';
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

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-base font-extrabold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* WIB Clock Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{timeStr || 'WIB'}</span>
        </div>

        {/* Quick Action: Catat Transaksi */}
        {onOpenNewTransaction && (
          <Button onClick={onOpenNewTransaction} size="sm" variant="primary">
            <Plus className="w-4 h-4 mr-1.5" />
            Catat Transaksi
          </Button>
        )}
      </div>
    </header>
  );
}
