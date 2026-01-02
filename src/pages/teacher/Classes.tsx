import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Users,
  Clock,
  Calendar,
  Search,
  Plus,
  MoreVertical,
  ChevronRight,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Video,
  MapPin,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const myClasses = [
  {
    id: 1,
    name: 'Advanced Physics',
    grade: '11-A',
    students: 32,
    schedule: 'Mon, Wed, Fri - 8:00 AM',
    room: 'Lab 201',
    progress: 68,
    avgGrade: 'B+',
    attendanceRate: 94,
    nextClass: 'Tomorrow, 8:00 AM',
    assignments: 12,
    pendingGrades: 8,
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 2,
    name: 'General Physics',
    grade: '10-B',
    students: 28,
    schedule: 'Tue, Thu - 10:00 AM',
    room: 'Room 105',
    progress: 55,
    avgGrade: 'B',
    attendanceRate: 91,
    nextClass: 'Today, 10:00 AM',
    assignments: 10,
    pendingGrades: 3,
    color: 'from-green-500 to-green-600',
  },
  {
    id: 3,
    name: 'AP Physics',
    grade: '12-A',
    students: 24,
    schedule: 'Mon, Wed, Fri - 1:00 PM',
    room: 'Lab 202',
    progress: 72,
    avgGrade: 'A-',
    attendanceRate: 97,
    nextClass: 'Tomorrow, 1:00 PM',
    assignments: 15,
    pendingGrades: 0,
    color: 'from-purple-500 to-purple-600',
  },
  {
    id: 4,
    name: 'Physics Lab',
    grade: '11-B',
    students: 30,
    schedule: 'Tue, Thu - 3:00 PM',
    room: 'Lab 201',
    progress: 45,
    avgGrade: 'B',
    attendanceRate: 89,
    nextClass: 'Today, 3:00 PM',
    assignments: 8,
    pendingGrades: 12,
    color: 'from-orange-500 to-orange-600',
  },
];

const upcomingSchedule = [
  { id: 1, className: 'General Physics', time: '10:00 AM - 11:30 AM', room: 'Room 105', status: 'upcoming' },
  { id: 2, className: 'Physics Lab', time: '3:00 PM - 4:30 PM', room: 'Lab 201', status: 'upcoming' },
];

export default function TeacherClasses() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredClasses = myClasses.filter(cls =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.grade.toLowerCase().includes(searchQuery.toLowerCase())
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
            <h1 className="text-3xl font-bold">My Classes</h1>
            <p className="text-muted-foreground mt-1">
              Manage your classes, assignments, and student progress
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-[200px]"
              />
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 gradient-primary text-white shadow-glow">
                  <Plus className="w-4 h-4" />
                  New Assignment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Assignment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input placeholder="Assignment Title" />
                  <Input placeholder="Select Class" />
                  <Input type="date" placeholder="Due Date" />
                  <Button className="w-full gradient-primary text-white">Create Assignment</Button>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>
        </div>

        {/* Today's Schedule Quick View */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border p-6 shadow-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Today's Classes</h3>
            <Badge variant="outline" className="gap-1">
              <Calendar className="w-3 h-3" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-4">
            {upcomingSchedule.map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center gap-4 p-4 rounded-lg border border-border bg-muted/30 min-w-[280px] flex-1"
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{schedule.className}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {schedule.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {schedule.room}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-1">
                  <Video className="w-4 h-4" />
                  Start
                </Button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Classes Grid */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Classes</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredClasses.map((cls, index) => (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-card rounded-xl border border-border overflow-hidden shadow-card hover:shadow-lg transition-all duration-300 group"
                >
                  {/* Class Header */}
                  <div className={cn("h-2 bg-gradient-to-r", cls.color)} />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{cls.name}</h3>
                        <p className="text-sm text-muted-foreground">Grade {cls.grade} • {cls.room}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit Class</DropdownMenuItem>
                          <DropdownMenuItem>Student List</DropdownMenuItem>
                          <DropdownMenuItem>Grade Book</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Archive</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <Users className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-semibold">{cls.students}</p>
                        <p className="text-xs text-muted-foreground">Students</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <TrendingUp className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-semibold">{cls.avgGrade}</p>
                        <p className="text-xs text-muted-foreground">Avg Grade</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-semibold">{cls.attendanceRate}%</p>
                        <p className="text-xs text-muted-foreground">Attendance</p>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Course Progress</span>
                        <span className="font-medium">{cls.progress}%</span>
                      </div>
                      <Progress value={cls.progress} className="h-2" />
                    </div>

                    {/* Quick Info */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <FileText className="w-3 h-3" />
                          {cls.assignments} assignments
                        </span>
                        {cls.pendingGrades > 0 && (
                          <Badge variant="secondary" className="gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {cls.pendingGrades} to grade
                          </Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" className="text-primary">
                        View <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>

                    {/* Schedule Info */}
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {cls.schedule}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Next: {cls.nextClass}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active">
            <div className="text-center py-12 text-muted-foreground">
              Active classes will be shown here
            </div>
          </TabsContent>

          <TabsContent value="archived">
            <div className="text-center py-12 text-muted-foreground">
              Archived classes will be shown here
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
