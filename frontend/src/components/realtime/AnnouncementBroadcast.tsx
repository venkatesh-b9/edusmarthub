import { useState, useEffect } from 'react';
import { useRealtime } from '@/hooks/useRealtime';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Megaphone, Send, Users, School, GraduationCap, User, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import api from '@/lib/axios';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'urgent' | 'success';
  priority: 'low' | 'medium' | 'high';
  targetAudience: 'all' | 'parents' | 'teachers' | 'students' | 'school-admins';
  schoolIds?: string[];
  classIds?: string[];
  sentBy: string;
  sentByName: string;
  sentAt: string;
  expiresAt?: string;
  acknowledgedBy?: string[];
  readBy?: string[];
  attachments?: Array<{ id: string; name: string; url: string }>;
}

interface AnnouncementBroadcastProps {
  userId: string;
  userRole: 'super-admin' | 'school-admin' | 'teacher' | 'parent';
  userSchoolId?: string;
  canBroadcast?: boolean;
}

export function AnnouncementBroadcast({
  userId,
  userRole,
  userSchoolId,
  canBroadcast = false,
}: AnnouncementBroadcastProps) {
  const { subscribe, emit, isConnected } = useRealtime();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Form state
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'urgent' | 'success',
    priority: 'medium' as 'low' | 'medium' | 'high',
    targetAudience: 'all' as 'all' | 'parents' | 'teachers' | 'students' | 'school-admins',
    schoolIds: [] as string[],
    expiresAt: '',
  });

  // Load announcements
  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const params: any = { role: userRole };
        if (userSchoolId) {
          params.schoolId = userSchoolId;
        }

        // const response = await api.get('/announcements', { params });
        // if (response.data) {
        //   setAnnouncements(response.data);
        // }
      } catch (error) {
        console.error('Failed to load announcements:', error);
      }
    };

    loadAnnouncements();
  }, [userRole, userSchoolId]);

  // Subscribe to broadcast announcements
  useEffect(() => {
    const unsubscribe = subscribe<Announcement>('announcement:broadcast', (announcement) => {
      // Filter based on target audience and user role
      const shouldShow =
        announcement.targetAudience === 'all' ||
        (userRole === 'parent' && announcement.targetAudience === 'parents') ||
        (userRole === 'teacher' && announcement.targetAudience === 'teachers') ||
        (userRole === 'school-admin' && announcement.targetAudience === 'school-admins') ||
        (userSchoolId && announcement.schoolIds?.includes(userSchoolId));

      if (shouldShow) {
        setAnnouncements((prev) => {
          const exists = prev.find((a) => a.id === announcement.id);
          if (exists) return prev;
          return [announcement, ...prev].slice(0, 100); // Keep last 100
        });

        // Show toast based on priority
        if (announcement.priority === 'high' || announcement.type === 'urgent') {
          toast.error(announcement.title, {
            description: announcement.message,
            duration: 10000,
          });
        } else if (announcement.type === 'warning') {
          toast.warning(announcement.title, {
            description: announcement.message,
            duration: 7000,
          });
        } else {
          toast.info(announcement.title, {
            description: announcement.message,
            duration: 5000,
          });
        }

        // Auto-acknowledge for low priority
        if (announcement.priority === 'low') {
          acknowledgeAnnouncement(announcement.id);
        }
      }
    });

    const unsubscribeRead = subscribe<{ announcementId: string; userId: string }>(
      'announcement:read',
      ({ announcementId, userId: readUserId }) => {
        if (readUserId !== userId) {
          setAnnouncements((prev) =>
            prev.map((a) =>
              a.id === announcementId
                ? { ...a, readBy: [...(a.readBy || []), readUserId] }
                : a
            )
          );
        }
      }
    );

    const unsubscribeAcknowledge = subscribe<{ announcementId: string; userId: string }>(
      'announcement:acknowledged',
      ({ announcementId, userId: ackUserId }) => {
        if (ackUserId !== userId) {
          setAnnouncements((prev) =>
            prev.map((a) =>
              a.id === announcementId
                ? { ...a, acknowledgedBy: [...(a.acknowledgedBy || []), ackUserId] }
                : a
            )
          );
        }
      }
    );

    return () => {
      unsubscribe();
      unsubscribeRead();
      unsubscribeAcknowledge();
    };
  }, [subscribe, userRole, userSchoolId, userId]);

  // Broadcast announcement
  const handleBroadcast = async () => {
    if (!announcementForm.title || !announcementForm.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSending(true);
    try {
      const announcement: Announcement = {
        id: `announcement-${Date.now()}`,
        ...announcementForm,
        sentBy: userId,
        sentByName: localStorage.getItem('userName') || 'Unknown',
        sentAt: new Date().toISOString(),
        expiresAt: announcementForm.expiresAt || undefined,
        acknowledgedBy: [],
        readBy: [],
      };

      // Emit via Socket.io for real-time broadcast
      emit('announcement:broadcast', announcement);

      // Persist to server
      const response = await api.post('/announcements/broadcast', announcement);

      if (response.data) {
        setAnnouncements((prev) => [response.data, ...prev]);
        toast.success('Announcement broadcasted successfully');
        setAnnouncementForm({
          title: '',
          message: '',
          type: 'info',
          priority: 'medium',
          targetAudience: 'all',
          schoolIds: [],
          expiresAt: '',
        });
      }
    } catch (error) {
      console.error('Failed to broadcast announcement:', error);
      toast.error('Failed to broadcast announcement');
    } finally {
      setIsSending(false);
    }
  };

  // Acknowledge announcement
  const acknowledgeAnnouncement = async (announcementId: string) => {
    emit('announcement:acknowledge', {
      announcementId,
      userId,
      acknowledgedAt: new Date().toISOString(),
    });

    setAnnouncements((prev) =>
      prev.map((a) =>
        a.id === announcementId
          ? { ...a, acknowledgedBy: [...(a.acknowledgedBy || []), userId] }
          : a
      )
    );

    try {
      await api.post(`/announcements/${announcementId}/acknowledge`, { userId });
    } catch (error) {
      console.error('Failed to acknowledge announcement:', error);
    }
  };

  // Mark as read
  const markAsRead = async (announcementId: string) => {
    emit('announcement:read', {
      announcementId,
      userId,
      readAt: new Date().toISOString(),
    });

    setAnnouncements((prev) =>
      prev.map((a) =>
        a.id === announcementId
          ? { ...a, readBy: [...(a.readBy || []), userId] }
          : a
      )
    );

    try {
      await api.post(`/announcements/${announcementId}/read`, { userId });
    } catch (error) {
      console.error('Failed to mark announcement as read:', error);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'bg-destructive/20 text-destructive border-destructive';
      case 'warning':
        return 'bg-warning/20 text-warning border-warning';
      case 'success':
        return 'bg-success/20 text-success border-success';
      default:
        return 'bg-info/20 text-info border-info';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4" />;
      case 'medium':
        return <Megaphone className="h-4 w-4" />;
      default:
        return <Megaphone className="h-4 w-4" />;
    }
  };

  const getTargetIcon = (audience: string) => {
    switch (audience) {
      case 'parents':
        return <User className="h-4 w-4" />;
      case 'teachers':
        return <GraduationCap className="h-4 w-4" />;
      case 'students':
        return <Users className="h-4 w-4" />;
      case 'school-admins':
        return <School className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const filteredAnnouncements = announcements.filter((a) => {
    if (a.expiresAt && new Date(a.expiresAt) < new Date()) return false;
    return true;
  });

  const unreadAnnouncements = filteredAnnouncements.filter(
    (a) => !a.readBy?.includes(userId)
  );

  return (
    <div className="space-y-4">
      {/* Broadcast Form (if user can broadcast) */}
      {canBroadcast && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Broadcast Announcement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                placeholder="Announcement title"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={announcementForm.message}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                placeholder="Announcement message"
                className="mt-2"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select
                  value={announcementForm.type}
                  onValueChange={(v: any) => setAnnouncementForm({ ...announcementForm, type: v })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select
                  value={announcementForm.priority}
                  onValueChange={(v: any) => setAnnouncementForm({ ...announcementForm, priority: v })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Target Audience</Label>
              <Select
                value={announcementForm.targetAudience}
                onValueChange={(v: any) => setAnnouncementForm({ ...announcementForm, targetAudience: v })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="parents">Parents</SelectItem>
                  <SelectItem value="teachers">Teachers</SelectItem>
                  <SelectItem value="students">Students</SelectItem>
                  <SelectItem value="school-admins">School Admins</SelectItem>
                </SelectContent>
              </SelectTrigger>
            </div>
            <div>
              <Label htmlFor="expiresAt">Expires At (Optional)</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={announcementForm.expiresAt}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, expiresAt: e.target.value })}
                className="mt-2"
              />
            </div>
            <Button
              onClick={handleBroadcast}
              disabled={isSending || !isConnected}
              className="w-full"
              size="lg"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSending ? 'Broadcasting...' : 'Broadcast Announcement'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Announcements List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Megaphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Announcements</CardTitle>
                {unreadAnnouncements.length > 0 && (
                  <Badge variant="destructive" className="mt-1">
                    {unreadAnnouncements.length} unread
                  </Badge>
                )}
              </div>
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
          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                All
                <Badge variant="secondary" className="ml-2">
                  {filteredAnnouncements.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                {unreadAnnouncements.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadAnnouncements.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="urgent">Urgent</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <AnnouncementsList
                announcements={filteredAnnouncements}
                userId={userId}
                onAcknowledge={acknowledgeAnnouncement}
                onRead={markAsRead}
                onSelect={setSelectedAnnouncement}
                getTypeColor={getTypeColor}
                getPriorityIcon={getPriorityIcon}
                getTargetIcon={getTargetIcon}
              />
            </TabsContent>

            <TabsContent value="unread" className="mt-4">
              <AnnouncementsList
                announcements={unreadAnnouncements}
                userId={userId}
                onAcknowledge={acknowledgeAnnouncement}
                onRead={markAsRead}
                onSelect={setSelectedAnnouncement}
                getTypeColor={getTypeColor}
                getPriorityIcon={getPriorityIcon}
                getTargetIcon={getTargetIcon}
              />
            </TabsContent>

            <TabsContent value="urgent" className="mt-4">
              <AnnouncementsList
                announcements={filteredAnnouncements.filter((a) => a.type === 'urgent' || a.priority === 'high')}
                userId={userId}
                onAcknowledge={acknowledgeAnnouncement}
                onRead={markAsRead}
                onSelect={setSelectedAnnouncement}
                getTypeColor={getTypeColor}
                getPriorityIcon={getPriorityIcon}
                getTargetIcon={getTargetIcon}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Selected Announcement Details */}
      {selectedAnnouncement && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedAnnouncement.title}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setSelectedAnnouncement(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className={getTypeColor(selectedAnnouncement.type)}>
                {selectedAnnouncement.type}
              </Badge>
              <Badge variant="outline" className="gap-1">
                {getPriorityIcon(selectedAnnouncement.priority)}
                {selectedAnnouncement.priority} priority
              </Badge>
              <Badge variant="outline" className="gap-1">
                {getTargetIcon(selectedAnnouncement.targetAudience)}
                {selectedAnnouncement.targetAudience}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Message</p>
              <p className="text-sm mt-2 whitespace-pre-wrap">{selectedAnnouncement.message}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Sent By</p>
                <p className="font-medium mt-1">{selectedAnnouncement.sentByName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Sent At</p>
                <p className="font-medium mt-1">
                  {format(new Date(selectedAnnouncement.sentAt), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              {selectedAnnouncement.expiresAt && (
                <div>
                  <p className="text-muted-foreground">Expires At</p>
                  <p className="font-medium mt-1">
                    {format(new Date(selectedAnnouncement.expiresAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Read By</p>
                <p className="font-medium mt-1">
                  {selectedAnnouncement.readBy?.length || 0} users
                </p>
              </div>
            </div>
            {selectedAnnouncement.attachments && selectedAnnouncement.attachments.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Attachments</p>
                <div className="space-y-2">
                  {selectedAnnouncement.attachments.map((attachment) => (
                    <Button
                      key={attachment.id}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.open(attachment.url, '_blank')}
                    >
                      {attachment.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 pt-4 border-t">
              <Button
                className="flex-1"
                onClick={() => {
                  markAsRead(selectedAnnouncement.id);
                  acknowledgeAnnouncement(selectedAnnouncement.id);
                }}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as Read & Acknowledge
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper component for announcements list
function AnnouncementsList({
  announcements,
  userId,
  onAcknowledge,
  onRead,
  onSelect,
  getTypeColor,
  getPriorityIcon,
  getTargetIcon,
}: {
  announcements: Announcement[];
  userId: string;
  onAcknowledge: (id: string) => void;
  onRead: (id: string) => void;
  onSelect: (announcement: Announcement) => void;
  getTypeColor: (type: string) => string;
  getPriorityIcon: (priority: string) => JSX.Element;
  getTargetIcon: (audience: string) => JSX.Element;
}) {
  if (announcements.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No announcements
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-3">
        {announcements.map((announcement) => {
          const isUnread = !announcement.readBy?.includes(userId);
          const isAcknowledged = announcement.acknowledgedBy?.includes(userId);

          return (
            <Alert
              key={announcement.id}
              className={cn(
                'cursor-pointer hover:shadow-md transition-all',
                isUnread && 'bg-primary/5 border-primary/20',
                getTypeColor(announcement.type)
              )}
              onClick={() => {
                onSelect(announcement);
                if (isUnread) {
                  onRead(announcement.id);
                }
              }}
            >
              <div className="flex items-start gap-3">
                {getPriorityIcon(announcement.priority)}
                <div className="flex-1 min-w-0">
                  <AlertTitle className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2">
                      {announcement.title}
                      {isUnread && (
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge className={getTypeColor(announcement.type)} variant="outline">
                        {announcement.type}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        {getTargetIcon(announcement.targetAudience)}
                        {announcement.targetAudience}
                      </Badge>
                    </div>
                  </AlertTitle>
                  <AlertDescription>
                    <p className="text-sm mb-2 line-clamp-2">{announcement.message}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{format(new Date(announcement.sentAt), 'MMM d, yyyy h:mm a')}</span>
                      <span>By {announcement.sentByName}</span>
                      {announcement.readBy && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {announcement.readBy.length} read
                        </span>
                      )}
                    </div>
                    {!isAcknowledged && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAcknowledge(announcement.id);
                        }}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Acknowledge
                      </Button>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          );
        })}
      </div>
    </ScrollArea>
  );
}
