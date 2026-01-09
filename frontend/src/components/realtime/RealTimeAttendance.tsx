import { useState, useEffect, useRef } from 'react';
import { useRealtime } from '@/hooks/useRealtime';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Camera, CheckCircle2, XCircle, Clock, AlertCircle, Save, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import api from '@/lib/axios';

interface Student {
  id: string;
  name: string;
  photo?: string;
  rollNumber: string;
  currentStatus?: 'present' | 'absent' | 'late' | 'excused';
}

interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  markedAt: string;
  markedBy: string;
  notes?: string;
  validated: boolean;
}

interface RealTimeAttendanceProps {
  classId: string;
  date: string;
  students: Student[];
  onAttendanceMarked?: (records: AttendanceRecord[]) => void;
  enableFacialRecognition?: boolean;
}

export function RealTimeAttendance({
  classId,
  date,
  students: initialStudents,
  onAttendanceMarked,
  enableFacialRecognition = false,
}: RealTimeAttendanceProps) {
  const { subscribe, emit, isConnected } = useRealtime();
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [attendanceRecords, setAttendanceRecords] = useState<Map<string, AttendanceRecord>>(new Map());
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'present' | 'absent' | 'late' | 'excused'>('present');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(new Map());
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Subscribe to real-time attendance updates
  useEffect(() => {
    const unsubscribe = subscribe<AttendanceRecord>('attendance:marked', (record) => {
      if (record.studentId) {
        setAttendanceRecords((prev) => {
          const next = new Map(prev);
          next.set(record.studentId, record);
          return next;
        });

        // Update student status
        setStudents((prev) =>
          prev.map((s) =>
            s.id === record.studentId ? { ...s, currentStatus: record.status } : s
          )
        );

        // Show notification if marked by another teacher/admin
        toast.info(`${record.status} marked for student`, {
          description: `Status updated by another user`,
          duration: 2000,
        });
      }
    });

    return unsubscribe;
  }, [subscribe]);

  // Initialize facial recognition if enabled
  useEffect(() => {
    if (enableFacialRecognition && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'user' } })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((error) => {
          console.error('Failed to access camera:', error);
          toast.error('Camera access denied');
        });
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [enableFacialRecognition]);

  // Validate attendance before marking
  const validateAttendance = async (studentId: string, status: string): Promise<boolean> => {
    setIsValidating(true);
    setValidationErrors(new Map());

    try {
      // Check for duplicates
      const existingRecord = attendanceRecords.get(studentId);
      if (existingRecord && existingRecord.validated) {
        setValidationErrors((prev) => {
          const next = new Map(prev);
          next.set(studentId, 'Attendance already marked for this student');
          return next;
        });
        return false;
      }

      // Check time constraints (e.g., can't mark present after class ends)
      const currentTime = new Date();
      const classDate = new Date(date);
      const hoursDiff = Math.abs(currentTime.getTime() - classDate.getTime()) / 36e5;

      // Example: Can't mark attendance more than 2 hours after class start
      if (hoursDiff > 2) {
        setValidationErrors((prev) => {
          const next = new Map(prev);
          next.set(studentId, 'Attendance marking window has closed');
          return next;
        });
        return false;
      }

      // Additional validation can be added here
      return true;
    } catch (error) {
      console.error('Validation error:', error);
      setValidationErrors((prev) => {
        const next = new Map(prev);
        next.set(studentId, 'Validation failed. Please try again.');
        return next;
      });
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  // Mark attendance
  const markAttendance = async (
    studentId: string,
    status: 'present' | 'absent' | 'late' | 'excused',
    notes?: string
  ) => {
    const isValid = await validateAttendance(studentId, status);
    if (!isValid) {
      return;
    }

    const record: AttendanceRecord = {
      studentId,
      status,
      markedAt: new Date().toISOString(),
      markedBy: localStorage.getItem('userId') || 'unknown',
      notes,
      validated: true,
    };

    // Optimistically update UI
    setAttendanceRecords((prev) => {
      const next = new Map(prev);
      next.set(studentId, record);
      return next;
    });

    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, currentStatus: status } : s))
    );

    // Emit via Socket.io for real-time updates
    emit('attendance:mark', {
      classId,
      date,
      ...record,
    });

    // Persist to server
    try {
      const response = await api.post('/attendance/mark', {
        classId,
        date,
        ...record,
      });

      if (response.data) {
        toast.success(`Attendance marked: ${status}`, {
          description: `Student: ${students.find((s) => s.id === studentId)?.name}`,
        });

        // Clear validation errors
        setValidationErrors((prev) => {
          const next = new Map(prev);
          next.delete(studentId);
          return next;
        });

        // Clear selection
        setSelectedStudent(null);
        setNotes('');
      }
    } catch (error) {
      console.error('Failed to mark attendance:', error);
      toast.error('Failed to save attendance');
      
      // Revert optimistic update
      setAttendanceRecords((prev) => {
        const next = new Map(prev);
        next.delete(studentId);
        return next;
      });
    }
  };

  // Bulk mark attendance
  const bulkMarkAttendance = async (status: 'present' | 'absent') => {
    setIsSaving(true);
    const unmarkedStudents = students.filter(
      (s) => !attendanceRecords.has(s.id) || !attendanceRecords.get(s.id)?.validated
    );

    try {
      const records = await Promise.all(
        unmarkedStudents.map(async (student) => {
          const isValid = await validateAttendance(student.id, status);
          if (!isValid) return null;

          const record: AttendanceRecord = {
            studentId: student.id,
            status,
            markedAt: new Date().toISOString(),
            markedBy: localStorage.getItem('userId') || 'unknown',
            validated: true,
          };

          emit('attendance:mark', {
            classId,
            date,
            ...record,
          });

          return { studentId: student.id, record };
        })
      );

      const validRecords = records.filter((r) => r !== null) as Array<{
        studentId: string;
        record: AttendanceRecord;
      }>;

      // Save to server
      await api.post('/attendance/bulk-mark', {
        classId,
        date,
        records: validRecords.map((r) => r.record),
      });

      // Update local state
      validRecords.forEach(({ studentId, record }) => {
        setAttendanceRecords((prev) => {
          const next = new Map(prev);
          next.set(studentId, record);
          return next;
        });

        setStudents((prev) =>
          prev.map((s) => (s.id === studentId ? { ...s, currentStatus: record.status } : s))
        );
      });

      toast.success(`Marked ${validRecords.length} students as ${status}`);
    } catch (error) {
      console.error('Failed to bulk mark attendance:', error);
      toast.error('Failed to save attendance');
    } finally {
      setIsSaving(false);
    }
  };

  // Save all attendance
  const saveAllAttendance = async () => {
    setIsSaving(true);
    try {
      const records = Array.from(attendanceRecords.values());
      const response = await api.post('/attendance/save', {
        classId,
        date,
        records,
      });

      if (response.data) {
        toast.success('Attendance saved successfully');
        onAttendanceMarked?.(records);
      }
    } catch (error) {
      console.error('Failed to save attendance:', error);
      toast.error('Failed to save attendance');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'present':
        return 'bg-success/20 text-success border-success';
      case 'absent':
        return 'bg-destructive/20 text-destructive border-destructive';
      case 'late':
        return 'bg-warning/20 text-warning border-warning';
      case 'excused':
        return 'bg-info/20 text-info border-info';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'absent':
        return <XCircle className="h-4 w-4" />;
      case 'late':
        return <Clock className="h-4 w-4" />;
      case 'excused':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const markedCount = Array.from(attendanceRecords.values()).filter((r) => r.validated).length;
  const presentCount = Array.from(attendanceRecords.values()).filter((r) => r.status === 'present' && r.validated).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Real-Time Attendance</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Class: {classId} | Date: {new Date(date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Badge variant="outline" className="text-success border-success gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  Live
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  Offline
                </Badge>
              )}
              <div className="text-sm text-muted-foreground">
                {markedCount}/{students.length} marked
              </div>
              <Button onClick={saveAllAttendance} disabled={isSaving} className="gap-2">
                <CheckCheck className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save All'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Quick Actions */}
          <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-muted/50">
            <span className="text-sm font-medium">Quick Mark:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkMarkAttendance('present')}
              disabled={isSaving}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark All Present
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkMarkAttendance('absent')}
              disabled={isSaving}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              Mark All Absent
            </Button>
            {enableFacialRecognition && (
              <Button variant="outline" size="sm" className="gap-2 ml-auto">
                <Camera className="h-4 w-4" />
                Facial Recognition
              </Button>
            )}
          </div>

          {/* Facial Recognition Camera */}
          {enableFacialRecognition && videoRef.current && (
            <div className="mb-4 rounded-lg border overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold">{students.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-success/10 text-center">
              <p className="text-xs text-muted-foreground">Present</p>
              <p className="text-2xl font-bold text-success">{presentCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-destructive/10 text-center">
              <p className="text-xs text-muted-foreground">Absent</p>
              <p className="text-2xl font-bold text-destructive">
                {Array.from(attendanceRecords.values()).filter((r) => r.status === 'absent' && r.validated).length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">Attendance %</p>
              <p className="text-2xl font-bold">
                {students.length > 0 ? ((presentCount / students.length) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {students.map((student) => {
                const record = attendanceRecords.get(student.id);
                const status = record?.status || student.currentStatus;
                const isMarked = record?.validated || false;
                const hasError = validationErrors.has(student.id);

                return (
                  <div
                    key={student.id}
                    className={cn(
                      'p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md',
                      selectedStudent?.id === student.id && 'ring-2 ring-primary',
                      isMarked && 'bg-muted/50',
                      hasError && 'border-destructive'
                    )}
                    onClick={() => {
                      setSelectedStudent(student);
                      setSelectedStatus(status || 'present');
                      setNotes(record?.notes || '');
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {student.name.split(' ').map((n) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{student.name}</p>
                        <p className="text-xs text-muted-foreground">Roll: {student.rollNumber}</p>
                      </div>
                      {status && (
                        <Badge className={cn('gap-1', getStatusColor(status))}>
                          {getStatusIcon(status)}
                          {status}
                        </Badge>
                      )}
                    </div>
                    {hasError && (
                      <p className="text-xs text-destructive mt-2">{validationErrors.get(student.id)}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Attendance Marking Dialog */}
      {selectedStudent && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Mark Attendance: {selectedStudent.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Status</Label>
              <RadioGroup value={selectedStatus} onValueChange={(v: any) => setSelectedStatus(v)}>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="present" id="present" />
                    <Label htmlFor="present" className="cursor-pointer flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      Present
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="absent" id="absent" />
                    <Label htmlFor="absent" className="cursor-pointer flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-destructive" />
                      Absent
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="late" id="late" />
                    <Label htmlFor="late" className="cursor-pointer flex items-center gap-2">
                      <Clock className="h-4 w-4 text-warning" />
                      Late
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="excused" id="excused" />
                    <Label htmlFor="excused" className="cursor-pointer flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-info" />
                      Excused
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes..."
                className="mt-2"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  markAttendance(selectedStudent.id, selectedStatus, notes);
                }}
                disabled={isValidating || !isConnected}
                className="flex-1"
              >
                {isValidating ? 'Validating...' : `Mark ${selectedStatus}`}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedStudent(null);
                  setNotes('');
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
