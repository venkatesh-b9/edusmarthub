import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { ChartCard } from './Charts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Building2, Users, GraduationCap, TrendingUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComparisonMetric {
  label: string;
  value: number;
  icon: React.ElementType;
}

export function MultiSchoolComparison() {
  const { schools, selectedSchools } = useAppSelector((state) => state.schools);
  const [comparisonType, setComparisonType] = useState<'performance' | 'size' | 'growth'>('performance');

  const selectedSchoolData = schools.filter((school) => selectedSchools.includes(school.id));

  const comparisonData = selectedSchoolData.map((school) => ({
    name: school.name.substring(0, 15),
    performance: school.performance,
    students: school.studentCount,
    teachers: school.teacherCount,
    teacherRatio: (school.studentCount / school.teacherCount).toFixed(1),
  }));

  const metrics: ComparisonMetric[] = selectedSchoolData.map((school) => ({
    label: school.name,
    value: school.performance,
    icon: Building2,
  }));

  const getComparisonChartData = () => {
    switch (comparisonType) {
      case 'performance':
        return comparisonData.map((d) => ({
          name: d.name,
          value: d.performance,
        }));
      case 'size':
        return comparisonData.map((d) => ({
          name: d.name,
          Students: d.students,
          Teachers: d.teachers,
        }));
      case 'growth':
        return comparisonData.map((d) => ({
          name: d.name,
          'Student/Teacher Ratio': parseFloat(d.teacherRatio),
        }));
      default:
        return [];
    }
  };

  if (selectedSchools.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Multi-School Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Select schools from the dashboard to compare their metrics side-by-side.
          </p>
        </CardContent>
      </Card>
    );
  }

  const colors = [
    'hsl(217 91% 60%)',
    'hsl(142 71% 45%)',
    'hsl(38 92% 50%)',
    'hsl(0 84% 60%)',
    'hsl(280 70% 60%)',
  ];

  return (
    <ChartCard
      title="Multi-School Comparison"
      subtitle={`Comparing ${selectedSchoolData.length} schools`}
      actions={
        <div className="flex items-center gap-2">
          <Select value={comparisonType} onValueChange={(v: any) => setComparisonType(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="size">Size</SelectItem>
              <SelectItem value="growth">Growth</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Comparison Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {comparisonType === 'size' ? (
              <BarChart data={getComparisonChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="Students" fill={colors[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Teachers" fill={colors[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <BarChart data={getComparisonChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {getComparisonChartData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Side-by-side metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedSchoolData.map((school, index) => (
            <Card key={school.id} className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium truncate">{school.name}</CardTitle>
                  <Badge variant="outline" className="ml-2">
                    #{index + 1}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs">Performance</span>
                  </div>
                  <span className="font-semibold text-primary">{school.performance}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GraduationCap className="w-4 h-4" />
                    <span className="text-xs">Students</span>
                  </div>
                  <span className="font-semibold">{school.studentCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span className="text-xs">Teachers</span>
                  </div>
                  <span className="font-semibold">{school.teacherCount}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground">Region</span>
                  <Badge variant="secondary" className="text-xs">
                    {school.region}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
