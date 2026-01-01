import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsChat } from '@/components/dashboard/AnalyticsChat';
import {
  EnrollmentTrendChart,
  PerformanceDistributionChart,
  SchoolsByRegionChart,
  AttendanceOverviewChart,
} from '@/components/dashboard/Charts';
import { 
  Download, 
  Calendar,
  TrendingUp,
  Users,
  GraduationCap,
  School
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';

export default function Analytics() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Comprehensive insights across all schools</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Last 30 Days
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Students"
            value="45,280"
            change={{ value: 12.5, label: "vs last month" }}
            icon={GraduationCap}
          />
          <StatsCard
            title="Total Teachers"
            value="2,847"
            change={{ value: 8.2, label: "vs last month" }}
            icon={Users}
          />
          <StatsCard
            title="Active Schools"
            value="156"
            change={{ value: 5.1, label: "vs last month" }}
            icon={School}
          />
          <StatsCard
            title="Avg. Performance"
            value="78.5%"
            change={{ value: 3.8, label: "vs last month" }}
            icon={TrendingUp}
          />
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Enrollment Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <EnrollmentTrendChart />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Schools by Region</CardTitle>
                </CardHeader>
                <CardContent>
                  <SchoolsByRegionChart />
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <PerformanceDistributionChart />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <AttendanceOverviewChart />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="enrollment">
            <Card>
              <CardHeader>
                <CardTitle>Enrollment Analytics</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <EnrollmentTrendChart />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <PerformanceDistributionChart />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Analytics</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <AttendanceOverviewChart />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <AnalyticsChat />
    </DashboardLayout>
  );
}
