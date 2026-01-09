import { useState, useEffect, useRef, useCallback } from 'react';
import { useRealtime } from '@/hooks/useRealtime';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Save, Users, Eye, EyeOff, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { debounce, throttle } from '@/lib/utils';
import { toast } from 'sonner';
import api from '@/lib/axios';

interface Document {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  version: number;
  lastModified: string;
  sharedWith?: string[];
}

interface Collaborator {
  userId: string;
  userName: string;
  avatar?: string;
  cursor?: { line: number; column: number };
  selection?: { start: number; end: number };
  online: boolean;
}

interface CollaborativeDocumentEditorProps {
  documentId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
}

export function CollaborativeDocumentEditor({
  documentId,
  userId,
  userName,
  userAvatar,
}: CollaborativeDocumentEditorProps) {
  const { subscribe, emit, isConnected, joinRoom, leaveRoom } = useRealtime();
  const [document, setDocument] = useState<Document | null>(null);
  const [content, setContent] = useState('');
  const [collaborators, setCollaborators] = useState<Map<string, Collaborator>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastSyncedContentRef = useRef<string>('');
  const changeQueueRef = useRef<Array<{ timestamp: number; content: string }>>([]);

  // Load document
  useEffect(() => {
    const loadDocument = async () => {
      try {
        const response = await api.get(`/documents/${documentId}`);
        if (response.data) {
          setDocument(response.data);
          setContent(response.data.content || '');
        }
      } catch (error) {
        console.error('Failed to load document:', error);
        toast.error('Failed to load document');
      }
    };

    loadDocument();
  }, [documentId]);

  // Initialize collaborative editing
  useEffect(() => {
    if (!documentId || !isConnected) return;

    lastSyncedContentRef.current = content;

    // Join room for Socket.io updates
    joinRoom(`document:${documentId}`);

    // Emit user join
    emit('document:user-join', {
      documentId,
      userId,
      userName,
      avatar: userAvatar,
    });

    return () => {
      // Emit user leave
      emit('document:user-leave', {
        documentId,
        userId,
      });
      leaveRoom(`document:${documentId}`);
    };
  }, [documentId, userId, userName, userAvatar, isConnected, joinRoom, leaveRoom, emit]);

  // Subscribe to document changes via Socket.io
  useEffect(() => {
    const unsubscribeChange = subscribe<{
      documentId: string;
      content: string;
      userId: string;
      timestamp: string;
      changeType: 'insert' | 'delete' | 'replace';
      position?: number;
      length?: number;
    }>('document:change', (data) => {
      if (data.documentId === documentId && data.userId !== userId) {
        // Apply changes from remote user (simplified - in production, use Operational Transform or CRDT)
        const queueItem = { timestamp: Date.now(), content: data.content };
        changeQueueRef.current.push(queueItem);
        
        // Apply the most recent change
        if (queueItem.timestamp > Date.now() - 1000) {
          setContent(data.content);
          lastSyncedContentRef.current = data.content;
          debouncedSave(data.content);
        }
      }
    });

    const unsubscribeUserJoin = subscribe<{
      documentId: string;
      userId: string;
      userName: string;
      avatar?: string;
    }>('document:user-join', (data) => {
      if (data.documentId === documentId && data.userId !== userId) {
        setCollaborators((prev) => {
          const next = new Map(prev);
          next.set(data.userId, {
            userId: data.userId,
            userName: data.userName,
            avatar: data.avatar,
            online: true,
          });
          return next;
        });
      }
    });

    const unsubscribeUserLeave = subscribe<{
      documentId: string;
      userId: string;
    }>('document:user-leave', (data) => {
      if (data.documentId === documentId) {
        setCollaborators((prev) => {
          const next = new Map(prev);
          next.delete(data.userId);
          return next;
        });
      }
    });

    return () => {
      unsubscribeChange();
      unsubscribeUserJoin();
      unsubscribeUserLeave();
    };
  }, [subscribe, documentId, userId]);

  // Subscribe to cursor movements
  useEffect(() => {
    const unsubscribe = subscribe<{ userId: string; documentId: string; cursor: { line: number; column: number } }>(
      'document:cursor',
      (data) => {
        if (data.documentId === documentId && data.userId !== userId) {
          setCollaborators((prev) => {
            const next = new Map(prev);
            const collaborator = next.get(data.userId);
            if (collaborator) {
              next.set(data.userId, { ...collaborator, cursor: data.cursor });
            }
            return next;
          });
        }
      }
    );

    return unsubscribe;
  }, [subscribe, documentId, userId]);

  // Handle content changes
  const handleContentChange = useCallback(
    throttle((newContent: string, oldContent: string) => {
      // Calculate diff (simplified - in production, use a proper diff algorithm)
      const diff = calculateDiff(oldContent, newContent);
      
      if (diff) {
        // Emit change via Socket.io
        emit('document:change', {
          documentId,
          content: newContent,
          userId,
          timestamp: new Date().toISOString(),
          changeType: diff.type,
          position: diff.position,
          length: diff.length,
          text: diff.text,
        });

        lastSyncedContentRef.current = newContent;
      }

      // Update cursor position
      const textarea = textareaRef.current;
      if (textarea) {
        const cursorPos = textarea.selectionStart;
        const lines = newContent.substring(0, cursorPos).split('\n');
        const line = lines.length - 1;
        const column = lines[lines.length - 1].length;

        emit('document:cursor', {
          documentId,
          userId,
          cursor: { line, column },
        });
      }
    }, 200),
    [emit, documentId, userId]
  );

  // Simple diff calculation
  const calculateDiff = (oldText: string, newText: string) => {
    if (oldText === newText) return null;

    let start = 0;
    while (start < oldText.length && start < newText.length && oldText[start] === newText[start]) {
      start++;
    }

    let oldEnd = oldText.length;
    let newEnd = newText.length;
    while (
      oldEnd > start &&
      newEnd > start &&
      oldText[oldEnd - 1] === newText[newEnd - 1]
    ) {
      oldEnd--;
      newEnd--;
    }

    const deletedLength = oldEnd - start;
    const insertedText = newText.substring(start, newEnd);

    return {
      type: deletedLength > 0 && insertedText.length > 0 ? 'replace' : deletedLength > 0 ? 'delete' : 'insert',
      position: start,
      length: deletedLength,
      text: insertedText,
    };
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const oldContent = content;
    setContent(newContent);
    handleContentChange(newContent, oldContent);
  };

  // Debounced save to server
  const debouncedSave = useCallback(
    debounce(async (contentToSave: string) => {
      if (!documentId) return;

      setIsSaving(true);
      try {
        await api.put(`/documents/${documentId}`, {
          content: contentToSave,
          version: document?.version || 0,
        });
        toast.success('Document saved', { duration: 1000 });
      } catch (error) {
        console.error('Failed to save document:', error);
        toast.error('Failed to save document');
      } finally {
        setIsSaving(false);
      }
    }, 2000),
    [documentId, document?.version]
  );

  // Manual save
  const handleSave = async () => {
    await debouncedSave(content);
  };

  // Download document
  const handleDownload = () => {
    if (!document || !content) return;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${document.title}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const collaboratorList = Array.from(collaborators.values());

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle>{document?.title || 'Untitled Document'}</CardTitle>
              {isSaving && (
                <p className="text-xs text-muted-foreground mt-1">Saving...</p>
              )}
            </div>
            {collaboratorList.length > 0 && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {collaboratorList.length} collaborator{collaboratorList.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {collaboratorList.length > 0 && (
              <div className="flex -space-x-2">
                {collaboratorList.slice(0, 3).map((collab) => (
                  <Avatar key={collab.userId} className="h-8 w-8 border-2 border-background">
                    <AvatarFallback className="text-xs">
                      {collab.userName.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {collaboratorList.length > 3 && (
                  <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                    +{collaboratorList.length - 3}
                  </div>
                )}
              </div>
            )}
            <Button variant="outline" size="icon" onClick={() => setIsReadOnly(!isReadOnly)}>
              {isReadOnly ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Active Collaborators */}
        {collaboratorList.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-muted/50 border flex items-center gap-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">Active collaborators:</span>
              {collaboratorList.map((collab) => (
                <Badge key={collab.userId} variant="outline" className="gap-2">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  {collab.userName}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Editor */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            readOnly={isReadOnly}
            placeholder="Start typing to collaborate in real-time..."
            className="min-h-[500px] font-mono text-sm resize-none"
            style={{ tabSize: 2 }}
          />

          {/* Cursor indicators for collaborators */}
          {collaboratorList.map((collab) => {
            if (!collab.cursor) return null;
            return (
              <div
                key={collab.userId}
                className="absolute pointer-events-none"
                style={{
                  left: `${collab.cursor.column * 8}px`,
                  top: `${collab.cursor.line * 24 + 16}px`,
                }}
              >
                <div
                  className="w-0.5 h-5 bg-primary"
                  style={{ borderLeft: `2px solid ${collab.userAvatar || '#3b82f6'}` }}
                />
                <div className="mt-1 px-2 py-1 rounded bg-primary text-primary-foreground text-xs whitespace-nowrap">
                  {collab.userName}
                </div>
              </div>
            );
          })}
        </div>

        {/* Connection Status */}
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                isConnected ? 'bg-success animate-pulse' : 'bg-muted'
              )}
            />
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          {document && (
            <span>
              Last modified: {new Date(document.lastModified).toLocaleString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
