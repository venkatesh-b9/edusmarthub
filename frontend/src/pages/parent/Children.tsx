import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  User,
  BookOpen,
  Calendar,
  TrendingUp,
  Star,
  Clock,
  Award,
  ChevronRight,
  GraduationCap,
  Target,
  Activity,
  FileText,
  MessageSquare,
} from 'lucide-react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
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
    age: 15,
    gpa: 3.8,
    attendance: 96,
    rank: 5,
    totalStudents: 32,
    teacher: 'Mrs. Johnson',
    subjects: ['Mathematics', 'Physics', 'Chemistry', 'English', 'History', 'Art'],
    upcomingAssignments: 3,
    currentCourse: 'Advanced Mathematics',
    performance: [
      { subject: 'Math', score: 88 },
      { subject: 'Science', score: 92 },
      { subject: 'English', score: 85 },
      { subject: 'History', score: 78 },
      { subject: 'Art', score: 95 },
      { subject: 'PE', score: 98 },
    ],
    recentGrades: [
      { subject: 'Mathematics', assignment: 'Chapter 5 Test', grade: 'A', score: 92, date: 'Jan 2' },
      { subject: 'Physics', assignment: 'Lab Report', grade: 'A-', score: 88, date: 'Dec 28' },
      { subject: 'English', assignment: 'Essay', grade: 'B+', score: 87, date: 'Dec 20' },
    ],
    achievements: [
      { title: 'Honor Roll', date: 'Fall 2025', icon: Award },
      { title: 'Science Fair Winner', date: 'Nov 2025', icon: Star },
      { title: 'Perfect Attendance', date: 'Sep 2025', icon: Calendar },
    ],
  },
  {
    id: 2,
    name: 'Lucas Martinez',
    grade: '7-B',
    photo: 'LM',
    age: 12,
    gpa: 3.5,
    attendance: 92,
    rank: 8,
    totalStudents: 28,
    teacher: 'Mr. Thompson',
    subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Art', 'Music'],
    upcomingAssignments: 5,
    currentCourse: 'General Science',
    performance: [
      { subject: 'Math', score: 82 },
      { subject: 'Science', score: 88 },
      { subject: 'English', score: 75 },
      { subject: 'History', score: 80 },
      { subject: 'Art', score: 90 },
      { subject: 'PE', score: 95 },
    ],
    recentGrades: [
      { subject: 'Science', assignment: 'Project', grade: 'A', score: 95, date: 'Jan 3' },
      { subject: 'Mathematics', assignment: 'Quiz', grade: 'B', score: 82, date: 'Dec 30' },
      { subject: 'English', assignment: 'Book Report', grade: 'B-', score: 78, date: 'Dec 22' },
    ],
    achievements: [
      { title: 'Most Improved', date: 'Fall 2025', icon: TrendingUp },
      { title: 'Art Exhibition', date: 'Oct 2025', icon: Star },
    ],
  },
];

export default function ParentChildren() {
  const [selectedChild, setSelectedChild] = useState(children[0]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-bold">My Children</h1>
            <p className="text-muted-foreground mt-1">
              View detailed information about your children's academic progress
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <FileText className="w-4 h-4" />
              View Reports
            </Button>
            <Button className="gap-2 gradient-primary text-white">
              <MessageSquare className="w-4 h-4" />
              Contact Teacher
            </Button>
          </motion.div>
        </div>

        {/* Children Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {children.map((child) => (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedChild(child)}
              className={cn(
                "bg-card rounded-xl border p-5 shadow-card cursor-pointer transition-all duration-300 hover:shadow-lg",
                selectedChild.id === child.id ? "border-primary ring-2 ring-primary/20" : "border-border"
              )}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-xl font-bold text-white">
                  {child.photo}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{child.name}</h3>
                    {selectedChild.id === child.id && <Badge className="gradient-primary text-white">Selected</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">Grade {child.grade} • Age {child.age}</p>
                  <p className="text-xs text-muted-foreground">Class Teacher: {child.teacher}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{child.gpa}</p>
                  <p className="text-xs text-muted-foreground">GPA</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Selected Child Details */}
        <motion.div
          key={selectedChild.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl border p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{selectedChild.gpa}</p>
                  <p className="text-xs text-muted-foreground">Current GPA</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{selectedChild.attendance}%</p>
                  <p className="text-xs text-muted-foreground">Attendance</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">#{selectedChild.rank}</p>
                  <p className="text-xs text-muted-foreground">Class Rank</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{selectedChild.upcomingAssignments}</p>
                  <p className="text-xs text-muted-foreground">Due Assignments</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Content */}
          <Tabs defaultValue="performance" className="space-y-6">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="grades">Recent Grades</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="subjects">Subjects</TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-xl border p-6 shadow-card">
                  <h3 className="text-lg font-semibold mb-4">Subject Performance</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={selectedChild.performance}>
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
                </div>

                <div className="bg-card rounded-xl border p-6 shadow-card">
                  <h3 className="text-lg font-semibold mb-4">Score Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={selectedChild.performance}>
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
                      <Bar dataKey="score" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="grades" className="space-y-4">
              <div className="bg-card rounded-xl border shadow-card overflow-hidden">
                <div className="p-4 border-b bg-muted/30">
                  <h3 className="font-semibold">Recent Grades & Assignments</h3>
                </div>
                <div className="divide-y">
                  {selectedChild.recentGrades.map((grade, index) => (
                    <div key={index} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{grade.assignment}</p>
                          <p className="text-sm text-muted-foreground">{grade.subject}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={grade.score >= 90 ? 'default' : grade.score >= 80 ? 'secondary' : 'outline'}>
                          {grade.grade}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">{grade.score}% • {grade.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedChild.achievements.map((achievement, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card rounded-xl border p-6 shadow-card text-center"
                  >
                    <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
                      <achievement.icon className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="font-semibold">{achievement.title}</h4>
                    <p className="text-sm text-muted-foreground">{achievement.date}</p>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="subjects" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedChild.subjects.map((subject, index) => (
                  <div key={index} className="bg-card rounded-xl border p-4 shadow-card hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{subject}</p>
                        <p className="text-xs text-muted-foreground">Active</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
