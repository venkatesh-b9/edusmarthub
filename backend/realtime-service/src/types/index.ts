export interface User {
  id: string;
  email: string;
  role: string;
  schoolId?: string;
  name: string;
}

export interface SocketConnection {
  socketId: string;
  userId: string;
  user: User;
  rooms: Set<string>;
  connectedAt: Date;
  lastActivity: Date;
  metadata?: Record<string, any>;
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  schoolId?: string;
  participants: Set<string>;
  createdBy: string;
  createdAt: Date;
  settings: RoomSettings;
  metadata?: Record<string, any>;
}

export enum RoomType {
  CLASSROOM = 'classroom',
  COLLABORATION = 'collaboration',
  CHAT = 'chat',
  POLLING = 'polling',
  EXAM = 'exam',
  EMERGENCY = 'emergency',
  BUS_TRACKING = 'bus_tracking',
}

export interface RoomSettings {
  maxParticipants?: number;
  allowScreenShare?: boolean;
  allowWhiteboard?: boolean;
  requireAuth?: boolean;
  isPrivate?: boolean;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  type: MessageType;
  content: any;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  NOTIFICATION = 'notification',
  POLL = 'poll',
  QUIZ = 'quiz',
  WHITEBOARD = 'whiteboard',
  SCREEN_SHARE = 'screen_share',
  LOCATION = 'location',
  PROCTORING_ALERT = 'proctoring_alert',
  EMERGENCY = 'emergency',
  DASHBOARD_UPDATE = 'dashboard_update',
}

export interface Poll {
  id: string;
  roomId: string;
  question: string;
  options: PollOption[];
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  results?: PollResults;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface PollResults {
  totalVotes: number;
  options: PollOption[];
  participants: string[];
}

export interface Quiz {
  id: string;
  roomId: string;
  title: string;
  questions: QuizQuestion[];
  createdBy: string;
  createdAt: Date;
  timeLimit?: number;
  isActive: boolean;
  submissions: QuizSubmission[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer: string | string[];
  points: number;
}

export interface QuizSubmission {
  studentId: string;
  answers: Record<string, any>;
  submittedAt: Date;
  score?: number;
}

export interface WhiteboardState {
  roomId: string;
  elements: WhiteboardElement[];
  version: number;
  lastModified: Date;
}

export interface WhiteboardElement {
  id: string;
  type: 'draw' | 'text' | 'shape' | 'image';
  data: any;
  userId: string;
  timestamp: Date;
}

export interface ScreenShare {
  id: string;
  roomId: string;
  sharerId: string;
  streamId: string;
  isActive: boolean;
  startedAt: Date;
}

export interface BusLocation {
  busId: string;
  routeId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: Date;
  accuracy?: number;
}

export interface ProctoringAlert {
  id: string;
  examId: string;
  studentId: string;
  type: ProctoringAlertType;
  severity: 'low' | 'medium' | 'high';
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export enum ProctoringAlertType {
  MULTIPLE_FACES = 'multiple_faces',
  NO_FACE = 'no_face',
  TAB_SWITCH = 'tab_switch',
  COPY_PASTE = 'copy_paste',
  VOICE_DETECTED = 'voice_detected',
  PHONE_DETECTED = 'phone_detected',
  UNUSUAL_BEHAVIOR = 'unusual_behavior',
}

export interface EmergencyBroadcast {
  id: string;
  schoolId: string;
  type: EmergencyType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  targetAudience: string[];
  broadcastedAt: Date;
  acknowledgedBy: string[];
}

export enum EmergencyType {
  FIRE = 'fire',
  EARTHQUAKE = 'earthquake',
  SECURITY = 'security',
  WEATHER = 'weather',
  MEDICAL = 'medical',
  OTHER = 'other',
}

export interface DashboardUpdate {
  id: string;
  schoolId: string;
  type: DashboardUpdateType;
  data: any;
  timestamp: Date;
}

export enum DashboardUpdateType {
  ATTENDANCE = 'attendance',
  GRADES = 'grades',
  ANALYTICS = 'analytics',
  NOTIFICATIONS = 'notifications',
  SYSTEM_STATUS = 'system_status',
}
