import { Server as SocketIOServer, Socket } from 'socket.io';
import { Message, MessageType } from '../types';
import logger from '../utils/logger';
import { MessagePersistence } from '../utils/messagePersistence';
import { v4 as uuidv4 } from 'uuid';

export class ParentTeacherChatService {
  private io: SocketIOServer;
  private messagePersistence: MessagePersistence;
  private chatRooms: Map<string, Set<string>> = new Map(); // roomId -> Set of userIds

  constructor(io: SocketIOServer) {
    this.io = io;
    this.messagePersistence = new MessagePersistence();
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      // Join chat room
      socket.on('join_chat', (data: { roomId: string; userId: string; otherUserId: string }) => {
        this.joinChat(socket, data);
      });

      // Send message
      socket.on('send_message', (data: { roomId: string; message: string; metadata?: any }) => {
        this.sendMessage(socket, data);
      });

      // Send file
      socket.on('send_file', (data: { roomId: string; fileName: string; fileUrl: string; fileSize: number; mimeType: string }) => {
        this.sendFile(socket, data);
      });

      // Get chat history
      socket.on('get_chat_history', (data: { roomId: string; limit?: number }) => {
        this.getChatHistory(socket, data);
      });

      // Mark messages as read
      socket.on('mark_messages_read', (data: { roomId: string; messageIds: string[] }) => {
        this.markMessagesRead(socket, data);
      });

      // Typing indicator
      socket.on('typing', (data: { roomId: string; isTyping: boolean }) => {
        this.handleTyping(socket, data);
      });
    });
  }

  private joinChat(socket: Socket, data: { roomId: string; userId: string; otherUserId: string }) {
    const roomId = `chat:${data.roomId}`;
    socket.join(roomId);

    // Track participants
    if (!this.chatRooms.has(roomId)) {
      this.chatRooms.set(roomId, new Set());
    }
    this.chatRooms.get(roomId)!.add(data.userId);

    // Notify other participant
    socket.to(roomId).emit('user_joined_chat', {
      roomId: data.roomId,
      userId: data.userId,
      userName: socket.data.userName,
      timestamp: new Date(),
    });

    // Send chat history
    this.getChatHistory(socket, { roomId: data.roomId, limit: 50 });

    logger.info(`User ${data.userId} joined chat room ${data.roomId}`);
  }

  private sendMessage(socket: Socket, data: { roomId: string; message: string; metadata?: any }) {
    const roomId = `chat:${data.roomId}`;

    const message: Message = {
      id: uuidv4(),
      roomId,
      senderId: socket.data.userId,
      senderName: socket.data.userName || 'User',
      type: MessageType.TEXT,
      content: {
        text: data.message,
        ...data.metadata,
      },
      timestamp: new Date(),
    };

    // Broadcast to room
    this.io.to(roomId).emit('new_message', message);

    // Persist message
    this.messagePersistence.saveMessage(message);

    logger.debug(`Message sent in chat ${data.roomId} by ${socket.data.userId}`);
  }

  private sendFile(socket: Socket, data: {
    roomId: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }) {
    const roomId = `chat:${data.roomId}`;

    const message: Message = {
      id: uuidv4(),
      roomId,
      senderId: socket.data.userId,
      senderName: socket.data.userName || 'User',
      type: MessageType.FILE,
      content: {
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
      },
      timestamp: new Date(),
    };

    // Broadcast to room
    this.io.to(roomId).emit('new_file', message);

    // Persist message
    this.messagePersistence.saveMessage(message);

    logger.info(`File sent in chat ${data.roomId} by ${socket.data.userId}: ${data.fileName}`);
  }

  private async getChatHistory(socket: Socket, data: { roomId: string; limit?: number }) {
    const roomId = `chat:${data.roomId}`;
    const messages = await this.messagePersistence.getRecentMessages(roomId, data.limit || 50);

    socket.emit('chat_history', {
      roomId: data.roomId,
      messages: messages.reverse(), // Oldest first
    });
  }

  private markMessagesRead(socket: Socket, data: { roomId: string; messageIds: string[] }) {
    const roomId = `chat:${data.roomId}`;

    // Notify sender that messages were read
    socket.to(roomId).emit('messages_read', {
      roomId: data.roomId,
      messageIds: data.messageIds,
      readBy: socket.data.userId,
      timestamp: new Date(),
    });

    logger.debug(`Messages marked as read in chat ${data.roomId}`);
  }

  private handleTyping(socket: Socket, data: { roomId: string; isTyping: boolean }) {
    const roomId = `chat:${data.roomId}`;

    socket.to(roomId).emit('typing_indicator', {
      roomId: data.roomId,
      userId: socket.data.userId,
      userName: socket.data.userName,
      isTyping: data.isTyping,
    });
  }

  public getChatParticipants(roomId: string): string[] {
    const participants = this.chatRooms.get(`chat:${roomId}`);
    return participants ? Array.from(participants) : [];
  }
}
