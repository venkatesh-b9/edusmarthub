import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Edit,
  Trash2,
  Plus,
  AlertCircle,
  Clock,
  User,
  Building2,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NUMBERS = [1, 2, 3, 4, 5, 6];

interface TimetableGridViewProps {
  timetable: any;
  sectionId: string;
  onUpdate: () => void;
  conflicts: any[];
}

export function TimetableGridView({ timetable, sectionId, onUpdate, conflicts }: TimetableGridViewProps) {
  const [periods, setPeriods] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (timetable) {
      loadPeriods();
      loadResources();
    }
  }, [timetable]);

  const loadPeriods = async () => {
    if (!timetable?.id) return;
    
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const loadResources = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Load subjects, teachers, rooms
      // These would be actual API calls
      setSubjects([
        { id: '1', name: 'Mathematics', code: 'MATH' },
        { id: '2', name: 'Science', code: 'SCI' },
        { id: '3', name: 'English', code: 'ENG' },
      ]);
      
      setTeachers([
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
      ]);
      
      setRooms([
        { id: '1', roomNumber: '101', building: 'Main', capacity: 30 },
        { id: '2', roomNumber: '102', building: 'Main', capacity: 30 },
      ]);
    } catch (error) {
      console.error('Error loading resources:', error);
    }
  };

  const getPeriod = (day: number, periodNum: number) => {
    return periods.find(
      (p) => p.day_of_week === day && p.period_number === periodNum
    );
  };

  const getConflictForPeriod = (periodId: string) => {
    return conflicts.find((c) => c.affected_period_id === periodId);
  };

  const handlePeriodClick = (period: any) => {
    setSelectedPeriod(period);
    setIsEditDialogOpen(true);
  };

  const handleAddPeriod = (day: number, periodNum: number) => {
    setSelectedPeriod({
      day_of_week: day,
      period_number: periodNum,
      timetable_id: timetable?.id,
    });
    setIsEditDialogOpen(true);
  };

  const handleSavePeriod = async (periodData: any) => {
    try {
      const token = localStorage.getItem('token');
      
      if (selectedPeriod?.id) {
        // Update existing
        await axios.put(
          `${API_BASE_URL}/timetable/periods/${selectedPeriod.id}`,
          periodData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        // Create new
        await axios.post(
          `${API_BASE_URL}/timetable/periods`,
          {
            ...periodData,
            timetable_id: timetable.id,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
      
      setIsEditDialogOpen(false);
      onUpdate();
    } catch (error: any) {
      console.error('Error saving period:', error);
      alert(error.response?.data?.error || 'Failed to save period');
    }
  };

  const handleDeletePeriod = async (periodId: string) => {
    if (!confirm('Are you sure you want to delete this period?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/timetable/periods/${periodId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      onUpdate();
    } catch (error) {
      console.error('Error deleting period:', error);
    }
  };

  // Get max periods per day
  const maxPeriods = Math.max(
    ...DAY_NUMBERS.map((day) =>
      periods.filter((p) => p.day_of_week === day).length
    ),
    8
  );

  if (loading) {
    return <div className="text-center py-8">Loading timetable...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 bg-muted font-semibold sticky left-0 z-10 min-w-[120px]">
                  Period
                </th>
                {DAYS.map((day, idx) => (
                  <th key={day} className="border p-2 bg-muted font-semibold min-w-[200px]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: maxPeriods }, (_, i) => i + 1).map((periodNum) => (
                <tr key={periodNum}>
                  <td className="border p-2 bg-muted font-medium text-center sticky left-0 z-10">
                    Period {periodNum}
                  </td>
                  {DAY_NUMBERS.map((day) => {
                    const period = getPeriod(day, periodNum);
                    const conflict = period ? getConflictForPeriod(period.id) : null;
                    
                    return (
                      <td
                        key={day}
                        className={cn(
                          'border p-2 min-h-[80px] cursor-pointer hover:bg-muted/50 transition-colors',
                          conflict && 'bg-destructive/10 border-destructive/50'
                        )}
                        onClick={() =>
                          period
                            ? handlePeriodClick(period)
                            : handleAddPeriod(day, periodNum)
                        }
                      >
                        {period ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs">
                                {subjects.find((s) => s.id === period.subject_id)?.name || 'Subject'}
                              </Badge>
                              {conflict && (
                                <AlertCircle className="h-4 w-4 text-destructive" />
                              )}
                            </div>
                            {period.teacher_id && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                {teachers.find((t) => t.id === period.teacher_id)?.name || 'Teacher'}
                              </div>
                            )}
                            {period.room_id && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Building2 className="h-3 w-3" />
                                {rooms.find((r) => r.id === period.room_id)?.room_number || 'Room'}
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {period.start_time?.substring(0, 5)} - {period.end_time?.substring(0, 5)}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <Plus className="h-4 w-4" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Period Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedPeriod?.id ? 'Edit Period' : 'Add Period'}
            </DialogTitle>
          </DialogHeader>
          <PeriodForm
            period={selectedPeriod}
            subjects={subjects}
            teachers={teachers}
            rooms={rooms}
            onSave={handleSavePeriod}
            onDelete={selectedPeriod?.id ? () => handleDeletePeriod(selectedPeriod.id) : undefined}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PeriodForm({
  period,
  subjects,
  teachers,
  rooms,
  onSave,
  onDelete,
  onCancel,
}: {
  period: any;
  subjects: any[];
  teachers: any[];
  rooms: any[];
  onSave: (data: any) => void;
  onDelete?: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    subject_id: period?.subject_id || '',
    teacher_id: period?.teacher_id || '',
    room_id: period?.room_id || '',
    start_time: period?.start_time?.substring(0, 5) || '08:00',
    end_time: period?.end_time?.substring(0, 5) || '08:45',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      start_time: `${formData.start_time}:00`,
      end_time: `${formData.end_time}:00`,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Subject</label>
        <Select
          value={formData.subject_id}
          onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                {subject.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Teacher</label>
        <Select
          value={formData.teacher_id}
          onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select teacher" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No teacher</SelectItem>
            {teachers.map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.id}>
                {teacher.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Room</label>
        <Select
          value={formData.room_id}
          onValueChange={(value) => setFormData({ ...formData, room_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select room" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No room</SelectItem>
            {rooms.map((room) => (
              <SelectItem key={room.id} value={room.id}>
                {room.roomNumber} ({room.building})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Start Time</label>
          <Input
            type="time"
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">End Time</label>
          <Input
            type="time"
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-between">
        <div>
          {onDelete && (
            <Button type="button" variant="destructive" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </div>
    </form>
  );
}
