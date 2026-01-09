/**
 * Unified Event System
 * Single event bus that connects all components
 */

import { EventEmitter } from 'events';
import { enhancedAIService } from '@/lib/api/services/ai.service.enhanced';
import { apiService } from '@/lib/api/apiService';

export interface Event {
  type: string;
  channel: string;
  data: any;
  timestamp: number;
  metadata: {
    userId?: string;
    source?: string;
    classification?: EventClassification;
    priority?: 'low' | 'medium' | 'high';
  };
}

export interface EventSubscriber {
  id: string;
  callback: (event: Event) => void | Promise<void>;
  filter?: (event: Event) => boolean;
}

export interface EventPattern {
  type?: string;
  channel?: string;
  metadata?: Partial<Event['metadata']>;
  data?: Partial<any>;
}

export interface EventContext {
  userId?: string;
  sessionId?: string;
  timestamp: number;
  recentEvents: Event[];
}

export interface EventPrediction {
  eventType: string;
  probability: number;
  estimatedTime: number;
  context: Record<string, any>;
}

export interface EventClassification {
  category: string;
  severity: 'low' | 'medium' | 'high';
  requiresAction: boolean;
  suggestedActions?: string[];
}

export class GlobalEventSystem extends EventEmitter {
  private static instance: GlobalEventSystem;
  private channels: Map<string, Set<EventSubscriber>> = new Map();
  private eventHistory: Event[] = [];
  private maxHistorySize: number = 1000;
  private processingQueue: Event[] = [];
  private isProcessing: boolean = false;

  private constructor() {
    super();
    this.setupCoreEventHandlers();
    this.startEventProcessing();
  }

  static getInstance(): GlobalEventSystem {
    if (!GlobalEventSystem.instance) {
      GlobalEventSystem.instance = new GlobalEventSystem();
    }
    return GlobalEventSystem.instance;
  }

  /**
   * Emit an event with AI-powered classification and routing
   */
  async emit(event: Event): Promise<void> {
    // Ensure required fields
    event.timestamp = event.timestamp || Date.now();
    event.metadata = event.metadata || {};

    // Classify event using AI
    try {
      const classification = await this.classifyEvent(event);
      event.metadata.classification = classification;
    } catch (error) {
      console.warn('Event classification failed:', error);
    }

    // Store in history
    this.eventHistory.push(event);
    this.trimEventHistory();

    // Add to processing queue
    this.processingQueue.push(event);

    // Process queue
    this.processEventQueue();
  }

  /**
   * Subscribe to events on a channel
   */
  subscribe(channel: string, subscriber: EventSubscriber): () => void {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }

    const subscribers = this.channels.get(channel)!;
    subscribers.add(subscriber);

    return () => {
      this.unsubscribe(channel, subscriber);
    };
  }

  unsubscribe(channel: string, subscriber: EventSubscriber): void {
    const subscribers = this.channels.get(channel);
    if (subscribers) {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        this.channels.delete(channel);
      }
    }
  }

  /**
   * Match events against a pattern
   */
  async matchPattern(pattern: EventPattern): Promise<Event[]> {
    return this.eventHistory.filter((event) => this.doesEventMatchPattern(event, pattern));
  }

  /**
   * Predict next events based on context
   */
  async predictNextEvents(context: EventContext): Promise<EventPrediction[]> {
    try {
      const prompt = `
        Predict next events based on context:
        User: ${context.userId}
        Recent events: ${JSON.stringify(context.recentEvents.slice(-10))}
        Timestamp: ${context.timestamp}
        
        Consider:
        1. User behavior patterns
        2. System workflows
        3. Temporal patterns
        4. Event sequences
        
        Provide predictions with probabilities.
      `;

      const response = await enhancedAIService.processNLQ(prompt, {
        type: 'event_prediction',
        context,
      });

      return Array.isArray(response) ? response : [response];
    } catch (error) {
      console.error('Event prediction failed:', error);
      return [];
    }
  }

  private async classifyEvent(event: Event): Promise<EventClassification> {
    try {
      const prompt = `
        Classify this event:
        Type: ${event.type}
        Channel: ${event.channel}
        Data: ${JSON.stringify(event.data)}
        
        Provide:
        1. Category
        2. Severity (low/medium/high)
        3. Whether action is required
        4. Suggested actions
      `;

      const response = await enhancedAIService.processNLQ(prompt, {
        type: 'event_classification',
      });

      return {
        category: response.category || 'general',
        severity: response.severity || 'low',
        requiresAction: response.requiresAction || false,
        suggestedActions: response.suggestedActions || [],
      };
    } catch (error) {
      // Default classification
      return {
        category: 'general',
        severity: 'low',
        requiresAction: false,
      };
    }
  }

  private async processEventQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) return;

    this.isProcessing = true;

    while (this.processingQueue.length > 0) {
      const event = this.processingQueue.shift()!;
      await this.processEvent(event);
    }

    this.isProcessing = false;
  }

  private async processEvent(event: Event): Promise<void> {
    // Determine channels to route to
    const channels = this.determineChannels(event);

    // Route to appropriate channels
    for (const channel of channels) {
      const subscribers = this.channels.get(channel) || new Set();

      // Process asynchronously for each subscriber
      subscribers.forEach((subscriber) => {
        this.processEventForSubscriber(subscriber, event);
      });
    }

    // Trigger side effects
    await this.handleEventSideEffects(event);

    // Emit to internal event system
    this.emit('event_processed', event);
  }

  private determineChannels(event: Event): string[] {
    const channels: string[] = [];

    // Direct channel match
    if (this.channels.has(event.channel)) {
      channels.push(event.channel);
    }

    // Pattern-based channels
    this.channels.forEach((subscribers, channel) => {
      if (this.isChannelMatch(channel, event)) {
        channels.push(channel);
      }
    });

    // Type-based channels
    const typeChannel = `type.${event.type}`;
    if (this.channels.has(typeChannel)) {
      channels.push(typeChannel);
    }

    return [...new Set(channels)]; // Remove duplicates
  }

  private isChannelMatch(channel: string, event: Event): boolean {
    // Support wildcard patterns like "notification.*" or "*.created"
    if (channel.includes('*')) {
      const pattern = channel.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(event.channel) || regex.test(event.type);
    }
    return false;
  }

  private async processEventForSubscriber(subscriber: EventSubscriber, event: Event): Promise<void> {
    try {
      // Apply filter if present
      if (subscriber.filter && !subscriber.filter(event)) {
        return;
      }

      // Call subscriber callback
      await subscriber.callback(event);
    } catch (error) {
      console.error(`Error processing event for subscriber ${subscriber.id}:`, error);
      this.emit('subscriber_error', { subscriber, event, error });
    }
  }

  private async handleEventSideEffects(event: Event): Promise<void> {
    // AI-powered side effect detection
    try {
      const prompt = `
        Detect side effects for event:
        Type: ${event.type}
        Channel: ${event.channel}
        Data: ${JSON.stringify(event.data)}
        Classification: ${JSON.stringify(event.metadata.classification)}
        
        Identify:
        1. Notifications to send
        2. Data sync operations
        3. Workflow triggers
        4. Cache invalidations
      `;

      const sideEffects = await enhancedAIService.processNLQ(prompt, {
        type: 'side_effect_detection',
      });

      const effects = Array.isArray(sideEffects) ? sideEffects : [sideEffects];

      for (const effect of effects) {
        if (effect.type === 'notification') {
          await this.triggerNotification(effect);
        } else if (effect.type === 'data_sync') {
          await this.triggerDataSync(effect);
        } else if (effect.type === 'workflow') {
          await this.triggerWorkflow(effect);
        } else if (effect.type === 'cache_invalidation') {
          await this.triggerCacheInvalidation(effect);
        }
      }
    } catch (error) {
      console.error('Side effect detection failed:', error);
    }
  }

  private async triggerNotification(effect: any): Promise<void> {
    try {
      await apiService.post('/notifications', {
        userId: effect.userId,
        type: effect.notificationType,
        title: effect.title,
        message: effect.message,
        priority: effect.priority || 'medium',
      });
    } catch (error) {
      console.error('Failed to trigger notification:', error);
    }
  }

  private async triggerDataSync(effect: any): Promise<void> {
    const { DataSyncManager } = await import('./DataSyncManager');
    const syncManager = DataSyncManager.getInstance();

    await syncManager.syncData(effect.dataType, effect.data, {
      conflictResolution: effect.conflictResolution || 'ai',
    });
  }

  private async triggerWorkflow(effect: any): Promise<void> {
    const { WorkflowEngine } = await import('./WorkflowEngine');
    const workflowEngine = WorkflowEngine.getInstance();

    await workflowEngine.executeWorkflow(effect.workflowName, effect.input);
  }

  private async triggerCacheInvalidation(effect: any): Promise<void> {
    // Invalidate cache
    if (effect.keys) {
      effect.keys.forEach((key: string) => {
        // Clear cache for key
        // Implementation depends on cache system
      });
    }
  }

  private doesEventMatchPattern(event: Event, pattern: EventPattern): boolean {
    if (pattern.type && event.type !== pattern.type) return false;
    if (pattern.channel && event.channel !== pattern.channel) return false;
    if (pattern.metadata) {
      for (const [key, value] of Object.entries(pattern.metadata)) {
        if (event.metadata[key as keyof typeof event.metadata] !== value) return false;
      }
    }
    if (pattern.data) {
      // Simple deep equality check
      return JSON.stringify(event.data) === JSON.stringify(pattern.data);
    }
    return true;
  }

  private setupCoreEventHandlers(): void {
    // Core event handlers
    this.on('error', (error) => {
      console.error('Event system error:', error);
    });
  }

  private startEventProcessing(): void {
    // Process events periodically
    setInterval(() => {
      this.processEventQueue();
    }, 100);
  }

  private trimEventHistory(): void {
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  getEventHistory(): Event[] {
    return [...this.eventHistory];
  }

  getChannelSubscribers(channel: string): number {
    return this.channels.get(channel)?.size || 0;
  }
}

export default GlobalEventSystem.getInstance();
