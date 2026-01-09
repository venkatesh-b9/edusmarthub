import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FileText,
  Plus,
  Download,
  Search,
  Calendar,
  BarChart3,
  Users,
  GraduationCap,
  DollarSign,
  Clock,
  Eye,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

const reports = [
  { id: 1, name: 'Monthly Attendance Report', type: 'Attendance', generatedAt: '2025-12-28', size: '2.4 MB', status: 'ready', icon: Calendar },
  { id: 2, name: 'Academic Performance Summary', type: 'Academic', generatedAt: '2025-12-27', size: '3.1 MB', status: 'ready', icon: GraduationCap },
  { id: 3, name: 'Financial Overview Q4', type: 'Financial', generatedAt: '2025-12-25', size: '1.8 MB', status: 'ready', icon: DollarSign },
  { id: 4, name: 'Teacher Performance Review', type: 'Staff', generatedAt: '2025-12-24', size: '4.2 MB', status: 'ready', icon: Users },
  { id: 5, name: 'Student Enrollment Statistics', type: 'Enrollment', generatedAt: '2025-12-23', size: '1.5 MB', status: 'ready', icon: BarChart3 },
  { id: 6, name: 'Annual Report 2025', type: 'Comprehensive', generatedAt: '2025-12-20', size: '12.4 MB', status: 'generating', icon: FileText },
];

const reportTemplates = [
  { id: 'attendance', name: 'Attendance Report', description: 'Daily, weekly, or monthly attendance statistics' },
  { id: 'academic', name: 'Academic Performance', description: 'Grades, GPA trends, and class rankings' },
  { id: 'financial', name: 'Financial Report', description: 'Revenue, expenses, and fee collection' },
  { id: 'staff', name: 'Staff Report', description: 'Teacher performance and workload analysis' },
  { id: 'enrollment', name: 'Enrollment Report', description: 'Student enrollment trends and demographics' },
  { id: 'comprehensive', name: 'Comprehensive Report', description: 'All-in-one school performance overview' },
];

export default function Reports() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  const filteredReports = reports.filter(report =>
    report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenerateReport = () => {
    toast.success('Report generation started! You will be notified when ready.');
    setIsGenerateModalOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-bold">Reports</h1>
            <p className="text-muted-foreground mt-1">
              Generate and manage school reports
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Dialog open={isGenerateModalOpen} onOpenChange={setIsGenerateModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 gradient-primary text-white shadow-glow">
                  <Plus className="w-4 h-4" />
                  Generate Report
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Generate New Report</DialogTitle>
                  <DialogDescription>
                    Select a report type and configure options.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Report Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        {reportTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div>
                              <p className="font-medium">{template.name}</p>
                              <p className="text-xs text-muted-foreground">{template.description}</p>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input type="date" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Format</Label>
                    <Select defaultValue="pdf">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF Document</SelectItem>
                        <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                        <SelectItem value="csv">CSV File</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label>Include Sections</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="summary" defaultChecked />
                        <label htmlFor="summary" className="text-sm">Executive Summary</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="charts" defaultChecked />
                        <label htmlFor="charts" className="text-sm">Charts & Graphs</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="tables" defaultChecked />
                        <label htmlFor="tables" className="text-sm">Data Tables</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="recommendations" />
                        <label htmlFor="recommendations" className="text-sm">Recommendations</label>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsGenerateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleGenerateReport} className="gradient-primary text-white">
                    Generate Report
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="attendance">Attendance</SelectItem>
              <SelectItem value="academic">Academic</SelectItem>
              <SelectItem value="financial">Financial</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Report Templates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-semibold mb-4">Quick Generate</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {reportTemplates.map((template) => (
              <Button
                key={template.id}
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary/50"
                onClick={() => setIsGenerateModalOpen(true)}
              >
                <FileText className="w-6 h-6 text-primary" />
                <span className="text-sm font-medium">{template.name}</span>
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Reports List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold mb-4">Recent Reports</h2>
          <div className="space-y-3">
            {filteredReports.map((report, index) => {
              const IconComponent = report.icon;
              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-xl border border-border p-4 shadow-card hover:shadow-elevated transition-all duration-300 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{report.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span>{report.type}</span>
                        <span>•</span>
                        <span>{report.generatedAt}</span>
                        <span>•</span>
                        <span>{report.size}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {report.status === 'generating' ? (
                      <Badge variant="secondary" className="gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Generating
                      </Badge>
                    ) : (
                      <Badge variant="default">Ready</Badge>
                    )}
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" disabled={report.status === 'generating'}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" disabled={report.status === 'generating'}>
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
