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
  Users,
  Building2,
  Award,
  BookOpen,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';

interface Teacher {
  id: string;
  name: string;
  email: string;
  school: string;
  department: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  rating: number;
  studentsCount: number;
  joinDate: string;
}

const teachersData: Teacher[] = [
  { id: 'TCH001', name: 'Dr. Sarah Mitchell', email: 'sarah.m@school.edu', school: 'Westwood Academy', department: 'Mathematics', status: 'Active', rating: 4.9, studentsCount: 145, joinDate: '2018-03-15' },
  { id: 'TCH002', name: 'Prof. James Anderson', email: 'james.a@school.edu', school: 'Eastside High', department: 'Science', status: 'Active', rating: 4.7, studentsCount: 132, joinDate: '2019-08-20' },
  { id: 'TCH003', name: 'Ms. Emily Chen', email: 'emily.c@school.edu', school: 'Central Academy', department: 'English', status: 'Active', rating: 4.8, studentsCount: 128, joinDate: '2020-01-10' },
  { id: 'TCH004', name: 'Mr. David Wilson', email: 'david.w@school.edu', school: 'Westwood Academy', department: 'History', status: 'On Leave', rating: 4.6, studentsCount: 118, joinDate: '2017-09-18' },
  { id: 'TCH005', name: 'Dr. Lisa Park', email: 'lisa.p@school.edu', school: 'Northside Prep', department: 'Physics', status: 'Active', rating: 4.9, studentsCount: 156, joinDate: '2016-03-12' },
  { id: 'TCH006', name: 'Mr. Robert Taylor', email: 'robert.t@school.edu', school: 'Southgate Academy', department: 'Art', status: 'Active', rating: 4.5, studentsCount: 98, joinDate: '2021-08-22' },
  { id: 'TCH007', name: 'Ms. Jennifer Adams', email: 'jennifer.a@school.edu', school: 'Central Academy', department: 'Music', status: 'Active', rating: 4.8, studentsCount: 112, joinDate: '2019-01-08' },
  { id: 'TCH008', name: 'Prof. Michael Brown', email: 'michael.b@school.edu', school: 'Eastside High', department: 'Chemistry', status: 'Inactive', rating: 4.4, studentsCount: 0, joinDate: '2015-08-25' },
];

const statusStyles = {
  Active: 'bg-success/10 text-success border-success/20',
  'On Leave': 'bg-warning/10 text-warning border-warning/20',
  Inactive: 'bg-muted text-muted-foreground border-muted',
};

export default function Teachers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredTeachers = teachersData.filter((teacher) => {
    const matchesSearch =
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSchool = schoolFilter === 'all' || teacher.school === schoolFilter;
    const matchesStatus = statusFilter === 'all' || teacher.status === statusFilter;
    return matchesSearch && matchesSchool && matchesStatus;
  });

  const schools = [...new Set(teachersData.map((t) => t.school))];

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
            <h1 className="text-3xl font-bold">All Teachers</h1>
            <p className="text-muted-foreground mt-1">
              Manage and monitor all teachers across schools
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
            title="Total Teachers"
            value="3,845"
            change={{ value: 5.2, label: 'from last month' }}
            icon={Users}
            variant="primary"
            delay={0}
          />
          <StatsCard
            title="Active Teachers"
            value="3,612"
            change={{ value: 4.8, label: 'from last month' }}
            icon={Award}
            variant="success"
            delay={0.1}
          />
          <StatsCard
            title="Avg Rating"
            value="4.7"
            change={{ value: 0.3, label: 'from last month' }}
            icon={Award}
            variant="warning"
            delay={0.2}
          />
          <StatsCard
            title="Departments"
            value="24"
            change={{ value: 2, label: 'from last month' }}
            icon={BookOpen}
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
              placeholder="Search teachers by name, email, or department..."
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
              <SelectItem value="On Leave">On Leave</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            More Filters
          </Button>
        </motion.div>

        {/* Teachers Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-card rounded-xl border border-border shadow-card"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.map((teacher, index) => (
                <motion.tr
                  key={teacher.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group hover:bg-muted/50"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {teacher.name.split(' ').slice(-2).map((n) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{teacher.name}</p>
                        <p className="text-sm text-muted-foreground">{teacher.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{teacher.school}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{teacher.department}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusStyles[teacher.status]}>
                      {teacher.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-warning">★</span>
                      <span className="font-medium">{teacher.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{teacher.studentsCount}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(teacher.joinDate).toLocaleDateString()}
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
                          Edit Teacher
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
