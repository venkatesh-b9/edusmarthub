import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ChartCard } from '@/components/dashboard/Charts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  User,
  BookOpen,
  Calendar,
  Clock,
  TrendingUp,
  MessageSquare,
  CreditCard,
  FileText,
  Bell,
  Star,
  ChevronRight,
  Video,
  Download,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const children = [
  {
    id: 1,
    name: 'Emma Martinez',
    grade: '10-A',
    photo: 'EM',
    gpa: 3.8,
    attendance: 96,
    nextClass: 'Mathematics',
  },
  {
    id: 2,
    name: 'Lucas Martinez',
    grade: '7-B',
    photo: 'LM',
    gpa: 3.5,
    attendance: 92,
    nextClass: 'Science',
  },
];

const subjectPerformance = [
  { subject: 'Math', score: 88, fullMark: 100 },
  { subject: 'Science', score: 92, fullMark: 100 },
  { subject: 'English', score: 85, fullMark: 100 },
  { subject: 'History', score: 78, fullMark: 100 },
  { subject: 'Art', score: 95, fullMark: 100 },
  { subject: 'PE', score: 98, fullMark: 100 },
];

const gradeHistory = [
  { month: 'Sep', grade: 82 },
  { month: 'Oct', grade: 85 },
  { month: 'Nov', grade: 83 },
  { month: 'Dec', grade: 88 },
  { month: 'Jan', grade: 92 },
];

const recentMessages = [
  { id: 1, from: 'Ms. Johnson', subject: 'Physics Project Update', time: '2 hours ago', read: false },
  { id: 2, from: 'Mr. Thompson', subject: 'Math Homework Reminder', time: '1 day ago', read: true },
  { id: 3, from: 'School Admin', subject: 'Parent-Teacher Meeting', time: '2 days ago', read: true },
];

const upcomingPayments = [
  { id: 1, title: 'Tuition Fee - January', amount: 1250, dueDate: 'Jan 15, 2026', status: 'pending' },
  { id: 2, title: 'Lab Fee', amount: 150, dueDate: 'Jan 20, 2026', status: 'pending' },
  { id: 3, title: 'Sports Equipment', amount: 75, dueDate: 'Jan 25, 2026', status: 'paid' },
];

const attendanceCalendar = [
  { day: 1, status: 'present' }, { day: 2, status: 'present' }, { day: 3, status: 'weekend' },
  { day: 4, status: 'weekend' }, { day: 5, status: 'present' }, { day: 6, status: 'present' },
  { day: 7, status: 'absent' }, { day: 8, status: 'present' }, { day: 9, status: 'present' },
  { day: 10, status: 'weekend' }, { day: 11, status: 'weekend' }, { day: 12, status: 'present' },
  { day: 13, status: 'present' }, { day: 14, status: 'present' }, { day: 15, status: 'present' },
  { day: 16, status: 'late' }, { day: 17, status: 'weekend' }, { day: 18, status: 'weekend' },
  { day: 19, status: 'present' }, { day: 20, status: 'present' },
];

export default function ParentDashboard() {
  const selectedChild = children[0];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-bold">Welcome, Jennifer!</h1>
            <p className="text-muted-foreground mt-1">
              Stay updated with your children's academic journey
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <Button variant="outline" size="sm" className="gap-2">
              <Video className="w-4 h-4" />
              Schedule Meeting
            </Button>
            <Button size="sm" className="gap-2 gradient-primary text-white shadow-glow">
              <MessageSquare className="w-4 h-4" />
              Message Teacher
            </Button>
          </motion.div>
        </div>

        {/* Children Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {children.map((child, index) => (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "bg-card rounded-xl border p-6 shadow-card transition-all duration-300 hover:shadow-lg cursor-pointer",
                index === 0 ? "border-primary ring-2 ring-primary/20" : "border-border"
              )}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-xl font-bold text-white">
                  {child.photo}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{child.name}</h3>
                  <p className="text-sm text-muted-foreground">Grade {child.grade}</p>
                </div>
                {index === 0 && <Badge className="gradient-primary text-white">Selected</Badge>}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-primary">{child.gpa}</p>
                  <p className="text-xs text-muted-foreground">GPA</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-success">{child.attendance}%</p>
                  <p className="text-xs text-muted-foreground">Attendance</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-sm font-semibold truncate">{child.nextClass}</p>
                  <p className="text-xs text-muted-foreground">Next Class</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats for Selected Child */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Current GPA"
            value="3.8"
            change={{ value: 0.3, label: 'from last semester' }}
            icon={Star}
            variant="primary"
            delay={0}
          />
          <StatsCard
            title="Attendance Rate"
            value="96%"
            change={{ value: 2, label: 'this month' }}
            icon={Calendar}
            variant="success"
            delay={0.1}
          />
          <StatsCard
            title="Assignments Done"
            value="42/45"
            icon={BookOpen}
            variant="accent"
            delay={0.2}
          />
          <StatsCard
            title="Class Rank"
            value="#5"
            change={{ value: 2, label: 'positions up' }}
            icon={TrendingUp}
            variant="warning"
            delay={0.3}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subject Performance Radar */}
          <ChartCard title="Subject Performance" subtitle="Emma's performance across subjects">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={subjectPerformance}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="hsl(var(--border))" />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="hsl(217 91% 60%)"
                  fill="hsl(217 91% 60%)"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Grade History */}
          <ChartCard title="Grade Trend" subtitle="Academic progress over time">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={gradeHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[60, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="grade"
                  stroke="hsl(142 71% 45%)"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(142 71% 45%)', r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Attendance Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl border border-border p-6 shadow-card"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Attendance - January</h3>
              <Button variant="ghost" size="sm">Full View</Button>
            </div>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
              {/* Empty cells for offset */}
              {[...Array(3)].map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {attendanceCalendar.map((day) => (
                <div
                  key={day.day}
                  className={cn(
                    "aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-colors",
                    day.status === 'present' && "bg-success/20 text-success",
                    day.status === 'absent' && "bg-destructive/20 text-destructive",
                    day.status === 'late' && "bg-warning/20 text-warning",
                    day.status === 'weekend' && "bg-muted text-muted-foreground"
                  )}
                >
                  {day.day}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-success/20" />
                <span>Present</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-destructive/20" />
                <span>Absent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-warning/20" />
                <span>Late</span>
              </div>
            </div>
          </motion.div>

          {/* Messages */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-xl border border-border p-6 shadow-card"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Messages</h3>
              <Badge variant="secondary">3 new</Badge>
            </div>
            <div className="space-y-3">
              {recentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer",
                    msg.read ? "hover:bg-muted/50" : "bg-primary/5 hover:bg-primary/10"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold",
                    msg.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                  )}>
                    {msg.from.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{msg.from}</p>
                      {!msg.read && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{msg.subject}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-3">
              View all messages <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>

          {/* Payments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card rounded-xl border border-border p-6 shadow-card"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Upcoming Payments</h3>
              <Button variant="ghost" size="sm">History</Button>
            </div>
            <div className="space-y-3">
              {upcomingPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      payment.status === 'paid' ? "bg-success/10" : "bg-warning/10"
                    )}>
                      {payment.status === 'paid' ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <CreditCard className="w-5 h-5 text-warning" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{payment.title}</p>
                      <p className="text-xs text-muted-foreground">Due: {payment.dueDate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">${payment.amount}</p>
                    <Badge variant={payment.status === 'paid' ? 'default' : 'outline'} className={cn("text-xs", payment.status === 'paid' && "bg-success")}>
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Button className="w-full mt-4 gradient-primary text-white">
              <CreditCard className="w-4 h-4 mr-2" />
              Pay Now - $1,400
            </Button>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
