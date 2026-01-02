import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  FileText,
  Search,
  Plus,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Download,
  Eye,
  Edit,
  Trash2,
  Copy,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const assignments = [
  {
    id: 1,
    title: 'Lab Report #3 - Momentum',
    className: 'Advanced Physics',
    grade: '11-A',
    dueDate: 'Jan 5, 2026',
    status: 'active',
    totalStudents: 32,
    submitted: 28,
    graded: 15,
    avgScore: 85,
    type: 'Lab Report',
  },
  {
    id: 2,
    title: 'Problem Set 5 - Forces',
    className: 'General Physics',
    grade: '10-B',
    dueDate: 'Jan 3, 2026',
    status: 'grading',
    totalStudents: 28,
    submitted: 28,
    graded: 28,
    avgScore: 78,
    type: 'Problem Set',
  },
  {
    id: 3,
    title: 'Midterm Exam Preparation',
    className: 'AP Physics',
    grade: '12-A',
    dueDate: 'Jan 10, 2026',
    status: 'active',
    totalStudents: 24,
    submitted: 12,
    graded: 0,
    avgScore: null,
    type: 'Exam',
  },
  {
    id: 4,
    title: 'Wave Properties Quiz',
    className: 'Physics Lab',
    grade: '11-B',
    dueDate: 'Dec 28, 2025',
    status: 'completed',
    totalStudents: 30,
    submitted: 30,
    graded: 30,
    avgScore: 82,
    type: 'Quiz',
  },
  {
    id: 5,
    title: 'Research Paper Draft',
    className: 'AP Physics',
    grade: '12-A',
    dueDate: 'Jan 15, 2026',
    status: 'draft',
    totalStudents: 24,
    submitted: 0,
    graded: 0,
    avgScore: null,
    type: 'Paper',
  },
];

const recentSubmissions = [
  { id: 1, student: 'Alice Johnson', assignment: 'Lab Report #3', submittedAt: '2 hours ago', status: 'pending' },
  { id: 2, student: 'Bob Smith', assignment: 'Lab Report #3', submittedAt: '3 hours ago', status: 'graded', score: 88 },
  { id: 3, student: 'Carol White', assignment: 'Problem Set 5', submittedAt: '5 hours ago', status: 'pending' },
  { id: 4, student: 'David Brown', assignment: 'Lab Report #3', submittedAt: '6 hours ago', status: 'graded', score: 92 },
];

export default function TeacherAssignments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.className.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success';
      case 'grading': return 'bg-warning/10 text-warning';
      case 'completed': return 'bg-muted text-muted-foreground';
      case 'draft': return 'bg-secondary text-secondary-foreground';
      default: return '';
    }
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
            <h1 className="text-3xl font-bold">Assignments</h1>
            <p className="text-muted-foreground mt-1">
              Create, manage, and grade student assignments
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 gradient-primary text-white shadow-glow">
                  <Plus className="w-4 h-4" />
                  Create Assignment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Assignment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Title</label>
                      <Input placeholder="Assignment title" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Type</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="homework">Homework</SelectItem>
                          <SelectItem value="quiz">Quiz</SelectItem>
                          <SelectItem value="exam">Exam</SelectItem>
                          <SelectItem value="project">Project</SelectItem>
                          <SelectItem value="lab">Lab Report</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Class</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Advanced Physics - 11-A</SelectItem>
                          <SelectItem value="2">General Physics - 10-B</SelectItem>
                          <SelectItem value="3">AP Physics - 12-A</SelectItem>
                          <SelectItem value="4">Physics Lab - 11-B</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Due Date</label>
                      <Input type="datetime-local" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Instructions</label>
                    <Textarea placeholder="Enter assignment instructions..." rows={4} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Total Points</label>
                      <Input type="number" placeholder="100" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Attachments</label>
                      <Input type="file" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Save as Draft</Button>
                    <Button className="gradient-primary text-white">Publish Assignment</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border p-4 shadow-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">5</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-success" />
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl border border-border p-4 shadow-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">43</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-warning" />
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl border border-border p-4 shadow-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Graded Today</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl border border-border p-4 shadow-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Score</p>
                <p className="text-2xl font-bold">82%</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-accent" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="grading">Grading</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assignments List */}
          <div className="lg:col-span-2 space-y-4">
            {filteredAssignments.map((assignment, index) => (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                className="bg-card rounded-xl border border-border p-5 shadow-card hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{assignment.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {assignment.className} • Grade {assignment.grade}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(assignment.status)}>
                      {assignment.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Eye className="w-4 h-4 mr-2" /> View</DropdownMenuItem>
                        <DropdownMenuItem><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem><Copy className="w-4 h-4 mr-2" /> Duplicate</DropdownMenuItem>
                        <DropdownMenuItem><Download className="w-4 h-4 mr-2" /> Export</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-semibold">{assignment.submitted}/{assignment.totalStudents}</p>
                    <p className="text-xs text-muted-foreground">Submitted</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-semibold">{assignment.graded}</p>
                    <p className="text-xs text-muted-foreground">Graded</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-semibold">{assignment.avgScore ?? '-'}%</p>
                    <p className="text-xs text-muted-foreground">Avg Score</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-semibold">{assignment.type}</p>
                    <p className="text-xs text-muted-foreground">Type</p>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Submission Progress</span>
                    <span className="font-medium">{Math.round((assignment.submitted / assignment.totalStudents) * 100)}%</span>
                  </div>
                  <Progress value={(assignment.submitted / assignment.totalStudents) * 100} className="h-2" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Due: {assignment.dueDate}
                  </div>
                  <Button variant="outline" size="sm">Grade Submissions</Button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Recent Submissions Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl border border-border p-5 shadow-card h-fit"
          >
            <h3 className="font-semibold mb-4">Recent Submissions</h3>
            <div className="space-y-4">
              {recentSubmissions.map((submission) => (
                <div key={submission.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                    {submission.student.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{submission.student}</p>
                    <p className="text-xs text-muted-foreground truncate">{submission.assignment}</p>
                  </div>
                  <div className="text-right">
                    {submission.status === 'graded' ? (
                      <Badge variant="outline" className="text-success">{submission.score}%</Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{submission.submittedAt}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">View All Submissions</Button>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
