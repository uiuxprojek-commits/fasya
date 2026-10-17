import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressBarProps {
  value: number; // 0 to 100 or higher
  max?: number;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, max = 100, className, showLabel = false }: ProgressBarProps) {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);

  let barColor = 'bg-emerald-500';
  if (percentage >= 100) {
    barColor = 'bg-red-500';
  } else if (percentage >= 80) {
    barColor = 'bg-amber-500';
  }

  return (
    <div className={cn('w-full space-y-1', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs font-semibold text-slate-600">
          <span>Terpakai</span>
          <span className={percentage >= 100 ? 'text-red-600' : percentage >= 80 ? 'text-amber-600' : 'text-emerald-600'}>
            {percentage}%
          </span>
        </div>
      )}
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all duration-500 rounded-full', barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
