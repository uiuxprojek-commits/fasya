import OpenAI from 'openai';
import { TRANSACTION_PARSER_SYSTEM_PROMPT } from './prompts';
import { ParsedTransactionResult } from '@/types';

export async function parseWithDeepSeek(
  text: string,
  apiKey: string,
  modelName: string = 'deepseek-chat'
): Promise<ParsedTransactionResult> {
  const deepseek = new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com',
  });

  const completion = await deepseek.chat.completions.create({
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
