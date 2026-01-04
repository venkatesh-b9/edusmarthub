import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileSpreadsheet, FileText, FileJson } from 'lucide-react';
import { toast } from 'sonner';

interface ExportModalProps {
  trigger?: React.ReactNode;
}

export function ExportModal({ trigger }: ExportModalProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState('csv');
  const [options, setOptions] = useState({
    includeSchools: true,
    includeStudents: true,
    includeTeachers: true,
    includeAnalytics: false,
  });

  const handleExport = () => {
    const selectedData = Object.entries(options)
      .filter(([_, v]) => v)
      .map(([k]) => k.replace('include', ''))
      .join(', ');

    toast.success('Export started', {
      description: `Exporting ${selectedData} as ${format.toUpperCase()}`,
    });
    
    // Simulate download
    setTimeout(() => {
      toast.success('Export complete', {
        description: 'Your file has been downloaded',
      });
    }, 1500);
    
    setOpen(false);
  };

  const formatIcons = {
    csv: FileSpreadsheet,
    xlsx: FileSpreadsheet,
    pdf: FileText,
    json: FileJson,
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={format} onValueChange={setFormat} className="grid grid-cols-2 gap-3">
              {['csv', 'xlsx', 'pdf', 'json'].map((f) => {
                const Icon = formatIcons[f as keyof typeof formatIcons];
                return (
                  <div key={f}>
                    <RadioGroupItem value={f} id={f} className="peer sr-only" />
                    <Label
                      htmlFor={f}
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <Icon className="mb-2 h-6 w-6" />
                      <span className="text-sm font-medium uppercase">{f}</span>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>Include Data</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="schools"
                  checked={options.includeSchools}
                  onCheckedChange={(checked) => setOptions({ ...options, includeSchools: !!checked })}
                />
                <label htmlFor="schools" className="text-sm">Schools (212 records)</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="students"
                  checked={options.includeStudents}
                  onCheckedChange={(checked) => setOptions({ ...options, includeStudents: !!checked })}
                />
                <label htmlFor="students" className="text-sm">Students (58,320 records)</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="teachers"
                  checked={options.includeTeachers}
                  onCheckedChange={(checked) => setOptions({ ...options, includeTeachers: !!checked })}
                />
                <label htmlFor="teachers" className="text-sm">Teachers (3,845 records)</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="analytics"
                  checked={options.includeAnalytics}
                  onCheckedChange={(checked) => setOptions({ ...options, includeAnalytics: !!checked })}
                />
                <label htmlFor="analytics" className="text-sm">Analytics Summary</label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button className="flex-1 gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
