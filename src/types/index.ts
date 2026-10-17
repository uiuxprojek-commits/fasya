export * from './database';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface ParsedTransactionResult {
  jenis: 'pemasukan' | 'pengeluaran' | 'transfer';
  nominal: number;
  kategori: string;
  catatan: string;
  tanggal?: string;
  wallet_nama?: string;
  transfer_ke_wallet?: string;
  confidence: number;
  extracted_items?: Array<{
    name: string;
    qty: number;
    price: number;
    total: number;
  }>;
}

export interface FinancialSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  budgetRemaining: number;
  budgetTotal: number;
  budgetPercentage: number;
  savingsRate: number;
}
