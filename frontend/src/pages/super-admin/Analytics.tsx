import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsChat } from '@/components/dashboard/AnalyticsChat';
import { MultiSchoolComparison } from '@/components/dashboard/MultiSchoolComparison';
import {
  EnrollmentTrendChart,
  PerformanceDistributionChart,
  SchoolsByRegionChart,
  AttendanceOverviewChart,
} from '@/components/dashboard/Charts';
import {
  PredictiveChart,
  HeatmapChart,
  ScatterPlot,
  GaugeChart,
} from '@/components/charts/AdvancedCharts';
import { 
  Download, 
  Calendar,
  TrendingUp,
  Users,
  GraduationCap,
  School,
  Map,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setDateRange } from '@/store/slices/analyticsSlice';
import { FilterPopover } from '@/components/dashboard/FilterPopover';
import { toast } from 'sonner';

// Mock data for advanced charts
const predictiveData = [
  { date: '2026-01-01', actual: 85, predicted: 86, confidence: { lower: 83, upper: 89 } },
  { date: '2026-01-08', actual: 87, predicted: 87.5, confidence: { lower: 84.5, upper: 90.5 } },
  { date: '2026-01-15', actual: 88, predicted: 88.2, confidence: { lower: 85.2, upper: 91.2 } },
  { date: '2026-01-22', predicted: 89, confidence: { lower: 86, upper: 92 } },
  { date: '2026-01-29', predicted: 89.5, confidence: { lower: 86.5, upper: 92.5 } },
  { date: '2026-02-05', predicted: 90, confidence: { lower: 87, upper: 93 } },
];

const heatmapData = [
  { x: 0, y: 0, value: 85, label: 'North-East' },
  { x: 1, y: 0, value: 78, label: 'North-Central' },
  { x: 2, y: 0, value: 92, label: 'North-West' },
  { x: 0, y: 1, value: 88, label: 'Central-East' },
  { x: 1, y: 1, value: 82, label: 'Central' },
  { x: 2, y: 1, value: 90, label: 'Central-West' },
  { x: 0, y: 2, value: 75, label: 'South-East' },
  { x: 1, y: 2, value: 80, label: 'South-Central' },
  { x: 2, y: 2, value: 87, label: 'South-West' },
];

const scatterData = [
  { x: 50, y: 75, name: 'School A' },
  { x: 65, y: 82, name: 'School B' },
  { x: 78, y: 88, name: 'School C' },
  { x: 45, y: 70, name: 'School D' },
  { x: 90, y: 92, name: 'School E' },
];

const geographicHeatmap = [
  { lat: 40.7128, lng: -74.0060, intensity: 85, name: 'New York' },
  { lat: 34.0522, lng: -118.2437, intensity: 78, name: 'Los Angeles' },
  { lat: 41.8781, lng: -87.6298, intensity: 92, name: 'Chicago' },
  { lat: 29.7604, lng: -95.3698, intensity: 88, name: 'Houston' },
  { lat: 33.4484, lng: -112.0740, intensity: 82, name: 'Phoenix' },
];

export default function Analytics() {
  const dispatch = useAppDispatch();
  const analyticsState = useAppSelector((state) => state.analytics);
  const dateRange = analyticsState?.dateRange || {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
  };
  const isLoading = analyticsState?.isLoading || false;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    toast.info('Refreshing analytics data...');
    
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Analytics data refreshed');
    }, 1500);
  }, []);

  const handleDateRangeChange = useCallback((start: Date, end: Date) => {
    try {
      dispatch(
        setDateRange({
          start: start.toISOString(),
          end: end.toISOString(),
        })
      );
    } catch (error) {
      console.error('Error setting date range:', error);
    }
  }, [dispatch]);

  try {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Global Analytics Dashboard</h1>
              <p className="text-muted-foreground">Real-time metrics and insights across all schools</p>
            </div>
            <div className="flex gap-2">
              <DateRangePicker
                onRangeChange={handleDateRangeChange}
                defaultStart={new Date(dateRange.start)}
                defaultEnd={new Date(dateRange.end)}
              />
              <FilterPopover />
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
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

        {/* Live Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Students"
            value="58,320"
            change={{ value: 12.5, label: "vs last month" }}
            icon={GraduationCap}
            variant="primary"
          />
          <StatsCard
            title="Total Teachers"
            value="3,845"
            change={{ value: 8.2, label: "vs last month" }}
            icon={Users}
            variant="success"
          />
          <StatsCard
            title="Active Schools"
            value="212"
            change={{ value: 5.1, label: "vs last month" }}
            icon={School}
            variant="accent"
          />
          <StatsCard
            title="Avg. Performance"
            value="86.4%"
            change={{ value: 3.8, label: "vs last month" }}
            icon={TrendingUp}
            variant="warning"
          />
        </div>

        {/* Predictive Analytics */}
        <div className="grid gap-6 lg:grid-cols-2">
          <PredictiveChart
            data={predictiveData}
            title="Performance Forecast"
            subtitle="AI-powered predictions with confidence intervals"
          />
          <GaugeChart
            value={86}
            max={100}
            title="Overall System Performance"
            subtitle="Current vs target metrics"
          />
        </div>

        {/* Multi-School Comparison */}
        <MultiSchoolComparison />

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="geographic">Geographic</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <EnrollmentTrendChart />
              <SchoolsByRegionChart />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <PerformanceDistributionChart />
              <AttendanceOverviewChart />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <ScatterPlot
                data={scatterData}
                title="Performance vs Enrollment"
                subtitle="Correlation analysis across schools"
                xLabel="Enrollment"
                yLabel="Performance Score"
              />
            </div>
          </TabsContent>

          <TabsContent value="geographic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  Geographic Heatmap of Institutions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] relative rounded-lg border border-border overflow-hidden">
                  {/* Placeholder for map - in production, use react-leaflet or Google Maps */}
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                    <div className="text-center space-y-2">
                      <Map className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">Interactive Map View</p>
                      <p className="text-sm text-muted-foreground">
                        {geographicHeatmap.length} schools plotted
                      </p>
                    </div>
                  </div>
                  {/* Heatmap overlay would be rendered here */}
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                  {geographicHeatmap.map((location, i) => (
                    <div key={i} className="text-center p-3 rounded-lg border border-border">
                      <p className="text-sm font-medium">{location.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Intensity: {location.intensity}%
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <HeatmapChart
              data={heatmapData}
              xLabels={['East', 'Central', 'West']}
              yLabels={['North', 'Central', 'South']}
              title="Regional Performance Heatmap"
              subtitle="Performance distribution by geographic regions"
            />
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <PerformanceDistributionChart />
            <div className="grid gap-4 lg:grid-cols-2">
              <ScatterPlot
                data={scatterData}
                title="Student-Teacher Ratio vs Performance"
                xLabel="Ratio"
                yLabel="Performance"
              />
              <GaugeChart
                value={86}
                max={100}
                title="Average Performance"
              />
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <EnrollmentTrendChart />
            <PredictiveChart
              data={predictiveData}
              title="Future Performance Trends"
              subtitle="6-week prediction with 95% confidence interval"
            />
            <AttendanceOverviewChart />
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            <MultiSchoolComparison />
            <div className="grid gap-4 lg:grid-cols-2">
              <PerformanceDistributionChart />
              <AttendanceOverviewChart />
            </div>
          </TabsContent>
        </Tabs>
        </div>
        
        <AnalyticsChat />
      </DashboardLayout>
    );
  } catch (error) {
    console.error('Error rendering Analytics page:', error);
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="bg-destructive/10 border border-destructive rounded-lg p-6">
            <h2 className="text-xl font-bold text-destructive mb-2">Error Loading Analytics</h2>
            <p className="text-muted-foreground">
              There was an error loading the analytics dashboard. Please refresh the page or contact support.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }
}
