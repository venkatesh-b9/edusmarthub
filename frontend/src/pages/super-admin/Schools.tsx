import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AddSchoolModal } from '@/components/dashboard/AddSchoolModal';
import { 
  Search, 
  Filter, 
  Building2, 
  Users, 
  GraduationCap,
  MapPin,
  Phone,
  Mail,
  MoreVertical,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const schoolsData = [
  {
    id: 1,
    name: 'Lincoln High School',
    location: 'New York, NY',
    type: 'High School',
    students: 1250,
    teachers: 85,
    status: 'active',
    email: 'admin@lincolnhs.edu',
    phone: '+1 (555) 123-4567',
  },
  {
    id: 2,
    name: 'Jefferson Elementary',
    location: 'Los Angeles, CA',
    type: 'Elementary',
    students: 680,
    teachers: 45,
    status: 'active',
    email: 'office@jeffersonelem.edu',
    phone: '+1 (555) 234-5678',
  },
  {
    id: 3,
    name: 'Washington Middle School',
    location: 'Chicago, IL',
    type: 'Middle School',
    students: 920,
    teachers: 62,
    status: 'active',
    email: 'info@washingtonms.edu',
    phone: '+1 (555) 345-6789',
  },
  {
    id: 4,
    name: 'Roosevelt Academy',
    location: 'Houston, TX',
    type: 'K-12',
    students: 1850,
    teachers: 120,
    status: 'pending',
    email: 'contact@rooseveltacademy.edu',
    phone: '+1 (555) 456-7890',
  },
  {
    id: 5,
    name: 'Madison Prep',
    location: 'Phoenix, AZ',
    type: 'High School',
    students: 560,
    teachers: 38,
    status: 'active',
    email: 'admissions@madisonprep.edu',
    phone: '+1 (555) 567-8901',
  },
];

export default function Schools() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSchools = schoolsData.filter(school =>
    school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    school.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Schools Management</h1>
            <p className="text-muted-foreground">Manage all registered schools in the system</p>
          </div>
          <AddSchoolModal />
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search schools by name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Schools Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSchools.map((school, index) => (
            <motion.div
              key={school.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{school.name}</CardTitle>
                      <Badge 
                        variant={school.status === 'active' ? 'default' : 'secondary'}
                        className="mt-1"
                      >
                        {school.status}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2">
                        <Eye className="h-4 w-4" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Edit className="h-4 w-4" /> Edit School
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-destructive">
                        <Trash2 className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {school.location}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{school.students.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">Students</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-accent" />
                      <span className="text-sm font-medium">{school.teachers}</span>
                      <span className="text-xs text-muted-foreground">Teachers</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{school.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {school.phone}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
