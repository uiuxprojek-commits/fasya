'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({
  length = 8,
  value = '',
  onChange,
  onComplete,
  disabled = false,
  hasError = false,
  autoFocus = true,
}: OtpInputProps) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Array of digits from value
  const digits = React.useMemo(() => {
    const valDigits = value.split('');
    const result: string[] = [];
    for (let i = 0; i < length; i++) {
      result.push(valDigits[i] || '');
    }
    return result;
  }, [value, length]);

  // Focus first input on mount if autoFocus is true
  React.useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus, disabled]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Extract only digits
    const cleanVal = rawVal.replace(/\D/g, '');

    if (!cleanVal) {
      // User deleted character
      const nextDigits = [...digits];
      nextDigits[index] = '';
      const nextValue = nextDigits.join('').trimEnd();
      onChange(nextValue);
      return;
    }

    if (cleanVal.length > 1) {
      // User typed or pasted multiple characters inside this input
      handlePasteString(cleanVal, index);
      return;
    }

    // Single digit input
    const nextDigits = [...digits];
    nextDigits[index] = cleanVal;
    const nextValue = nextDigits.join('');
    onChange(nextValue);

    // Auto-advance focus to next input
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }

    // If all digits are filled, notify onComplete
    if (nextValue.length === length && onComplete) {
      onComplete(nextValue);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Current box is empty, move back and delete previous
        const nextDigits = [...digits];
        nextDigits[index - 1] = '';
        onChange(nextDigits.join('').trimEnd());
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
      inputRefs.current[index - 1]?.select();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }
  };

  const handlePasteString = (pasteText: string, startIndex = 0) => {
    const rawDigits = pasteText.replace(/\D/g, '').slice(0, length);
    if (!rawDigits) return;

    const nextDigits = [...digits];
    for (let i = 0; i < rawDigits.length; i++) {
      const targetIndex = startIndex + i;
      if (targetIndex < length) {
        nextDigits[targetIndex] = rawDigits[i];
      }
    }

    const nextValue = nextDigits.join('');
    onChange(nextValue);

    // Focus the box following the last inserted digit, or the last box
    const nextFocusIndex = Math.min(startIndex + rawDigits.length, length - 1);
    inputRefs.current[nextFocusIndex]?.focus();
    inputRefs.current[nextFocusIndex]?.select();

    if (nextValue.length === length && onComplete) {
      onComplete(nextValue);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    handlePasteString(pastedData, 0);
  };

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 select-none">
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => {
            inputRefs.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoComplete={idx === 0 ? 'one-time-code' : 'off'}
          value={digits[idx]}
          onChange={(e) => handleChange(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          aria-label={`Digit OTP ${idx + 1} dari ${length}`}
          className={cn(
            'w-8.5 h-12.5 sm:w-11 sm:h-14 text-center font-mono font-black text-lg sm:text-2xl',
            'rounded-xl border bg-white text-slate-900 shadow-xs transition-all outline-hidden',
            'focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:scale-[1.03]',
            'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
            hasError
              ? 'border-red-400 bg-red-50/30 text-red-700 focus:border-red-500 focus:ring-red-500/20'
              : digits[idx]
              ? 'border-orange-400 bg-orange-50/20 text-orange-950 font-bold'
              : 'border-slate-200 hover:border-slate-300'
          )}
        />
      ))}
    </div>
  );
}
