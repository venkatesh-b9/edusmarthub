import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  TrendingUp,
  AlertCircle,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AttendanceOverviewChart } from '@/components/dashboard/Charts';

const classes = [
  { id: '1', name: 'Advanced Physics - 11-A' },
  { id: '2', name: 'General Physics - 10-B' },
  { id: '3', name: 'AP Physics - 12-A' },
  { id: '4', name: 'Physics Lab - 11-B' },
];

const students = [
  { id: 1, name: 'Alice Johnson', rollNo: '11A001', status: 'present', avatar: 'AJ' },
  { id: 2, name: 'Bob Smith', rollNo: '11A002', status: 'present', avatar: 'BS' },
  { id: 3, name: 'Carol White', rollNo: '11A003', status: 'absent', avatar: 'CW' },
  { id: 4, name: 'David Brown', rollNo: '11A004', status: 'present', avatar: 'DB' },
  { id: 5, name: 'Emma Davis', rollNo: '11A005', status: 'late', avatar: 'ED' },
  { id: 6, name: 'Frank Miller', rollNo: '11A006', status: 'present', avatar: 'FM' },
  { id: 7, name: 'Grace Lee', rollNo: '11A007', status: 'present', avatar: 'GL' },
  { id: 8, name: 'Henry Wilson', rollNo: '11A008', status: 'absent', avatar: 'HW' },
  { id: 9, name: 'Ivy Chen', rollNo: '11A009', status: 'present', avatar: 'IC' },
  { id: 10, name: 'Jack Taylor', rollNo: '11A010', status: 'present', avatar: 'JT' },
];

const attendanceHistory = [
  { date: 'Jan 1, 2026', present: 30, absent: 2, late: 0, total: 32 },
  { date: 'Dec 30, 2025', present: 28, absent: 3, late: 1, total: 32 },
  { date: 'Dec 27, 2025', present: 31, absent: 1, late: 0, total: 32 },
  { date: 'Dec 25, 2025', present: 29, absent: 2, late: 1, total: 32 },
  { date: 'Dec 23, 2025', present: 30, absent: 2, late: 0, total: 32 },
];

export default function TeacherAttendance() {
  const [selectedClass, setSelectedClass] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState(students);

  const updateStatus = (studentId: number, status: 'present' | 'absent' | 'late') => {
    setAttendanceData(prev =>
      prev.map(s => s.id === studentId ? { ...s, status } : s)
    );
  };

  const presentCount = attendanceData.filter(s => s.status === 'present').length;
  const absentCount = attendanceData.filter(s => s.status === 'absent').length;
  const lateCount = attendanceData.filter(s => s.status === 'late').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-bold">Attendance</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage student attendance
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button className="gap-2 gradient-primary text-white shadow-glow">
              <CheckCircle2 className="w-4 h-4" />
              Save Attendance
            </Button>
          </motion.div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border p-4 shadow-card"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{presentCount}</p>
                <p className="text-sm text-muted-foreground">Present</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl border border-border p-4 shadow-card"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{absentCount}</p>
                <p className="text-sm text-muted-foreground">Absent</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl border border-border p-4 shadow-card"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lateCount}</p>
                <p className="text-sm text-muted-foreground">Late</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl border border-border p-4 shadow-card"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round((presentCount / students.length) * 100)}%</p>
                <p className="text-sm text-muted-foreground">Rate</p>
              </div>
            </div>
          </motion.div>
        </div>

        <Tabs defaultValue="take" className="space-y-6">
          <TabsList>
            <TabsTrigger value="take">Take Attendance</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="take" className="space-y-6">
            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap gap-4"
            >
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
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-[180px]"
              />
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </motion.div>

            {/* Student List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-xl border border-border overflow-hidden shadow-card"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Roll No</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Present</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Absent</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Late</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.filter(s => 
                      s.name.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map((student, index) => (
                      <motion.tr
                        key={student.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.02 * index }}
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                              {student.avatar}
                            </div>
                            <span className="font-medium">{student.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{student.rollNo}</td>
                        <td className="py-3 px-4 text-center">
                          <Checkbox
                            checked={student.status === 'present'}
                            onCheckedChange={() => updateStatus(student.id, 'present')}
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Checkbox
                            checked={student.status === 'absent'}
                            onCheckedChange={() => updateStatus(student.id, 'absent')}
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Checkbox
                            checked={student.status === 'late'}
                            onCheckedChange={() => updateStatus(student.id, 'late')}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              student.status === 'present' ? 'default' :
                              student.status === 'late' ? 'secondary' : 'destructive'
                            }
                            className={cn(
                              student.status === 'present' && 'bg-success/10 text-success hover:bg-success/20'
                            )}
                          >
                            {student.status}
                          </Badge>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border overflow-hidden shadow-card"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold">Attendance History</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">January 2026</span>
                  <Button variant="outline" size="icon">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Present</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Absent</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Late</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceHistory.map((record, index) => (
                      <tr key={index} className="border-b border-border hover:bg-muted/30">
                        <td className="py-3 px-4 font-medium">{record.date}</td>
                        <td className="py-3 px-4 text-center text-success">{record.present}</td>
                        <td className="py-3 px-4 text-center text-destructive">{record.absent}</td>
                        <td className="py-3 px-4 text-center text-warning">{record.late}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="outline">
                            {Math.round((record.present / record.total) * 100)}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AttendanceOverviewChart />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
