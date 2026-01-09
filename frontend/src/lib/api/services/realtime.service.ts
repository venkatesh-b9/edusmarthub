import { socketManager } from '@/lib/socket';

export const realtimeService = {
  // Classroom Monitoring
  joinClassroomMonitoring(classroomId: string, userId: string) {
    socketManager.emit('join_classroom_monitoring', { classroomId, userId });
  },

  onStudentActivity(callback: (data: any) => void) {
    socketManager.on('student_activity_update', callback);
    return () => socketManager.off('student_activity_update', callback);
  },

  onClassroomStatus(callback: (data: any) => void) {
    socketManager.on('classroom_status', callback);
    return () => socketManager.off('classroom_status', callback);
  },

  // Document Collaboration
  joinDocument(documentId: string, userId: string) {
    socketManager.emit('join_document', { documentId, userId });
  },

  onDocumentOperation(callback: (data: any) => void) {
    socketManager.on('document_operation', callback);
    return () => socketManager.off('document_operation', callback);
  },

  sendDocumentOperation(documentId: string, operation: any) {
    socketManager.emit('document_operation', { documentId, operation });
  },

  // Notifications
  subscribeNotifications(userId: string, types?: string[]) {
    socketManager.emit('subscribe_notifications', { userId, types });
  },

  onNotification(callback: (notification: any) => void) {
    socketManager.on('notification', callback);
    return () => socketManager.off('notification', callback);
  },

  // Polling & Quiz
  createPoll(roomId: string, poll: any) {
    socketManager.emit('create_poll', { roomId, poll });
  },

  votePoll(pollId: string, optionId: string) {
    socketManager.emit('vote_poll', { pollId, optionId });
  },

  onPollUpdate(callback: (data: any) => void) {
    socketManager.on('poll_updated', callback);
    return () => socketManager.off('poll_updated', callback);
  },

  // Screen Share & Whiteboard
  startScreenShare(roomId: string, streamId: string) {
    socketManager.emit('start_screen_share', { roomId, streamId });
  },

  joinWhiteboard(roomId: string) {
    socketManager.emit('join_whiteboard', { roomId });
  },

  sendWhiteboardDraw(roomId: string, element: any) {
    socketManager.emit('whiteboard_draw', { roomId, element });
  },

  onWhiteboardElement(callback: (data: any) => void) {
    socketManager.on('whiteboard_element_added', callback);
    return () => socketManager.off('whiteboard_element_added', callback);
  },

  // Bus Tracking
  subscribeBusTracking(data: { busId?: string; routeId?: string; schoolId?: string }) {
    socketManager.emit('subscribe_bus_tracking', data);
  },

  onBusLocationUpdate(callback: (data: any) => void) {
    socketManager.on('bus_location_update', callback);
    return () => socketManager.off('bus_location_update', callback);
  },

  // Exam Proctoring
  startExamProctoring(examId: string, studentId: string) {
    socketManager.emit('start_exam_proctoring', { examId, studentId });
  },

  onProctoringAlert(callback: (alert: any) => void) {
    socketManager.on('proctoring_alert', callback);
    return () => socketManager.off('proctoring_alert', callback);
  },

  // Emergency Broadcast
  subscribeEmergency(schoolId: string, roles?: string[]) {
    socketManager.emit('subscribe_emergency', { schoolId, roles });
  },

  onEmergencyBroadcast(callback: (broadcast: any) => void) {
    socketManager.on('emergency_broadcast', callback);
    return () => socketManager.off('emergency_broadcast', callback);
  },

  // Parent-Teacher Chat
  joinChat(roomId: string, userId: string, otherUserId: string) {
    socketManager.emit('join_chat', { roomId, userId, otherUserId });
  },

  sendMessage(roomId: string, message: string, metadata?: any) {
    socketManager.emit('send_message', { roomId, message, metadata });
  },

  onNewMessage(callback: (message: any) => void) {
    socketManager.on('new_message', callback);
    return () => socketManager.off('new_message', callback);
  },

  // Dashboard Updates
  subscribeDashboard(schoolId: string, types?: string[]) {
    socketManager.emit('subscribe_dashboard', { schoolId, types });
  },

  onDashboardUpdate(callback: (update: any) => void) {
    socketManager.on('dashboard_update', callback);
    return () => socketManager.off('dashboard_update', callback);
  },
};
