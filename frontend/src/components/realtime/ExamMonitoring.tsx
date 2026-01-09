import { useState, useEffect, useRef } from 'react';
import { useRealtime } from '@/hooks/useRealtime';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, AlertTriangle, CheckCircle2, XCircle, Eye, EyeOff, Flag, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import api from '@/lib/axios';

interface ExamSession {
  id: string;
  examId: string;
  examName: string;
  studentId: string;
  studentName: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'submitted' | 'flagged' | 'completed';
  progress: number;
  warnings: number;
  flags: Array<{ reason: string; timestamp: string }>;
  screenshotCount: number;
  lastActivity?: string;
}

interface ExamAlert {
  id: string;
  studentId: string;
  studentName: string;
  type: 'tab_switch' | 'copy_paste' | 'face_not_detected' | 'multiple_faces' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  description: string;
  screenshot?: string;
}

interface ExamMonitoringProps {
  examId: string;
  examName: string;
  startTime: string;
  endTime: string;
  onSessionFlag?: (sessionId: string, reason: string) => void;
  enableScreenshots?: boolean;
  enableFacialRecognition?: boolean;
}

export function ExamMonitoring({
  examId,
  examName,
  startTime,
  endTime,
  onSessionFlag,
  enableScreenshots = true,
  enableFacialRecognition = true,
}: ExamMonitoringProps) {
  const { subscribe, emit, isConnected } = useRealtime();
  const [sessions, setSessions] = useState<Map<string, ExamSession>>(new Map());
  const [alerts, setAlerts] = useState<ExamAlert[]>([]);
  const [selectedSession, setSelectedSession] = useState<ExamSession | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'flagged' | 'completed'>('all');
  const [isMonitoring, setIsMonitoring] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load exam sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const response = await api.get(`/exams/${examId}/sessions`);
        if (response.data) {
          const sessionsMap = new Map<string, ExamSession>();
          response.data.forEach((session: ExamSession) => {
            sessionsMap.set(session.id, session);
          });
          setSessions(sessionsMap);
        }
      } catch (error) {
        console.error('Failed to load exam sessions:', error);
      }
    };

    loadSessions();
  }, [examId]);

  // Subscribe to exam monitoring events
  useEffect(() => {
    const unsubscribeSessionUpdate = subscribe<ExamSession>('exam:session-update', (session) => {
      if (session.examId === examId) {
        setSessions((prev) => {
          const next = new Map(prev);
          next.set(session.id, session);
          return next;
        });
      }
    });

    const unsubscribeAlert = subscribe<ExamAlert>('exam:alert', (alert) => {
      if (alert.type) {
        setAlerts((prev) => [alert, ...prev].slice(0, 100)); // Keep last 100 alerts

        // Show toast for high severity alerts
        if (alert.severity === 'high') {
          toast.error(`High Alert: ${alert.studentName}`, {
            description: alert.description,
            duration: 5000,
          });
        } else if (alert.severity === 'medium') {
          toast.warning(`Alert: ${alert.studentName}`, {
            description: alert.description,
            duration: 3000,
          });
        }
      }
    });

    const unsubscribeStatus = subscribe<{ studentId: string; status: string }>('exam:status', (data) => {
      setSessions((prev) => {
        const next = new Map(prev);
        const session = Array.from(next.values()).find((s) => s.studentId === data.studentId);
        if (session) {
          next.set(session.id, { ...session, status: data.status as any });
        }
        return next;
      });
    });

    // Join exam room
    emit('exam:join', { examId });

    return () => {
      unsubscribeSessionUpdate();
      unsubscribeAlert();
      unsubscribeStatus();
      emit('exam:leave', { examId });
    };
  }, [subscribe, emit, examId]);

  // Periodic monitoring updates
  useEffect(() => {
    if (!isMonitoring || !isConnected) return;

    intervalRef.current = setInterval(() => {
      emit('exam:ping', { examId });
    }, 5000); // Ping every 5 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isMonitoring, isConnected, emit, examId]);

  const handleFlagSession = async (sessionId: string, reason: string) => {
    try {
      emit('exam:flag', { examId, sessionId, reason });
      await api.post(`/exams/${examId}/sessions/${sessionId}/flag`, { reason });

      setSessions((prev) => {
        const next = new Map(prev);
        const session = next.get(sessionId);
        if (session) {
          next.set(sessionId, {
            ...session,
            status: 'flagged',
            flags: [...(session.flags || []), { reason, timestamp: new Date().toISOString() }],
          });
        }
        return next;
      });

      toast.warning('Session flagged', {
        description: `Reason: ${reason}`,
      });

      onSessionFlag?.(sessionId, reason);
    } catch (error) {
      console.error('Failed to flag session:', error);
      toast.error('Failed to flag session');
    }
  };

  const handleEndSession = async (sessionId: string) => {
    try {
      emit('exam:end-session', { examId, sessionId });
      await api.post(`/exams/${examId}/sessions/${sessionId}/end`);

      setSessions((prev) => {
        const next = new Map(prev);
        const session = next.get(sessionId);
        if (session) {
          next.set(sessionId, { ...session, status: 'completed', endTime: new Date().toISOString() });
        }
        return next;
      });

      toast.success('Session ended');
    } catch (error) {
      console.error('Failed to end session:', error);
      toast.error('Failed to end session');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success/20 text-success border-success';
      case 'flagged':
        return 'bg-destructive/20 text-destructive border-destructive';
      case 'completed':
        return 'bg-info/20 text-info border-info';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-destructive/20 text-destructive border-destructive';
      case 'medium':
        return 'bg-warning/20 text-warning border-warning';
      default:
        return 'bg-info/20 text-info border-info';
    }
  };

  const filteredSessions = Array.from(sessions.values()).filter((session) => {
    if (filter === 'all') return true;
    return session.status === filter;
  });

  const activeCount = Array.from(sessions.values()).filter((s) => s.status === 'active').length;
  const flaggedCount = Array.from(sessions.values()).filter((s) => s.status === 'flagged').length;
  const totalAlerts = alerts.length;
  const highSeverityAlerts = alerts.filter((a) => a.severity === 'high').length;

  const calculateTimeRemaining = () => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return 'Exam ended';
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m remaining`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{examName} - Monitoring</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {calculateTimeRemaining()} | Start: {new Date(startTime).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Badge variant="outline" className="text-success border-success gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  Monitoring
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  Offline
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMonitoring(!isMonitoring)}
                className="gap-2"
              >
                {isMonitoring ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {isMonitoring ? 'Pause' : 'Resume'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">Active Sessions</p>
              <p className="text-2xl font-bold text-success">{activeCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-destructive/10 text-center">
              <p className="text-xs text-muted-foreground">Flagged</p>
              <p className="text-2xl font-bold text-destructive">{flaggedCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-warning/10 text-center">
              <p className="text-xs text-muted-foreground">Total Alerts</p>
              <p className="text-2xl font-bold text-warning">{totalAlerts}</p>
            </div>
            <div className="p-3 rounded-lg bg-destructive/10 text-center">
              <p className="text-xs text-muted-foreground">High Severity</p>
              <p className="text-2xl font-bold text-destructive">{highSeverityAlerts}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sessions List */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sessions</CardTitle>
                <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="flagged">Flagged</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {filteredSessions.map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        'p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md',
                        selectedSession?.id === session.id && 'ring-2 ring-primary',
                        getStatusColor(session.status)
                      )}
                      onClick={() => setSelectedSession(session)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {session.studentName.split(' ').map((n) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{session.studentName}</p>
                            <p className="text-xs text-muted-foreground">
                              Started: {new Date(session.startTime).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <Badge className={cn('gap-1', getStatusColor(session.status))}>
                          {session.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex-1">
                          <Progress value={session.progress} className="h-2 mb-2" />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Progress: {session.progress}%</span>
                            <span>Warnings: {session.warnings}</span>
                            {enableScreenshots && (
                              <span className="flex items-center gap-1">
                                <Camera className="h-3 w-3" />
                                {session.screenshotCount}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFlagSession(session.id, 'Manual flag by proctor');
                            }}
                          >
                            <Flag className="h-4 w-4" />
                          </Button>
                          {session.status === 'active' && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEndSession(session.id);
                              }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {session.flags && session.flags.length > 0 && (
                        <div className="mt-3 pt-3 border-t space-y-1">
                          {session.flags.map((flag, index) => (
                            <div key={index} className="text-xs text-destructive flex items-center gap-2">
                              <AlertTriangle className="h-3 w-3" />
                              <span>{flag.reason}</span>
                              <span className="text-muted-foreground">
                                ({new Date(flag.timestamp).toLocaleTimeString()})
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {alerts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No alerts
                    </div>
                  ) : (
                    alerts.slice(0, 20).map((alert) => (
                      <Alert
                        key={alert.id}
                        className={cn('cursor-pointer hover:shadow-md transition-shadow', getSeverityColor(alert.severity))}
                        onClick={() => {
                          const session = Array.from(sessions.values()).find((s) => s.studentId === alert.studentId);
                          if (session) setSelectedSession(session);
                        }}
                      >
                        <AlertTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          {alert.studentName}
                          <Badge variant="outline" className="ml-auto text-xs">
                            {alert.severity}
                          </Badge>
                        </AlertTitle>
                        <AlertDescription className="mt-2">
                          <p className="text-sm">{alert.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                          {alert.screenshot && (
                            <img
                              src={alert.screenshot}
                              alt="Alert screenshot"
                              className="mt-2 rounded border max-w-full"
                            />
                          )}
                        </AlertDescription>
                      </Alert>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Selected Session Details */}
      {selectedSession && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Session Details: {selectedSession.studentName}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setSelectedSession(null)}>
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge className={cn('mt-1', getStatusColor(selectedSession.status))}>
                  {selectedSession.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Progress</p>
                <p className="text-lg font-semibold mt-1">{selectedSession.progress}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Warnings</p>
                <p className="text-lg font-semibold text-warning mt-1">{selectedSession.warnings}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Screenshots</p>
                <p className="text-lg font-semibold mt-1">{selectedSession.screenshotCount}</p>
              </div>
            </div>
            {selectedSession.lastActivity && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground">Last Activity</p>
                <p className="text-sm font-medium mt-1">
                  {new Date(selectedSession.lastActivity).toLocaleString()}
                </p>
              </div>
            )}
            {selectedSession.flags && selectedSession.flags.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">Flags</p>
                <div className="space-y-2">
                  {selectedSession.flags.map((flag, index) => (
                    <div key={index} className="p-2 rounded bg-destructive/10 border border-destructive/20">
                      <p className="text-sm font-medium text-destructive">{flag.reason}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(flag.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
