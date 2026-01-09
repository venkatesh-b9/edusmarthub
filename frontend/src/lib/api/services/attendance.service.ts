import apiClient from '../config';

export interface Attendance {
  id: string;
  studentId: string;
  classId: string;
  schoolId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused' | 'half_day';
  method: 'manual' | 'biometric' | 'rfid' | 'facial_recognition';
  markedBy: string;
  notes?: string;
}

export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
}

export interface MarkAttendanceData {
  studentId: string;
  classId: string;
  schoolId: string;
  date: string;
  status: Attendance['status'];
  method: Attendance['method'];
  notes?: string;
}

export interface BulkAttendanceRecord {
  studentId: string;
  status: Attendance['status'];
  notes?: string;
}

export const attendanceService = {
  async markAttendance(data: MarkAttendanceData): Promise<Attendance> {
    const response = await apiClient.post('/attendance', data);
    return response.data.data;
  },

  async bulkMarkAttendance(data: {
    records: BulkAttendanceRecord[];
    classId: string;
    schoolId: string;
    date: string;
    method: Attendance['method'];
  }): Promise<{ success: number; failed: number }> {
    const response = await apiClient.post('/attendance/bulk', data);
    return response.data.data;
  },

  async getAttendanceByStudent(
    studentId: string,
    startDate: string,
    endDate: string
  ): Promise<Attendance[]> {
    const response = await apiClient.get(`/attendance/student/${studentId}`, {
      params: { startDate, endDate },
    });
    return response.data.data;
  },

  async getAttendanceStats(
    studentId: string,
    startDate: string,
    endDate: string
  ): Promise<AttendanceStats> {
    const response = await apiClient.get(`/attendance/student/${studentId}/stats`, {
      params: { startDate, endDate },
    });
    return response.data.data;
  },
};
