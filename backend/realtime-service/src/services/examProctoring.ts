import { Server as SocketIOServer, Socket } from 'socket.io';
import { ProctoringAlert, ProctoringAlertType, Message, MessageType } from '../types';
import logger from '../utils/logger';
import { MessagePersistence } from '../utils/messagePersistence';
import { v4 as uuidv4 } from 'uuid';

export class ExamProctoringService {
  private io: SocketIOServer;
  private messagePersistence: MessagePersistence;
  private activeExams: Map<string, Set<string>> = new Map(); // examId -> Set of studentIds
  private proctoringAlerts: Map<string, ProctoringAlert[]> = new Map(); // examId -> alerts

  constructor(io: SocketIOServer) {
    this.io = io;
    this.messagePersistence = new MessagePersistence();
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      // Start exam proctoring
      socket.on('start_exam_proctoring', (data: { examId: string; studentId: string }) => {
        this.startExamProctoring(socket, data);
      });

      // End exam proctoring
      socket.on('end_exam_proctoring', (data: { examId: string; studentId: string }) => {
        this.endExamProctoring(socket, data);
      });

      // Report proctoring alert
      socket.on('proctoring_alert', (data: {
        examId: string;
        studentId: string;
        type: ProctoringAlertType;
        severity: 'low' | 'medium' | 'high';
        description: string;
        metadata?: any;
      }) => {
        this.handleProctoringAlert(socket, data);
      });

      // Get proctoring alerts
      socket.on('get_proctoring_alerts', (data: { examId: string }) => {
        this.getProctoringAlerts(socket, data);
      });

      // Acknowledge alert
      socket.on('acknowledge_alert', (data: { examId: string; alertId: string }) => {
        this.acknowledgeAlert(socket, data);
      });
    });
  }

  private startExamProctoring(socket: Socket, data: { examId: string; studentId: string }) {
    const roomId = `exam:${data.examId}`;
    socket.join(roomId);

    // Track active exam
    if (!this.activeExams.has(data.examId)) {
      this.activeExams.set(data.examId, new Set());
    }
    this.activeExams.get(data.examId)!.add(data.studentId);

    // Notify proctor
    this.io.to(`exam:${data.examId}:proctor`).emit('student_started_exam', {
      examId: data.examId,
      studentId: data.studentId,
      studentName: socket.data.userName,
      timestamp: new Date(),
    });

    logger.info(`Exam proctoring started: ${data.examId} for student ${data.studentId}`);
  }

  private endExamProctoring(socket: Socket, data: { examId: string; studentId: string }) {
    const roomId = `exam:${data.examId}`;
    socket.leave(roomId);

    // Remove from active exams
    const activeStudents = this.activeExams.get(data.examId);
    if (activeStudents) {
      activeStudents.delete(data.studentId);
    }

    // Notify proctor
    this.io.to(`exam:${data.examId}:proctor`).emit('student_ended_exam', {
      examId: data.examId,
      studentId: data.studentId,
      timestamp: new Date(),
    });

    logger.info(`Exam proctoring ended: ${data.examId} for student ${data.studentId}`);
  }

  private handleProctoringAlert(socket: Socket, data: {
    examId: string;
    studentId: string;
    type: ProctoringAlertType;
    severity: 'low' | 'medium' | 'high';
    description: string;
    metadata?: any;
  }) {
    const alert: ProctoringAlert = {
      id: uuidv4(),
      examId: data.examId,
      studentId: data.studentId,
      type: data.type,
      severity: data.severity,
      description: data.description,
      timestamp: new Date(),
      metadata: data.metadata,
    };

    // Store alert
    if (!this.proctoringAlerts.has(data.examId)) {
      this.proctoringAlerts.set(data.examId, []);
    }
    this.proctoringAlerts.get(data.examId)!.push(alert);

    // Notify proctor immediately
    this.io.to(`exam:${data.examId}:proctor`).emit('proctoring_alert', alert);

    // Broadcast to exam room if high severity
    if (data.severity === 'high') {
      this.io.to(`exam:${data.examId}`).emit('proctoring_alert_broadcast', {
        examId: data.examId,
        type: data.type,
        message: data.description,
      });
    }

    // Persist alert
    const message: Message = {
      id: alert.id,
      roomId: `exam:${data.examId}`,
      senderId: 'system',
      senderName: 'Proctoring System',
      type: MessageType.PROCTORING_ALERT,
      content: {
        alert,
      },
      timestamp: new Date(),
    };

    this.messagePersistence.saveMessage(message);

    logger.warn(`Proctoring alert: ${data.type} for student ${data.studentId} in exam ${data.examId}`);
  }

  private getProctoringAlerts(socket: Socket, data: { examId: string }) {
    const alerts = this.proctoringAlerts.get(data.examId) || [];

    // Filter by severity if requested
    const severity = socket.handshake.query.severity as string | undefined;
    const filteredAlerts = severity
      ? alerts.filter((a) => a.severity === severity)
      : alerts;

    socket.emit('proctoring_alerts', {
      examId: data.examId,
      alerts: filteredAlerts,
      total: alerts.length,
    });
  }

  private acknowledgeAlert(socket: Socket, data: { examId: string; alertId: string }) {
    const alerts = this.proctoringAlerts.get(data.examId);
    if (!alerts) {
      socket.emit('error', { message: 'Exam not found' });
      return;
    }

    const alert = alerts.find((a) => a.id === data.alertId);
    if (alert) {
      // Mark as acknowledged (would add acknowledgedBy field in production)
      socket.emit('alert_acknowledged', {
        examId: data.examId,
        alertId: data.alertId,
        acknowledgedBy: socket.data.userId,
        timestamp: new Date(),
      });

      logger.info(`Alert acknowledged: ${data.alertId} by ${socket.data.userId}`);
    } else {
      socket.emit('error', { message: 'Alert not found' });
    }
  }

  public async reportAlert(alert: ProctoringAlert): Promise<void> {
    // Public method for external systems to report alerts
    this.handleProctoringAlert({ data: alert } as any, {
      examId: alert.examId,
      studentId: alert.studentId,
      type: alert.type,
      severity: alert.severity,
      description: alert.description,
      metadata: alert.metadata,
    });
  }
}
