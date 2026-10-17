import OpenAI from 'openai';
import { TRANSACTION_PARSER_SYSTEM_PROMPT, RECEIPT_OCR_SYSTEM_PROMPT } from './prompts';
import { ParsedTransactionResult } from '@/types';
import { VisionReceiptResult } from './types';

export async function parseWithOpenAI(
  text: string,
  apiKey: string,
  modelName: string = 'gpt-4o-mini'
): Promise<ParsedTransactionResult> {
  const openai = new OpenAI({ apiKey });

  const completion = await openai.chat.completions.create({
    model: modelName,
    messages: [
      { role: 'system', content: TRANSACTION_PARSER_SYSTEM_PROMPT },
      { role: 'user', content: text },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  });

  const content = completion.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(content);

  return {
    jenis: parsed.jenis || 'pengeluaran',
    nominal: Number(parsed.nominal) || 0,
    kategori: parsed.kategori || 'Lain-lain',
    catatan: parsed.catatan || text,
    wallet_nama: parsed.wallet_nama || undefined,
    transfer_ke_wallet: parsed.transfer_ke_wallet || undefined,
    confidence: Number(parsed.confidence) || 0.9,
  };
}

export async function parseReceiptWithOpenAI(
  base64Image: string,
  mimeType: string,
  apiKey: string,
  modelName: string = 'gpt-4o-mini'
): Promise<VisionReceiptResult> {
  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: modelName,
    messages: [
      { role: 'system', content: RECEIPT_OCR_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Ekstrak transaksi dari struk berikut:' },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType || 'image/jpeg'};base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  });

  const content = response.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(content);

  return {
    merchantName: parsed.merchantName || 'Merchant',
    date: parsed.date,
    totalAmount: Number(parsed.totalAmount) || 0,
    taxAmount: Number(parsed.taxAmount) || 0,
    items: Array.isArray(parsed.items) ? parsed.items : [],
    suggestedCategory: parsed.suggestedCategory || 'Belanja Harian',
    confidence: Number(parsed.confidence) || 0.85,
  };
}

export async function transcribeVoiceWithWhisper(
  audioBuffer: Buffer,
  fileName: string,
  apiKey: string
): Promise<string> {
  const openai = new OpenAI({ apiKey });

  const file = new File([new Uint8Array(audioBuffer)], fileName, { type: 'audio/ogg' });
  const transcription = await openai.audio.transcriptions.create({
    file: file,
    model: 'whisper-1',
    language: 'id',
  });

  return transcription.text;
}
