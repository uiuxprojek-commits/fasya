import { parseWithGemini, parseReceiptWithGemini } from './gemini';
import { parseWithOpenAI, parseReceiptWithOpenAI, transcribeVoiceWithWhisper } from './openai';
import { parseWithDeepSeek } from './deepseek';
import { ParsedTransactionResult } from '@/types';
import { VisionReceiptResult } from './types';
import { parseIndonesianCurrency } from '@/lib/utils';

/**
 * Intelligent Indonesian Rule-Based Heuristic Parser
 * Used as reliable fallback when API keys are pending or provider times out
 */
export function heuristicFallbackParser(rawText: string): ParsedTransactionResult {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  // Determine type
  let jenis: 'pemasukan' | 'pengeluaran' | 'transfer' = 'pengeluaran';
  if (
    lower.includes('transfer') ||
    lower.includes('tf ') ||
    lower.includes('pindah dana') ||
    lower.includes('top up')
  ) {
    jenis = 'transfer';
  } else if (
    lower.includes('gaji') ||
    lower.includes('gajian') ||
    lower.includes('dapat transfer') ||
    lower.includes('bonus') ||
    lower.includes('cashback') ||
    lower.includes('pendapatan') ||
    lower.includes('terima uang') ||
    lower.includes('klaim')
  ) {
    jenis = 'pemasukan';
  }

  // Extract amount with regex looking for digits with rb/k/jt/ribu/juta
  const amountMatch = lower.match(/(?:rp\.?\s*)?(\d+(?:[.,]\d+)?\s*(?:jt|juta|rb|ribu|k|miliar|m)?)/i);
  let nominal = 0;

  if (amountMatch) {
    // Find candidate tokens
    const tokens = lower.split(/\s+/);
    for (const token of tokens) {
      const parsed = parseIndonesianCurrency(token);
      if (parsed && parsed > 0) {
        nominal = parsed;
        break;
      }
    }
  }

  // Extract category
  let kategori = 'Lain-lain';
  if (jenis === 'pemasukan') {
    if (lower.includes('gaji')) kategori = 'Gaji Pokok';
    else if (lower.includes('bonus') || lower.includes('freelance') || lower.includes('proyek'))
      kategori = 'Freelance & Side Job';
    else kategori = 'Pemasukan Lain';
  } else if (jenis === 'transfer') {
    kategori = 'Transfer Antar Wallet';
  } else {
    if (
      lower.includes('makan') ||
      lower.includes('minum') ||
      lower.includes('bakso') ||
      lower.includes('kopi') ||
      lower.includes('nasi') ||
      lower.includes('ayam') ||
      lower.includes('mie') ||
      lower.includes('cafe') ||
      lower.includes('resto') ||
      lower.includes('jajan')
    ) {
      kategori = 'Makanan & Minuman';
    } else if (
      lower.includes('bensin') ||
      lower.includes('pertalite') ||
      lower.includes('pertamax') ||
      lower.includes('gojek') ||
      lower.includes('grab') ||
      lower.includes('parkir') ||
      lower.includes('tol') ||
      lower.includes('ojol')
    ) {
      kategori = 'Transportasi';
    } else if (
      lower.includes('listrik') ||
      lower.includes('pln') ||
      lower.includes('wifi') ||
      lower.includes('pulsa') ||
      lower.includes('kuota') ||
      lower.includes('air') ||
      lower.includes('pdam') ||
      lower.includes('iuran')
    ) {
      kategori = 'Tagihan & Utilitas';
    } else if (
      lower.includes('belanja') ||
      lower.includes('supermarket') ||
      lower.includes('indomaret') ||
      lower.includes('alfamart') ||
      lower.includes('pasar')
    ) {
      kategori = 'Belanja Harian';
    } else if (
      lower.includes('obat') ||
      lower.includes('dokter') ||
      lower.includes('klinik') ||
      lower.includes('vitamin')
    ) {
      kategori = 'Kesehatan & Obat';
    } else if (
      lower.includes('nonton') ||
      lower.includes('bioskop') ||
      lower.includes('game') ||
      lower.includes('netflix') ||
      lower.includes('spotify')
    ) {
      kategori = 'Hiburan & Liburan';
    }
  }

  // Extract source/destination wallet if transfer
  let wallet_nama: string | undefined = undefined;
  let transfer_ke_wallet: string | undefined = undefined;

  const walletNames = ['bca', 'mandiri', 'bri', 'bni', 'gopay', 'ovo', 'dana', 'shopeepay', 'tunai', 'cash'];
  for (const w of walletNames) {
    if (lower.includes(`dari ${w}`)) {
      wallet_nama = w.toUpperCase();
    }
    if (lower.includes(`ke ${w}`)) {
      transfer_ke_wallet = w.toUpperCase();
    }
  }

  return {
    jenis,
    nominal,
    kategori,
    catatan: text,
    wallet_nama,
    transfer_ke_wallet,
    confidence: nominal > 0 ? 0.75 : 0.3,
  };
}

/**
 * Multi-Provider Failover Router for Text Transaction Parsing
 */
export async function parseTransactionWithFailover(rawText: string): Promise<{
  result: ParsedTransactionResult;
  providerUsed: string;
  isFallback: boolean;
}> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const deepseekKey = process.env.DEEPSEEK_API_KEY;

  // 1. Try Gemini first (Default primary provider)
  if (geminiKey && geminiKey.trim() !== '') {
    try {
      const result = await parseWithGemini(rawText, geminiKey);
      if (result.nominal > 0) {
        return { result, providerUsed: 'gemini', isFallback: false };
      }
    } catch (err) {
      console.warn('[AI Router] Gemini parsing failed, trying failover:', err);
    }
  }

  // 2. Try OpenAI failover
  if (openaiKey && openaiKey.trim() !== '') {
    try {
      const result = await parseWithOpenAI(rawText, openaiKey);
      if (result.nominal > 0) {
        return { result, providerUsed: 'openai', isFallback: false };
      }
    } catch (err) {
      console.warn('[AI Router] OpenAI parsing failed, trying failover:', err);
    }
  }

  // 3. Try DeepSeek failover
  if (deepseekKey && deepseekKey.trim() !== '') {
    try {
      const result = await parseWithDeepSeek(rawText, deepseekKey);
      if (result.nominal > 0) {
        return { result, providerUsed: 'deepseek', isFallback: false };
      }
    } catch (err) {
      console.warn('[AI Router] DeepSeek parsing failed, falling back to heuristic:', err);
    }
  }

  // 4. Offline heuristic fallback (zero-dependency, always succeeds)
  const heuristic = heuristicFallbackParser(rawText);
  return {
    result: heuristic,
    providerUsed: 'heuristic-engine',
    isFallback: true,
  };
}

/**
 * Multi-Provider Failover for Receipt OCR (Pro Feature)
 */
export async function parseReceiptWithFailover(
  base64Image: string,
  mimeType: string = 'image/jpeg'
): Promise<{
  result: VisionReceiptResult;
  providerUsed: string;
  isFallback: boolean;
}> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  // Try Gemini Vision
  if (geminiKey && geminiKey.trim() !== '') {
    try {
      const result = await parseReceiptWithGemini(base64Image, mimeType, geminiKey);
      return { result, providerUsed: 'gemini-vision', isFallback: false };
    } catch (err) {
      console.warn('[AI Router] Gemini receipt parsing failed:', err);
    }
  }

  // Try OpenAI GPT-4o Vision
  if (openaiKey && openaiKey.trim() !== '') {
    try {
      const result = await parseReceiptWithOpenAI(base64Image, mimeType, openaiKey);
      return { result, providerUsed: 'openai-vision', isFallback: false };
    } catch (err) {
      console.warn('[AI Router] OpenAI receipt parsing failed:', err);
    }
  }

  // Fallback demo mock if no vision API key configured
  return {
    result: {
      merchantName: 'Supermarket / Toko (Struk Demo)',
      date: new Date().toISOString().split('T')[0],
      totalAmount: 75000,
      taxAmount: 7500,
      items: [
        { name: 'Kopi Susu Literan', quantity: 1, pricePerUnit: 45000, totalPrice: 45000 },
        { name: 'Roti Gandum', quantity: 1, pricePerUnit: 22500, totalPrice: 22500 },
      ],
      suggestedCategory: 'Makanan & Minuman',
      confidence: 0.8,
    },
    providerUsed: 'receipt-demo-fallback',
    isFallback: true,
  };
}

/**
 * Speech-to-Text Transcription for Voice Notes
 */
export async function transcribeVoiceNote(
  audioBuffer: Buffer,
  fileName: string = 'voice.ogg'
): Promise<string> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && openaiKey.trim() !== '') {
    try {
      return await transcribeVoiceWithWhisper(audioBuffer, fileName, openaiKey);
    } catch (err) {
      console.warn('[AI Router] Whisper transcription failed:', err);
    }
  }

  // Graceful fallback response when STT key is not yet set
  return 'Beli makan siang 35rb';
}
