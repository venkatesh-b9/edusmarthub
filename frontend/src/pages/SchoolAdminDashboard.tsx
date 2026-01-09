import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { AttendanceOverviewChart, SubjectPerformanceChart, ChartCard } from '@/components/dashboard/Charts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  TrendingUp,
  Plus,
  FileSpreadsheet,
  Bell,
  Clock,
  CheckCircle2,
  XCircle,
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
} from 'recharts';

const revenueData = [
  { month: 'Jul', revenue: 42000 },
  { month: 'Aug', revenue: 85000 },
  { month: 'Sep', revenue: 78000 },
  { month: 'Oct', revenue: 92000 },
  { month: 'Nov', revenue: 88000 },
  { month: 'Dec', revenue: 95000 },
];

const upcomingEvents = [
  { id: 1, title: 'Parent-Teacher Conference', date: 'Jan 15, 2026', time: '2:00 PM', type: 'meeting' },
  { id: 2, title: 'Science Fair', date: 'Jan 22, 2026', time: '9:00 AM', type: 'event' },
  { id: 3, title: 'Staff Meeting', date: 'Jan 25, 2026', time: '3:30 PM', type: 'meeting' },
  { id: 4, title: 'Winter Break Ends', date: 'Jan 28, 2026', time: 'All Day', type: 'holiday' },
];

const pendingApprovals = [
  { id: 1, title: 'Leave Request - John Smith', status: 'pending', priority: 'medium' },
  { id: 2, title: 'Budget Approval - Lab Equipment', status: 'pending', priority: 'high' },
  { id: 3, title: 'New Course Proposal - AI Basics', status: 'pending', priority: 'low' },
  { id: 4, title: 'Field Trip - Museum Visit', status: 'pending', priority: 'medium' },
];

const topTeachers = [
  { id: 1, name: 'Dr. Sarah Johnson', subject: 'Physics', rating: 4.9, classes: 5 },
  { id: 2, name: 'Prof. Michael Chen', subject: 'Mathematics', rating: 4.8, classes: 4 },
  { id: 3, name: 'Ms. Emily Davis', subject: 'English', rating: 4.7, classes: 6 },
  { id: 4, name: 'Mr. Robert Wilson', subject: 'History', rating: 4.6, classes: 4 },
];

export default function SchoolAdminDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-bold">School Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Lincoln High School • Academic Year 2025-2026
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <Button variant="outline" size="sm" className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Import Data
            </Button>
            <Button size="sm" className="gap-2 gradient-primary text-white shadow-glow">
              <Plus className="w-4 h-4" />
              Add Student
            </Button>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Students"
            value="1,250"
            change={{ value: 5.2, label: 'this semester' }}
            icon={GraduationCap}
            variant="primary"
            delay={0}
            href="/school-admin/students"
          />
          <StatsCard
            title="Total Teachers"
            value="85"
            change={{ value: 3, label: 'new this year' }}
            icon={Users}
            variant="success"
            delay={0.1}
            href="/school-admin/teachers"
          />
          <StatsCard
            title="Active Classes"
            value="48"
            icon={BookOpen}
            variant="accent"
            delay={0.2}
            href="/school-admin/classes"
          />
          <StatsCard
            title="Attendance Rate"
            value="94.5%"
            change={{ value: 1.2, label: 'vs last week' }}
            icon={Calendar}
            variant="warning"
            delay={0.3}
            href="/school-admin/reports"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AttendanceOverviewChart />
          <ChartCard title="Fee Collection" subtitle="Monthly revenue trend">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(142 71% 45%)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(142 71% 45%)', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Middle Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Events */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl border border-border p-6 shadow-card"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Upcoming Events</h3>
              <Button variant="ghost" size="sm">View all</Button>
            </div>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{event.date}</span>
                      <span>•</span>
                      <span>{event.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Pending Approvals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl border border-border p-6 shadow-card"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Pending Approvals</h3>
              <Badge variant="secondary">{pendingApprovals.length}</Badge>
            </div>
            <div className="space-y-3">
              {pendingApprovals.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <AlertCircle className={cn(
                      "w-4 h-4",
                      item.priority === 'high' ? 'text-destructive' :
                      item.priority === 'medium' ? 'text-warning' : 'text-info'
                    )} />
                    <span className="text-sm font-medium">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:text-success hover:bg-success/10">
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top Teachers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-xl border border-border p-6 shadow-card"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Top Performers</h3>
              <Button variant="ghost" size="sm">View all</Button>
            </div>
            <div className="space-y-4">
              {topTeachers.map((teacher, index) => (
                <div key={teacher.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-info flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{teacher.name}</p>
                    <p className="text-xs text-muted-foreground">{teacher.subject}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-warning">★ {teacher.rating}</p>
                    <p className="text-xs text-muted-foreground">{teacher.classes} classes</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <SubjectPerformanceChart />
      </div>
    </DashboardLayout>
  );
}
