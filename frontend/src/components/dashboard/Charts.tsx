import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export function ChartCard({ title, subtitle, children, className, actions }: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "bg-card rounded-xl border border-border p-6 shadow-card",
        className
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions}
      </div>
      {children}
    </motion.div>
  );
}

// Enrollment Trend Chart
const enrollmentData = [
  { month: 'Jan', students: 4200, teachers: 280 },
  { month: 'Feb', students: 4350, teachers: 285 },
  { month: 'Mar', students: 4500, teachers: 290 },
  { month: 'Apr', students: 4680, teachers: 295 },
  { month: 'May', students: 4850, teachers: 302 },
  { month: 'Jun', students: 4950, teachers: 310 },
  { month: 'Jul', students: 5100, teachers: 318 },
  { month: 'Aug', students: 5280, teachers: 325 },
  { month: 'Sep', students: 5450, teachers: 335 },
  { month: 'Oct', students: 5620, teachers: 342 },
  { month: 'Nov', students: 5780, teachers: 348 },
  { month: 'Dec', students: 5950, teachers: 355 },
];

export function EnrollmentTrendChart() {
  return (
    <ChartCard title="Enrollment Trends" subtitle="Student and teacher growth over time">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={enrollmentData}>
          <defs>
            <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorTeachers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="month"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="students"
            stroke="hsl(217 91% 60%)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorStudents)"
            name="Students"
          />
          <Area
            type="monotone"
            dataKey="teachers"
            stroke="hsl(142 71% 45%)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorTeachers)"
            name="Teachers"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Performance Distribution Chart
const performanceData = [
  { name: 'Excellent', value: 35, color: 'hsl(142 71% 45%)' },
  { name: 'Good', value: 40, color: 'hsl(217 91% 60%)' },
  { name: 'Average', value: 18, color: 'hsl(38 92% 50%)' },
  { name: 'Needs Improvement', value: 7, color: 'hsl(0 84% 60%)' },
];

export function PerformanceDistributionChart() {
  return (
    <ChartCard title="Performance Distribution" subtitle="Overall student performance grades">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={performanceData}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={120}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {performanceData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-6 mt-4">
        {performanceData.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-muted-foreground">{item.name}</span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

// Schools by Region Chart
const regionData = [
  { region: 'North', schools: 45, students: 12500 },
  { region: 'South', schools: 38, students: 10200 },
  { region: 'East', schools: 52, students: 14800 },
  { region: 'West', schools: 42, students: 11300 },
  { region: 'Central', schools: 35, students: 9500 },
];

export function SchoolsByRegionChart() {
  return (
    <ChartCard title="Schools by Region" subtitle="Distribution across regions">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={regionData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis
            type="category"
            dataKey="region"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            width={60}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Bar dataKey="schools" fill="hsl(217 91% 60%)" radius={[0, 4, 4, 0]} name="Schools" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Attendance Overview Chart
const attendanceData = [
  { day: 'Mon', present: 94, absent: 6 },
  { day: 'Tue', present: 92, absent: 8 },
  { day: 'Wed', present: 96, absent: 4 },
  { day: 'Thu', present: 93, absent: 7 },
  { day: 'Fri', present: 89, absent: 11 },
];

export function AttendanceOverviewChart() {
  return (
    <ChartCard title="Weekly Attendance" subtitle="This week's attendance overview">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={attendanceData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Bar dataKey="present" stackId="a" fill="hsl(142 71% 45%)" name="Present %" radius={[4, 4, 0, 0]} />
          <Bar dataKey="absent" stackId="a" fill="hsl(0 84% 60%)" name="Absent %" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Subject Performance Radar
const subjectData = [
  { subject: 'Math', score: 85 },
  { subject: 'Science', score: 78 },
  { subject: 'English', score: 92 },
  { subject: 'History', score: 70 },
  { subject: 'Art', score: 88 },
  { subject: 'PE', score: 95 },
];

export function SubjectPerformanceChart() {
  return (
    <ChartCard title="Subject Performance" subtitle="Average scores by subject">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={subjectData}>
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
          <Bar dataKey="score" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} name="Score" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
