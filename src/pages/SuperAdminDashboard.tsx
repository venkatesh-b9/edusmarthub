import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { EnrollmentTrendChart, PerformanceDistributionChart, SchoolsByRegionChart } from '@/components/dashboard/Charts';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { SchoolsList } from '@/components/dashboard/SchoolsList';
import { AddSchoolModal } from '@/components/dashboard/AddSchoolModal';
import { AnalyticsChat } from '@/components/dashboard/AnalyticsChat';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Users,
  GraduationCap,
  TrendingUp,
  Download,
  RefreshCw,
  Filter,
} from 'lucide-react';

export default function SuperAdminDashboard() {
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
            <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, Marcus! Here's what's happening across all schools.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <AddSchoolModal />
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Schools"
            value="212"
            change={{ value: 12, label: 'from last month' }}
            icon={Building2}
            variant="primary"
            delay={0}
            href="/super-admin/schools"
          />
          <StatsCard
            title="Total Students"
            value="58,320"
            change={{ value: 8.5, label: 'from last month' }}
            icon={GraduationCap}
            variant="success"
            delay={0.1}
            href="/super-admin/students"
          />
          <StatsCard
            title="Total Teachers"
            value="3,845"
            change={{ value: 5.2, label: 'from last month' }}
            icon={Users}
            variant="accent"
            delay={0.2}
            href="/super-admin/teachers"
          />
          <StatsCard
            title="Avg Performance"
            value="86.4%"
            change={{ value: 2.8, label: 'from last month' }}
            icon={TrendingUp}
            variant="warning"
            delay={0.3}
            href="/super-admin/analytics"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EnrollmentTrendChart />
          <PerformanceDistributionChart />
        </div>

        {/* Schools Table */}
        <SchoolsList />

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SchoolsByRegionChart />
          </div>
          <RecentActivity />
        </div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-card rounded-xl border border-border p-6 shadow-card"
        >
          <h3 className="text-lg font-semibold mb-4">System Status</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-success/5 border border-success/20">
              <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
              <div>
                <p className="text-sm font-medium">API Services</p>
                <p className="text-xs text-muted-foreground">Operational</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-success/5 border border-success/20">
              <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
              <div>
                <p className="text-sm font-medium">Database</p>
                <p className="text-xs text-muted-foreground">99.9% uptime</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-success/5 border border-success/20">
              <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
              <div>
                <p className="text-sm font-medium">Storage</p>
                <p className="text-xs text-muted-foreground">45% used</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-warning/5 border border-warning/20">
              <div className="w-3 h-3 rounded-full bg-warning animate-pulse" />
              <div>
                <p className="text-sm font-medium">Backup</p>
                <p className="text-xs text-muted-foreground">In progress</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Analytics Chat Assistant */}
      <AnalyticsChat />
    </DashboardLayout>
  );
}
