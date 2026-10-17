import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number to Indonesian Rupiah standard (e.g. Rp 15.000 atau Rp 1.500.000)
 * Normalizes non-breaking spaces (\u00a0) to regular spaces.
 */
export function formatRupiah(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return 'Rp 0';
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return 'Rp 0';

  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericAmount);

  return formatted.replace(/\u00a0/g, ' ');
}

/**
 * Format date string or Date object to Indonesian localized format in Asia/Jakarta timezone
 */
export function formatDateWIB(
  dateInput: string | Date,
  formatStyle: 'full' | 'medium' | 'short' | 'time' = 'medium'
): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

  if (isNaN(date.getTime())) return '-';

  if (formatStyle === 'time') {
    return (
      new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
      }).format(date) + ' WIB'
    );
  }

  if (formatStyle === 'short') {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    }).format(date);
  }

  if (formatStyle === 'full') {
    return (
      new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
      }).format(date) + ' WIB'
    );
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(date);
}

/**
 * Parse Indonesian informal currency strings (e.g. '15rb', '1.5jt', '500k', '20ribu', '2.5miliar')
 */
export function parseIndonesianCurrency(rawInput: string): number | null {
  if (!rawInput) return null;
  const cleaned = rawInput.toLowerCase().replace(/\s+/g, '').replace(/^rp\.?/, '');

  // Miliar (miliar / m)
  const miliarMatch = cleaned.match(/^([\d.,]+)(miliar|m)$/);
  if (miliarMatch) {
    const val = parseFloat(miliarMatch[1].replace(',', '.'));
    return isNaN(val) ? null : Math.round(val * 1000000000);
  }

  // Juta (jt / juta)
  const jtMatch = cleaned.match(/^([\d.,]+)(jt|juta)$/);
  if (jtMatch) {
    const val = parseFloat(jtMatch[1].replace(',', '.'));
    return isNaN(val) ? null : Math.round(val * 1000000);
  }

  // Ribu (rb / k / ribu)
  const rbMatch = cleaned.match(/^([\d.,]+)(rb|k|ribu)$/);
  if (rbMatch) {
    const val = parseFloat(rbMatch[1].replace(',', '.'));
    return isNaN(val) ? null : Math.round(val * 1000);
  }

  // Pure digits or dot/comma formatted numbers
  const standardMatch = cleaned.replace(/\./g, '').replace(',', '.');
  const directVal = parseFloat(standardMatch);
  return isNaN(directVal) ? null : Math.round(directVal);
}
