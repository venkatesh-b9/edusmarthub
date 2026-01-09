import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  Search,
  Download,
  Upload,
  Filter,
  ChevronDown,
  Edit,
  Save,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ChartCard } from '@/components/dashboard/Charts';

const classes = [
  { id: '1', name: 'Advanced Physics - 11-A' },
  { id: '2', name: 'General Physics - 10-B' },
  { id: '3', name: 'AP Physics - 12-A' },
  { id: '4', name: 'Physics Lab - 11-B' },
];

const gradeBook = [
  { id: 1, name: 'Alice Johnson', rollNo: '11A001', quiz1: 92, quiz2: 88, midterm: 85, lab1: 90, lab2: 88, project: 95, final: null, avg: 89.7 },
  { id: 2, name: 'Bob Smith', rollNo: '11A002', quiz1: 78, quiz2: 82, midterm: 75, lab1: 80, lab2: 85, project: 88, final: null, avg: 81.3 },
  { id: 3, name: 'Carol White', rollNo: '11A003', quiz1: 95, quiz2: 94, midterm: 92, lab1: 95, lab2: 93, project: 97, final: null, avg: 94.3 },
  { id: 4, name: 'David Brown', rollNo: '11A004', quiz1: 68, quiz2: 72, midterm: 65, lab1: 70, lab2: 75, project: 80, final: null, avg: 71.7 },
  { id: 5, name: 'Emma Davis', rollNo: '11A005', quiz1: 85, quiz2: 88, midterm: 82, lab1: 87, lab2: 90, project: 92, final: null, avg: 87.3 },
  { id: 6, name: 'Frank Miller', rollNo: '11A006', quiz1: 72, quiz2: 75, midterm: 70, lab1: 78, lab2: 80, project: 85, final: null, avg: 76.7 },
  { id: 7, name: 'Grace Lee', rollNo: '11A007', quiz1: 90, quiz2: 92, midterm: 88, lab1: 91, lab2: 89, project: 94, final: null, avg: 90.7 },
  { id: 8, name: 'Henry Wilson', rollNo: '11A008', quiz1: 60, quiz2: 65, midterm: 58, lab1: 62, lab2: 68, project: 72, final: null, avg: 64.2 },
];

const gradeDistribution = [
  { grade: 'A', count: 12, color: 'hsl(142, 76%, 36%)' },
  { grade: 'B', count: 18, color: 'hsl(217, 91%, 60%)' },
  { grade: 'C', count: 8, color: 'hsl(47, 100%, 50%)' },
  { grade: 'D', count: 3, color: 'hsl(25, 95%, 53%)' },
  { grade: 'F', count: 1, color: 'hsl(0, 84%, 60%)' },
];

const performanceTrend = [
  { month: 'Sep', avgGrade: 78 },
  { month: 'Oct', avgGrade: 80 },
  { month: 'Nov', avgGrade: 82 },
  { month: 'Dec', avgGrade: 85 },
  { month: 'Jan', avgGrade: 84 },
];

const getGradeColor = (score: number | null) => {
  if (score === null) return 'text-muted-foreground';
  if (score >= 90) return 'text-success';
  if (score >= 80) return 'text-primary';
  if (score >= 70) return 'text-warning';
  if (score >= 60) return 'text-orange-500';
  return 'text-destructive';
};

const getLetterGrade = (avg: number) => {
  if (avg >= 90) return 'A';
  if (avg >= 80) return 'B';
  if (avg >= 70) return 'C';
  if (avg >= 60) return 'D';
  return 'F';
};

export default function TeacherGrades() {
  const [selectedClass, setSelectedClass] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const filteredGrades = gradeBook.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-bold">Grades</h1>
            <p className="text-muted-foreground mt-1">
              Manage and analyze student grades
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <Button variant="outline" className="gap-2">
              <Upload className="w-4 h-4" />
              Import
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              className={cn("gap-2", isEditing ? "bg-success hover:bg-success/90" : "gradient-primary text-white shadow-glow")}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <><Save className="w-4 h-4" /> Save Changes</> : <><Edit className="w-4 h-4" /> Edit Grades</>}
            </Button>
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
                <p className="text-sm text-muted-foreground">Class Average</p>
                <p className="text-2xl font-bold">82.4%</p>
              </div>
              <Badge variant="outline" className="text-success">+2.3%</Badge>
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
                <p className="text-sm text-muted-foreground">Highest Score</p>
                <p className="text-2xl font-bold">97%</p>
              </div>
              <TrendingUp className="w-5 h-5 text-success" />
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
                <p className="text-sm text-muted-foreground">Lowest Score</p>
                <p className="text-2xl font-bold">58%</p>
              </div>
              <Badge variant="destructive">At Risk</Badge>
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
                <p className="text-sm text-muted-foreground">Pending Grades</p>
                <p className="text-2xl font-bold">32</p>
              </div>
              <BarChart3 className="w-5 h-5 text-warning" />
            </div>
          </motion.div>
        </div>

        <Tabs defaultValue="gradebook" className="space-y-6">
          <TabsList>
            <TabsTrigger value="gradebook">Grade Book</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="gradebook" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Grade Book Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border overflow-hidden shadow-card"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground sticky left-0 bg-muted/50">Student</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Quiz 1</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Quiz 2</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Midterm</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Lab 1</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Lab 2</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Project</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Final</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Average</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGrades.map((student, index) => (
                      <motion.tr
                        key={student.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.02 * index }}
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-4 sticky left-0 bg-card">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="font-medium">{student.name}</p>
                              <p className="text-xs text-muted-foreground">{student.rollNo}</p>
                            </div>
                          </div>
                        </td>
                        <td className={cn("py-3 px-4 text-center font-medium", getGradeColor(student.quiz1))}>
                          {isEditing ? <Input type="number" className="w-16 h-8 text-center" defaultValue={student.quiz1} /> : student.quiz1}
                        </td>
                        <td className={cn("py-3 px-4 text-center font-medium", getGradeColor(student.quiz2))}>
                          {isEditing ? <Input type="number" className="w-16 h-8 text-center" defaultValue={student.quiz2} /> : student.quiz2}
                        </td>
                        <td className={cn("py-3 px-4 text-center font-medium", getGradeColor(student.midterm))}>
                          {isEditing ? <Input type="number" className="w-16 h-8 text-center" defaultValue={student.midterm} /> : student.midterm}
                        </td>
                        <td className={cn("py-3 px-4 text-center font-medium", getGradeColor(student.lab1))}>
                          {isEditing ? <Input type="number" className="w-16 h-8 text-center" defaultValue={student.lab1} /> : student.lab1}
                        </td>
                        <td className={cn("py-3 px-4 text-center font-medium", getGradeColor(student.lab2))}>
                          {isEditing ? <Input type="number" className="w-16 h-8 text-center" defaultValue={student.lab2} /> : student.lab2}
                        </td>
                        <td className={cn("py-3 px-4 text-center font-medium", getGradeColor(student.project))}>
                          {isEditing ? <Input type="number" className="w-16 h-8 text-center" defaultValue={student.project} /> : student.project}
                        </td>
                        <td className="py-3 px-4 text-center text-muted-foreground">
                          {student.final ?? '-'}
                        </td>
                        <td className={cn("py-3 px-4 text-center font-bold", getGradeColor(student.avg))}>
                          {student.avg.toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge className={cn(
                            student.avg >= 90 ? 'bg-success/10 text-success' :
                            student.avg >= 80 ? 'bg-primary/10 text-primary' :
                            student.avg >= 70 ? 'bg-warning/10 text-warning' :
                            student.avg >= 60 ? 'bg-orange-100 text-orange-600' :
                            'bg-destructive/10 text-destructive'
                          )}>
                            {getLetterGrade(student.avg)}
                          </Badge>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Grade Distribution" subtitle="All students">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={gradeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="grade" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {gradeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Performance Trend" subtitle="Class average over time">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={performanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis domain={[60, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgGrade"
                      stroke="hsl(217, 91%, 60%)"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(217, 91%, 60%)', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="text-center py-12 text-muted-foreground">
              <p>Generate detailed grade reports here</p>
              <Button className="mt-4 gradient-primary text-white">Generate Report</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
