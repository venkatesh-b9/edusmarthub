// User and Role Types
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  SCHOOL_ADMIN = 'school_admin',
  TEACHER = 'teacher',
  PARENT = 'parent',
  STUDENT = 'student',
}

export enum Permission {
  // User Management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  
  // School Management
  SCHOOL_CREATE = 'school:create',
  SCHOOL_READ = 'school:read',
  SCHOOL_UPDATE = 'school:update',
  SCHOOL_DELETE = 'school:delete',
  
  // Attendance
  ATTENDANCE_CREATE = 'attendance:create',
  ATTENDANCE_READ = 'attendance:read',
  ATTENDANCE_UPDATE = 'attendance:update',
  
  // Academics
  GRADE_CREATE = 'grade:create',
  GRADE_READ = 'grade:read',
  GRADE_UPDATE = 'grade:update',
  GRADE_DELETE = 'grade:delete',
  
  // Communication
  MESSAGE_SEND = 'message:send',
  MESSAGE_READ = 'message:read',
  ANNOUNCEMENT_CREATE = 'announcement:create',
  
  // Analytics
  ANALYTICS_READ = 'analytics:read',
  REPORT_GENERATE = 'report:generate',
  
  // Payment
  PAYMENT_READ = 'payment:read',
  PAYMENT_CREATE = 'payment:create',
  
  // File Management
  FILE_UPLOAD = 'file:upload',
  FILE_READ = 'file:read',
  FILE_DELETE = 'file:delete',
  
  // Timetable Management
  TIMETABLE_CREATE = 'timetable:create',
  TIMETABLE_READ = 'timetable:read',
  TIMETABLE_UPDATE = 'timetable:update',
  TIMETABLE_DELETE = 'timetable:delete',
  TIMETABLE_GENERATE = 'timetable:generate',
  TIMETABLE_EXPORT = 'timetable:export',
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  schoolId?: string;
  permissions: Permission[];
  isActive: boolean;
  isEmailVerified: boolean;
  mfaEnabled: boolean;
  mfaSecret?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface School {
  id: string;
  name: string;
  code: string;
  subdomain: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  email: string;
  logoUrl?: string;
  branding?: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
  };
  settings: {
    academicYear: string;
    terms: string[];
    timezone: string;
    locale: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Class {
  id: string;
  schoolId: string;
  name: string;
  section: string;
  grade: string;
  academicYear: string;
  teacherId: string;
  capacity: number;
  currentEnrollment: number;
  subjects: string[];
  schedule: Schedule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Schedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subject: string;
  room: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  classId: string;
  schoolId: string;
  date: Date;
  status: AttendanceStatus;
  method: AttendanceMethod;
  markedBy: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
  HALF_DAY = 'half_day',
}

export enum AttendanceMethod {
  MANUAL = 'manual',
  BIOMETRIC = 'biometric',
  RFID = 'rfid',
  FACIAL_RECOGNITION = 'facial_recognition',
}

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
  createdAt: Date;
  updatedAt: Date;
}

export interface Assessment {
  id: string;
  schoolId: string;
  classId: string;
  subject: string;
  title: string;
  type: AssessmentType;
  maxScore: number;
  weight: number;
  dueDate: Date;
  rubric?: Rubric;
  createdAt: Date;
  updatedAt: Date;
}

export enum AssessmentType {
  EXAM = 'exam',
  QUIZ = 'quiz',
  ASSIGNMENT = 'assignment',
  PROJECT = 'project',
  PARTICIPATION = 'participation',
}

export interface Rubric {
  criteria: RubricCriteria[];
  totalPoints: number;
}

export interface RubricCriteria {
  name: string;
  description: string;
  maxPoints: number;
  levels: RubricLevel[];
}

export interface RubricLevel {
  name: string;
  description: string;
  points: number;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  schoolId: string;
  subject?: string;
  content: string;
  type: MessageType;
  isRead: boolean;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export enum MessageType {
  DIRECT = 'direct',
  ANNOUNCEMENT = 'announcement',
  NOTIFICATION = 'notification',
}

export interface Payment {
  id: string;
  schoolId: string;
  studentId: string;
  parentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gateway: PaymentGateway;
  transactionId?: string;
  invoiceId: string;
  dueDate: Date;
  paidAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentGateway {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  RAZORPAY = 'razorpay',
}

export interface FileUpload {
  id: string;
  schoolId: string;
  uploadedBy: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  s3Key: string;
  bucket: string;
  version: number;
  isPublic: boolean;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: ValidationError[];
  pagination?: PaginationMeta;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  schoolId?: string;
  permissions: Permission[];
  iat?: number;
  exp?: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  schoolId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}
