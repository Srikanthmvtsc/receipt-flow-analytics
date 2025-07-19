import { useState, useEffect, useMemo } from 'react';
import { Receipt, ReceiptStats, SearchFilters, SortOptions } from '@/types/receipt';

// Mock data for demonstration
const mockReceipts: Receipt[] = [
  {
    id: '1',
    fileName: 'grocery_receipt_001.jpg',
    vendor: 'Walmart',
    date: '2024-01-15',
    amount: 127.45,
    category: 'Groceries',
    description: 'Weekly grocery shopping',
    uploadDate: '2024-01-15T10:30:00Z',
    fileType: 'image/jpeg',
    fileSize: 2048000,
    status: 'processed',
    extractedText: 'WALMART Store #1234 Receipt Total: $127.45'
  },
  {
    id: '2',
    fileName: 'electricity_bill.pdf',
    vendor: 'PowerCorp',
    date: '2024-01-20',
    amount: 89.99,
    category: 'Utilities',
    description: 'Monthly electricity bill',
    uploadDate: '2024-01-20T14:20:00Z',
    fileType: 'application/pdf',
    fileSize: 512000,
    status: 'processed',
    extractedText: 'PowerCorp Electric Bill Amount Due: $89.99'
  },
  {
    id: '3',
    fileName: 'internet_bill.png',
    vendor: 'TechNet ISP',
    date: '2024-01-25',
    amount: 79.99,
    category: 'Internet',
    description: 'Monthly internet service',
    uploadDate: '2024-01-25T09:15:00Z',
    fileType: 'image/png',
    fileSize: 1024000,
    status: 'processed',
    extractedText: 'TechNet Monthly Service $79.99'
  },
  {
    id: '4',
    fileName: 'coffee_shop.jpg',
    vendor: 'Starbucks',
    date: '2024-02-01',
    amount: 12.75,
    category: 'Food & Beverage',
    description: 'Morning coffee',
    uploadDate: '2024-02-01T08:45:00Z',
    fileType: 'image/jpeg',
    fileSize: 1536000,
    status: 'processed',
    extractedText: 'Starbucks Receipt Total: $12.75'
  },
  {
    id: '5',
    fileName: 'gas_station.jpg',
    vendor: 'Shell',
    date: '2024-02-05',
    amount: 65.20,
    category: 'Transportation',
    description: 'Gas fill-up',
    uploadDate: '2024-02-05T16:30:00Z',
    fileType: 'image/jpeg',
    fileSize: 1800000,
    status: 'processed',
    extractedText: 'Shell Gas Station Total: $65.20'
  },
  {
    id: '6',
    fileName: 'pharmacy.pdf',
    vendor: 'CVS Pharmacy',
    date: '2024-02-10',
    amount: 45.99,
    category: 'Healthcare',
    description: 'Prescription medication',
    uploadDate: '2024-02-10T12:00:00Z',
    fileType: 'application/pdf',
    fileSize: 768000,
    status: 'processed',
    extractedText: 'CVS Pharmacy Receipt $45.99'
  }
];

export const useReceiptData = () => {
  const [receipts, setReceipts] = useState<Receipt[]>(mockReceipts);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [sortOptions, setSortOptions] = useState<SortOptions>({ field: 'date', direction: 'desc' });

  // Search Algorithm Implementation
  const searchReceipts = useMemo(() => {
    return receipts.filter(receipt => {
      // Keyword search (linear search with string matching)
      if (searchFilters.keyword) {
        const keyword = searchFilters.keyword.toLowerCase();
        const searchFields = [
          receipt.vendor,
          receipt.category,
          receipt.description || '',
          receipt.extractedText || ''
        ].join(' ').toLowerCase();
        
        if (!searchFields.includes(keyword)) return false;
      }

      // Vendor filter
      if (searchFilters.vendor && !receipt.vendor.toLowerCase().includes(searchFilters.vendor.toLowerCase())) {
        return false;
      }

      // Category filter
      if (searchFilters.category && receipt.category !== searchFilters.category) {
        return false;
      }

      // Date range filter
      if (searchFilters.dateFrom && new Date(receipt.date) < new Date(searchFilters.dateFrom)) {
        return false;
      }
      if (searchFilters.dateTo && new Date(receipt.date) > new Date(searchFilters.dateTo)) {
        return false;
      }

      // Amount range filter
      if (searchFilters.amountMin && receipt.amount < searchFilters.amountMin) {
        return false;
      }
      if (searchFilters.amountMax && receipt.amount > searchFilters.amountMax) {
        return false;
      }

      return true;
    });
  }, [receipts, searchFilters]);

  // Sorting Algorithm Implementation (Timsort equivalent - JavaScript's native sort)
  const sortedReceipts = useMemo(() => {
    return [...searchReceipts].sort((a, b) => {
      const { field, direction } = sortOptions;
      let comparison = 0;

      switch (field) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'vendor':
          comparison = a.vendor.localeCompare(b.vendor);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        default:
          return 0;
      }

      return direction === 'asc' ? comparison : -comparison;
    });
  }, [searchReceipts, sortOptions]);

  // Statistical Aggregation Functions
  const stats = useMemo((): ReceiptStats => {
    const amounts = receipts.map(r => r.amount);
    
    // Sum aggregation
    const totalSpend = amounts.reduce((sum, amount) => sum + amount, 0);
    
    // Mean calculation
    const averageAmount = amounts.length > 0 ? totalSpend / amounts.length : 0;
    
    // Median calculation (O(n log n) with sorting)
    const sortedAmounts = [...amounts].sort((a, b) => a - b);
    const medianAmount = sortedAmounts.length > 0 
      ? sortedAmounts.length % 2 === 0
        ? (sortedAmounts[sortedAmounts.length / 2 - 1] + sortedAmounts[sortedAmounts.length / 2]) / 2
        : sortedAmounts[Math.floor(sortedAmounts.length / 2)]
      : 0;

    // Mode calculation (frequency distribution)
    const amountFreq = amounts.reduce((freq, amount) => {
      const rounded = Math.round(amount * 100) / 100; // Round to 2 decimals
      freq[rounded] = (freq[rounded] || 0) + 1;
      return freq;
    }, {} as Record<number, number>);
    
    const maxFreq = Math.max(...Object.values(amountFreq));
    const modeAmount = parseFloat(Object.keys(amountFreq).find(amount => 
      amountFreq[parseFloat(amount)] === maxFreq
    ) || '0');

    // Top vendors aggregation (frequency and sum)
    const vendorStats = receipts.reduce((stats, receipt) => {
      if (!stats[receipt.vendor]) {
        stats[receipt.vendor] = { count: 0, total: 0 };
      }
      stats[receipt.vendor].count++;
      stats[receipt.vendor].total += receipt.amount;
      return stats;
    }, {} as Record<string, { count: number; total: number }>);

    const topVendors = Object.entries(vendorStats)
      .map(([vendor, data]) => ({ vendor, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Category spending aggregation
    const categoryStats = receipts.reduce((stats, receipt) => {
      if (!stats[receipt.category]) {
        stats[receipt.category] = { amount: 0, count: 0 };
      }
      stats[receipt.category].amount += receipt.amount;
      stats[receipt.category].count++;
      return stats;
    }, {} as Record<string, { amount: number; count: number }>);

    const categorySpending = Object.entries(categoryStats)
      .map(([category, data]) => ({ category, ...data }));

    // Monthly spending time-series aggregation
    const monthlyStats = receipts.reduce((stats, receipt) => {
      const month = new Date(receipt.date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      stats[month] = (stats[month] || 0) + receipt.amount;
      return stats;
    }, {} as Record<string, number>);

    const monthlySpending = Object.entries(monthlyStats)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    return {
      totalSpend,
      totalReceipts: receipts.length,
      averageAmount,
      medianAmount,
      modeAmount,
      topVendors,
      categorySpending,
      monthlySpending
    };
  }, [receipts]);

  const addReceipt = (receipt: Omit<Receipt, 'id' | 'uploadDate' | 'status'>) => {
    const newReceipt: Receipt = {
      ...receipt,
      id: Date.now().toString(),
      uploadDate: new Date().toISOString(),
      status: 'processed'
    };
    setReceipts(prev => [newReceipt, ...prev]);
  };

  const updateReceipt = (id: string, updates: Partial<Receipt>) => {
    setReceipts(prev => prev.map(receipt => 
      receipt.id === id ? { ...receipt, ...updates } : receipt
    ));
  };

  const deleteReceipt = (id: string) => {
    setReceipts(prev => prev.filter(receipt => receipt.id !== id));
  };

  return {
    receipts: sortedReceipts,
    allReceipts: receipts,
    stats,
    searchFilters,
    sortOptions,
    setSearchFilters,
    setSortOptions,
    addReceipt,
    updateReceipt,
    deleteReceipt
  };
};