import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  Search,
  Plus,
  Send,
  Paperclip,
  Star,
  Archive,
  Trash2,
  MoreVertical,
  Users,
  Clock,
  Check,
  CheckCheck,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const conversations = [
  {
    id: 1,
    name: 'Alice Johnson',
    role: 'Student - 11-A',
    avatar: 'AJ',
    lastMessage: 'Thank you for the feedback on my lab report!',
    time: '10 min ago',
    unread: 2,
    online: true,
  },
  {
    id: 2,
    name: 'Robert Johnson',
    role: 'Parent',
    avatar: 'RJ',
    lastMessage: "I wanted to discuss Alice's progress in physics",
    time: '1 hour ago',
    unread: 0,
    online: false,
  },
  {
    id: 3,
    name: 'Dr. Sarah Mitchell',
    role: 'School Admin',
    avatar: 'SM',
    lastMessage: 'The department meeting is scheduled for Friday',
    time: '2 hours ago',
    unread: 1,
    online: true,
  },
  {
    id: 4,
    name: 'Physics Department',
    role: 'Group • 8 members',
    avatar: 'PD',
    lastMessage: 'New curriculum guidelines attached',
    time: 'Yesterday',
    unread: 0,
    online: false,
    isGroup: true,
  },
  {
    id: 5,
    name: 'Bob Smith',
    role: 'Student - 11-A',
    avatar: 'BS',
    lastMessage: 'When is the makeup exam?',
    time: 'Yesterday',
    unread: 0,
    online: false,
  },
];

const currentMessages = [
  { id: 1, sender: 'Alice Johnson', content: 'Good morning, Dr. Thompson!', time: '9:30 AM', isMe: false },
  { id: 2, sender: 'Me', content: 'Good morning, Alice! How can I help you?', time: '9:32 AM', isMe: true, read: true },
  { id: 3, sender: 'Alice Johnson', content: 'I had a question about the momentum conservation problem from yesterday\'s class.', time: '9:33 AM', isMe: false },
  { id: 4, sender: 'Alice Johnson', content: 'Specifically about problem #5 - I\'m not sure how to account for the friction in the calculation.', time: '9:33 AM', isMe: false },
  { id: 5, sender: 'Me', content: 'Great question! For that problem, you need to consider friction as an external force. This means momentum won\'t be perfectly conserved, but we can calculate the impulse from friction to adjust our answer.', time: '9:35 AM', isMe: true, read: true },
  { id: 6, sender: 'Alice Johnson', content: 'Oh, that makes sense! So I need to calculate the friction force first and then find the change in momentum?', time: '9:37 AM', isMe: false },
  { id: 7, sender: 'Me', content: 'Exactly! Calculate the friction force using μ × normal force, then multiply by time to get the impulse. That impulse equals the change in momentum.', time: '9:38 AM', isMe: true, read: true },
  { id: 8, sender: 'Alice Johnson', content: 'Thank you for the feedback on my lab report!', time: '9:45 AM', isMe: false },
];

export default function TeacherMessages() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const filteredConversations = conversations.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // In a real app, this would send the message
      setNewMessage('');
    }
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-120px)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border shadow-card h-full flex overflow-hidden"
        >
          {/* Conversations List */}
          <div className="w-80 border-r border-border flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Messages</h2>
                <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
                  <DialogTrigger asChild>
                    <Button size="icon" className="gradient-primary text-white shadow-glow">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>New Message</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <Input placeholder="To: Search for students, parents, or staff..." />
                      <Input placeholder="Subject" />
                      <Textarea placeholder="Write your message..." rows={6} />
                      <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsComposeOpen(false)}>Cancel</Button>
                        <Button className="gradient-primary text-white">Send Message</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Conversations */}
            <ScrollArea className="flex-1">
              <div className="p-2">
                {filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={cn(
                      "w-full p-3 rounded-lg flex items-start gap-3 text-left transition-colors",
                      selectedConversation.id === conversation.id
                        ? "bg-primary/10"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className="relative">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold",
                        conversation.isGroup ? "bg-accent/20 text-accent" : "bg-primary/10 text-primary"
                      )}>
                        {conversation.isGroup ? <Users className="w-5 h-5" /> : conversation.avatar}
                      </div>
                      {conversation.online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-card" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{conversation.name}</p>
                        <span className="text-xs text-muted-foreground">{conversation.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{conversation.role}</p>
                      <p className="text-sm text-muted-foreground truncate mt-1">{conversation.lastMessage}</p>
                    </div>
                    {conversation.unread > 0 && (
                      <Badge className="bg-primary text-primary-foreground h-5 min-w-5 flex items-center justify-center">
                        {conversation.unread}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    {selectedConversation.avatar}
                  </div>
                  {selectedConversation.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-card" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{selectedConversation.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation.online ? 'Online' : `Last seen ${selectedConversation.time}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Star className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Archive className="w-4 h-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Profile</DropdownMenuItem>
                    <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
                    <DropdownMenuItem>Block User</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Conversation
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {currentMessages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex",
                      message.isMe ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className={cn(
                      "max-w-[70%] rounded-2xl px-4 py-2",
                      message.isMe
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    )}>
                      <p className="text-sm">{message.content}</p>
                      <div className={cn(
                        "flex items-center gap-1 mt-1",
                        message.isMe ? "justify-end" : "justify-start"
                      )}>
                        <span className={cn(
                          "text-xs",
                          message.isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                          {message.time}
                        </span>
                        {message.isMe && (
                          <CheckCheck className={cn(
                            "w-3 h-3",
                            message.read ? "text-primary-foreground" : "text-primary-foreground/50"
                          )} />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="gradient-primary text-white shadow-glow"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
