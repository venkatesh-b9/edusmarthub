import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  Plus,
  Video,
  BookOpen,
} from 'lucide-react';

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeSlots = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

const weeklySchedule = {
  Monday: [
    { id: 1, name: 'Advanced Physics', grade: '11-A', time: '8:00 AM - 9:30 AM', room: 'Lab 201', color: 'bg-blue-500' },
    { id: 2, name: 'AP Physics', grade: '12-A', time: '1:00 PM - 2:30 PM', room: 'Lab 202', color: 'bg-purple-500' },
  ],
  Tuesday: [
    { id: 3, name: 'General Physics', grade: '10-B', time: '10:00 AM - 11:30 AM', room: 'Room 105', color: 'bg-green-500' },
    { id: 4, name: 'Physics Lab', grade: '11-B', time: '3:00 PM - 4:30 PM', room: 'Lab 201', color: 'bg-orange-500' },
  ],
  Wednesday: [
    { id: 5, name: 'Advanced Physics', grade: '11-A', time: '8:00 AM - 9:30 AM', room: 'Lab 201', color: 'bg-blue-500' },
    { id: 6, name: 'AP Physics', grade: '12-A', time: '1:00 PM - 2:30 PM', room: 'Lab 202', color: 'bg-purple-500' },
  ],
  Thursday: [
    { id: 7, name: 'General Physics', grade: '10-B', time: '10:00 AM - 11:30 AM', room: 'Room 105', color: 'bg-green-500' },
    { id: 8, name: 'Physics Lab', grade: '11-B', time: '3:00 PM - 4:30 PM', room: 'Lab 201', color: 'bg-orange-500' },
  ],
  Friday: [
    { id: 9, name: 'Advanced Physics', grade: '11-A', time: '8:00 AM - 9:30 AM', room: 'Lab 201', color: 'bg-blue-500' },
    { id: 10, name: 'Office Hours', grade: 'All', time: '2:00 PM - 4:00 PM', room: 'Room 301', color: 'bg-gray-500' },
  ],
};

const upcomingEvents = [
  { id: 1, title: 'Parent-Teacher Conference', date: 'Jan 5, 2026', time: '2:00 PM', type: 'meeting' },
  { id: 2, title: 'Department Meeting', date: 'Jan 6, 2026', time: '10:00 AM', type: 'meeting' },
  { id: 3, title: 'Midterm Exam - AP Physics', date: 'Jan 10, 2026', time: '9:00 AM', type: 'exam' },
  { id: 4, title: 'Science Fair Preparation', date: 'Jan 15, 2026', time: '3:00 PM', type: 'event' },
];

const todayClasses = [
  { id: 1, name: 'General Physics', grade: '10-B', time: '10:00 AM - 11:30 AM', room: 'Room 105', students: 28, status: 'upcoming' },
  { id: 2, name: 'Physics Lab', grade: '11-B', time: '3:00 PM - 4:30 PM', room: 'Lab 201', students: 30, status: 'upcoming' },
];

export default function TeacherSchedule() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState('Tuesday');

  const formatWeekRange = () => {
    const start = new Date(currentWeek);
    start.setDate(start.getDate() - start.getDay() + 1);
    const end = new Date(start);
    end.setDate(end.getDate() + 4);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-bold">Schedule</h1>
            <p className="text-muted-foreground mt-1">
              Manage your teaching schedule and events
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <Button variant="outline" className="gap-2">
              <Video className="w-4 h-4" />
              Start Virtual Class
            </Button>
            <Button className="gap-2 gradient-primary text-white shadow-glow">
              <Plus className="w-4 h-4" />
              Add Event
            </Button>
          </motion.div>
        </div>

        {/* Today's Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-6 shadow-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Today's Classes</h3>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <Badge variant="outline" className="gap-1">
              <Calendar className="w-3 h-3" />
              {todayClasses.length} classes today
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todayClasses.map((cls) => (
              <div
                key={cls.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{cls.name}</h4>
                  <p className="text-sm text-muted-foreground">Grade {cls.grade}</p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {cls.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {cls.room}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {cls.students}
                    </span>
                  </div>
                </div>
                <Button size="sm" className="gradient-primary text-white">
                  Start Class
                </Button>
              </div>
            ))}
          </div>
        </motion.div>

        <Tabs defaultValue="week" className="space-y-6">
          <TabsList>
            <TabsTrigger value="week">Week View</TabsTrigger>
            <TabsTrigger value="day">Day View</TabsTrigger>
            <TabsTrigger value="month">Month View</TabsTrigger>
          </TabsList>

          <TabsContent value="week" className="space-y-6">
            {/* Week Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => {
                  const prev = new Date(currentWeek);
                  prev.setDate(prev.getDate() - 7);
                  setCurrentWeek(prev);
                }}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-medium min-w-[200px] text-center">{formatWeekRange()}</span>
                <Button variant="outline" size="icon" onClick={() => {
                  const next = new Date(currentWeek);
                  next.setDate(next.getDate() + 7);
                  setCurrentWeek(next);
                }}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <Button variant="outline" onClick={() => setCurrentWeek(new Date())}>Today</Button>
            </div>

            {/* Weekly Schedule Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border overflow-hidden shadow-card"
            >
              <div className="grid grid-cols-6 border-b border-border">
                <div className="p-4 bg-muted/50" />
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className={cn(
                      "p-4 text-center border-l border-border",
                      day === 'Tuesday' && "bg-primary/5"
                    )}
                  >
                    <p className="font-semibold">{day}</p>
                    <p className="text-sm text-muted-foreground">
                      {weeklySchedule[day as keyof typeof weeklySchedule]?.length || 0} classes
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-6">
                <div className="border-r border-border">
                  {timeSlots.map((time) => (
                    <div key={time} className="h-16 p-2 border-b border-border text-xs text-muted-foreground">
                      {time}
                    </div>
                  ))}
                </div>
                {weekDays.map((day) => (
                  <div key={day} className="border-r border-border relative">
                    {timeSlots.map((time) => (
                      <div key={time} className="h-16 border-b border-border" />
                    ))}
                    {/* Classes overlay */}
                    <div className="absolute inset-0 p-1">
                      {weeklySchedule[day as keyof typeof weeklySchedule]?.map((cls) => {
                        const startHour = parseInt(cls.time.split(':')[0]);
                        const isPM = cls.time.includes('PM') && startHour !== 12;
                        const top = ((isPM ? startHour + 12 : startHour) - 8) * 64;
                        return (
                          <div
                            key={cls.id}
                            className={cn(
                              "absolute left-1 right-1 rounded-lg p-2 text-white text-xs",
                              cls.color
                            )}
                            style={{ top: `${top}px`, height: '96px' }}
                          >
                            <p className="font-semibold truncate">{cls.name}</p>
                            <p className="opacity-80 truncate">{cls.grade}</p>
                            <p className="opacity-80 truncate">{cls.room}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="day" className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              {weekDays.map((day) => (
                <Button
                  key={day}
                  variant={selectedDay === day ? 'default' : 'outline'}
                  onClick={() => setSelectedDay(day)}
                  className={selectedDay === day ? 'gradient-primary text-white' : ''}
                >
                  {day}
                </Button>
              ))}
            </div>

            <div className="space-y-4">
              {weeklySchedule[selectedDay as keyof typeof weeklySchedule]?.map((cls, index) => (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-card rounded-xl border border-border p-5 shadow-card flex items-center gap-4"
                >
                  <div className={cn("w-2 h-16 rounded-full", cls.color)} />
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{cls.name}</h4>
                    <p className="text-muted-foreground">Grade {cls.grade}</p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p className="flex items-center gap-1 justify-end">
                      <Clock className="w-4 h-4" />
                      {cls.time}
                    </p>
                    <p className="flex items-center gap-1 justify-end mt-1">
                      <MapPin className="w-4 h-4" />
                      {cls.room}
                    </p>
                  </div>
                  <Button variant="outline">View Details</Button>
                </motion.div>
              )) || (
                <p className="text-center py-8 text-muted-foreground">No classes on {selectedDay}</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="month">
            <div className="text-center py-12 text-muted-foreground">
              Monthly calendar view coming soon
            </div>
          </TabsContent>
        </Tabs>

        {/* Upcoming Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border p-6 shadow-card"
        >
          <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
              >
                <Badge
                  variant={
                    event.type === 'meeting' ? 'default' :
                    event.type === 'exam' ? 'destructive' : 'secondary'
                  }
                  className="mb-2"
                >
                  {event.type}
                </Badge>
                <h4 className="font-medium">{event.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {event.date} • {event.time}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
