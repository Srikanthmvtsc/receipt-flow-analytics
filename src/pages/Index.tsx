import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReceiptUpload } from '@/components/ReceiptUpload';
import { ReceiptTable } from '@/components/ReceiptTable';
import { StatsCards } from '@/components/StatsCards';
import { Charts } from '@/components/Charts';
import { ExportOptions } from '@/components/ExportOptions';
import { useReceiptData } from '@/hooks/useReceiptData';
import { Upload, BarChart3, Table, Download } from 'lucide-react';

const Index = () => {
  const {
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
    exportData
  } = useReceiptData();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-foreground">Receipt Management System</h1>
          <p className="text-muted-foreground mt-2">
            Upload, analyze, and manage your receipts and bills with advanced data extraction and insights
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="receipts" className="flex items-center gap-2">
              <Table className="h-4 w-4" />
              Receipts
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <ReceiptUpload onUpload={uploadReceipt} />
            
            {/* Quick Stats Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card rounded-lg p-4 border">
                <h3 className="font-semibold text-sm text-muted-foreground">Total Receipts</h3>
                <p className="text-2xl font-bold text-primary">{stats.totalReceipts}</p>
              </div>
              <div className="bg-card rounded-lg p-4 border">
                <h3 className="font-semibold text-sm text-muted-foreground">Total Spending</h3>
                <p className="text-2xl font-bold text-success">
                  ${stats.totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-card rounded-lg p-4 border">
                <h3 className="font-semibold text-sm text-muted-foreground">Average Amount</h3>
                <p className="text-2xl font-bold text-info">
                  ${stats.averageAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <StatsCards stats={stats} />
            <Charts stats={stats} />
          </TabsContent>

          {/* Receipts Tab */}
          <TabsContent value="receipts" className="space-y-6">
            <ReceiptTable
              receipts={receipts}
              searchFilters={searchFilters}
              sortOptions={sortOptions}
              onSearchChange={setSearchFilters}
              onSortChange={setSortOptions}
              onEdit={updateReceipt}
              onDelete={deleteReceipt}
            />
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-6">
            <ExportOptions receipts={receipts} stats={stats} onExport={exportData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
