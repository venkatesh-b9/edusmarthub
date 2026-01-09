import { Server as SocketIOServer, Socket } from 'socket.io';
import { Message, MessageType } from '../types';
import logger from '../utils/logger';
import { MessagePersistence } from '../utils/messagePersistence';

export class ClassroomMonitoringService {
  private io: SocketIOServer;
  private messagePersistence: MessagePersistence;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.messagePersistence = new MessagePersistence();
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      // Join classroom monitoring room
      socket.on('join_classroom_monitoring', async (data: { classroomId: string; userId: string }) => {
        await this.joinClassroomMonitoring(socket, data.classroomId, data.userId);
      });

      // Student activity tracking
      socket.on('student_activity', (data: { classroomId: string; studentId: string; activity: any }) => {
        this.handleStudentActivity(socket, data);
      });

      // Teacher monitoring actions
      socket.on('teacher_action', (data: { classroomId: string; action: string; metadata?: any }) => {
        this.handleTeacherAction(socket, data);
      });

      // Request classroom status
      socket.on('get_classroom_status', (data: { classroomId: string }) => {
        this.getClassroomStatus(socket, data.classroomId);
      });
    });
  }

  private async joinClassroomMonitoring(socket: Socket, classroomId: string, userId: string) {
    const roomId = `classroom:${classroomId}`;
    socket.join(roomId);

    // Get current classroom status
    const status = await this.getClassroomStatusData(classroomId);

    socket.emit('classroom_status', status);

    // Notify others
    socket.to(roomId).emit('monitor_joined', {
      userId,
      classroomId,
      timestamp: new Date(),
    });

    logger.info(`User ${userId} joined classroom monitoring: ${classroomId}`);
  }

  private handleStudentActivity(socket: Socket, data: { classroomId: string; studentId: string; activity: any }) {
    const roomId = `classroom:${data.classroomId}`;

    const activityMessage: Message = {
      id: `activity_${Date.now()}`,
      roomId,
      senderId: data.studentId,
      senderName: 'Student',
      type: MessageType.DASHBOARD_UPDATE,
      content: {
        type: 'student_activity',
        studentId: data.studentId,
        activity: data.activity,
      },
      timestamp: new Date(),
    };

    // Broadcast to monitoring dashboard
    this.io.to(roomId).emit('student_activity_update', activityMessage);

    // Persist activity
    this.messagePersistence.saveMessage(activityMessage);

    logger.debug(`Student activity: ${data.studentId} in ${data.classroomId}`);
  }

  private handleTeacherAction(socket: Socket, data: { classroomId: string; action: string; metadata?: any }) {
    const roomId = `classroom:${data.classroomId}`;

    const actionMessage: Message = {
      id: `action_${Date.now()}`,
      roomId,
      senderId: socket.data.userId,
      senderName: 'Teacher',
      type: MessageType.DASHBOARD_UPDATE,
      content: {
        type: 'teacher_action',
        action: data.action,
        metadata: data.metadata,
      },
      timestamp: new Date(),
    };

    // Broadcast to all participants
    this.io.to(roomId).emit('teacher_action_update', actionMessage);

    // Persist action
    this.messagePersistence.saveMessage(actionMessage);

    logger.info(`Teacher action: ${data.action} in ${data.classroomId}`);
  }

  private async getClassroomStatus(socket: Socket, classroomId: string) {
    const status = await this.getClassroomStatusData(classroomId);
    socket.emit('classroom_status', status);
  }

  private async getClassroomStatusData(classroomId: string) {
    const roomId = `classroom:${classroomId}`;
    const sockets = await this.io.in(roomId).fetchSockets();

    const students = sockets
      .filter((s) => s.data.role === 'student')
      .map((s) => ({
        id: s.data.userId,
        name: s.data.userName,
        connected: true,
        lastActivity: s.data.lastActivity || new Date(),
      }));

    const teachers = sockets
      .filter((s) => s.data.role === 'teacher')
      .map((s) => ({
        id: s.data.userId,
        name: s.data.userName,
      }));

    // Get recent activities from persistence
    const recentActivities = await this.messagePersistence.getRecentMessages(roomId, 50);

    return {
      classroomId,
      timestamp: new Date(),
      students: {
        total: students.length,
        active: students.filter((s) => s.connected).length,
        list: students,
      },
      teachers: {
        total: teachers.length,
        list: teachers,
      },
      recentActivities: recentActivities.slice(0, 20),
      statistics: {
        averageEngagement: this.calculateEngagement(students),
        participationRate: this.calculateParticipationRate(students),
      },
    };
  }

  private calculateEngagement(students: any[]): number {
    if (students.length === 0) return 0;

    const now = Date.now();
    const activeThreshold = 5 * 60 * 1000; // 5 minutes

    const activeStudents = students.filter((s) => {
      const lastActivity = new Date(s.lastActivity).getTime();
      return now - lastActivity < activeThreshold;
    }).length;

    return (activeStudents / students.length) * 100;
  }

  private calculateParticipationRate(students: any[]): number {
    // Simplified calculation
    return students.length > 0 ? 85 : 0; // Would be calculated from actual participation data
  }

  public async broadcastClassroomUpdate(classroomId: string, update: any) {
    const roomId = `classroom:${classroomId}`;
    this.io.to(roomId).emit('classroom_update', {
      classroomId,
      update,
      timestamp: new Date(),
    });
  }
}
