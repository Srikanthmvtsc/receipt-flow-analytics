import { useState } from 'react';
import { Edit, Trash2, Eye, FileText, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Receipt, SearchFilters, SortOptions } from '@/types/receipt';
import { useToast } from '@/hooks/use-toast';

interface ReceiptTableProps {
  receipts: Receipt[];
  searchFilters: SearchFilters;
  sortOptions: SortOptions;
  onSearchChange: (filters: SearchFilters) => void;
  onSortChange: (sort: SortOptions) => void;
  onEdit: (id: string, updates: Partial<Receipt>) => void;
  onDelete: (id: string) => void;
}

export const ReceiptTable = ({
  receipts,
  searchFilters,
  sortOptions,
  onSearchChange,
  onSortChange,
  onEdit,
  onDelete
}: ReceiptTableProps) => {
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null);
  const { toast } = useToast();

  const categories = ['Groceries', 'Utilities', 'Internet', 'Food & Beverage', 'Transportation', 'Healthcare', 'Miscellaneous'];

  const handleSort = (field: SortOptions['field']) => {
    const direction = sortOptions.field === field && sortOptions.direction === 'asc' ? 'desc' : 'asc';
    onSortChange({ field, direction });
  };

  const getSortIcon = (field: string) => {
    if (sortOptions.field !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortOptions.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const handleEdit = (receipt: Receipt) => {
    setEditingReceipt({ ...receipt });
  };

  const handleSaveEdit = () => {
    if (editingReceipt) {
      onEdit(editingReceipt.id, editingReceipt);
      setEditingReceipt(null);
      toast({
        title: 'Receipt Updated',
        description: 'Receipt information has been successfully updated.',
      });
    }
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    toast({
      title: 'Receipt Deleted',
      description: 'Receipt has been successfully deleted.',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receipt Records</CardTitle>
        <CardDescription>
          Search, sort, and manage your uploaded receipts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search and Filter Controls */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="keyword-search">Keyword Search</Label>
              <Input
                id="keyword-search"
                placeholder="Search receipts..."
                value={searchFilters.keyword || ''}
                onChange={(e) => onSearchChange({ ...searchFilters, keyword: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="vendor-filter">Vendor Filter</Label>
              <Input
                id="vendor-filter"
                placeholder="Filter by vendor..."
                value={searchFilters.vendor || ''}
                onChange={(e) => onSearchChange({ ...searchFilters, vendor: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="category-filter">Category Filter</Label>
              <Select
                value={searchFilters.category || ''}
                onValueChange={(value) => onSearchChange({ ...searchFilters, category: value || undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="date-from">Date From</Label>
              <Input
                id="date-from"
                type="date"
                value={searchFilters.dateFrom || ''}
                onChange={(e) => onSearchChange({ ...searchFilters, dateFrom: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="date-to">Date To</Label>
              <Input
                id="date-to"
                type="date"
                value={searchFilters.dateTo || ''}
                onChange={(e) => onSearchChange({ ...searchFilters, dateTo: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="amount-min">Min Amount</Label>
              <Input
                id="amount-min"
                type="number"
                placeholder="$0"
                value={searchFilters.amountMin || ''}
                onChange={(e) => onSearchChange({ ...searchFilters, amountMin: parseFloat(e.target.value) || undefined })}
              />
            </div>
            <div>
              <Label htmlFor="amount-max">Max Amount</Label>
              <Input
                id="amount-max"
                type="number"
                placeholder="$999"
                value={searchFilters.amountMax || ''}
                onChange={(e) => onSearchChange({ ...searchFilters, amountMax: parseFloat(e.target.value) || undefined })}
              />
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {receipts.length} receipt{receipts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Table */}
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('date')}
                    className="h-auto p-0 hover:bg-transparent"
                  >
                    Date {getSortIcon('date')}
                  </Button>
                </th>
                <th className="text-left p-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('vendor')}
                    className="h-auto p-0 hover:bg-transparent"
                  >
                    Vendor {getSortIcon('vendor')}
                  </Button>
                </th>
                <th className="text-left p-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('amount')}
                    className="h-auto p-0 hover:bg-transparent"
                  >
                    Amount {getSortIcon('amount')}
                  </Button>
                </th>
                <th className="text-left p-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('category')}
                    className="h-auto p-0 hover:bg-transparent"
                  >
                    Category {getSortIcon('category')}
                  </Button>
                </th>
                <th className="text-left p-3">File</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-muted-foreground">
                    No receipts found matching your search criteria.
                  </td>
                </tr>
              ) : (
                receipts.map((receipt) => (
                  <tr key={receipt.id} className="border-b hover:bg-muted/30">
                    <td className="p-3">{formatDate(receipt.date)}</td>
                    <td className="p-3 font-medium">{receipt.vendor}</td>
                    <td className="p-3 font-mono">{formatCurrency(receipt.amount)}</td>
                    <td className="p-3">
                      <Badge variant="secondary">{receipt.category}</Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium" title={receipt.fileName}>
                            {receipt.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(receipt.fileSize)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge 
                        variant={receipt.status === 'processed' ? 'default' : 
                                receipt.status === 'processing' ? 'secondary' : 'destructive'}
                      >
                        {receipt.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingReceipt(receipt)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Receipt Details</DialogTitle>
                              <DialogDescription>
                                View detailed information about this receipt
                              </DialogDescription>
                            </DialogHeader>
                            {viewingReceipt && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Vendor</Label>
                                    <p className="font-medium">{viewingReceipt.vendor}</p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Amount</Label>
                                    <p className="font-mono font-medium">{formatCurrency(viewingReceipt.amount)}</p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Date</Label>
                                    <p>{formatDate(viewingReceipt.date)}</p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Category</Label>
                                    <p>{viewingReceipt.category}</p>
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Description</Label>
                                  <p>{viewingReceipt.description || 'No description'}</p>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Extracted Text</Label>
                                  <p className="text-sm bg-muted p-2 rounded text-muted-foreground">
                                    {viewingReceipt.extractedText || 'No extracted text available'}
                                  </p>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(receipt)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Receipt</DialogTitle>
                              <DialogDescription>
                                Make changes to the receipt information
                              </DialogDescription>
                            </DialogHeader>
                            {editingReceipt && (
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="edit-vendor">Vendor</Label>
                                  <Input
                                    id="edit-vendor"
                                    value={editingReceipt.vendor}
                                    onChange={(e) => setEditingReceipt({
                                      ...editingReceipt,
                                      vendor: e.target.value
                                    })}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-amount">Amount</Label>
                                  <Input
                                    id="edit-amount"
                                    type="number"
                                    step="0.01"
                                    value={editingReceipt.amount}
                                    onChange={(e) => setEditingReceipt({
                                      ...editingReceipt,
                                      amount: parseFloat(e.target.value) || 0
                                    })}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-date">Date</Label>
                                  <Input
                                    id="edit-date"
                                    type="date"
                                    value={editingReceipt.date}
                                    onChange={(e) => setEditingReceipt({
                                      ...editingReceipt,
                                      date: e.target.value
                                    })}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-category">Category</Label>
                                  <Select
                                    value={editingReceipt.category}
                                    onValueChange={(value) => setEditingReceipt({
                                      ...editingReceipt,
                                      category: value
                                    })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {categories.map(category => (
                                        <SelectItem key={category} value={category}>
                                          {category}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="edit-description">Description</Label>
                                  <Input
                                    id="edit-description"
                                    value={editingReceipt.description || ''}
                                    onChange={(e) => setEditingReceipt({
                                      ...editingReceipt,
                                      description: e.target.value
                                    })}
                                  />
                                </div>
                                <Button onClick={handleSaveEdit} className="w-full">
                                  Save Changes
                                </Button>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(receipt.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};