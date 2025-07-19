import { useState, useCallback } from 'react';
import { Upload, FileText, Image, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Receipt } from '@/types/receipt';

interface ReceiptUploadProps {
  onUpload: (receipt: Omit<Receipt, 'id' | 'uploadDate' | 'status'>) => void;
}

export const ReceiptUpload = ({ onUpload }: ReceiptUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'Invalid file type. Please upload JPG, PNG, PDF, or TXT files.' };
    }

    if (file.size > maxSize) {
      return { isValid: false, error: 'File size too large. Maximum size is 10MB.' };
    }

    return { isValid: true };
  };

  const extractReceiptData = async (file: File): Promise<Omit<Receipt, 'id' | 'uploadDate' | 'status'>> => {
    // Simulate OCR/text extraction processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock data extraction based on filename patterns
    const fileName = file.name.toLowerCase();
    let vendor = 'Unknown Vendor';
    let category = 'Miscellaneous';
    let amount = Math.floor(Math.random() * 200) + 10;
    let description = 'Extracted from uploaded receipt';

    // Pattern-based vendor detection
    if (fileName.includes('walmart') || fileName.includes('grocery')) {
      vendor = 'Walmart';
      category = 'Groceries';
    } else if (fileName.includes('starbucks') || fileName.includes('coffee')) {
      vendor = 'Starbucks';
      category = 'Food & Beverage';
    } else if (fileName.includes('shell') || fileName.includes('gas')) {
      vendor = 'Shell';
      category = 'Transportation';
    } else if (fileName.includes('electric') || fileName.includes('power')) {
      vendor = 'PowerCorp';
      category = 'Utilities';
    } else if (fileName.includes('internet') || fileName.includes('wifi')) {
      vendor = 'TechNet ISP';
      category = 'Internet';
    }

    const today = new Date();
    return {
      fileName: file.name,
      vendor,
      date: today.toISOString().split('T')[0],
      amount,
      category,
      description,
      fileType: file.type,
      fileSize: file.size,
      extractedText: `Processed file: ${file.name} - Amount: $${amount}`
    };
  };

  const processFile = async (file: File) => {
    const validation = validateFile(file);
    if (!validation.isValid) {
      toast({
        title: 'Upload Error',
        description: validation.error,
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const receiptData = await extractReceiptData(file);
      
      setUploadProgress(100);
      setTimeout(() => {
        onUpload(receiptData);
        setIsProcessing(false);
        setUploadProgress(0);
        
        toast({
          title: 'Upload Successful',
          description: `Receipt from ${receiptData.vendor} processed successfully.`,
        });
      }, 500);

    } catch (error) {
      setIsProcessing(false);
      setUploadProgress(0);
      toast({
        title: 'Processing Error',
        description: 'Failed to process the uploaded file. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
    e.target.value = ''; // Reset input
  };

  return (
    <Card className="border-2 border-dashed transition-colors duration-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Receipt or Bill
        </CardTitle>
        <CardDescription>
          Upload your receipts and bills in JPG, PNG, PDF, or TXT format (max 10MB)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isProcessing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center p-8">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground">Processing your receipt...</p>
                <Progress value={uploadProgress} className="w-64" />
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 cursor-pointer hover:border-primary/50 ${
              isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-3">
                  {isDragging ? (
                    <CheckCircle className="h-8 w-8 text-primary" />
                  ) : (
                    <Upload className="h-8 w-8 text-primary" />
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-lg font-medium">
                  {isDragging ? 'Drop your file here' : 'Drag and drop your file here'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse your files
                </p>
              </div>

              <Button 
                variant="outline" 
                onClick={() => document.getElementById('file-input')?.click()}
                className="mx-auto"
              >
                <FileText className="h-4 w-4 mr-2" />
                Choose File
              </Button>

              <input
                id="file-input"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Image className="h-3 w-3" />
                  JPG, PNG
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  PDF, TXT
                </div>
              </div>
            </div>
          </div>
        )}

        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Our system automatically extracts vendor, date, amount, and category information from your receipts using advanced OCR technology.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};