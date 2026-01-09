import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Download,
  Clock,
  User,
  Settings,
  Shield,
  Database,
  FileEdit,
  Trash2,
  Plus,
  Eye
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const auditLogs = [
  {
    id: 1,
    action: 'User Created',
    type: 'create',
    user: 'John Admin',
    target: 'Teacher: Sarah Wilson',
    timestamp: '2024-01-15 14:32:05',
    ip: '192.168.1.100',
    details: 'Created new teacher account with role assignments',
  },
  {
    id: 2,
    action: 'School Settings Updated',
    type: 'update',
    user: 'Jane Smith',
    target: 'Lincoln High School',
    timestamp: '2024-01-15 13:45:22',
    ip: '192.168.1.101',
    details: 'Updated school contact information and address',
  },
  {
    id: 3,
    action: 'Student Record Deleted',
    type: 'delete',
    user: 'Mike Johnson',
    target: 'Student ID: 12345',
    timestamp: '2024-01-15 12:15:00',
    ip: '192.168.1.102',
    details: 'Removed inactive student record per data retention policy',
  },
  {
    id: 4,
    action: 'Permission Changed',
    type: 'security',
    user: 'System Admin',
    target: 'Role: School Admin',
    timestamp: '2024-01-15 11:30:45',
    ip: '192.168.1.1',
    details: 'Added new permission for report generation',
  },
  {
    id: 5,
    action: 'Database Backup',
    type: 'system',
    user: 'System',
    target: 'Production Database',
    timestamp: '2024-01-15 06:00:00',
    ip: 'localhost',
    details: 'Automated daily backup completed successfully',
  },
  {
    id: 6,
    action: 'Login Attempt Failed',
    type: 'security',
    user: 'Unknown',
    target: 'admin@school.edu',
    timestamp: '2024-01-15 04:23:11',
    ip: '203.45.67.89',
    details: 'Multiple failed login attempts detected',
  },
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'create':
      return <Plus className="h-4 w-4 text-success" />;
    case 'update':
      return <FileEdit className="h-4 w-4 text-primary" />;
    case 'delete':
      return <Trash2 className="h-4 w-4 text-destructive" />;
    case 'security':
      return <Shield className="h-4 w-4 text-warning" />;
    case 'system':
      return <Database className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Settings className="h-4 w-4" />;
  }
};

const getTypeBadge = (type: string) => {
  switch (type) {
    case 'create':
      return <Badge className="bg-success/10 text-success hover:bg-success/20">Create</Badge>;
    case 'update':
      return <Badge className="bg-primary/10 text-primary hover:bg-primary/20">Update</Badge>;
    case 'delete':
      return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20">Delete</Badge>;
    case 'security':
      return <Badge className="bg-warning/10 text-warning hover:bg-warning/20">Security</Badge>;
    case 'system':
      return <Badge variant="secondary">System</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

export default function AuditLogs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
            <p className="text-muted-foreground">Track all system activities and changes</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Logs
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredLogs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center">
                    {getTypeIcon(log.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{log.action}</p>
                        <p className="text-sm text-muted-foreground">{log.target}</p>
                      </div>
                      {getTypeBadge(log.type)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{log.details}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {log.user}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {log.timestamp}
                      </span>
                      <span>IP: {log.ip}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
