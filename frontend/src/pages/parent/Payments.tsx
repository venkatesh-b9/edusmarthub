import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  CreditCard,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  DollarSign,
  Receipt,
  TrendingUp,
  ArrowRight,
  Wallet,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const children = [
  { id: 1, name: 'Emma Martinez', grade: '10-A' },
  { id: 2, name: 'Lucas Martinez', grade: '7-B' },
];

const pendingPayments = [
  { id: 1, title: 'Tuition Fee - January 2026', amount: 1250, dueDate: 'Jan 15, 2026', child: 'Emma Martinez', category: 'Tuition', daysLeft: 12 },
  { id: 2, title: 'Lab Fee', amount: 150, dueDate: 'Jan 20, 2026', child: 'Emma Martinez', category: 'Lab', daysLeft: 17 },
  { id: 3, title: 'Tuition Fee - January 2026', amount: 1100, dueDate: 'Jan 15, 2026', child: 'Lucas Martinez', category: 'Tuition', daysLeft: 12 },
  { id: 4, title: 'Sports Equipment', amount: 75, dueDate: 'Jan 25, 2026', child: 'Lucas Martinez', category: 'Sports', daysLeft: 22 },
];

const paymentHistory = [
  { id: 1, title: 'Tuition Fee - December 2025', amount: 1250, date: 'Dec 10, 2025', child: 'Emma Martinez', status: 'paid', method: 'Credit Card' },
  { id: 2, title: 'Tuition Fee - December 2025', amount: 1100, date: 'Dec 10, 2025', child: 'Lucas Martinez', status: 'paid', method: 'Credit Card' },
  { id: 3, title: 'Book Fee', amount: 200, date: 'Nov 28, 2025', child: 'Emma Martinez', status: 'paid', method: 'Bank Transfer' },
  { id: 4, title: 'Art Supplies', amount: 85, date: 'Nov 15, 2025', child: 'Lucas Martinez', status: 'paid', method: 'Credit Card' },
  { id: 5, title: 'Tuition Fee - November 2025', amount: 1250, date: 'Nov 5, 2025', child: 'Emma Martinez', status: 'paid', method: 'Credit Card' },
  { id: 6, title: 'Tuition Fee - November 2025', amount: 1100, date: 'Nov 5, 2025', child: 'Lucas Martinez', status: 'paid', method: 'Credit Card' },
];

const monthlySpending = [
  { month: 'Sep', amount: 2800 },
  { month: 'Oct', amount: 2650 },
  { month: 'Nov', amount: 2835 },
  { month: 'Dec', amount: 2550 },
  { month: 'Jan', amount: 2575 },
];

const feeBreakdown = [
  { name: 'Tuition', value: 4700, color: 'hsl(217 91% 60%)' },
  { name: 'Lab Fees', value: 300, color: 'hsl(142 71% 45%)' },
  { name: 'Sports', value: 150, color: 'hsl(38 92% 50%)' },
  { name: 'Books', value: 400, color: 'hsl(280 67% 55%)' },
  { name: 'Other', value: 200, color: 'hsl(0 84% 60%)' },
];

const totalPending = pendingPayments.reduce((acc, p) => acc + p.amount, 0);
const totalPaid = paymentHistory.reduce((acc, p) => acc + p.amount, 0);

export default function ParentPayments() {
  const [selectedPayments, setSelectedPayments] = useState<number[]>([]);

  const togglePaymentSelection = (id: number) => {
    setSelectedPayments((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const selectedTotal = pendingPayments
    .filter((p) => selectedPayments.includes(p.id))
    .reduce((acc, p) => acc + p.amount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-bold">Payments</h1>
            <p className="text-muted-foreground mt-1">
              Manage school fees and payment history
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Download Receipts
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2 gradient-primary text-white">
                  <CreditCard className="w-4 h-4" />
                  Pay Now
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Make Payment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-3xl font-bold">${selectedPayments.length > 0 ? selectedTotal.toLocaleString() : totalPending.toLocaleString()}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Payment Method</label>
                    <Select defaultValue="card">
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="card">Credit/Debit Card</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                        <SelectItem value="wallet">Digital Wallet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Card Number</label>
                    <Input placeholder="1234 5678 9012 3456" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Expiry</label>
                      <Input placeholder="MM/YY" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">CVV</label>
                      <Input placeholder="123" type="password" />
                    </div>
                  </div>
                  <Button className="w-full gradient-primary text-white">
                    Pay ${selectedPayments.length > 0 ? selectedTotal.toLocaleString() : totalPending.toLocaleString()}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalPending.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Pending</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl border p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalPaid.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Paid (YTD)</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl border p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingPayments.length}</p>
                <p className="text-xs text-muted-foreground">Pending Items</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card rounded-xl border p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <Receipt className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">Jan 15</p>
                <p className="text-xs text-muted-foreground">Next Due Date</p>
              </div>
            </div>
          </motion.div>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="pending">Pending ({pendingPayments.length})</TabsTrigger>
            <TabsTrigger value="history">Payment History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pending Payments List */}
              <div className="lg:col-span-2 bg-card rounded-xl border shadow-card overflow-hidden">
                <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                  <h3 className="font-semibold">Pending Payments</h3>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedPayments(pendingPayments.map(p => p.id))}>
                    Select All
                  </Button>
                </div>
                <div className="divide-y">
                  {pendingPayments.map((payment, index) => (
                    <motion.div
                      key={payment.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => togglePaymentSelection(payment.id)}
                      className={cn(
                        "flex items-center justify-between p-4 cursor-pointer transition-colors",
                        selectedPayments.includes(payment.id) ? "bg-primary/5" : "hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                          selectedPayments.includes(payment.id)
                            ? "bg-primary border-primary"
                            : "border-muted-foreground/30"
                        )}>
                          {selectedPayments.includes(payment.id) && (
                            <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                          )}
                        </div>
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          payment.daysLeft <= 7 ? "bg-destructive/10" : "bg-warning/10"
                        )}>
                          {payment.daysLeft <= 7 ? (
                            <AlertCircle className="w-5 h-5 text-destructive" />
                          ) : (
                            <Clock className="w-5 h-5 text-warning" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{payment.title}</p>
                          <p className="text-sm text-muted-foreground">{payment.child}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{payment.category}</Badge>
                            <span className="text-xs text-muted-foreground">Due: {payment.dueDate}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">${payment.amount.toLocaleString()}</p>
                        <Badge variant={payment.daysLeft <= 7 ? 'destructive' : 'outline'} className="text-xs">
                          {payment.daysLeft} days left
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="space-y-4">
                <div className="bg-card rounded-xl border p-6 shadow-card">
                  <h3 className="font-semibold mb-4">Payment Summary</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Selected Items</span>
                      <span className="font-medium">{selectedPayments.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">${selectedTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Processing Fee</span>
                      <span className="font-medium">$0.00</span>
                    </div>
                    <hr />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="text-xl font-bold">${selectedTotal.toLocaleString()}</span>
                    </div>
                    <Button className="w-full gradient-primary text-white" disabled={selectedPayments.length === 0}>
                      Pay Selected <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>

                <div className="bg-card rounded-xl border p-6 shadow-card">
                  <h3 className="font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Wallet className="w-4 h-4" />
                      Set Up Auto-Pay
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Calendar className="w-4 h-4" />
                      Payment Schedule
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Receipt className="w-4 h-4" />
                      View All Receipts
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="bg-card rounded-xl border shadow-card overflow-hidden">
              <div className="p-4 border-b bg-muted/30">
                <h3 className="font-semibold">Payment History</h3>
              </div>
              <div className="divide-y">
                {paymentHistory.map((payment, index) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="font-medium">{payment.title}</p>
                        <p className="text-sm text-muted-foreground">{payment.child}</p>
                        <p className="text-xs text-muted-foreground">{payment.date} • {payment.method}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold">${payment.amount.toLocaleString()}</p>
                        <Badge variant="default" className="bg-success text-xs">Paid</Badge>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-xl border p-6 shadow-card">
                <h3 className="text-lg font-semibold mb-4">Monthly Spending</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlySpending}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value) => [`$${value}`, 'Amount']}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="hsl(217 91% 60%)"
                      strokeWidth={3}
                      dot={{ fill: 'hsl(217 91% 60%)', r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-card rounded-xl border p-6 shadow-card">
                <h3 className="text-lg font-semibold mb-4">Fee Breakdown</h3>
                <div className="flex items-center gap-8">
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie
                        data={feeBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {feeBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3">
                    {feeBreakdown.map((item) => (
                      <div key={item.name} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <span className="text-sm font-medium">${item.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
