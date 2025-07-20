import { useState, useEffect, useMemo } from 'react';
import { Receipt, ReceiptStats, SearchFilters, SortOptions } from '@/types/receipt';

const API_BASE_URL = 'http://localhost:8000';

export const useReceiptData = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [sortOptions, setSortOptions] = useState<SortOptions>({ field: 'date', direction: 'desc' });

  // Fetch receipts from API
  const fetchReceipts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchFilters.keyword) params.append('keyword', searchFilters.keyword);
      if (searchFilters.vendor) params.append('vendor', searchFilters.vendor);
      if (searchFilters.category) params.append('category', searchFilters.category);
      if (searchFilters.dateFrom) params.append('date_from', searchFilters.dateFrom);
      if (searchFilters.dateTo) params.append('date_to', searchFilters.dateTo);
      if (searchFilters.amountMin) params.append('amount_min', searchFilters.amountMin.toString());
      if (searchFilters.amountMax) params.append('amount_max', searchFilters.amountMax.toString());
      params.append('sort_field', sortOptions.field);
      params.append('sort_direction', sortOptions.direction);

      const response = await fetch(`${API_BASE_URL}/receipts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch receipts');
      
      const data = await response.json();
      setReceipts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch receipts when filters or sort options change
  useEffect(() => {
    fetchReceipts();
  }, [searchFilters, sortOptions]);

  // Fetch statistics from API
  const [stats, setStats] = useState<ReceiptStats>({
    totalSpend: 0,
    totalReceipts: 0,
    averageAmount: 0,
    medianAmount: 0,
    modeAmount: 0,
    topVendors: [],
    categorySpending: [],
    monthlySpending: []
  });

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`);
      if (!response.ok) throw new Error('Failed to fetch statistics');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [receipts]);

  const uploadReceipt = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
        mode: 'cors',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(errorData.detail || 'Failed to upload receipt');
      }
      
      const result = await response.json();
      
      // Check if the response indicates success
      if (!result.success && !result.message) {
        throw new Error('Upload failed - invalid response format');
      }
      
      await fetchReceipts(); // Refresh receipts
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateReceipt = async (id: string, updates: Partial<Receipt>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/receipts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update receipt');
      
      await fetchReceipts(); // Refresh receipts
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
      throw err;
    }
  };

  const deleteReceipt = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/receipts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete receipt');
      
      await fetchReceipts(); // Refresh receipts
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      throw err;
    }
  };

  const exportData = async (format: 'csv' | 'json') => {
    try {
      const response = await fetch(`${API_BASE_URL}/export/${format}`);
      if (!response.ok) throw new Error('Failed to export data');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipts.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
      throw err;
    }
  };

  return {
    receipts,
    stats,
    loading,
    error,
    searchFilters,
    sortOptions,
    setSearchFilters,
    setSortOptions,
    uploadReceipt,
    updateReceipt,
    deleteReceipt,
    exportData,
    fetchReceipts
  };
};