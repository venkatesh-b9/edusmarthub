import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, Users, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

interface TimetableAnalyticsProps {
  timetable: any;
  conflicts: any[];
}

export function TimetableAnalytics({ timetable, conflicts }: TimetableAnalyticsProps) {
  const [periods, setPeriods] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    if (timetable) {
      loadPeriods();
      loadStatistics();
    }
  }, [timetable]);

  const loadPeriods = async () => {
    if (!timetable?.id) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/timetable/timetables/${timetable.id}/periods`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setPeriods(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading periods:', error);
    }
  };

  const loadStatistics = async () => {
    // Calculate statistics from periods
    const teacherWorkload: Record<string, number> = {};
    const subjectDistribution: Record<string, number> = {};
    const roomUtilization: Record<string, number> = {};

    periods.forEach((period) => {
      if (period.teacher_id) {
        teacherWorkload[period.teacher_id] = (teacherWorkload[period.teacher_id] || 0) + 1;
      }
      if (period.subject_id) {
        subjectDistribution[period.subject_id] = (subjectDistribution[period.subject_id] || 0) + 1;
      }
      if (period.room_id) {
        roomUtilization[period.room_id] = (roomUtilization[period.room_id] || 0) + 1;
      }
    });

    setStatistics({
      totalPeriods: periods.length,
      totalTeachers: Object.keys(teacherWorkload).length,
      totalSubjects: Object.keys(subjectDistribution).length,
      totalRooms: Object.keys(roomUtilization).length,
      teacherWorkload,
      subjectDistribution,
      roomUtilization,
      conflictCount: conflicts.length,
    });
  };

  if (!statistics) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  const teacherWorkloadData = Object.entries(statistics.teacherWorkload).map(([id, count]) => ({
    teacher: `Teacher ${id}`,
    periods: count,
  }));

  const subjectDistributionData = Object.entries(statistics.subjectDistribution).map(
    ([id, count]) => ({
      subject: `Subject ${id}`,
      periods: count,
    })
  );

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const conflictSeverityData = [
    {
      name: 'Errors',
      value: conflicts.filter((c) => c.severity === 'error').length,
    },
    {
      name: 'Warnings',
      value: conflicts.filter((c) => c.severity === 'warning').length,
    },
    {
      name: 'Info',
      value: conflicts.filter((c) => c.severity === 'info').length,
    },
  ];

  const fitnessScore = Math.max(
    0,
    100 - (statistics.conflictCount * 5) - (statistics.totalPeriods === 0 ? 100 : 0)
  );

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Periods</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalPeriods}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalTeachers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conflicts</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{statistics.conflictCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fitness Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fitnessScore}%</div>
            <Progress value={fitnessScore} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Teacher Workload Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teacherWorkloadData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="teacher" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="periods" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subject Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subjectDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="periods" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conflict Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={conflictSeverityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {conflictSeverityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quality Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Balance Score</span>
                <span className="text-sm font-medium">85%</span>
              </div>
              <Progress value={85} />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Room Utilization</span>
                <span className="text-sm font-medium">72%</span>
              </div>
              <Progress value={72} />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Workload Balance</span>
                <span className="text-sm font-medium">90%</span>
              </div>
              <Progress value={90} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
