import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { AttendanceOverviewChart, ChartCard } from '@/components/dashboard/Charts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Users,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  FileText,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const myClasses = [
  { id: 1, name: 'Advanced Physics', grade: '11-A', students: 32, time: '8:00 AM - 9:30 AM', room: 'Lab 201', status: 'ongoing' },
  { id: 2, name: 'General Physics', grade: '10-B', students: 28, time: '10:00 AM - 11:30 AM', room: 'Room 105', status: 'upcoming' },
  { id: 3, name: 'AP Physics', grade: '12-A', students: 24, time: '1:00 PM - 2:30 PM', room: 'Lab 202', status: 'upcoming' },
  { id: 4, name: 'Physics Lab', grade: '11-B', students: 30, time: '3:00 PM - 4:30 PM', room: 'Lab 201', status: 'upcoming' },
];

const recentSubmissions = [
  { id: 1, student: 'Alice Johnson', assignment: 'Lab Report #3', time: '10 min ago', status: 'submitted' },
  { id: 2, student: 'Bob Smith', assignment: 'Problem Set 5', time: '25 min ago', status: 'late' },
  { id: 3, student: 'Carol White', assignment: 'Lab Report #3', time: '1 hour ago', status: 'submitted' },
  { id: 4, student: 'David Brown', assignment: 'Lab Report #3', time: '2 hours ago', status: 'submitted' },
];

const gradeDistribution = [
  { grade: 'A', count: 45 },
  { grade: 'B', count: 62 },
  { grade: 'C', count: 38 },
  { grade: 'D', count: 15 },
  { grade: 'F', count: 5 },
];

const pendingTasks = [
  { id: 1, title: 'Grade Lab Report #3', dueDate: 'Today', priority: 'high', count: 28 },
  { id: 2, title: 'Prepare Midterm Exam', dueDate: 'Jan 20', priority: 'medium' },
  { id: 3, title: 'Submit Lesson Plans', dueDate: 'Jan 15', priority: 'low' },
  { id: 4, title: 'Parent Meeting - Johnson', dueDate: 'Jan 18', priority: 'medium' },
];

export default function TeacherDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-bold">Good morning, David!</h1>
            <p className="text-muted-foreground mt-1">
              You have 4 classes scheduled for today
            </p>
          </motion.div>

        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Students"
            value="114"
            icon={Users}
            variant="primary"
            delay={0}
          />
          <StatsCard
            title="Active Classes"
            value="4"
            icon={BookOpen}
            variant="success"
            delay={0.1}
          />
          <StatsCard
            title="Pending Grades"
            value="28"
            icon={FileText}
            variant="warning"
            delay={0.2}
          />
          <StatsCard
            title="Avg Attendance"
            value="92%"
            change={{ value: 2.5, label: 'this week' }}
            icon={CheckCircle2}
            variant="accent"
            delay={0.3}
          />
        </div>

        {/* Today's Classes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border p-6 shadow-card"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Today's Schedule</h3>
              <p className="text-sm text-muted-foreground">Wednesday, January 1, 2026</p>
            </div>
            <Button variant="outline" size="sm">Full Calendar</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {myClasses.map((cls, index) => (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className={cn(
                  "p-4 rounded-xl border transition-all duration-300 hover:shadow-md cursor-pointer",
                  cls.status === 'ongoing'
                    ? "border-primary bg-primary/5 shadow-glow"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={cls.status === 'ongoing' ? 'default' : 'secondary'} className={cls.status === 'ongoing' ? 'gradient-primary text-white' : ''}>
                    {cls.status === 'ongoing' ? 'Now' : 'Upcoming'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{cls.room}</span>
                </div>
                <h4 className="font-semibold mb-1">{cls.name}</h4>
                <p className="text-sm text-muted-foreground mb-3">Grade {cls.grade}</p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {cls.time.split(' - ')[0]}
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {cls.students}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Middle Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Submissions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl border border-border p-6 shadow-card"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Submissions</h3>
              <Button variant="ghost" size="sm" className="text-primary">
                View all <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-4">
              {recentSubmissions.map((submission) => (
                <div key={submission.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    {submission.student.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{submission.student}</p>
                    <p className="text-xs text-muted-foreground">{submission.assignment}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={submission.status === 'late' ? 'destructive' : 'secondary'} className="text-xs">
                      {submission.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{submission.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Grade Distribution */}
          <ChartCard title="Grade Distribution" subtitle="Across all classes">
            <ResponsiveContainer width="100%" height={220}>
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
                <Bar
                  dataKey="count"
                  fill="hsl(217 91% 60%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Pending Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-xl border border-border p-6 shadow-card"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Pending Tasks</h3>
              <Badge variant="outline">{pendingTasks.length}</Badge>
            </div>
            <div className="space-y-3">
              {pendingTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    task.priority === 'high' ? 'bg-destructive' :
                    task.priority === 'medium' ? 'bg-warning' : 'bg-info'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">Due: {task.dueDate}</p>
                  </div>
                  {task.count && (
                    <Badge variant="secondary">{task.count}</Badge>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Attendance Chart */}
        <AttendanceOverviewChart />
      </div>
    </DashboardLayout>
  );
}
