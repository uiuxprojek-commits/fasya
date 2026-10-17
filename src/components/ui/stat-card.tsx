import * as React from 'react';
import { cn, formatRupiah } from '@/lib/utils';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, AlertCircle } from 'lucide-react';

export interface StatCardProps {
  title: string;
  amount: number;
  subtitle?: string;
  type?: 'balance' | 'income' | 'expense' | 'budget';
  trendPercentage?: number;
  trendText?: string;
  isLoading?: boolean;
}

export function StatCard({
  title,
  amount,
  subtitle,
  type = 'balance',
  trendPercentage,
  trendText,
  isLoading,
}: StatCardProps) {
  const configs = {
    balance: {
      icon: Wallet,
      iconBg: 'bg-orange-50 text-orange-600',
      accentColor: 'text-slate-900',
    },
    income: {
      icon: ArrowDownRight,
      iconBg: 'bg-emerald-50 text-emerald-600',
      accentColor: 'text-emerald-600',
    },
    expense: {
      icon: ArrowUpRight,
      iconBg: 'bg-red-50 text-red-600',
      accentColor: 'text-red-600',
    },
    budget: {
      icon: AlertCircle,
      iconBg: 'bg-amber-50 text-amber-600',
      accentColor: 'text-amber-600',
    },
  };

  const current = configs[type];
  const IconComponent = current.icon;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-slate-200 rounded-md" />
          <div className="h-10 w-10 bg-slate-200 rounded-xl" />
        </div>
        <div className="mt-4 h-7 w-36 bg-slate-200 rounded-md" />
        <div className="mt-2 h-3 w-28 bg-slate-100 rounded-md" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
          {title}
        </span>
        <div className={cn('flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl shrink-0', current.iconBg)}>
          <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>

      <div className="mt-2.5 sm:mt-3 min-w-0">
        <div
          title={formatRupiah(amount)}
          className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 truncate"
        >
          {formatRupiah(amount)}
        </div>
        {subtitle && (
          <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-slate-500 font-medium truncate">
            {subtitle}
          </p>
        )}
      </div>

      {(trendPercentage !== undefined || trendText) && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {trendPercentage !== undefined && (
            <span
              className={cn(
                'inline-flex items-center font-bold px-1.5 py-0.5 rounded-md',
                trendPercentage >= 0
                  ? type === 'expense'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-emerald-50 text-emerald-600'
                  : type === 'expense'
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-red-50 text-red-600'
              )}
            >
              {trendPercentage >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5 mr-1 inline" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 mr-1 inline" />
              )}
              {Math.abs(trendPercentage)}%
            </span>
          )}
          {trendText && <span className="text-slate-400 font-medium">{trendText}</span>}
        </div>
      )}
    </div>
  );
}
