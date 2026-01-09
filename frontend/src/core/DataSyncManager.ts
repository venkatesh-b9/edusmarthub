/**
 * Real-time Data Synchronization Engine
 * Handles data sync with conflict resolution and offline support
 */

import { EventEmitter } from 'events';
import { apiService } from '@/lib/api/apiService';
import { enhancedAIService } from '@/lib/api/services/ai.service.enhanced';
import { socketManager } from '@/lib/socket';

export type DataType = 'student' | 'teacher' | 'attendance' | 'grade' | 'timetable' | 'notification';

export interface SyncOptions {
  userId?: string;
  deviceId?: string;
  operation?: 'create' | 'update' | 'delete';
  priority?: 'low' | 'medium' | 'high';
  conflictResolution?: 'auto' | 'manual' | 'ai';
}

export interface SyncResult {
  status: 'success' | 'conflict' | 'error' | 'manual_resolution_required' | 'resolved';
  syncId?: string;
  conflict?: DataConflict;
  resolvedData?: any;
  method?: string;
  confidence?: number;
  error?: Error;
}

export interface DataConflict {
  current: any;
  incoming: any;
  context: Record<string, any>;
  timestamp: number;
}

export interface SyncQueue {
  items: SyncQueueItem[];
  processing: boolean;
}

export interface SyncQueueItem {
  id: string;
  data: any;
  timestamp: number;
  userId?: string;
  deviceId?: string;
  operation: string;
  retries: number;
}

export class DataSyncManager extends EventEmitter {
  private static instance: DataSyncManager;
  private syncQueues: Map<DataType, SyncQueue> = new Map();
  private conflictResolvers: Map<DataType, ConflictResolver> = new Map();
  private syncStrategies: Map<DataType, SyncStrategy> = new Map();
  private offlineStorage: Map<string, any> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = navigator.onLine;

  private constructor() {
    super();
    this.initializeSyncStrategies();
    this.setupConflictResolvers();
    this.initializeOfflineStorage();
    this.setupOnlineStatusListener();
    this.startSyncEngine();
  }

  static getInstance(): DataSyncManager {
    if (!DataSyncManager.instance) {
      DataSyncManager.instance = new DataSyncManager();
    }
    return DataSyncManager.instance;
  }

  /**
   * Sync data with automatic conflict resolution
   */
  async syncData(type: DataType, data: any, options?: SyncOptions): Promise<SyncResult> {
    const strategy = this.getSyncStrategy(type);
    const queue = this.getOrCreateQueue(type);

    // Add to sync queue
    const syncId = this.generateSyncId();
    const queueItem: SyncQueueItem = {
      id: syncId,
      data,
      timestamp: Date.now(),
      userId: options?.userId,
      deviceId: options?.deviceId,
      operation: options?.operation || 'update',
      retries: 0,
    };

    queue.items.push(queueItem);
    this.emit('sync_queued', { type, syncId, data });

    // If offline, store locally
    if (!this.isOnline) {
      this.storeOffline(type, syncId, data);
      return {
        status: 'success',
        syncId,
      };
    }

    // Apply sync strategy
    try {
      const result = await strategy.execute(data, options);

      if (result.status === 'conflict') {
        // Use AI-powered conflict resolution
        const resolution = await this.resolveConflict(type, result.conflict!, options);
        return resolution;
      }

      // Remove from queue on success
      queue.items = queue.items.filter((item) => item.id !== syncId);

      // Broadcast sync completion
      this.broadcastSyncComplete(type, syncId, result);
      this.emit('sync_complete', { type, syncId, result });

      return result;
    } catch (error) {
      // Retry logic
      if (queueItem.retries < 3) {
        queueItem.retries++;
        setTimeout(() => this.syncData(type, data, options), 1000 * queueItem.retries);
      }

      return {
        status: 'error',
        syncId,
        error: error as Error,
      };
    }
  }

  private async resolveConflict(
    type: DataType,
    conflict: DataConflict,
    options?: SyncOptions
  ): Promise<SyncResult> {
    const resolutionMethod = options?.conflictResolution || 'ai';

    if (resolutionMethod === 'auto') {
      // Try automatic resolution first
      const resolver = this.conflictResolvers.get(type);
      if (resolver) {
        const resolution = await resolver.resolve(conflict);
        if (resolution) return resolution;
      }
    }

    if (resolutionMethod === 'ai' || resolutionMethod === 'auto') {
      // Use AI for complex conflicts
      const aiResolution = await this.resolveWithAI(type, conflict);
      if (aiResolution) return aiResolution;
    }

    // Manual resolution required
    this.emit('conflict_requires_manual_resolution', { type, conflict });
    return {
      status: 'manual_resolution_required',
      conflict,
      resolvedData: await this.getSuggestedResolutions(conflict),
    };
  }

  private async resolveWithAI(type: DataType, conflict: DataConflict): Promise<SyncResult | null> {
    const prompt = `
      Resolve this data conflict for ${type}:
      Current: ${JSON.stringify(conflict.current)}
      Incoming: ${JSON.stringify(conflict.incoming)}
      Context: ${JSON.stringify(conflict.context)}
      
      Consider:
      1. Data consistency rules
      2. User permissions
      3. Business logic constraints
      4. Historical patterns
      
      Provide resolution with confidence score.
    `;

    try {
      const response = await enhancedAIService.processNLQ(prompt, {
        type: 'conflict_resolution',
        domain: type,
      });

      if (response.confidence && response.confidence > 0.8) {
        return {
          status: 'resolved',
          resolvedData: response.resolution || response.response,
          method: 'ai_resolution',
          confidence: response.confidence,
        };
      }
    } catch (error) {
      console.error('AI conflict resolution failed:', error);
    }

    return null;
  }

  private async getSuggestedResolutions(conflict: DataConflict): Promise<any[]> {
    // Generate suggested resolutions using AI
    try {
      const response = await enhancedAIService.processNLQ(
        `Suggest resolutions for conflict: ${JSON.stringify(conflict)}`,
        { type: 'conflict_suggestions' }
      );

      return Array.isArray(response) ? response : [response];
    } catch {
      return [
        { action: 'use_current', description: 'Keep current data' },
        { action: 'use_incoming', description: 'Use incoming data' },
        { action: 'merge', description: 'Merge both datasets' },
      ];
    }
  }

  private initializeSyncStrategies(): void {
    // Default sync strategy
    const defaultStrategy: SyncStrategy = {
      execute: async (data, options) => {
        const endpoint = this.getEndpointForType(options?.operation || 'update');
        try {
          const method = options?.operation === 'create' ? 'post' : options?.operation === 'delete' ? 'delete' : 'put';
          await apiService[method](endpoint, data);
          return { status: 'success' as const };
        } catch (error: any) {
          if (error.response?.status === 409) {
            // Conflict detected
            return {
              status: 'conflict' as const,
              conflict: {
                current: error.response.data?.current,
                incoming: data,
                context: error.response.data?.context || {},
                timestamp: Date.now(),
              },
            };
          }
          throw error;
        }
      },
    };

    // Set default strategy for all types
    const types: DataType[] = ['student', 'teacher', 'attendance', 'grade', 'timetable', 'notification'];
    types.forEach((type) => {
      this.syncStrategies.set(type, defaultStrategy);
    });
  }

  private setupConflictResolvers(): void {
    // Default conflict resolver - use latest timestamp
    const defaultResolver: ConflictResolver = {
      resolve: async (conflict) => {
        if (conflict.incoming.timestamp > conflict.current.timestamp) {
          return {
            status: 'resolved' as const,
            resolvedData: conflict.incoming,
            method: 'timestamp_based',
          };
        }
        return null;
      },
    };

    const types: DataType[] = ['student', 'teacher', 'attendance', 'grade', 'timetable', 'notification'];
    types.forEach((type) => {
      this.conflictResolvers.set(type, defaultResolver);
    });
  }

  private initializeOfflineStorage(): void {
    // Load from localStorage if available
    try {
      const stored = localStorage.getItem('offline_sync_queue');
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.entries(parsed).forEach(([type, items]) => {
          this.offlineStorage.set(type, items);
        });
      }
    } catch (error) {
      console.error('Failed to load offline storage:', error);
    }
  }

  private setupOnlineStatusListener(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit('online');
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('offline');
    });
  }

  private startSyncEngine(): void {
    // Periodic sync for queued items
    this.syncInterval = setInterval(() => {
      this.processSyncQueues();
    }, 5000);

    // Real-time sync via WebSocket
    this.setupWebSocketSync();

    // Background sync for performance
    this.startBackgroundSync();
  }

  private async processSyncQueues(): Promise<void> {
    if (!this.isOnline) return;

    for (const [type, queue] of this.syncQueues.entries()) {
      if (queue.processing || queue.items.length === 0) continue;

      queue.processing = true;

      for (const item of queue.items.slice()) {
        try {
          await this.syncData(type, item.data, {
            userId: item.userId,
            deviceId: item.deviceId,
            operation: item.operation as any,
          });
        } catch (error) {
          console.error(`Sync failed for ${type}:`, error);
        }
      }

      queue.processing = false;
    }
  }

  private setupWebSocketSync(): void {
    socketManager.on('data_sync', (data: any) => {
      this.emit('remote_sync', data);
    });
  }

  private startBackgroundSync(): void {
    // Background sync runs less frequently
    setInterval(() => {
      if (this.isOnline) {
        this.syncOfflineData();
      }
    }, 30000); // Every 30 seconds
  }

  private async processOfflineQueue(): Promise<void> {
    for (const [type, items] of this.offlineStorage.entries()) {
      for (const item of items) {
        try {
          await this.syncData(type as DataType, item.data, item.options);
        } catch (error) {
          console.error(`Offline sync failed for ${type}:`, error);
        }
      }
    }
    this.offlineStorage.clear();
    this.saveOfflineStorage();
  }

  private storeOffline(type: DataType, syncId: string, data: any): void {
    const items = this.offlineStorage.get(type) || [];
    items.push({ syncId, data, timestamp: Date.now() });
    this.offlineStorage.set(type, items);
    this.saveOfflineStorage();
  }

  private saveOfflineStorage(): void {
    try {
      const toStore: Record<string, any> = {};
      this.offlineStorage.forEach((items, type) => {
        toStore[type] = items;
      });
      localStorage.setItem('offline_sync_queue', JSON.stringify(toStore));
    } catch (error) {
      console.error('Failed to save offline storage:', error);
    }
  }

  private async syncOfflineData(): Promise<void> {
    // Sync any pending offline data
    await this.processOfflineQueue();
  }

  private getSyncStrategy(type: DataType): SyncStrategy {
    return this.syncStrategies.get(type) || this.syncStrategies.get('student')!;
  }

  private getOrCreateQueue(type: DataType): SyncQueue {
    if (!this.syncQueues.has(type)) {
      this.syncQueues.set(type, { items: [], processing: false });
    }
    return this.syncQueues.get(type)!;
  }

  private getEndpointForType(operation: string): string {
    // Map operation to endpoint
    const endpoints: Record<string, string> = {
      create: '/create',
      update: '/update',
      delete: '/delete',
    };
    return endpoints[operation] || '/update';
  }

  private generateSyncId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private broadcastSyncComplete(type: DataType, syncId: string, result: SyncResult): void {
    socketManager.emit('sync_complete', { type, syncId, result });
  }
}

interface SyncStrategy {
  execute: (data: any, options?: SyncOptions) => Promise<SyncResult>;
}

interface ConflictResolver {
  resolve: (conflict: DataConflict) => Promise<SyncResult | null>;
}

export default DataSyncManager.getInstance();
