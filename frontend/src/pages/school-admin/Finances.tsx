import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ChartCard } from '@/components/dashboard/Charts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Receipt,
  Download,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PiggyBank,
} from 'lucide-react';
import {
  LineChart,
  Line,
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
import { cn } from '@/lib/utils';

const revenueData = [
  { month: 'Jul', revenue: 125000, expenses: 85000 },
  { month: 'Aug', revenue: 185000, expenses: 92000 },
  { month: 'Sep', revenue: 178000, expenses: 88000 },
  { month: 'Oct', revenue: 192000, expenses: 95000 },
  { month: 'Nov', revenue: 188000, expenses: 90000 },
  { month: 'Dec', revenue: 195000, expenses: 98000 },
];

const feeBreakdown = [
  { name: 'Tuition', value: 65, color: 'hsl(217 91% 60%)' },
  { name: 'Transport', value: 15, color: 'hsl(142 71% 45%)' },
  { name: 'Cafeteria', value: 10, color: 'hsl(38 92% 50%)' },
  { name: 'Activities', value: 10, color: 'hsl(280 85% 65%)' },
];

const transactions = [
  { id: 1, student: 'Alex Thompson', type: 'Tuition Fee', amount: 2500, date: '2025-12-28', status: 'completed', method: 'Card' },
  { id: 2, student: 'Emma Wilson', type: 'Transport Fee', amount: 350, date: '2025-12-27', status: 'completed', method: 'Bank Transfer' },
  { id: 3, student: 'James Rodriguez', type: 'Lab Fee', amount: 150, date: '2025-12-27', status: 'pending', method: 'Pending' },
  { id: 4, student: 'Sophie Chen', type: 'Tuition Fee', amount: 2500, date: '2025-12-26', status: 'completed', method: 'Card' },
  { id: 5, student: 'Michael Brown', type: 'Activity Fee', amount: 200, date: '2025-12-26', status: 'failed', method: 'Card' },
  { id: 6, student: 'Olivia Davis', type: 'Cafeteria', amount: 180, date: '2025-12-25', status: 'completed', method: 'Cash' },
];

const pendingPayments = [
  { id: 1, student: 'James Rodriguez', amount: 2500, dueDate: '2025-12-30', daysOverdue: 0 },
  { id: 2, student: 'Daniel Lee', amount: 2850, dueDate: '2025-12-15', daysOverdue: 13 },
  { id: 3, student: 'Sarah Miller', amount: 1200, dueDate: '2025-12-20', daysOverdue: 8 },
];

export default function Finances() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-bold">Finances</h1>
            <p className="text-muted-foreground mt-1">
              Track revenue, expenses, and fee collection
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
            <Button size="sm" className="gap-2 gradient-primary text-white shadow-glow">
              <Receipt className="w-4 h-4" />
              Generate Invoice
            </Button>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Revenue"
            value="$1.06M"
            change={{ value: 12.5, label: 'vs last year' }}
            icon={DollarSign}
            variant="primary"
            delay={0}
          />
          <StatsCard
            title="Collected This Month"
            value="$195,000"
            change={{ value: 8.2, label: 'vs last month' }}
            icon={Wallet}
            variant="success"
            delay={0.1}
          />
          <StatsCard
            title="Pending Fees"
            value="$45,200"
            change={{ value: -5.3, label: 'from last month' }}
            icon={CreditCard}
            variant="warning"
            delay={0.2}
          />
          <StatsCard
            title="Total Expenses"
            value="$548,000"
            change={{ value: 3.1, label: 'vs budget' }}
            icon={TrendingDown}
            variant="accent"
            delay={0.3}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard title="Revenue vs Expenses" subtitle="Monthly comparison" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                />
                <Bar dataKey="revenue" name="Revenue" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Fee Breakdown" subtitle="By category">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={feeBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {feeBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value}%`, '']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {feeBreakdown.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* Tabs for Transactions and Pending */}
        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
            <TabsTrigger value="pending">Pending Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border shadow-card"
            >
              <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">{tx.student}</TableCell>
                      <TableCell>{tx.type}</TableCell>
                      <TableCell className="font-semibold">${tx.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground">{tx.date}</TableCell>
                      <TableCell>{tx.method}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            tx.status === 'completed' ? 'default' :
                            tx.status === 'pending' ? 'secondary' : 'destructive'
                          }
                        >
                          {tx.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </motion.div>
          </TabsContent>

          <TabsContent value="pending">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border shadow-card"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Amount Due</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.student}</TableCell>
                      <TableCell className="font-semibold text-destructive">${payment.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground">{payment.dueDate}</TableCell>
                      <TableCell>
                        <Badge variant={payment.daysOverdue > 0 ? 'destructive' : 'secondary'}>
                          {payment.daysOverdue > 0 ? `${payment.daysOverdue} days overdue` : 'Due soon'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">Send Reminder</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
