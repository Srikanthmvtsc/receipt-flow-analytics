export interface Receipt {
  id: string;
  fileName: string;
  vendor: string;
  date: string;
  amount: number;
  category: string;
  description?: string;
  uploadDate: string;
  fileType: string;
  fileSize: number;
  status: 'processed' | 'processing' | 'error';
  extractedText?: string;
}

export interface ReceiptStats {
  totalSpend: number;
  totalReceipts: number;
  averageAmount: number;
  medianAmount: number;
  modeAmount: number;
  topVendors: { vendor: string; count: number; total: number }[];
  categorySpending: { category: string; amount: number; count: number }[];
  monthlySpending: { month: string; amount: number }[];
}

export interface SearchFilters {
  vendor?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  keyword?: string;
}

export interface SortOptions {
  field: 'date' | 'amount' | 'vendor' | 'category';
  direction: 'asc' | 'desc';
}