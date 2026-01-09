import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Building2, Users, Star, MapPin, MoreHorizontal, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface School {
  id: string;
  name: string;
  location: string;
  students: number;
  teachers: number;
  rating: number;
  performance: number;
  status: 'active' | 'pending' | 'inactive';
}

const schools: School[] = [
  {
    id: '1',
    name: 'Lincoln High School',
    location: 'New York, NY',
    students: 1250,
    teachers: 85,
    rating: 4.8,
    performance: 12,
    status: 'active',
  },
  {
    id: '2',
    name: 'Westside Academy',
    location: 'Los Angeles, CA',
    students: 980,
    teachers: 62,
    rating: 4.6,
    performance: 8,
    status: 'active',
  },
  {
    id: '3',
    name: 'Central Elementary',
    location: 'Chicago, IL',
    students: 650,
    teachers: 45,
    rating: 4.5,
    performance: -3,
    status: 'active',
  },
  {
    id: '4',
    name: 'Riverside Middle School',
    location: 'Houston, TX',
    students: 820,
    teachers: 55,
    rating: 4.3,
    performance: 5,
    status: 'pending',
  },
  {
    id: '5',
    name: 'Mountain View High',
    location: 'Denver, CO',
    students: 1100,
    teachers: 72,
    rating: 4.7,
    performance: 15,
    status: 'active',
  },
];

const statusStyles = {
  active: 'bg-success/10 text-success border-success/20',
  pending: 'bg-warning/10 text-warning border-warning/20',
  inactive: 'bg-muted text-muted-foreground border-muted',
};

export function SchoolsList() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-card rounded-xl border border-border shadow-card overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Top Schools</h3>
          <p className="text-sm text-muted-foreground">Performance overview</p>
        </div>
        <Button variant="outline" size="sm">
          View all schools
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">School</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Location</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Students</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Teachers</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Rating</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Performance</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {schools.map((school, index) => (
              <motion.tr
                key={school.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-medium">{school.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{school.location}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{school.students.toLocaleString()}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium">{school.teachers}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-warning fill-warning" />
                    <span className="text-sm font-medium">{school.rating}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    {school.performance >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-success" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-destructive" />
                    )}
                    <span className={cn(
                      "text-sm font-medium",
                      school.performance >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {school.performance >= 0 ? '+' : ''}{school.performance}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className={cn("capitalize", statusStyles[school.status])}>
                    {school.status}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
