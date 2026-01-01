import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Server, 
  Database, 
  Wifi, 
  HardDrive,
  Cpu,
  MemoryStick,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const systemServices = [
  { name: 'API Server', status: 'operational', uptime: '99.99%', latency: '45ms' },
  { name: 'Database', status: 'operational', uptime: '99.95%', latency: '12ms' },
  { name: 'Authentication', status: 'operational', uptime: '99.99%', latency: '28ms' },
  { name: 'File Storage', status: 'degraded', uptime: '98.50%', latency: '156ms' },
  { name: 'Email Service', status: 'operational', uptime: '99.90%', latency: '320ms' },
  { name: 'Analytics Engine', status: 'operational', uptime: '99.85%', latency: '89ms' },
];

const serverMetrics = [
  { name: 'CPU Usage', value: 42, icon: Cpu, color: 'text-primary' },
  { name: 'Memory Usage', value: 68, icon: MemoryStick, color: 'text-accent' },
  { name: 'Disk Usage', value: 55, icon: HardDrive, color: 'text-success' },
  { name: 'Network I/O', value: 35, icon: Wifi, color: 'text-warning' },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'operational':
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    case 'degraded':
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    case 'down':
      return <XCircle className="h-4 w-4 text-destructive" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'operational':
      return <Badge className="bg-success/10 text-success hover:bg-success/20">Operational</Badge>;
    case 'degraded':
      return <Badge className="bg-warning/10 text-warning hover:bg-warning/20">Degraded</Badge>;
    case 'down':
      return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20">Down</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
};

export default function SystemHealth() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">System Health</h1>
            <p className="text-muted-foreground">Monitor system performance and service status</p>
          </div>
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Status
          </Button>
        </div>

        {/* Overall Status */}
        <Card className="border-success/50 bg-success/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-success">All Systems Operational</h3>
                <p className="text-sm text-muted-foreground">Last checked: 2 minutes ago</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Server Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {serverMetrics.map((metric, index) => (
            <motion.div
              key={metric.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <metric.icon className={`h-5 w-5 ${metric.color}`} />
                      <span className="font-medium">{metric.name}</span>
                    </div>
                    <span className="text-2xl font-bold">{metric.value}%</span>
                  </div>
                  <Progress value={metric.value} className="h-2" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Services Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Service Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemServices.map((service, index) => (
                <motion.div
                  key={service.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(service.status)}
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-muted-foreground">Uptime: {service.uptime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{service.latency}</span>
                    {getStatusBadge(service.status)}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Incidents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg bg-warning/10 border border-warning/20">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-warning">File Storage Degraded Performance</p>
                    <span className="text-sm text-muted-foreground">30 minutes ago</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Increased latency detected on file storage service. Team is investigating.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Database Maintenance Completed</p>
                    <span className="text-sm text-muted-foreground">2 hours ago</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Scheduled database maintenance completed successfully with no downtime.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
