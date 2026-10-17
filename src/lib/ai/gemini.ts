import { GoogleGenerativeAI } from '@google/generative-ai';
import { TRANSACTION_PARSER_SYSTEM_PROMPT, RECEIPT_OCR_SYSTEM_PROMPT } from './prompts';
import { ParsedTransactionResult } from '@/types';
import { VisionReceiptResult } from './types';

export async function parseWithGemini(
  text: string,
  apiKey: string,
  modelName: string = 'gemini-3.5-flash-lite'
): Promise<ParsedTransactionResult> {
  const genAI = new GoogleGenerativeAI(apiKey);

  const callModel = async (targetModel: string) => {
    const model = genAI.getGenerativeModel({
      model: targetModel,
      systemInstruction: TRANSACTION_PARSER_SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    });

    const response = await model.generateContent(text);
    const jsonStr = response.response.text();
    return JSON.parse(jsonStr);
  };

  let parsed: any;
  try {
    parsed = await callModel(modelName);
  } catch (err: any) {
    // If the model hits a 503 high demand spike or 404, fallback to alternate flash model
    const alternate = modelName === 'gemini-3.5-flash-lite' ? 'gemini-3.8-flash' : 'gemini-3.5-flash-lite';
    try {
      parsed = await callModel(alternate);
    } catch {
      throw err;
    }
  }

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

export async function parseReceiptWithGemini(
  base64Image: string,
  mimeType: string,
  apiKey: string,
  modelName: string = 'gemini-3.5-flash-lite'
): Promise<VisionReceiptResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: RECEIPT_OCR_SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  });

  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: mimeType || 'image/jpeg',
    },
  };

  const response = await model.generateContent([
    'Ekstrak seluruh informasi transaksi dari struk ini:',
    imagePart,
  ]);
  const jsonStr = response.response.text();
  const parsed = JSON.parse(jsonStr);

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
