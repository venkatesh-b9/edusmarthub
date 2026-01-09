import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Clock, BookOpen, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

interface TimetableTeacherViewProps {
  timetable: any;
  conflicts: any[];
}

export function TimetableTeacherView({ timetable, conflicts }: TimetableTeacherViewProps) {
  const [periods, setPeriods] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');

  useEffect(() => {
    if (timetable) {
      loadPeriods();
      loadTeachers();
    }
  }, [timetable]);

  const loadPeriods = async () => {
    if (!timetable?.id) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/timetable/timetables/${timetable.id}/periods`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setPeriods(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading periods:', error);
    }
  };

  const loadTeachers = async () => {
    // Load teachers from periods
    const teacherIds = [...new Set(periods.map((p) => p.teacher_id).filter(Boolean))];
    // In real app, fetch teacher details from API
    setTeachers(teacherIds.map((id) => ({ id, name: `Teacher ${id}` })));
  };

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const DAY_NUMBERS = [1, 2, 3, 4, 5, 6];

  const getTeacherPeriods = (teacherId: string) => {
    return periods.filter((p) => p.teacher_id === teacherId);
  };

  const getPeriodForDay = (teacherId: string, day: number, periodNum: number) => {
    return periods.find(
      (p) => p.teacher_id === teacherId && p.day_of_week === day && p.period_number === periodNum
    );
  };

  const getTeacherConflicts = (teacherId: string) => {
    return conflicts.filter((c) => c.affected_teacher_id === teacherId);
  };

  if (teachers.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No teachers assigned</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {teachers.map((teacher) => (
          <Badge
            key={teacher.id}
            variant={selectedTeacher === teacher.id ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedTeacher(selectedTeacher === teacher.id ? '' : teacher.id)}
          >
            {teacher.name}
          </Badge>
        ))}
      </div>

      <div className="space-y-6">
        {teachers
          .filter((t) => !selectedTeacher || t.id === selectedTeacher)
          .map((teacher) => {
            const teacherPeriods = getTeacherPeriods(teacher.id);
            const teacherConflicts = getTeacherConflicts(teacher.id);
            const maxPeriods = Math.max(
              ...DAY_NUMBERS.map((day) =>
                teacherPeriods.filter((p) => p.day_of_week === day).length
              ),
              1
            );

            return (
              <Card key={teacher.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {teacher.name}
                    </div>
                    {teacherConflicts.length > 0 && (
                      <Badge variant="destructive">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        {teacherConflicts.length} conflict{teacherConflicts.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className="border p-2 bg-muted">Period</th>
                          {DAYS.map((day) => (
                            <th key={day} className="border p-2 bg-muted min-w-[150px]">
                              {day}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: maxPeriods }, (_, i) => i + 1).map((periodNum) => (
                          <tr key={periodNum}>
                            <td className="border p-2 text-center font-medium">
                              {periodNum}
                            </td>
                            {DAY_NUMBERS.map((day) => {
                              const period = getPeriodForDay(teacher.id, day, periodNum);
                              return (
                                <td
                                  key={day}
                                  className={cn(
                                    'border p-2',
                                    period && 'bg-primary/10'
                                  )}
                                >
                                  {period ? (
                                    <div className="space-y-1">
                                      <Badge variant="outline" className="text-xs">
                                        {period.subject_id}
                                      </Badge>
                                      <div className="text-xs text-muted-foreground">
                                        {period.start_time?.substring(0, 5)} - {period.end_time?.substring(0, 5)}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">Free</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
