import axios from 'axios';

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:5000/api/v1/ai';

const aiClient = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 60000, // Longer timeout for AI operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token
aiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const aiService = {
  // Performance Prediction
  async predictPerformance(studentId: string, studentData: any): Promise<any> {
    const response = await aiClient.post('/performance/predict', {
      student_id: studentId,
      student_data: studentData,
    });
    return response.data.data;
  },

  // Early Warning
  async assessStudentRisk(studentData: any): Promise<any> {
    const response = await aiClient.post('/early-warning/assess', {
      student_data: studentData,
    });
    return response.data.data;
  },

  async detectAtRiskStudents(studentsData: any[]): Promise<any> {
    const response = await aiClient.post('/early-warning/detect-batch', {
      students_data: studentsData,
    });
    return response.data.data;
  },

  // Essay Grading
  async gradeEssay(essayText: string, rubric?: any, maxScore?: number): Promise<any> {
    const response = await aiClient.post('/essay-grading/grade', {
      essay_text: essayText,
      rubric,
      max_score: maxScore,
    });
    return response.data.data;
  },

  async checkPlagiarism(essayText: string, referenceTexts?: string[]): Promise<any> {
    const response = await aiClient.post('/essay-grading/plagiarism', {
      essay_text: essayText,
      reference_texts: referenceTexts,
    });
    return response.data.data;
  },

  // Sentiment Analysis
  async analyzeSentiment(text: string, method?: string): Promise<any> {
    const response = await aiClient.post('/sentiment/analyze', {
      text,
      method: method || 'ensemble',
    });
    return response.data.data;
  },

  // Learning Path
  async recommendLearningPath(studentProfile: any, availableResources: any[]): Promise<any> {
    const response = await aiClient.post('/learning-path/recommend', {
      student_profile: studentProfile,
      available_resources: availableResources,
    });
    return response.data.data;
  },

  // Anomaly Detection
  async detectAttendanceAnomalies(attendanceData: any[], schoolId: string): Promise<any> {
    const response = await aiClient.post('/anomaly/attendance', {
      attendance_data: attendanceData,
      school_id: schoolId,
    });
    return response.data.data;
  },

  // Chatbot
  async chat(userId: string, message: string, context?: any): Promise<any> {
    const response = await aiClient.post('/chatbot/chat', {
      user_id: userId,
      message,
      context,
    });
    return response.data.data;
  },
};
