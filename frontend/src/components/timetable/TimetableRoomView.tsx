import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Clock, Users, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

interface TimetableRoomViewProps {
  timetable: any;
  conflicts: any[];
}

export function TimetableRoomView({ timetable, conflicts }: TimetableRoomViewProps) {
  const [periods, setPeriods] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('');

  useEffect(() => {
    if (timetable) {
      loadPeriods();
      loadRooms();
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

  const loadRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/timetable/rooms`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setRooms(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const DAY_NUMBERS = [1, 2, 3, 4, 5, 6];

  const getRoomPeriods = (roomId: string) => {
    return periods.filter((p) => p.room_id === roomId);
  };

  const getPeriodForDay = (roomId: string, day: number, periodNum: number) => {
    return periods.find(
      (p) => p.room_id === roomId && p.day_of_week === day && p.period_number === periodNum
    );
  };

  const getRoomConflicts = (roomId: string) => {
    return conflicts.filter((c) => c.affected_room_id === roomId);
  };

  const calculateUtilization = (roomId: string) => {
    const roomPeriods = getRoomPeriods(roomId);
    const totalSlots = DAY_NUMBERS.length * 8; // Assuming 8 periods per day
    return (roomPeriods.length / totalSlots) * 100;
  };

  if (rooms.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No rooms available</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {rooms.map((room) => (
          <Badge
            key={room.id}
            variant={selectedRoom === room.id ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedRoom(selectedRoom === room.id ? '' : room.id)}
          >
            {room.room_number} ({Math.round(calculateUtilization(room.id))}%)
          </Badge>
        ))}
      </div>

      <div className="space-y-6">
        {rooms
          .filter((r) => !selectedRoom || r.id === selectedRoom)
          .map((room) => {
            const roomPeriods = getRoomPeriods(room.id);
            const roomConflicts = getRoomConflicts(room.id);
            const utilization = calculateUtilization(room.id);
            const maxPeriods = Math.max(
              ...DAY_NUMBERS.map((day) =>
                roomPeriods.filter((p) => p.day_of_week === day).length
              ),
              1
            );

            return (
              <Card key={room.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {room.room_number} {room.building && `(${room.building})`}
                    </div>
                    <div className="flex items-center gap-2">
                      {roomConflicts.length > 0 && (
                        <Badge variant="destructive">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          {roomConflicts.length}
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {Math.round(utilization)}% utilized
                      </Badge>
                    </div>
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
                              const period = getPeriodForDay(room.id, day, periodNum);
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
                                    <span className="text-muted-foreground text-xs">Vacant</span>
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
