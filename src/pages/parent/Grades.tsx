import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Download,
  BookOpen,
  Award,
  Star,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

const children = [
  { id: 1, name: 'Emma Martinez', grade: '10-A', photo: 'EM' },
  { id: 2, name: 'Lucas Martinez', grade: '7-B', photo: 'LM' },
];

const subjectGrades = [
  { subject: 'Mathematics', teacher: 'Mrs. Johnson', currentGrade: 'A', percentage: 92, trend: 'up', assignments: 12, completed: 11 },
  { subject: 'Physics', teacher: 'Mr. Wilson', currentGrade: 'A-', percentage: 88, trend: 'up', assignments: 10, completed: 10 },
  { subject: 'Chemistry', teacher: 'Dr. Brown', currentGrade: 'B+', percentage: 85, trend: 'stable', assignments: 8, completed: 8 },
  { subject: 'English', teacher: 'Ms. Davis', currentGrade: 'B+', percentage: 87, trend: 'up', assignments: 15, completed: 14 },
  { subject: 'History', teacher: 'Mr. Thompson', currentGrade: 'B', percentage: 82, trend: 'down', assignments: 9, completed: 9 },
  { subject: 'Art', teacher: 'Ms. Garcia', currentGrade: 'A', percentage: 95, trend: 'stable', assignments: 6, completed: 6 },
];

const gradeHistory = [
  { semester: 'Spring 2025', gpa: 3.5 },
  { semester: 'Summer 2025', gpa: 3.6 },
  { semester: 'Fall 2025', gpa: 3.7 },
  { semester: 'Winter 2026', gpa: 3.8 },
];

const recentAssignments = [
  { subject: 'Mathematics', name: 'Chapter 8 Test', grade: 'A', score: 94, date: 'Jan 3, 2026', weight: '20%' },
  { subject: 'Physics', name: 'Lab Report: Motion', grade: 'A-', score: 88, date: 'Jan 2, 2026', weight: '15%' },
  { subject: 'English', name: 'Essay: Modern Literature', grade: 'B+', score: 86, date: 'Dec 28, 2025', weight: '25%' },
  { subject: 'Chemistry', name: 'Quiz: Chemical Bonds', grade: 'B+', score: 84, date: 'Dec 27, 2025', weight: '10%' },
  { subject: 'History', name: 'Research Paper', grade: 'B', score: 80, date: 'Dec 20, 2025', weight: '30%' },
];

const upcomingDeadlines = [
  { subject: 'Mathematics', name: 'Chapter 9 Homework', dueDate: 'Jan 8, 2026', daysLeft: 5 },
  { subject: 'English', name: 'Book Report', dueDate: 'Jan 10, 2026', daysLeft: 7 },
  { subject: 'Physics', name: 'Project Presentation', dueDate: 'Jan 15, 2026', daysLeft: 12 },
];

const subjectPerformance = [
  { subject: 'Math', score: 92 },
  { subject: 'Physics', score: 88 },
  { subject: 'Chemistry', score: 85 },
  { subject: 'English', score: 87 },
  { subject: 'History', score: 82 },
  { subject: 'Art', score: 95 },
];

export default function ParentGrades() {
  const [selectedChild, setSelectedChild] = useState(children[0]);

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-success';
    if (grade.startsWith('B')) return 'text-primary';
    if (grade.startsWith('C')) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-bold">Grades</h1>
            <p className="text-muted-foreground mt-1">
              Track academic performance and assignments
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
            <Select defaultValue={selectedChild.id.toString()} onValueChange={(v) => setSelectedChild(children.find(c => c.id.toString() === v) || children[0])}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select child" />
              </SelectTrigger>
              <SelectContent>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id.toString()}>
                    {child.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Download Report
            </Button>
          </motion.div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold">3.8</p>
                <p className="text-xs text-muted-foreground">Current GPA</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl border p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-3xl font-bold">A-</p>
                <p className="text-xs text-muted-foreground">Average Grade</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl border p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-3xl font-bold">58/60</p>
                <p className="text-xs text-muted-foreground">Assignments Done</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card rounded-xl border p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-3xl font-bold">#5</p>
                <p className="text-xs text-muted-foreground">Class Rank</p>
              </div>
            </div>
          </motion.div>
        </div>

        <Tabs defaultValue="subjects" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="subjects">By Subject</TabsTrigger>
            <TabsTrigger value="assignments">Recent Assignments</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="subjects" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Subject Grades */}
              <div className="lg:col-span-2 bg-card rounded-xl border shadow-card overflow-hidden">
                <div className="p-4 border-b bg-muted/30">
                  <h3 className="font-semibold">Subject Grades</h3>
                </div>
                <div className="divide-y">
                  {subjectGrades.map((subject, index) => (
                    <motion.div
                      key={subject.subject}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{subject.subject}</p>
                            <p className="text-sm text-muted-foreground">{subject.teacher}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={cn("text-2xl font-bold", getGradeColor(subject.currentGrade))}>
                              {subject.currentGrade}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              {subject.trend === 'up' && <TrendingUp className="w-3 h-3 text-success" />}
                              {subject.trend === 'down' && <TrendingDown className="w-3 h-3 text-destructive" />}
                              <span>{subject.percentage}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Progress value={subject.percentage} className="flex-1 h-2" />
                        <span className="text-xs text-muted-foreground">
                          {subject.completed}/{subject.assignments} assignments
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Upcoming Deadlines */}
              <div className="bg-card rounded-xl border p-6 shadow-card">
                <h3 className="text-lg font-semibold mb-4">Upcoming Deadlines</h3>
                <div className="space-y-4">
                  {upcomingDeadlines.map((deadline, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        deadline.daysLeft <= 3 ? "bg-destructive/10" : deadline.daysLeft <= 7 ? "bg-warning/10" : "bg-primary/10"
                      )}>
                        <AlertCircle className={cn(
                          "w-5 h-5",
                          deadline.daysLeft <= 3 ? "text-destructive" : deadline.daysLeft <= 7 ? "text-warning" : "text-primary"
                        )} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{deadline.name}</p>
                        <p className="text-xs text-muted-foreground">{deadline.subject}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-muted-foreground">{deadline.dueDate}</span>
                          <Badge variant={deadline.daysLeft <= 3 ? 'destructive' : 'outline'} className="text-xs">
                            {deadline.daysLeft} days left
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <div className="bg-card rounded-xl border shadow-card overflow-hidden">
              <div className="p-4 border-b bg-muted/30">
                <h3 className="font-semibold">Recent Graded Assignments</h3>
              </div>
              <div className="divide-y">
                {recentAssignments.map((assignment, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{assignment.name}</p>
                        <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                        <p className="text-xs text-muted-foreground">{assignment.date} • Weight: {assignment.weight}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={cn(
                        "text-lg font-bold",
                        assignment.grade.startsWith('A') ? "bg-success" : "bg-primary"
                      )}>
                        {assignment.grade}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">{assignment.score}%</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-xl border p-6 shadow-card">
                <h3 className="text-lg font-semibold mb-4">GPA Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={gradeHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="semester" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[3.0, 4.0]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="gpa"
                      stroke="hsl(217 91% 60%)"
                      strokeWidth={3}
                      dot={{ fill: 'hsl(217 91% 60%)', r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-card rounded-xl border p-6 shadow-card">
                <h3 className="text-lg font-semibold mb-4">Subject Performance</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={subjectPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="subject" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="score" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
