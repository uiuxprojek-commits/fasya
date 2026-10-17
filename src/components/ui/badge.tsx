import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline' | 'pro';
}

export function Badge({ className, variant = 'secondary', children, ...props }: BadgeProps) {
  const variants = {
    primary: 'bg-orange-50 text-orange-700 border-orange-200/80',
    secondary: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    danger: 'bg-red-50 text-red-700 border-red-200/80',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
    outline: 'border-slate-200 text-slate-600 bg-transparent',
    pro: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold border-transparent shadow-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors select-none',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
