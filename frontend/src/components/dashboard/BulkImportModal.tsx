import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Upload, FileSpreadsheet, FileText, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ImportData {
  file: File | null;
  data: any[];
  errors: ValidationError[];
  isValid: boolean;
  progress: number;
}

interface BulkImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: any[]) => Promise<void>;
  type: 'teacher' | 'student';
  validationSchema?: any;
}

export function BulkImportModal({
  open,
  onOpenChange,
  onImport,
  type,
  validationSchema,
}: BulkImportModalProps) {
  const [importData, setImportData] = useState<ImportData>({
    file: null,
    data: [],
    errors: [],
    isValid: false,
    progress: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setImportData({
      file,
      data: [],
      errors: [],
      isValid: false,
      progress: 0,
    });

    setIsProcessing(true);
    toast.info(`Processing ${file.name}...`);

    // Simulate file processing
    setTimeout(() => {
      try {
        // In production, use a library like PapaParse for CSV or xlsx for Excel
        const mockData = [
          { name: 'John Doe', email: 'john@example.com', subject: 'Math', status: 'valid' },
          { name: 'Jane Smith', email: 'invalid-email', subject: 'Science', status: 'error' },
          { name: 'Bob Johnson', email: 'bob@example.com', subject: 'English', status: 'valid' },
        ];

        const errors: ValidationError[] = mockData
          .map((row, index) => {
            if (row.status === 'error') {
              return {
                row: index + 2, // +2 for header and 1-based index
                field: 'email',
                message: 'Invalid email format',
              };
            }
            return null;
          })
          .filter(Boolean) as ValidationError[];

        setImportData({
          file,
          data: mockData,
          errors,
          isValid: errors.length === 0,
          progress: 100,
        });

        toast.success(`Processed ${mockData.length} rows`);
      } catch (error) {
        toast.error('Failed to process file');
      } finally {
        setIsProcessing(false);
      }
    }, 2000);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
  });

  const handleImport = async () => {
    if (!importData.isValid || importData.data.length === 0) {
      toast.error('Please fix validation errors before importing');
      return;
    }

    setIsImporting(true);
    const validData = importData.data.filter((row) => row.status !== 'error');

    try {
      await onImport(validData);
      toast.success(`Successfully imported ${validData.length} ${type}s`);
      onOpenChange(false);
      setImportData({
        file: null,
        data: [],
        errors: [],
        isValid: false,
        progress: 0,
      });
    } catch (error) {
      toast.error('Failed to import data');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import {type === 'teacher' ? 'Teachers' : 'Students'}</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to import multiple records at once. The file will be validated before import.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList>
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="preview" disabled={importData.data.length === 0}>
              Preview & Validate
              {importData.errors.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {importData.errors.length} errors
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <input {...getInputProps()} />
              {importData.file ? (
                <div className="space-y-4">
                  <FileSpreadsheet className="h-12 w-12 mx-auto text-primary" />
                  <div>
                    <p className="font-medium">{importData.file.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(importData.file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  {isProcessing && (
                    <div className="space-y-2">
                      <Progress value={importData.progress} className="w-full" />
                      <p className="text-sm text-muted-foreground">Processing file...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {isDragActive ? 'Drop the file here' : 'Drag & drop a file here'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or click to select a CSV or Excel file
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>.xlsx, .xls</span>
                    <FileText className="h-4 w-4" />
                    <span>.csv</span>
                  </div>
                </div>
              )}
            </div>

            {importData.file && !isProcessing && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  {importData.isValid ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Valid
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      {importData.errors.length} Error(s)
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Rows processed</span>
                  <span className="font-medium">{importData.data.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Valid rows</span>
                  <span className="font-medium text-success">
                    {importData.data.filter((r) => r.status !== 'error').length}
                  </span>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            {importData.errors.length > 0 && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="font-medium text-destructive">Validation Errors</span>
                </div>
                <div className="space-y-1 text-sm">
                  {importData.errors.slice(0, 5).map((error, i) => (
                    <p key={i} className="text-muted-foreground">
                      Row {error.row}, {error.field}: {error.message}
                    </p>
                  ))}
                  {importData.errors.length > 5 && (
                    <p className="text-muted-foreground">
                      ...and {importData.errors.length - 5} more errors
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {importData.data.length > 0 &&
                        Object.keys(importData.data[0]).map((key) => (
                          <TableHead key={key}>{key}</TableHead>
                        ))}
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importData.data.slice(0, 10).map((row, i) => (
                      <TableRow key={i}>
                        {Object.values(row).map((value: any, j) => (
                          <TableCell key={j} className="text-sm">
                            {String(value)}
                          </TableCell>
                        ))}
                        <TableCell>
                          {row.status === 'valid' ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {importData.data.length > 10 && (
                <div className="p-4 text-center text-sm text-muted-foreground border-t">
                  Showing first 10 rows of {importData.data.length} total
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!importData.isValid || importData.data.length === 0 || isImporting}
          >
            {isImporting ? 'Importing...' : `Import ${importData.data.filter((r) => r.status !== 'error').length} ${type}s`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
