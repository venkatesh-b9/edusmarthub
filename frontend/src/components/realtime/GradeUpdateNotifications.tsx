import { useState, useEffect } from 'react';
import { useRealtime } from '@/hooks/useRealtime';
import { useAppSelector } from '@/store/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, BookOpen, Award, CheckCircle2, Bell, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface GradeUpdate {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  assignmentName: string;
  previousGrade?: number;
  newGrade: number;
  maxGrade: number;
  gradedBy: string;
  gradedAt: string;
  notes?: string;
  improvement?: number;
  notificationSent: boolean;
}

interface GradeUpdateNotificationsProps {
  userId: string;
  role: 'parent' | 'student' | 'teacher';
  studentId?: string;
  showAll?: boolean;
}

export function GradeUpdateNotifications({
  userId,
  role,
  studentId,
  showAll = false,
}: GradeUpdateNotificationsProps) {
  const { subscribe, emit, isConnected } = useRealtime();
  const [gradeUpdates, setGradeUpdates] = useState<GradeUpdate[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dismissedGrades, setDismissedGrades] = useState<Set<string>>(new Set());

  // Subscribe to grade update notifications
  useEffect(() => {
    const unsubscribe = subscribe<GradeUpdate>('grade:updated', (update) => {
      // Filter based on role and user
      const shouldNotify =
        role === 'parent'
          ? update.studentId === studentId || showAll
          : role === 'student'
          ? update.studentId === userId
          : showAll || update.gradedBy === userId;

      if (shouldNotify) {
        setGradeUpdates((prev) => {
          // Check if already exists
          const exists = prev.find((g) => g.id === update.id);
          if (exists) return prev;
          return [update, ...prev].slice(0, 50); // Keep last 50
        });

        // Mark as unread if not dismissed
        if (!dismissedGrades.has(update.id)) {
          setUnreadCount((prev) => prev + 1);

          // Show toast notification
          const improvementText = update.improvement
            ? update.improvement > 0
              ? `(+${update.improvement.toFixed(1)}%)`
              : `(${update.improvement.toFixed(1)}%)`
            : '';

          toast.success(`New Grade: ${update.newGrade}/${update.maxGrade}`, {
            description: `${update.subject} - ${update.assignmentName} ${improvementText}`,
            duration: 5000,
            action: {
              label: 'View',
              onClick: () => {
                // Navigate to grades page
              },
            },
          });
        }

        // Emit acknowledgment
        emit('grade:notification-received', {
          gradeUpdateId: update.id,
          userId,
          receivedAt: new Date().toISOString(),
        });
      }
    });

    return unsubscribe;
  }, [subscribe, emit, userId, role, studentId, showAll, dismissedGrades]);

  // Load persisted grade updates
  useEffect(() => {
    const loadGradeUpdates = async () => {
      try {
        const params: any = { userId, role };
        if (studentId && role === 'parent') {
          params.studentId = studentId;
        }

        // This would call your API
        // const response = await api.get('/grades/updates', { params });
        // if (response.data) {
        //   setGradeUpdates(response.data);
        //   setUnreadCount(response.data.filter((g: GradeUpdate) => !g.notificationSent).length);
        // }
      } catch (error) {
        console.error('Failed to load grade updates:', error);
      }
    };

    loadGradeUpdates();
  }, [userId, role, studentId]);

  const handleDismiss = (gradeId: string) => {
    setDismissedGrades((prev) => {
      const next = new Set(prev);
      next.add(gradeId);
      return next;
    });
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAsRead = async (gradeId: string) => {
    setGradeUpdates((prev) =>
      prev.map((g) => (g.id === gradeId ? { ...g, notificationSent: true } : g))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      emit('grade:notification-read', {
        gradeUpdateId: gradeId,
        userId,
        readAt: new Date().toISOString(),
      });
      // await api.post(`/grades/updates/${gradeId}/read`, { userId });
    } catch (error) {
      console.error('Failed to mark grade update as read:', error);
    }
  };

  const getGradeColor = (grade: number, maxGrade: number) => {
    const percentage = (grade / maxGrade) * 100;
    if (percentage >= 90) return 'text-success';
    if (percentage >= 75) return 'text-primary';
    if (percentage >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getImprovementIcon = (improvement?: number) => {
    if (!improvement) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (improvement > 0) return <TrendingUp className="h-4 w-4 text-success" />;
    if (improvement < 0) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const filteredUpdates = gradeUpdates.filter((update) => !dismissedGrades.has(update.id));
  const recentUpdates = filteredUpdates.slice(0, 10);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Grade Updates</CardTitle>
              {!isConnected && (
                <p className="text-xs text-muted-foreground mt-1">Reconnecting...</p>
              )}
            </div>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {isConnected && (
            <Badge variant="outline" className="text-success border-success gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Live
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {filteredUpdates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Award className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">No grade updates</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {recentUpdates.map((update) => {
                const percentage = (update.newGrade / update.maxGrade) * 100;
                const isUnread = !update.notificationSent && !dismissedGrades.has(update.id);

                return (
                  <Alert
                    key={update.id}
                    className={cn(
                      'cursor-pointer hover:shadow-md transition-all',
                      isUnread && 'bg-primary/5 border-primary/20'
                    )}
                    onClick={() => handleMarkAsRead(update.id)}
                  >
                    <div className="flex items-start gap-3">
                      <BookOpen className="h-5 w-5 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <AlertTitle className="flex items-center justify-between mb-2">
                          <span className="flex items-center gap-2">
                            {update.subject}
                            {isUnread && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDismiss(update.id);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </AlertTitle>
                        <AlertDescription>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium">{update.assignmentName}</p>
                              {role === 'parent' && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Student: {update.studentName}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Grade</p>
                                <p className={cn('text-2xl font-bold', getGradeColor(update.newGrade, update.maxGrade))}>
                                  {update.newGrade}/{update.maxGrade}
                                </p>
                              </div>
                              {update.previousGrade !== undefined && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Previous</p>
                                  <p className="text-lg font-semibold text-muted-foreground">
                                    {update.previousGrade}/{update.maxGrade}
                                  </p>
                                </div>
                              )}
                              {update.improvement !== undefined && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Change</p>
                                  <div className="flex items-center gap-1">
                                    {getImprovementIcon(update.improvement)}
                                    <p
                                      className={cn(
                                        'text-lg font-semibold',
                                        update.improvement > 0
                                          ? 'text-success'
                                          : update.improvement < 0
                                          ? 'text-destructive'
                                          : 'text-muted-foreground'
                                      )}
                                    >
                                      {update.improvement > 0 ? '+' : ''}
                                      {update.improvement.toFixed(1)}%
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-muted-foreground">Progress</span>
                                <span className="text-xs font-medium">{percentage.toFixed(1)}%</span>
                              </div>
                              <Progress value={percentage} className="h-2" />
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                              <span>
                                {format(new Date(update.gradedAt), 'MMM d, yyyy h:mm a')}
                              </span>
                              <span>Graded by {update.gradedBy}</span>
                            </div>
                            {update.notes && (
                              <p className="text-sm text-muted-foreground mt-2 pt-2 border-t">
                                {update.notes}
                              </p>
                            )}
                          </div>
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Summary Stats */}
        {filteredUpdates.length > 0 && (
          <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Total Updates</p>
              <p className="text-lg font-semibold">{filteredUpdates.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-success/10">
              <p className="text-xs text-muted-foreground">Average Grade</p>
              <p className="text-lg font-semibold text-success">
                {(
                  filteredUpdates.reduce((sum, u) => sum + (u.newGrade / u.maxGrade) * 100, 0) /
                  filteredUpdates.length
                ).toFixed(1)}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10">
              <p className="text-xs text-muted-foreground">Improvements</p>
              <p className="text-lg font-semibold text-primary">
                {filteredUpdates.filter((u) => u.improvement && u.improvement > 0).length}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
