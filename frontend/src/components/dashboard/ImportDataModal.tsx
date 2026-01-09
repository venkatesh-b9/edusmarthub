import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload, FileSpreadsheet, Users, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

interface ImportDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const dataTypes = [
  { id: 'students', label: 'Students', icon: Users, description: 'Import student records' },
  { id: 'teachers', label: 'Teachers', icon: Users, description: 'Import teacher records' },
  { id: 'classes', label: 'Classes', icon: BookOpen, description: 'Import class schedules' },
  { id: 'grades', label: 'Grades', icon: FileSpreadsheet, description: 'Import grade records' },
];

export function ImportDataModal({ open, onOpenChange }: ImportDataModalProps) {
  const [selectedType, setSelectedType] = useState('students');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || 
          selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          selectedFile.type === 'application/vnd.ms-excel') {
        setFile(selectedFile);
      } else {
        toast.error('Please select a CSV or Excel file');
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file to import');
      return;
    }

    setIsUploading(true);

    // Simulate upload
    await new Promise((resolve) => setTimeout(resolve, 2000));

    toast.success(`${selectedType} data imported successfully!`);
    setFile(null);
    setIsUploading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Data</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to import data into the system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label>Data Type</Label>
            <RadioGroup value={selectedType} onValueChange={setSelectedType}>
              <div className="grid grid-cols-2 gap-3">
                {dataTypes.map((type) => (
                  <Label
                    key={type.id}
                    htmlFor={type.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedType === type.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <RadioGroupItem value={type.id} id={type.id} className="sr-only" />
                    <type.icon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                  </Label>
                ))}
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>Upload File</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                file ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
              }`}
            >
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                {file ? (
                  <p className="text-sm font-medium">{file.name}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium">Click to upload</p>
                    <p className="text-xs text-muted-foreground mt-1">CSV or Excel files only</p>
                  </>
                )}
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!file || isUploading}>
              {isUploading ? 'Importing...' : 'Import Data'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
