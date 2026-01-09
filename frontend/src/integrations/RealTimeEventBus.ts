/**
 * Real-Time Event Bus Integration
 * Connects all real-time components
 */

import { EventEmitter } from 'events';
import { socketManager } from '@/lib/socket';
import { apiService } from '@/lib/api/apiService';
import { GlobalEventSystem } from '@/core/EventSystem';
import { WorkflowEngine } from '@/core/WorkflowEngine';
import { enhancedAIService } from '@/lib/api/services/ai.service.enhanced';

export interface RealTimeEvent {
  id: string;
  type: string;
  channel: string;
  data: any;
  timestamp: number;
  metadata: {
    schoolId?: string;
    userId?: string;
    version?: string;
    [key: string]: any;
  };
}

export interface Channel {
  name: string;
  events: string[];
  subscribers: string[];
}

export interface TimetableUpdate {
  schoolId: string;
  updatedBy: string;
  version: string;
  type: 'minor_change' | 'major_change';
  requiresApproval?: boolean;
  changes: any;
}

export class RealTimeEventBus extends EventEmitter {
  private static instance: RealTimeEventBus;
  private channels: Map<string, Channel> = new Map();
  private eventSystem: GlobalEventSystem;
  private workflowEngine: WorkflowEngine;
  private initialized: boolean = false;

  private constructor() {
    super();
    this.eventSystem = GlobalEventSystem.getInstance();
    this.workflowEngine = WorkflowEngine.getInstance();
  }

  static getInstance(): RealTimeEventBus {
    if (!RealTimeEventBus.instance) {
      RealTimeEventBus.instance = new RealTimeEventBus();
    }
    return RealTimeEventBus.instance;
  }

  /**
   * Initialize event bus with all channels
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('📡 Initializing Real-Time Event Bus...');

    // Setup channels for all components
    this.setupComponentChannels();

    // Connect WebSocket
    if (!socketManager.isConnected()) {
      socketManager.connect();
    }

    // Setup message routing
    this.startMessageRouter();

    // Start health monitoring
    this.startHealthMonitoring();

    this.initialized = true;
    console.log('✅ Real-Time Event Bus Initialized');
  }

  private setupComponentChannels(): void {
    // Authentication Channel
    this.createChannel('auth', {
      events: ['login', 'logout', 'session_expired', 'password_changed'],
      subscribers: ['analytics', 'security', 'notifications'],
    });

    // Timetable Channel
    this.createChannel('timetable', {
      events: ['created', 'updated', 'conflict', 'optimized', 'approved'],
      subscribers: ['teachers', 'students', 'parents', 'ai_timetable'],
    });

    // Attendance Channel
    this.createChannel('attendance', {
      events: ['marked', 'updated', 'irregularity', 'pattern_detected'],
      subscribers: ['teachers', 'parents', 'ai_attendance', 'analytics'],
    });

    // Performance Channel
    this.createChannel('performance', {
      events: ['grade_added', 'analysis_complete', 'intervention_suggested', 'risk_updated'],
      subscribers: ['teachers', 'parents', 'ai_performance', 'workflows'],
    });

    // Communication Channel
    this.createChannel('communication', {
      events: ['message_sent', 'announcement', 'meeting_scheduled', 'notification'],
      subscribers: ['all_users', 'notifications', 'analytics'],
    });

    // AI Service Channel
    this.createChannel('ai_services', {
      events: ['prediction_ready', 'optimization_complete', 'error', 'model_updated'],
      subscribers: ['ai_orchestrator', 'monitoring', 'fallback_services'],
    });

    // System Channel
    this.createChannel('system', {
      events: ['health_check', 'error', 'maintenance', 'update'],
      subscribers: ['monitoring', 'admin', 'logging'],
    });

    // Student Channel
    this.createChannel('student', {
      events: ['enrolled', 'updated', 'transferred', 'graduated'],
      subscribers: ['parents', 'teachers', 'admin', 'workflows'],
    });

    // Teacher Channel
    this.createChannel('teacher', {
      events: ['assigned', 'schedule_updated', 'performance_review'],
      subscribers: ['teachers', 'admin', 'timetable'],
    });
  }

  private createChannel(name: string, config: Omit<Channel, 'name'>): void {
    this.channels.set(name, {
      name,
      ...config,
    });
  }

  /**
   * Publish event to appropriate channels
   */
  async publish(event: RealTimeEvent): Promise<void> {
    // 1. Validate event
    this.validateEvent(event);

    // 2. Route to appropriate channels
    const channels = this.routeEvent(event);

    // 3. Process through pipeline
    for (const channel of channels) {
      // Apply channel-specific transformations
      const processedEvent = await this.processForChannel(event, channel);

      // Send to local subscribers
      await this.sendToSubscribers(channel, processedEvent);

      // Broadcast via WebSocket
      await this.broadcastViaWebSocket(channel, processedEvent);

      // Publish to event system
      await this.eventSystem.emit(processedEvent);

      // Trigger side effects
      await this.triggerSideEffects(channel, processedEvent);
    }
  }

  /**
   * Handle timetable update with complete workflow
   */
  async handleTimetableUpdate(update: TimetableUpdate): Promise<void> {
    const event: RealTimeEvent = {
      id: this.generateId(),
      type: 'timetable_updated',
      channel: 'timetable',
      data: update,
      timestamp: Date.now(),
      metadata: {
        schoolId: update.schoolId,
        updatedBy: update.updatedBy,
        version: update.version,
      },
    };

    await this.publish(event);

    // Additional processing for major changes
    if (update.type === 'major_change') {
      // Notify all affected users
      await this.notifyAffectedUsers(update);

      // Update AI models
      try {
        await enhancedAIService.optimizeTimetable(
          update.changes,
          {
            optimization_goal: 'balanced_workload',
            include_visualization: true,
            school_id: update.schoolId,
          }
        );
      } catch (error) {
        console.error('AI timetable update failed:', error);
      }

      // Trigger workflow for approval if needed
      if (update.requiresApproval) {
        await this.workflowEngine.executeWorkflow('timetable_approval', update);
      }
    }
  }

  private validateEvent(event: RealTimeEvent): void {
    if (!event.id || !event.type || !event.channel) {
      throw new Error('Invalid event structure');
    }
  }

  private routeEvent(event: RealTimeEvent): Channel[] {
    const channels: Channel[] = [];

    // Direct channel match
    const channel = this.channels.get(event.channel);
    if (channel) {
      channels.push(channel);
    }

    // Type-based routing
    if (event.type.includes('timetable')) {
      const timetableChannel = this.channels.get('timetable');
      if (timetableChannel && !channels.includes(timetableChannel)) {
        channels.push(timetableChannel);
      }
    }

    // Always include system channel for system events
    if (event.channel === 'system' || event.type.includes('error')) {
      const systemChannel = this.channels.get('system');
      if (systemChannel && !channels.includes(systemChannel)) {
        channels.push(systemChannel);
      }
    }

    return channels;
  }

  private async processForChannel(event: RealTimeEvent, channel: Channel): Promise<RealTimeEvent> {
    // Apply channel-specific transformations
    return {
      ...event,
      metadata: {
        ...event.metadata,
        channel: channel.name,
        processed: true,
      },
    };
  }

  private async sendToSubscribers(channel: Channel, event: RealTimeEvent): Promise<void> {
    // Send to local subscribers through event system
    await this.eventSystem.emit({
      type: event.type,
      channel: channel.name,
      data: event.data,
      timestamp: event.timestamp,
      metadata: event.metadata,
    });
  }

  private async broadcastViaWebSocket(channel: Channel, event: RealTimeEvent): Promise<void> {
    if (socketManager.isConnected()) {
      socketManager.emit(`channel.${channel.name}`, event);
    }
  }

  private shouldBroadcastToRedis(event: RealTimeEvent): boolean {
    // Broadcast important events to Redis for horizontal scaling
    return event.metadata.priority === 'high' || event.type.includes('system');
  }

  private async triggerSideEffects(channel: Channel, event: RealTimeEvent): Promise<void> {
    // Trigger side effects based on event type
    if (event.type === 'timetable_updated') {
      // Update cache
      // Invalidate related data
    } else if (event.type === 'performance_update') {
      // Update analytics
      // Trigger notifications
    }
  }

  private async notifyAffectedUsers(update: TimetableUpdate): Promise<void> {
    try {
      // Get affected users
      const affectedUsers = await apiService.post('/timetable/affected-users', {
        schoolId: update.schoolId,
        changes: update.changes,
      });

      // Send notifications
      for (const user of affectedUsers) {
        await apiService.post('/notifications', {
          type: 'timetable_update',
          recipient: user.id,
          title: 'Timetable Updated',
          message: 'Your timetable has been updated',
          data: update,
        });
      }
    } catch (error) {
      console.error('Failed to notify affected users:', error);
    }
  }

  private startMessageRouter(): void {
    // Listen to WebSocket events
    socketManager.on('channel.*', (data: any) => {
      this.handleIncomingEvent(data);
    });
  }

  private handleIncomingEvent(data: any): void {
    // Process incoming events
    this.emit('event_received', data);
  }

  private startHealthMonitoring(): void {
    setInterval(() => {
      const health = {
        channels: this.channels.size,
        websocket: socketManager.isConnected(),
        timestamp: Date.now(),
      };
      this.emit('health_check', health);
    }, 30000);
  }

  private generateId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getChannel(name: string): Channel | undefined {
    return this.channels.get(name);
  }

  getAllChannels(): Map<string, Channel> {
    return new Map(this.channels);
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export default RealTimeEventBus.getInstance();
