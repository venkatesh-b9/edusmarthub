import { Server as SocketIOServer, Socket } from 'socket.io';
import { ScreenShare, WhiteboardState, WhiteboardElement, Message, MessageType } from '../types';
import logger from '../utils/logger';
import { MessagePersistence } from '../utils/messagePersistence';
import { v4 as uuidv4 } from 'uuid';

export class ScreenShareWhiteboardService {
  private io: SocketIOServer;
  private messagePersistence: MessagePersistence;
  private activeScreenShares: Map<string, ScreenShare> = new Map();
  private whiteboardStates: Map<string, WhiteboardState> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.messagePersistence = new MessagePersistence();
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      // Screen sharing
      socket.on('start_screen_share', (data: { roomId: string; streamId: string }) => {
        this.startScreenShare(socket, data);
      });

      socket.on('stop_screen_share', (data: { roomId: string }) => {
        this.stopScreenShare(socket, data);
      });

      socket.on('screen_share_signal', (data: { roomId: string; signal: any }) => {
        this.handleScreenShareSignal(socket, data);
      });

      // Whiteboard
      socket.on('join_whiteboard', (data: { roomId: string }) => {
        this.joinWhiteboard(socket, data);
      });

      socket.on('whiteboard_draw', (data: { roomId: string; element: Omit<WhiteboardElement, 'id' | 'timestamp'> }) => {
        this.handleWhiteboardDraw(socket, data);
      });

      socket.on('whiteboard_clear', (data: { roomId: string }) => {
        this.clearWhiteboard(socket, data);
      });

      socket.on('get_whiteboard_state', (data: { roomId: string }) => {
        this.getWhiteboardState(socket, data);
      });
    });
  }

  private startScreenShare(socket: Socket, data: { roomId: string; streamId: string }) {
    const screenShare: ScreenShare = {
      id: uuidv4(),
      roomId: data.roomId,
      sharerId: socket.data.userId,
      streamId: data.streamId,
      isActive: true,
      startedAt: new Date(),
    };

    this.activeScreenShares.set(data.roomId, screenShare);

    // Notify room participants
    socket.to(data.roomId).emit('screen_share_started', {
      roomId: data.roomId,
      sharerId: socket.data.userId,
      sharerName: socket.data.userName,
      streamId: data.streamId,
      startedAt: screenShare.startedAt,
    });

    // Persist event
    const message: Message = {
      id: uuidv4(),
      roomId: data.roomId,
      senderId: socket.data.userId,
      senderName: socket.data.userName || 'User',
      type: MessageType.SCREEN_SHARE,
      content: {
        action: 'started',
        streamId: data.streamId,
      },
      timestamp: new Date(),
    };

    this.messagePersistence.saveMessage(message);

    logger.info(`Screen share started in room ${data.roomId} by ${socket.data.userId}`);
  }

  private stopScreenShare(socket: Socket, data: { roomId: string }) {
    const screenShare = this.activeScreenShares.get(data.roomId);
    if (!screenShare || screenShare.sharerId !== socket.data.userId) {
      socket.emit('error', { message: 'Screen share not found or unauthorized' });
      return;
    }

    screenShare.isActive = false;
    this.activeScreenShares.delete(data.roomId);

    // Notify room participants
    this.io.to(data.roomId).emit('screen_share_stopped', {
      roomId: data.roomId,
      sharerId: socket.data.userId,
    });

    logger.info(`Screen share stopped in room ${data.roomId}`);
  }

  private handleScreenShareSignal(socket: Socket, data: { roomId: string; signal: any }) {
    // Relay WebRTC signaling to other participants
    socket.to(data.roomId).emit('screen_share_signal', {
      roomId: data.roomId,
      signal: data.signal,
      from: socket.data.userId,
    });
  }

  private joinWhiteboard(socket: Socket, data: { roomId: string }) {
    socket.join(`whiteboard:${data.roomId}`);

    // Initialize whiteboard state if not exists
    if (!this.whiteboardStates.has(data.roomId)) {
      this.whiteboardStates.set(data.roomId, {
        roomId: data.roomId,
        elements: [],
        version: 0,
        lastModified: new Date(),
      });
    }

    const state = this.whiteboardStates.get(data.roomId)!;

    // Send current state to user
    socket.emit('whiteboard_state', {
      roomId: data.roomId,
      elements: state.elements,
      version: state.version,
    });

    logger.info(`User ${socket.data.userId} joined whiteboard in room ${data.roomId}`);
  }

  private handleWhiteboardDraw(socket: Socket, data: { roomId: string; element: Omit<WhiteboardElement, 'id' | 'timestamp'> }) {
    const state = this.whiteboardStates.get(data.roomId);
    if (!state) {
      socket.emit('error', { message: 'Whiteboard not found' });
      return;
    }

    // Create element
    const element: WhiteboardElement = {
      id: uuidv4(),
      type: data.element.type,
      data: data.element.data,
      userId: socket.data.userId,
      timestamp: new Date(),
    };

    // Add to state
    state.elements.push(element);
    state.version++;
    state.lastModified = new Date();

    // Limit history
    if (state.elements.length > 1000) {
      state.elements = state.elements.slice(-1000);
    }

    // Broadcast to other participants
    socket.to(`whiteboard:${data.roomId}`).emit('whiteboard_element_added', {
      roomId: data.roomId,
      element,
      version: state.version,
    });

    // Persist element
    const message: Message = {
      id: uuidv4(),
      roomId: data.roomId,
      senderId: socket.data.userId,
      senderName: socket.data.userName || 'User',
      type: MessageType.WHITEBOARD,
      content: {
        action: 'draw',
        element,
      },
      timestamp: new Date(),
    };

    this.messagePersistence.saveMessage(message);

    logger.debug(`Whiteboard element added in room ${data.roomId}`);
  }

  private clearWhiteboard(socket: Socket, data: { roomId: string }) {
    const state = this.whiteboardStates.get(data.roomId);
    if (!state) {
      socket.emit('error', { message: 'Whiteboard not found' });
      return;
    }

    // Clear elements
    state.elements = [];
    state.version++;
    state.lastModified = new Date();

    // Broadcast clear to all participants
    this.io.to(`whiteboard:${data.roomId}`).emit('whiteboard_cleared', {
      roomId: data.roomId,
      clearedBy: socket.data.userId,
      version: state.version,
    });

    logger.info(`Whiteboard cleared in room ${data.roomId} by ${socket.data.userId}`);
  }

  private getWhiteboardState(socket: Socket, data: { roomId: string }) {
    const state = this.whiteboardStates.get(data.roomId);
    if (state) {
      socket.emit('whiteboard_state', {
        roomId: data.roomId,
        elements: state.elements,
        version: state.version,
        lastModified: state.lastModified,
      });
    } else {
      socket.emit('error', { message: 'Whiteboard not found' });
    }
  }
}
