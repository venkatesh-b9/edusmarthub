import { io, Socket } from 'socket.io-client';
import { store } from '@/store/store';
import { setConnectionStatus, updateStatus } from '@/store/slices/realtimeSlice';
import { addNotification } from '@/store/slices/notificationSlice';
import { toast } from 'sonner';

type EventCallback = (...args: any[]) => void;
type ReconnectStrategy = 'exponential' | 'linear' | 'fixed';

interface SocketConfig {
  url?: string;
  auth?: Record<string, any>;
  reconnectStrategy?: ReconnectStrategy;
  maxReconnectAttempts?: number;
  reconnectionDelay?: number;
}

class SocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private reconnectStrategy: ReconnectStrategy = 'exponential';
  private eventCallbacks: Map<string, Set<EventCallback>> = new Map();
  private messageQueue: Array<{ event: string; data: any }> = [];
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isManuallyDisconnected = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private connectionListeners: Set<(connected: boolean) => void> = new Set();

  connect(config: SocketConfig = {}) {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.isManuallyDisconnected) {
      this.isManuallyDisconnected = false;
    }

    const socketUrl = config.url || import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_REALTIME_URL || 'http://localhost:3001';
    const auth = config.auth || {
      token: localStorage.getItem('token'),
      userId: localStorage.getItem('userId'),
    };

    this.maxReconnectAttempts = config.maxReconnectAttempts || 10;
    this.reconnectDelay = config.reconnectionDelay || 1000;
    this.reconnectStrategy = config.reconnectStrategy || 'exponential';

    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000,
      forceNew: true,
      auth,
    });

    this.setupEventHandlers();
    return this.socket;
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      store.dispatch(setConnectionStatus('connected'));
      this.notifyConnectionListeners(true);
      this.flushMessageQueue();
      this.startHeartbeat();
      toast.success('Connected to real-time services');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      store.dispatch(setConnectionStatus('disconnected'));
      this.notifyConnectionListeners(false);
      this.stopHeartbeat();

      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.socket?.connect();
      } else if (!this.isManuallyDisconnected) {
        this.scheduleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts += 1;
      store.dispatch(setConnectionStatus('connecting'));

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        store.dispatch(setConnectionStatus('disconnected'));
        toast.error('Failed to connect to real-time services');
      } else {
        const delay = this.calculateReconnectDelay();
        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      store.dispatch(setConnectionStatus('connected'));
      this.reconnectAttempts = 0;
      toast.success('Reconnected to real-time services');
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Reconnection attempt:', attemptNumber);
      store.dispatch(setConnectionStatus('connecting'));
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Reconnection failed');
      store.dispatch(setConnectionStatus('disconnected'));
      toast.error('Unable to reconnect. Please refresh the page.');
    });

    // Core real-time event handlers
    this.socket.on('status:update', (data: { key: string; value: boolean }) => {
      store.dispatch(updateStatus(data));
      this.notifyListeners('status:update', data);
    });

    this.socket.on('notification:new', (notification: any) => {
      const notificationData = {
        ...notification,
        id: notification.id || `notification-${Date.now()}-${Math.random()}`,
        timestamp: notification.timestamp || new Date().toISOString(),
        read: false,
      };
      store.dispatch(addNotification(notificationData));
      this.notifyListeners('notification:new', notificationData);
      
      // Show toast for high priority notifications
      if (notification.priority === 'high') {
        toast.error(notification.title, {
          description: notification.message,
          duration: 5000,
        });
      } else if (notification.priority === 'medium') {
        toast.warning(notification.title, {
          description: notification.message,
          duration: 3000,
        });
      } else {
        toast.info(notification.title, {
          description: notification.message,
          duration: 2000,
        });
      }
    });

    this.socket.on('analytics:update', (data: any) => {
      this.notifyListeners('analytics:update', data);
    });

    // Online/Offline status
    this.socket.on('user:online', (data: { userId: string; status: boolean }) => {
      this.notifyListeners('user:online', data);
    });

    // Message events
    this.socket.on('message:new', (message: any) => {
      this.notifyListeners('message:new', message);
    });

    this.socket.on('message:read', (data: { messageId: string; readBy: string; readAt: string }) => {
      this.notifyListeners('message:read', data);
    });

    this.socket.on('typing:start', (data: { userId: string; conversationId: string }) => {
      this.notifyListeners('typing:start', data);
    });

    this.socket.on('typing:stop', (data: { userId: string; conversationId: string }) => {
      this.notifyListeners('typing:stop', data);
    });

    // Attendance events
    this.socket.on('attendance:marked', (data: any) => {
      this.notifyListeners('attendance:marked', data);
    });

    // Grade events
    this.socket.on('grade:updated', (data: any) => {
      this.notifyListeners('grade:updated', data);
    });

    // Exam monitoring events
    this.socket.on('exam:status', (data: any) => {
      this.notifyListeners('exam:status', data);
    });

    // Meeting events
    this.socket.on('meeting:scheduled', (data: any) => {
      this.notifyListeners('meeting:scheduled', data);
    });

    // Announcement events
    this.socket.on('announcement:broadcast', (data: any) => {
      this.notifyListeners('announcement:broadcast', data);
      toast.info(data.title, {
        description: data.message,
        duration: 10000,
      });
    });

    // Document collaboration events
    this.socket.on('document:change', (data: any) => {
      this.notifyListeners('document:change', data);
    });

    this.socket.on('document:cursor', (data: any) => {
      this.notifyListeners('document:cursor', data);
    });

    // Dashboard update events
    this.socket.on('dashboard:update', (data: any) => {
      this.notifyListeners('dashboard:update', data);
    });
  }

  private calculateReconnectDelay(): number {
    switch (this.reconnectStrategy) {
      case 'exponential':
        return Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 5000);
      case 'linear':
        return this.reconnectDelay * this.reconnectAttempts;
      case 'fixed':
      default:
        return this.reconnectDelay;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts && !this.isManuallyDisconnected) {
      const delay = this.calculateReconnectDelay();
      this.reconnectTimeout = setTimeout(() => {
        if (this.socket && !this.socket.connected && !this.isManuallyDisconnected) {
          this.socket.connect();
        }
      }, delay);
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping', { timestamp: Date.now() });
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.socket?.connected) {
      const { event, data } = this.messageQueue.shift()!;
      this.socket.emit(event, data);
    }
  }

  private notifyListeners(event: string, data: any) {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  private notifyConnectionListeners(connected: boolean) {
    this.connectionListeners.forEach((listener) => {
      try {
        listener(connected);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  disconnect() {
    this.isManuallyDisconnected = true;
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      store.dispatch(setConnectionStatus('disconnected'));
      this.notifyConnectionListeners(false);
    }
  }

  emit(event: string, data?: any, options?: { queue?: boolean; ack?: (response: any) => void }) {
    if (this.socket?.connected) {
      if (options?.ack) {
        this.socket.emit(event, data, options.ack);
      } else {
        this.socket.emit(event, data);
      }
    } else if (options?.queue !== false) {
      // Queue message if not connected
      this.messageQueue.push({ event, data });
      console.warn(`Socket not connected. Queued event: ${event}`);
    } else {
      console.warn(`Socket not connected. Dropped event: ${event}`);
    }
  }

  on(event: string, callback: EventCallback) {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, new Set());
    }
    this.eventCallbacks.get(event)!.add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: EventCallback) {
    if (callback) {
      const callbacks = this.eventCallbacks.get(event);
      if (callbacks) {
        callbacks.delete(callback);
      }
    } else {
      this.eventCallbacks.delete(event);
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionListeners.add(callback);
    return () => {
      this.connectionListeners.delete(callback);
    };
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  joinRoom(room: string) {
    this.emit('room:join', { room });
  }

  leaveRoom(room: string) {
    this.emit('room:leave', { room });
  }
}

export const socketManager = new SocketManager();
