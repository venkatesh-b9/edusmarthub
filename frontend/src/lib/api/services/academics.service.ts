import apiClient from '../config';

export interface Grade {
  id: string;
  studentId: string;
  classId: string;
  subject: string;
  assessmentId: string;
  score: number;
  maxScore: number;
  percentage: number;
  grade: string;
  remarks?: string;
  gradedBy: string;
}

export interface Assessment {
  id: string;
  schoolId: string;
  classId: string;
  subject: string;
  title: string;
  type: 'exam' | 'quiz' | 'assignment' | 'project' | 'participation';
  maxScore: number;
  weight: number;
  dueDate: string;
}

export interface StudentProgress {
  overallAverage: number;
  subjectAverages: Record<string, number>;
  totalAssessments: number;
  completedAssessments: number;
}

export const academicsService = {
  async createAssessment(data: {
    schoolId: string;
    classId: string;
    subject: string;
    title: string;
    type: Assessment['type'];
    maxScore: number;
    weight: number;
    dueDate: string;
    rubric?: any;
  }): Promise<Assessment> {
    const response = await apiClient.post('/academics/assessments', data);
    return response.data.data;
  },

  async createGrade(data: {
    studentId: string;
    classId: string;
    subject: string;
    assessmentId: string;
    score: number;
    maxScore: number;
    remarks?: string;
  }): Promise<Grade> {
    const response = await apiClient.post('/academics/grades', data);
    return response.data.data;
  },

  async getGrades(
    studentId: string,
    classId?: string,
    subject?: string
  ): Promise<Grade[]> {
    const response = await apiClient.get(`/academics/grades/student/${studentId}`, {
      params: { classId, subject },
    });
    return response.data.data;
  },

  async getStudentProgress(
    studentId: string,
    classId: string
  ): Promise<StudentProgress> {
    const response = await apiClient.get(`/academics/progress/student/${studentId}`, {
      params: { classId },
    });
    return response.data.data;
  },
};
