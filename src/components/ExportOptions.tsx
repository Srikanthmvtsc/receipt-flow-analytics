import { Download, FileText, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt, ReceiptStats } from '@/types/receipt';
import { useToast } from '@/hooks/use-toast';

interface ExportOptionsProps {
  receipts: Receipt[];
  stats: ReceiptStats;
  onExport: (format: 'csv' | 'json') => Promise<void>;
}

export const ExportOptions = ({ receipts, stats, onExport }: ExportOptionsProps) => {
  const { toast } = useToast();

  const exportToCSV = () => {
    const headers = ['Date', 'Vendor', 'Amount', 'Category', 'Description', 'File Name', 'File Size'];
    const csvContent = [
      headers.join(','),
      ...receipts.map(receipt => [
        receipt.date,
        `"${receipt.vendor}"`,
        receipt.amount,
        `"${receipt.category}"`,
        `"${receipt.description || ''}"`,
        `"${receipt.fileName}"`,
        receipt.fileSize
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `receipts_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast({
      title: 'Export Successful',
      description: 'Receipt data has been exported to CSV format.',
    });
  };

  const exportToJSON = () => {
    const exportData = {
      export_date: new Date().toISOString(),
      stats: stats,
      receipts: receipts.map(receipt => ({
        ...receipt,
        // Remove binary data for JSON export
        extractedText: receipt.extractedText?.substring(0, 500) // Truncate long text
      }))
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `receipts_export_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast({
      title: 'Export Successful',
      description: 'Receipt data has been exported to JSON format.',
    });
  };

  const exportSummaryReport = () => {
    const reportContent = `
RECEIPT MANAGEMENT SYSTEM - SUMMARY REPORT
Generated: ${new Date().toLocaleString()}

==================================================
STATISTICAL OVERVIEW
==================================================

Total Receipts: ${stats.totalReceipts}
Total Spending: $${stats.totalSpend.toFixed(2)}
Average Amount: $${stats.averageAmount.toFixed(2)}
Median Amount: $${stats.medianAmount.toFixed(2)}
Mode Amount: $${stats.modeAmount.toFixed(2)}

==================================================
TOP VENDORS (by total spending)
==================================================

${stats.topVendors.map((vendor, index) => 
  `${index + 1}. ${vendor.vendor}: $${vendor.total.toFixed(2)} (${vendor.count} transactions)`
).join('\n')}

==================================================
CATEGORY BREAKDOWN
==================================================

${stats.categorySpending.map(category => 
  `${category.category}: $${category.amount.toFixed(2)} (${category.count} receipts)`
).join('\n')}

==================================================
MONTHLY SPENDING TREND
==================================================

${stats.monthlySpending.map(month => 
  `${month.month}: $${month.amount.toFixed(2)}`
).join('\n')}

==================================================
DETAILED RECEIPT LIST
==================================================

${receipts.map((receipt, index) => 
  `${index + 1}. ${receipt.date} | ${receipt.vendor} | $${receipt.amount.toFixed(2)} | ${receipt.category}`
).join('\n')}

==================================================
End of Report
==================================================
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `receipt_summary_${new Date().toISOString().split('T')[0]}.txt`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast({
      title: 'Export Successful',
      description: 'Summary report has been generated and downloaded.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Options
        </CardTitle>
        <CardDescription>
          Export your receipt data in various formats for external analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            onClick={exportToCSV}
            className="h-auto flex-col gap-2 p-4"
          >
            <Database className="h-6 w-6" />
            <div className="text-center">
              <p className="font-medium">Export to CSV</p>
              <p className="text-xs text-muted-foreground">
                Spreadsheet-compatible format
              </p>
            </div>
          </Button>

          <Button
            variant="outline"
            onClick={exportToJSON}
            className="h-auto flex-col gap-2 p-4"
          >
            <FileText className="h-6 w-6" />
            <div className="text-center">
              <p className="font-medium">Export to JSON</p>
              <p className="text-xs text-muted-foreground">
                Structured data with statistics
              </p>
            </div>
          </Button>

          <Button
            variant="outline"
            onClick={exportSummaryReport}
            className="h-auto flex-col gap-2 p-4"
          >
            <Download className="h-6 w-6" />
            <div className="text-center">
              <p className="font-medium">Summary Report</p>
              <p className="text-xs text-muted-foreground">
                Human-readable text report
              </p>
            </div>
          </Button>
        </div>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Export Information</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• CSV: Compatible with Excel, Google Sheets, and other spreadsheet applications</li>
            <li>• JSON: Includes both raw data and computed statistics for programmatic use</li>
            <li>• Summary Report: Human-readable overview with key insights and trends</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};