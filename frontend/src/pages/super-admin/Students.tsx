import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  GraduationCap,
  Building2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';

interface Student {
  id: string;
  name: string;
  email: string;
  school: string;
  grade: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  performance: number;
  enrollmentDate: string;
}

const studentsData: Student[] = [
  { id: 'STU001', name: 'Emma Johnson', email: 'emma.j@school.edu', school: 'Westwood Academy', grade: '10th Grade', status: 'Active', performance: 92, enrollmentDate: '2022-08-15' },
  { id: 'STU002', name: 'Liam Smith', email: 'liam.s@school.edu', school: 'Eastside High', grade: '11th Grade', status: 'Active', performance: 88, enrollmentDate: '2021-08-20' },
  { id: 'STU003', name: 'Olivia Brown', email: 'olivia.b@school.edu', school: 'Central Academy', grade: '9th Grade', status: 'Active', performance: 95, enrollmentDate: '2023-08-10' },
  { id: 'STU004', name: 'Noah Davis', email: 'noah.d@school.edu', school: 'Westwood Academy', grade: '12th Grade', status: 'Active', performance: 78, enrollmentDate: '2020-08-18' },
  { id: 'STU005', name: 'Ava Wilson', email: 'ava.w@school.edu', school: 'Northside Prep', grade: '10th Grade', status: 'Inactive', performance: 85, enrollmentDate: '2022-08-12' },
  { id: 'STU006', name: 'James Taylor', email: 'james.t@school.edu', school: 'Southgate Academy', grade: '11th Grade', status: 'Active', performance: 91, enrollmentDate: '2021-08-22' },
  { id: 'STU007', name: 'Sophia Martinez', email: 'sophia.m@school.edu', school: 'Central Academy', grade: '9th Grade', status: 'Active', performance: 89, enrollmentDate: '2023-08-08' },
  { id: 'STU008', name: 'Benjamin Lee', email: 'ben.l@school.edu', school: 'Eastside High', grade: '12th Grade', status: 'Suspended', performance: 72, enrollmentDate: '2020-08-25' },
];

const statusStyles = {
  Active: 'bg-success/10 text-success border-success/20',
  Inactive: 'bg-muted text-muted-foreground border-muted',
  Suspended: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function Students() {
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredStudents = studentsData.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSchool = schoolFilter === 'all' || student.school === schoolFilter;
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    return matchesSearch && matchesSchool && matchesStatus;
  });

  const schools = [...new Set(studentsData.map((s) => s.school))];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold">All Students</h1>
            <p className="text-muted-foreground mt-1">
              Manage and monitor all students across schools
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Students"
            value="58,320"
            change={{ value: 8.5, label: 'from last month' }}
            icon={GraduationCap}
            variant="success"
            delay={0}
          />
          <StatsCard
            title="Active Students"
            value="55,102"
            change={{ value: 5.2, label: 'from last month' }}
            icon={Users}
            variant="primary"
            delay={0.1}
          />
          <StatsCard
            title="Avg Performance"
            value="86.4%"
            change={{ value: 2.8, label: 'from last month' }}
            icon={TrendingUp}
            variant="warning"
            delay={0.2}
          />
          <StatsCard
            title="Schools Enrolled"
            value="212"
            change={{ value: 12, label: 'from last month' }}
            icon={Building2}
            variant="accent"
            delay={0.3}
          />
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search students by name, email, or ID..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={schoolFilter} onValueChange={setSchoolFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by school" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Schools</SelectItem>
              {schools.map((school) => (
                <SelectItem key={school} value={school}>
                  {school}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            More Filters
          </Button>
        </motion.div>

        {/* Students Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-card rounded-xl border border-border shadow-card"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student, index) => (
                <motion.tr
                  key={student.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group hover:bg-muted/50"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {student.name.split(' ').map((n) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{student.school}</TableCell>
                  <TableCell>{student.grade}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusStyles[student.status]}>
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            student.performance >= 90
                              ? 'bg-success'
                              : student.performance >= 75
                              ? 'bg-warning'
                              : 'bg-destructive'
                          }`}
                          style={{ width: `${student.performance}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{student.performance}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(student.enrollmentDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2">
                          <Eye className="w-4 h-4" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Edit className="w-4 h-4" />
                          Edit Student
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-destructive">
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
