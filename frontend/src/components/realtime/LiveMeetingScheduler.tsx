import { useState, useEffect } from 'react';
import { useRealtime } from '@/hooks/useRealtime';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Clock, Users, Video, CheckCircle2, XCircle, AlertCircle, Send, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, isSameDay, startOfDay } from 'date-fns';
import { toast } from 'sonner';
import api from '@/lib/axios';

interface Meeting {
  id: string;
  title: string;
  description?: string;
  parentId: string;
  parentName: string;
  teacherId: string;
  teacherName: string;
  scheduledTime: string;
  duration: number; // in minutes
  status: 'pending' | 'confirmed' | 'declined' | 'completed' | 'cancelled';
  meetingLink?: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface MeetingRequest {
  parentId: string;
  teacherId: string;
  title: string;
  description?: string;
  requestedTime: string;
  duration: number;
  preferredSlots?: string[];
}

interface LiveMeetingSchedulerProps {
  userId: string;
  userRole: 'parent' | 'teacher' | 'admin';
  onMeetingScheduled?: (meeting: Meeting) => void;
}

export function LiveMeetingScheduler({
  userId,
  userRole,
  onMeetingScheduled,
}: LiveMeetingSchedulerProps) {
  const { subscribe, emit, isConnected } = useRealtime();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isScheduling, setIsScheduling] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  // Form state
  const [meetingForm, setMeetingForm] = useState<MeetingRequest>({
    parentId: '',
    teacherId: '',
    title: '',
    description: '',
    requestedTime: '',
    duration: 30,
    preferredSlots: [],
  });

  // Load meetings
  useEffect(() => {
    const loadMeetings = async () => {
      try {
        const response = await api.get('/meetings', {
          params: { userId, role: userRole },
        });
        if (response.data) {
          setMeetings(response.data);
        }
      } catch (error) {
        console.error('Failed to load meetings:', error);
      }
    };

    loadMeetings();
  }, [userId, userRole]);

  // Subscribe to real-time meeting updates
  useEffect(() => {
    const unsubscribe = subscribe<Meeting>('meeting:scheduled', (meeting) => {
      // Check if meeting involves current user
      if (meeting.parentId === userId || meeting.teacherId === userId) {
        setMeetings((prev) => {
          const existing = prev.find((m) => m.id === meeting.id);
          if (existing) {
            return prev.map((m) => (m.id === meeting.id ? meeting : m));
          }
          return [...prev, meeting];
        });

        // Show notification
        toast.info('New meeting scheduled', {
          description: `${meeting.title} on ${format(new Date(meeting.scheduledTime), 'MMM d, h:mm a')}`,
          duration: 5000,
        });

        onMeetingScheduled?.(meeting);
      }
    });

    const unsubscribeStatus = subscribe<{ meetingId: string; status: string }>(
      'meeting:status-update',
      ({ meetingId, status }) => {
        setMeetings((prev) =>
          prev.map((m) =>
            m.id === meetingId
              ? { ...m, status: status as Meeting['status'], updatedAt: new Date().toISOString() }
              : m
          )
        );

        toast.info('Meeting status updated', {
          description: `Meeting status changed to ${status}`,
        });
      }
    );

    return () => {
      unsubscribe();
      unsubscribeStatus();
    };
  }, [subscribe, userId, onMeetingScheduled]);

  // Schedule new meeting
  const handleScheduleMeeting = async () => {
    if (!meetingForm.title || !meetingForm.requestedTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsScheduling(true);
    try {
      // Emit via Socket.io
      emit('meeting:request', {
        ...meetingForm,
        requestedBy: userId,
        timestamp: new Date().toISOString(),
      });

      // Persist to server
      const response = await api.post('/meetings/request', {
        ...meetingForm,
        requestedBy: userId,
      });

      if (response.data) {
        const meeting: Meeting = response.data;
        setMeetings((prev) => [...prev, meeting]);
        toast.success('Meeting request sent', {
          description: 'Waiting for confirmation',
        });
        setMeetingForm({
          parentId: '',
          teacherId: '',
          title: '',
          description: '',
          requestedTime: '',
          duration: 30,
          preferredSlots: [],
        });
        onMeetingScheduled?.(meeting);
      }
    } catch (error) {
      console.error('Failed to schedule meeting:', error);
      toast.error('Failed to schedule meeting');
    } finally {
      setIsScheduling(false);
    }
  };

  // Confirm/Decline meeting
  const handleMeetingResponse = async (meetingId: string, status: 'confirmed' | 'declined') => {
    try {
      emit('meeting:respond', {
        meetingId,
        status,
        respondedBy: userId,
        timestamp: new Date().toISOString(),
      });

      await api.post(`/meetings/${meetingId}/respond`, {
        status,
        respondedBy: userId,
      });

      setMeetings((prev) =>
        prev.map((m) =>
          m.id === meetingId
            ? { ...m, status, updatedAt: new Date().toISOString() }
            : m
        )
      );

      toast.success(`Meeting ${status}`, {
        description: status === 'confirmed' ? 'Meeting confirmed!' : 'Meeting declined',
      });
    } catch (error) {
      console.error('Failed to respond to meeting:', error);
      toast.error('Failed to respond to meeting');
    }
  };

  // Get meetings for selected date
  const getMeetingsForDate = (date: Date) => {
    return meetings.filter((meeting) => isSameDay(new Date(meeting.scheduledTime), date));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-success/20 text-success border-success';
      case 'pending':
        return 'bg-warning/20 text-warning border-warning';
      case 'declined':
        return 'bg-destructive/20 text-destructive border-destructive';
      case 'completed':
        return 'bg-info/20 text-info border-info';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const selectedDateMeetings = getMeetingsForDate(selectedDate);
  const todayMeetings = getMeetingsForDate(new Date());
  const upcomingMeetings = meetings
    .filter((m) => new Date(m.scheduledTime) > new Date() && m.status === 'confirmed')
    .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Meeting Scheduler</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Schedule and manage parent-teacher meetings in real-time
              </p>
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
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">Today</p>
              <p className="text-2xl font-bold">{todayMeetings.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-warning/10 text-center">
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-warning">
                {meetings.filter((m) => m.status === 'pending').length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-success/10 text-center">
              <p className="text-xs text-muted-foreground">Confirmed</p>
              <p className="text-2xl font-bold text-success">
                {meetings.filter((m) => m.status === 'confirmed').length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-info/10 text-center">
              <p className="text-xs text-muted-foreground">Upcoming</p>
              <p className="text-2xl font-bold text-info">{upcomingMeetings.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
              modifiers={{
                hasMeetings: meetings.map((m) => startOfDay(new Date(m.scheduledTime))),
              }}
              modifiersClassNames={{
                hasMeetings: 'bg-primary/20',
              }}
            />
            {selectedDateMeetings.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">
                  {format(selectedDate, 'MMMM d')} - {selectedDateMeetings.length} meeting
                  {selectedDateMeetings.length > 1 ? 's' : ''}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Date Meetings */}
        <Card>
          <CardHeader>
            <CardTitle>
              {format(selectedDate, 'MMMM d, yyyy')} - Meetings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {selectedDateMeetings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No meetings scheduled
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateMeetings
                    .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
                    .map((meeting) => (
                      <div
                        key={meeting.id}
                        className={cn('p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all', getStatusColor(meeting.status))}
                        onClick={() => setSelectedMeeting(meeting)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-sm">{meeting.title}</p>
                          <Badge className={cn('text-xs', getStatusColor(meeting.status))}>
                            {meeting.status}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>{format(new Date(meeting.scheduledTime), 'h:mm a')} ({meeting.duration} min)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-3 w-3" />
                            <span>
                              {userRole === 'parent' ? meeting.teacherName : meeting.parentName}
                            </span>
                          </div>
                          {meeting.meetingLink && (
                            <div className="flex items-center gap-2">
                              <Video className="h-3 w-3" />
                              <span>Video link available</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Schedule New Meeting / Upcoming Meetings */}
        <Card>
          <CardHeader>
            <CardTitle>
              {userRole === 'parent' ? 'Schedule Meeting' : 'Upcoming Meetings'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userRole === 'parent' ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full" size="lg" variant="default">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Request Meeting
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Request Meeting</DialogTitle>
                    <DialogDescription>
                      Select teacher and preferred time slot
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="teacher">Teacher *</Label>
                      <Select
                        value={meetingForm.teacherId}
                        onValueChange={(value) => setMeetingForm({ ...meetingForm, teacherId: value })}
                      >
                        <SelectTrigger id="teacher" className="mt-2">
                          <SelectValue placeholder="Select teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Teachers would be loaded from API */}
                          <SelectItem value="teacher1">Mr. Thompson</SelectItem>
                          <SelectItem value="teacher2">Ms. Johnson</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="title">Subject *</Label>
                      <Input
                        id="title"
                        value={meetingForm.title}
                        onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                        placeholder="Meeting subject"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={meetingForm.description}
                        onChange={(e) => setMeetingForm({ ...meetingForm, description: e.target.value })}
                        placeholder="Optional notes..."
                        className="mt-2"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="datetime">Preferred Date & Time *</Label>
                      <Input
                        id="datetime"
                        type="datetime-local"
                        value={meetingForm.requestedTime}
                        onChange={(e) => setMeetingForm({ ...meetingForm, requestedTime: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration">Duration (minutes) *</Label>
                      <Select
                        value={meetingForm.duration.toString()}
                        onValueChange={(value) => setMeetingForm({ ...meetingForm, duration: parseInt(value) })}
                      >
                        <SelectTrigger id="duration" className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setMeetingForm({
                      parentId: '',
                      teacherId: '',
                      title: '',
                      description: '',
                      requestedTime: '',
                      duration: 30,
                      preferredSlots: [],
                    })}>
                      Cancel
                    </Button>
                    <Button onClick={handleScheduleMeeting} disabled={isScheduling || !isConnected}>
                      {isScheduling ? 'Sending...' : 'Send Request'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : (
              <ScrollArea className="h-[400px]">
                {upcomingMeetings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No upcoming meetings
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingMeetings.map((meeting) => (
                      <div key={meeting.id} className="p-3 rounded-lg border">
                        <p className="font-medium text-sm">{meeting.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(meeting.scheduledTime), 'MMM d, h:mm a')}
                        </p>
                        <p className="text-xs text-muted-foreground">With: {meeting.parentName}</p>
                        {meeting.status === 'pending' && (
                          <div className="flex items-center gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleMeetingResponse(meeting.id, 'confirmed')}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleMeetingResponse(meeting.id, 'declined')}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Decline
                            </Button>
                          </div>
                        )}
                        {meeting.meetingLink && meeting.status === 'confirmed' && (
                          <Button
                            size="sm"
                            variant="default"
                            className="w-full mt-2"
                            onClick={() => window.open(meeting.meetingLink, '_blank')}
                          >
                            <Video className="h-3 w-3 mr-1" />
                            Join Meeting
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Meeting Details Modal */}
      {selectedMeeting && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedMeeting.title}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setSelectedMeeting(null)}>
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Date & Time</p>
                  <p className="text-sm font-medium mt-1">
                    {format(new Date(selectedMeeting.scheduledTime), 'MMMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-sm font-medium mt-1">{selectedMeeting.duration} minutes</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {userRole === 'parent' ? 'Teacher' : 'Parent'}
                  </p>
                  <p className="text-sm font-medium mt-1">
                    {userRole === 'parent' ? selectedMeeting.teacherName : selectedMeeting.parentName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={cn('mt-1', getStatusColor(selectedMeeting.status))}>
                    {selectedMeeting.status}
                  </Badge>
                </div>
              </div>
              {selectedMeeting.description && (
                <div>
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm mt-1">{selectedMeeting.description}</p>
                </div>
              )}
              {selectedMeeting.location && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    Location
                  </p>
                  <p className="text-sm mt-1">{selectedMeeting.location}</p>
                </div>
              )}
              {selectedMeeting.meetingLink && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-2 mb-2">
                    <Video className="h-3 w-3" />
                    Video Link
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(selectedMeeting.meetingLink, '_blank')}
                  >
                    Join Video Meeting
                  </Button>
                </div>
              )}
              {selectedMeeting.status === 'pending' && userRole === 'teacher' && (
                <div className="flex items-center gap-2 pt-4 border-t">
                  <Button
                    className="flex-1"
                    onClick={() => handleMeetingResponse(selectedMeeting.id, 'confirmed')}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirm
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleMeetingResponse(selectedMeeting.id, 'declined')}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
