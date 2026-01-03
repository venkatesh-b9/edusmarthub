import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Download,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const children = [
  { id: 1, name: 'Emma Martinez', grade: '10-A', photo: 'EM' },
  { id: 2, name: 'Lucas Martinez', grade: '7-B', photo: 'LM' },
];

const attendanceStats = {
  present: 85,
  absent: 5,
  late: 8,
  excused: 2,
};

const monthlyData = [
  { month: 'Sep', attendance: 98 },
  { month: 'Oct', attendance: 95 },
  { month: 'Nov', attendance: 92 },
  { month: 'Dec', attendance: 88 },
  { month: 'Jan', attendance: 96 },
];

const attendanceCalendar = [
  { day: 1, status: 'present', period: 'Full Day' },
  { day: 2, status: 'present', period: 'Full Day' },
  { day: 3, status: 'weekend', period: null },
  { day: 4, status: 'weekend', period: null },
  { day: 5, status: 'present', period: 'Full Day' },
  { day: 6, status: 'present', period: 'Full Day' },
  { day: 7, status: 'absent', period: 'Sick Leave' },
  { day: 8, status: 'present', period: 'Full Day' },
  { day: 9, status: 'present', period: 'Full Day' },
  { day: 10, status: 'weekend', period: null },
  { day: 11, status: 'weekend', period: null },
  { day: 12, status: 'present', period: 'Full Day' },
  { day: 13, status: 'present', period: 'Full Day' },
  { day: 14, status: 'present', period: 'Full Day' },
  { day: 15, status: 'present', period: 'Full Day' },
  { day: 16, status: 'late', period: 'Arrived 9:15 AM' },
  { day: 17, status: 'weekend', period: null },
  { day: 18, status: 'weekend', period: null },
  { day: 19, status: 'present', period: 'Full Day' },
  { day: 20, status: 'present', period: 'Full Day' },
  { day: 21, status: 'present', period: 'Full Day' },
  { day: 22, status: 'present', period: 'Full Day' },
  { day: 23, status: 'excused', period: 'Medical' },
  { day: 24, status: 'weekend', period: null },
  { day: 25, status: 'weekend', period: null },
  { day: 26, status: 'present', period: 'Full Day' },
  { day: 27, status: 'present', period: 'Full Day' },
  { day: 28, status: 'late', period: 'Arrived 8:45 AM' },
  { day: 29, status: 'present', period: 'Full Day' },
  { day: 30, status: 'present', period: 'Full Day' },
  { day: 31, status: 'holiday', period: 'School Holiday' },
];

const recentAbsences = [
  { date: 'Jan 7, 2026', reason: 'Sick Leave', status: 'excused', note: 'Doctor\'s note provided' },
  { date: 'Jan 23, 2026', reason: 'Medical Appointment', status: 'excused', note: 'Pre-approved' },
  { date: 'Dec 15, 2025', reason: 'Family Emergency', status: 'excused', note: 'Parent called in' },
];

const pieData = [
  { name: 'Present', value: attendanceStats.present, color: 'hsl(142, 71%, 45%)' },
  { name: 'Absent', value: attendanceStats.absent, color: 'hsl(0, 84%, 60%)' },
  { name: 'Late', value: attendanceStats.late, color: 'hsl(38, 92%, 50%)' },
  { name: 'Excused', value: attendanceStats.excused, color: 'hsl(217, 91%, 60%)' },
];

export default function ParentAttendance() {
  const [selectedChild, setSelectedChild] = useState(children[0]);
  const [currentMonth, setCurrentMonth] = useState('January 2026');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-bold">Attendance</h1>
            <p className="text-muted-foreground mt-1">
              Track your children's attendance records
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
              Export
            </Button>
          </motion.div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-success">{attendanceStats.present}</p>
                <p className="text-xs text-muted-foreground">Days Present</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl border p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{attendanceStats.absent}</p>
                <p className="text-xs text-muted-foreground">Days Absent</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl border p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-warning">{attendanceStats.late}</p>
                <p className="text-xs text-muted-foreground">Days Late</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card rounded-xl border p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">96%</p>
                <p className="text-xs text-muted-foreground">Attendance Rate</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 bg-card rounded-xl border p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Attendance Calendar</h3>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-medium">{currentMonth}</span>
                <Button variant="ghost" size="icon">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
              {/* Empty cells for offset (January 2026 starts on Thursday) */}
              {[...Array(4)].map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {attendanceCalendar.map((day) => (
                <div
                  key={day.day}
                  className={cn(
                    "aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-colors relative group cursor-pointer",
                    day.status === 'present' && "bg-success/20 text-success hover:bg-success/30",
                    day.status === 'absent' && "bg-destructive/20 text-destructive hover:bg-destructive/30",
                    day.status === 'late' && "bg-warning/20 text-warning hover:bg-warning/30",
                    day.status === 'excused' && "bg-primary/20 text-primary hover:bg-primary/30",
                    day.status === 'weekend' && "bg-muted text-muted-foreground",
                    day.status === 'holiday' && "bg-accent/20 text-accent"
                  )}
                >
                  {day.day}
                  {day.period && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {day.period}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-center gap-6 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-success/20" />
                <span className="text-sm">Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-destructive/20" />
                <span className="text-sm">Absent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-warning/20" />
                <span className="text-sm">Late</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-primary/20" />
                <span className="text-sm">Excused</span>
              </div>
            </div>
          </motion.div>

          {/* Attendance Breakdown */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl border p-6 shadow-card">
            <h3 className="text-lg font-semibold mb-4">Breakdown</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium">{item.value} days</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Monthly Trend & Recent Absences */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border p-6 shadow-card">
            <h3 className="text-lg font-semibold mb-4">Monthly Attendance Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[80, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="attendance" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl border p-6 shadow-card">
            <h3 className="text-lg font-semibold mb-4">Recent Absences</h3>
            <div className="space-y-4">
              {recentAbsences.map((absence, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{absence.reason}</p>
                      <Badge variant="outline" className="text-xs">{absence.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{absence.date}</p>
                    <p className="text-xs text-muted-foreground mt-1">{absence.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
