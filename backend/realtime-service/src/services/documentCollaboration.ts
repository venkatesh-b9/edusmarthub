import { Server as SocketIOServer, Socket } from 'socket.io';
import { Message, MessageType } from '../types';
import logger from '../utils/logger';
import { MessagePersistence } from '../utils/messagePersistence';
import { v4 as uuidv4 } from 'uuid';

export class DocumentCollaborationService {
  private io: SocketIOServer;
  private messagePersistence: MessagePersistence;
  private documentStates: Map<string, any> = new Map();
  private activeCursors: Map<string, Map<string, any>> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.messagePersistence = new MessagePersistence();
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      // Join document collaboration room
      socket.on('join_document', async (data: { documentId: string; userId: string }) => {
        await this.joinDocument(socket, data.documentId, data.userId);
      });

      // Document operations
      socket.on('document_operation', (data: { documentId: string; operation: any }) => {
        this.handleDocumentOperation(socket, data);
      });

      // Cursor position
      socket.on('cursor_update', (data: { documentId: string; position: any; selection?: any }) => {
        this.handleCursorUpdate(socket, data);
      });

      // Document change
      socket.on('document_change', (data: { documentId: string; changes: any }) => {
        this.handleDocumentChange(socket, data);
      });

      // Request document state
      socket.on('get_document_state', (data: { documentId: string }) => {
        this.getDocumentState(socket, data.documentId);
      });

      // Leave document
      socket.on('leave_document', (data: { documentId: string }) => {
        this.leaveDocument(socket, data.documentId);
      });
    });
  }

  private async joinDocument(socket: Socket, documentId: string, userId: string) {
    const roomId = `document:${documentId}`;
    socket.join(roomId);

    // Initialize document state if not exists
    if (!this.documentStates.has(documentId)) {
      this.documentStates.set(documentId, {
        id: documentId,
        content: '',
        version: 0,
        lastModified: new Date(),
        participants: new Set(),
      });
    }

    const docState = this.documentStates.get(documentId)!;
    docState.participants.add(userId);

    // Initialize cursor tracking
    if (!this.activeCursors.has(documentId)) {
      this.activeCursors.set(documentId, new Map());
    }

    // Send current document state
    socket.emit('document_state', {
      documentId,
      content: docState.content,
      version: docState.version,
      participants: Array.from(docState.participants),
    });

    // Notify others
    socket.to(roomId).emit('user_joined_document', {
      userId,
      documentId,
      timestamp: new Date(),
    });

    logger.info(`User ${userId} joined document: ${documentId}`);
  }

  private handleDocumentOperation(socket: Socket, data: { documentId: string; operation: any }) {
    const roomId = `document:${data.documentId}`;
    const docState = this.documentStates.get(data.documentId);

    if (!docState) {
      socket.emit('error', { message: 'Document not found' });
      return;
    }

    // Apply operation (simplified - in production use operational transforms)
    const operation = data.operation;
    if (operation.type === 'insert') {
      docState.content = this.insertText(docState.content, operation.position, operation.text);
    } else if (operation.type === 'delete') {
      docState.content = this.deleteText(docState.content, operation.position, operation.length);
    }

    docState.version++;
    docState.lastModified = new Date();

    // Broadcast to other participants
    socket.to(roomId).emit('document_operation', {
      documentId: data.documentId,
      operation: data.operation,
      userId: socket.data.userId,
      version: docState.version,
      timestamp: new Date(),
    });

    // Persist change
    const message: Message = {
      id: uuidv4(),
      roomId,
      senderId: socket.data.userId,
      senderName: socket.data.userName || 'User',
      type: MessageType.TEXT,
      content: {
        type: 'document_operation',
        operation: data.operation,
        version: docState.version,
      },
      timestamp: new Date(),
    };

    this.messagePersistence.saveMessage(message);

    logger.debug(`Document operation: ${data.documentId} by ${socket.data.userId}`);
  }

  private handleCursorUpdate(socket: Socket, data: { documentId: string; position: any; selection?: any }) {
    const roomId = `document:${data.documentId}`;
    const cursors = this.activeCursors.get(data.documentId);

    if (cursors) {
      cursors.set(socket.data.userId, {
        position: data.position,
        selection: data.selection,
        timestamp: new Date(),
      });

      // Broadcast cursor position to others
      socket.to(roomId).emit('cursor_update', {
        documentId: data.documentId,
        userId: socket.data.userId,
        userName: socket.data.userName,
        position: data.position,
        selection: data.selection,
        timestamp: new Date(),
      });
    }
  }

  private handleDocumentChange(socket: Socket, data: { documentId: string; changes: any }) {
    const roomId = `document:${data.documentId}`;
    const docState = this.documentStates.get(data.documentId);

    if (!docState) return;

    // Apply changes
    docState.content = data.changes.content || docState.content;
    docState.version++;
    docState.lastModified = new Date();

    // Broadcast to all participants
    this.io.to(roomId).emit('document_changed', {
      documentId: data.documentId,
      changes: data.changes,
      version: docState.version,
      timestamp: new Date(),
    });
  }

  private getDocumentState(socket: Socket, documentId: string) {
    const docState = this.documentStates.get(documentId);

    if (docState) {
      socket.emit('document_state', {
        documentId,
        content: docState.content,
        version: docState.version,
        lastModified: docState.lastModified,
        participants: Array.from(docState.participants),
      });
    } else {
      socket.emit('error', { message: 'Document not found' });
    }
  }

  private leaveDocument(socket: Socket, documentId: string) {
    const roomId = `document:${documentId}`;
    socket.leave(roomId);

    const docState = this.documentStates.get(documentId);
    if (docState) {
      docState.participants.delete(socket.data.userId);
    }

    const cursors = this.activeCursors.get(documentId);
    if (cursors) {
      cursors.delete(socket.data.userId);
    }

    // Notify others
    socket.to(roomId).emit('user_left_document', {
      userId: socket.data.userId,
      documentId,
      timestamp: new Date(),
    });

    logger.info(`User ${socket.data.userId} left document: ${documentId}`);
  }

  private insertText(content: string, position: number, text: string): string {
    return content.slice(0, position) + text + content.slice(position);
  }

  private deleteText(content: string, position: number, length: number): string {
    return content.slice(0, position) + content.slice(position + length);
  }

  public getDocumentParticipants(documentId: string): string[] {
    const docState = this.documentStates.get(documentId);
    return docState ? Array.from(docState.participants) : [];
  }
}
