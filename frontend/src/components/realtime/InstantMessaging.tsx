import { useState, useEffect, useRef } from 'react';
import { useRealtime } from '@/hooks/useRealtime';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send, Paperclip, Smile, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import api from '@/lib/axios';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  read: boolean;
  readAt?: string;
  readBy?: string[];
  attachments?: Array<{ id: string; name: string; url: string; type: string }>;
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage?: Message;
  unreadCount: number;
  online?: boolean;
}

interface InstantMessagingProps {
  conversationId?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
}

export function InstantMessaging({
  conversationId: initialConversationId,
  userId,
  userName,
  userAvatar,
}: InstantMessagingProps) {
  const { subscribe, emit, isConnected } = useRealtime();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(initialConversationId);
  const [messages, setMessages] = useState<Map<string, Message[]>>(new Map());
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sendingMessageId, setSendingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);
  const conversationMessages = selectedConversationId ? messages.get(selectedConversationId) || [] : [];

  const { typingText, sendTypingStart, sendTypingStop } = useTypingIndicator(
    selectedConversationId || '',
    userId
  );

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/conversations');
        if (response.data) {
          setConversations(response.data);
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, []);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversationId) return;

    const loadMessages = async () => {
      try {
        const response = await api.get(`/conversations/${selectedConversationId}/messages`);
        if (response.data) {
          setMessages((prev) => {
            const next = new Map(prev);
            next.set(selectedConversationId, response.data);
            return next;
          });
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    loadMessages();
  }, [selectedConversationId]);

  // Subscribe to new messages
  useEffect(() => {
    const unsubscribe = subscribe<Message>('message:new', (message) => {
      setMessages((prev) => {
        const next = new Map(prev);
        const conversationMessages = next.get(message.conversationId) || [];
        if (!conversationMessages.find((m) => m.id === message.id)) {
          next.set(message.conversationId, [...conversationMessages, message]);
        }
        return next;
      });

      // Update conversation last message
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === message.conversationId
            ? { ...conv, lastMessage: message, unreadCount: conv.unreadCount + (message.senderId !== userId ? 1 : 0) }
            : conv
        )
      );

      // Mark as read if it's the active conversation
      if (message.conversationId === selectedConversationId && message.senderId !== userId) {
        markMessageAsRead(message.id);
      }
    });

    return unsubscribe;
  }, [subscribe, selectedConversationId, userId]);

  // Subscribe to read receipts
  useEffect(() => {
    const unsubscribe = subscribe<{ messageId: string; readBy: string; readAt: string }>(
      'message:read',
      ({ messageId, readBy, readAt }) => {
        setMessages((prev) => {
          const next = new Map(prev);
          next.forEach((msgs, convId) => {
            const updated = msgs.map((msg) =>
              msg.id === messageId
                ? {
                    ...msg,
                    read: true,
                    readAt,
                    readBy: [...(msg.readBy || []), readBy],
                  }
                : msg
            );
            next.set(convId, updated);
          });
          return next;
        });
      }
    );

    return unsubscribe;
  }, [subscribe]);

  // Subscribe to online status
  useEffect(() => {
    const unsubscribe = subscribe<{ userId: string; status: boolean }>('user:online', ({ userId: targetUserId, status }) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.participantId === targetUserId ? { ...conv, online: status } : conv
        )
      );
    });

    return unsubscribe;
  }, [subscribe]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  // Handle typing
  const handleInputChange = (value: string) => {
    setNewMessage(value);
    if (value.length > 0) {
      sendTypingStart();
    } else {
      sendTypingStop();
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    emit('message:read', { messageId, readBy: userId, conversationId: selectedConversationId });

    try {
      await api.post(`/messages/${messageId}/read`, { readBy: userId });
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  // Mark all messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversationId && conversationMessages.length > 0) {
      const unreadMessages = conversationMessages.filter(
        (m) => !m.read && m.senderId !== userId
      );
      unreadMessages.forEach((msg) => {
        markMessageAsRead(msg.id);
      });

      // Update conversation unread count
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConversationId ? { ...conv, unreadCount: 0 } : conv
        )
      );
    }
  }, [selectedConversationId, conversationMessages, userId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId || !isConnected) return;

    const tempId = `temp-${Date.now()}`;
    const message: Message = {
      id: tempId,
      conversationId: selectedConversationId,
      senderId: userId,
      senderName: userName,
      senderAvatar: userAvatar,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    };

    setSendingMessageId(tempId);

    // Optimistically add message
    setMessages((prev) => {
      const next = new Map(prev);
      const conversationMessages = next.get(selectedConversationId) || [];
      next.set(selectedConversationId, [...conversationMessages, message]);
      return next;
    });

    setNewMessage('');
    sendTypingStop();

    try {
      // Send via socket
      emit('message:send', {
        conversationId: selectedConversationId,
        content: message.content,
        senderId: userId,
      });

      // Also send via API for persistence
      const response = await api.post(`/conversations/${selectedConversationId}/messages`, {
        content: message.content,
        senderId: userId,
      });

      if (response.data) {
        // Replace temp message with server response
        setMessages((prev) => {
          const next = new Map(prev);
          const conversationMessages = next.get(selectedConversationId) || [];
          const updated = conversationMessages.map((m) =>
            m.id === tempId ? response.data : m
          );
          next.set(selectedConversationId, updated);
          return next;
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      // Remove failed message
      setMessages((prev) => {
        const next = new Map(prev);
        const conversationMessages = next.get(selectedConversationId) || [];
        next.set(selectedConversationId, conversationMessages.filter((m) => m.id !== tempId));
        return next;
      });
    } finally {
      setSendingMessageId(null);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = date.toDateString() === new Date(now.getTime() - 86400000).toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (isYesterday) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden">
      {/* Conversations List */}
      <div className="w-80 border-r bg-muted/30 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Conversations</h3>
            {isConnected ? (
              <Badge variant="outline" className="text-success border-success">
                Online
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Offline
              </Badge>
            )}
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  'p-3 rounded-lg cursor-pointer transition-colors',
                  selectedConversationId === conversation.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
                onClick={() => setSelectedConversationId(conversation.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {conversation.participantName.split(' ').map((n) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm truncate">{conversation.participantName}</p>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="destructive" className="h-5 min-w-5 text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                    {conversation.lastMessage && (
                      <p className="text-xs text-muted-foreground truncate">
                        {conversation.lastMessage.content}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar>
                    <AvatarFallback>
                      {selectedConversation.participantName.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {selectedConversation.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-background" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedConversation.participantName}</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation.online ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {conversationMessages.map((message, index) => {
                  const isOwn = message.senderId === userId;
                  const showAvatar = index === 0 || conversationMessages[index - 1]?.senderId !== message.senderId;
                  const isPending = message.id === sendingMessageId;

                  return (
                    <div
                      key={message.id}
                      className={cn('flex gap-3', isOwn ? 'flex-row-reverse' : 'flex-row')}
                    >
                      {showAvatar && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {message.senderName.split(' ').map((n) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {!showAvatar && <div className="w-8" />}
                      <div className={cn('flex flex-col max-w-[70%]', isOwn ? 'items-end' : 'items-start')}>
                        {showAvatar && (
                          <p className="text-xs text-muted-foreground mb-1">{message.senderName}</p>
                        )}
                        <div
                          className={cn(
                            'rounded-lg px-4 py-2',
                            isOwn
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground'
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</p>
                          {isOwn && (
                            <div className="flex items-center">
                              {message.read ? (
                                <CheckCheck className="h-3 w-3 text-primary" />
                              ) : (
                                <Check className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                          )}
                        </div>
                        {isPending && (
                          <p className="text-xs text-muted-foreground italic">Sending...</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {typingText && (
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{selectedConversation.participantName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <p className="text-sm text-muted-foreground italic">{typingText}</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex items-end gap-2">
                <Textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="min-h-[60px] max-h-[120px] resize-none"
                  rows={2}
                />
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button onClick={sendMessage} disabled={!newMessage.trim() || !isConnected} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
