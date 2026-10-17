import { ParsedTransactionResult } from '@/types';

export interface AIProviderConfig {
  apiKey: string;
  modelName: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ParseOptions {
  userCategories?: string[];
  userWallets?: string[];
  referenceDate?: string;
}

export interface VisionReceiptResult {
  merchantName: string;
  date?: string;
  totalAmount: number;
  taxAmount?: number;
  items: Array<{
    name: string;
    quantity: number;
    pricePerUnit: number;
    totalPrice: number;
    suggestedCategory?: string;
  }>;
  suggestedCategory: string;
  confidence: number;
}

export interface AIAdvisorResult {
  insights: Array<{
    type: 'warning' | 'info' | 'positive';
    title: string;
    description: string;
  }>;
  summary: string;
  budgetAlerts: string[];
}
