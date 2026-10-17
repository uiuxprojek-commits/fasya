'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  onAutoDetectLength?: (detectedLength: 6 | 8) => void;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({
  length = 6,
  value = '',
  onChange,
  onComplete,
  onAutoDetectLength,
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
    const rawDigits = pasteText.replace(/\D/g, '');
    if (!rawDigits) return;

    if (rawDigits.length === 8 && length !== 8 && onAutoDetectLength) {
      onAutoDetectLength(8);
      onChange(rawDigits);
      if (onComplete) onComplete(rawDigits);
      return;
    } else if (rawDigits.length === 6 && length !== 6 && onAutoDetectLength) {
      onAutoDetectLength(6);
      onChange(rawDigits);
      if (onComplete) onComplete(rawDigits);
      return;
    }

    const onlyDigits = rawDigits.slice(0, length);
    const nextDigits = [...digits];
    for (let i = 0; i < onlyDigits.length; i++) {
      const targetIndex = startIndex + i;
      if (targetIndex < length) {
        nextDigits[targetIndex] = onlyDigits[i];
      }
    }

    const nextValue = nextDigits.join('');
    onChange(nextValue);

    // Focus the box following the last inserted digit, or the last box
    const nextFocusIndex = Math.min(startIndex + onlyDigits.length, length - 1);
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

  const isWide = length > 6;

  return (
    <div className={cn("flex items-center justify-center select-none", isWide ? "gap-1.5 sm:gap-2.5" : "gap-2 sm:gap-3")}>
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
            isWide
              ? 'w-8 h-12 sm:w-10.5 sm:h-14 text-lg sm:text-xl'
              : 'w-10 h-13 sm:w-12 sm:h-14 text-xl sm:text-2xl',
            'text-center font-mono font-black',
            'rounded-xl border bg-white text-slate-900 shadow-xs transition-all outline-hidden',
            'focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:scale-[1.03]',
            'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
            hasError
              ? 'border-red-400 bg-red-50/30 text-red-700 focus:border-red-500 focus:ring-red-500/20'
              : digits[idx]
              ? 'border-orange-400 bg-orange-50/20'
              : 'border-slate-200 hover:border-slate-300'
          )}
        />
      ))}
    </div>
  );
}
