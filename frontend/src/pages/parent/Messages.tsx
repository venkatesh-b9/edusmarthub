import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  Search,
  Plus,
  Send,
  Paperclip,
  MoreVertical,
  Phone,
  Video,
  Star,
  Archive,
  Trash2,
  Check,
  CheckCheck,
} from 'lucide-react';

const conversations = [
  {
    id: 1,
    name: 'Mrs. Johnson',
    role: 'Mathematics Teacher',
    avatar: 'MJ',
    lastMessage: "Emma did great on her test today! She scored 94%.",
    time: '10:30 AM',
    unread: 2,
    online: true,
    messages: [
      { id: 1, sender: 'them', text: "Good morning! I wanted to share some news about Emma's progress.", time: '10:15 AM' },
      { id: 2, sender: 'me', text: "Good morning! I'd love to hear about it.", time: '10:18 AM' },
      { id: 3, sender: 'them', text: "Emma did great on her test today! She scored 94%.", time: '10:30 AM' },
    ],
  },
  {
    id: 2,
    name: 'Mr. Wilson',
    role: 'Physics Teacher',
    avatar: 'MW',
    lastMessage: "The science fair project is due next Friday.",
    time: 'Yesterday',
    unread: 0,
    online: false,
    messages: [
      { id: 1, sender: 'them', text: "Hello! Just a reminder about the upcoming science fair.", time: 'Yesterday 3:00 PM' },
      { id: 2, sender: 'them', text: "The science fair project is due next Friday.", time: 'Yesterday 3:01 PM' },
      { id: 3, sender: 'me', text: "Thank you for the reminder! Emma is working on it.", time: 'Yesterday 4:30 PM' },
    ],
  },
  {
    id: 3,
    name: 'School Admin',
    role: 'Administration',
    avatar: 'SA',
    lastMessage: "Parent-Teacher meeting scheduled for Jan 15th.",
    time: 'Jan 2',
    unread: 1,
    online: true,
    messages: [
      { id: 1, sender: 'them', text: "Dear Parent, we're pleased to invite you to our upcoming Parent-Teacher meeting.", time: 'Jan 2 9:00 AM' },
      { id: 2, sender: 'them', text: "Parent-Teacher meeting scheduled for Jan 15th.", time: 'Jan 2 9:01 AM' },
    ],
  },
  {
    id: 4,
    name: 'Mr. Thompson',
    role: 'History Teacher',
    avatar: 'MT',
    lastMessage: "Lucas submitted his research paper on time.",
    time: 'Dec 28',
    unread: 0,
    online: false,
    messages: [
      { id: 1, sender: 'them', text: "Hi! Just wanted to update you on Lucas's progress.", time: 'Dec 28 2:00 PM' },
      { id: 2, sender: 'them', text: "Lucas submitted his research paper on time.", time: 'Dec 28 2:01 PM' },
      { id: 3, sender: 'me', text: "That's great to hear! Thank you for letting me know.", time: 'Dec 28 3:15 PM' },
    ],
  },
  {
    id: 5,
    name: 'Ms. Garcia',
    role: 'Art Teacher',
    avatar: 'MG',
    lastMessage: "Emma's artwork was selected for the exhibition!",
    time: 'Dec 20',
    unread: 0,
    online: false,
    messages: [
      { id: 1, sender: 'them', text: "Exciting news! Emma's artwork was selected for the exhibition!", time: 'Dec 20 11:00 AM' },
      { id: 2, sender: 'me', text: "That's wonderful! We're so proud of her!", time: 'Dec 20 11:30 AM' },
      { id: 3, sender: 'them', text: "The exhibition will be on January 20th. Hope you can attend!", time: 'Dec 20 11:45 AM' },
    ],
  },
];

export default function ParentMessages() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // In a real app, this would send the message to the backend
      setNewMessage('');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground mt-1">
              Communicate with teachers and school staff
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2 gradient-primary text-white">
                  <Plus className="w-4 h-4" />
                  New Message
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Message</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input placeholder="To: Search for teachers or staff..." />
                  <Input placeholder="Subject" />
                  <Textarea placeholder="Write your message..." rows={6} />
                  <Button className="w-full gradient-primary text-white">Send Message</Button>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>
        </div>

        {/* Messages Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border shadow-card overflow-hidden h-[calc(100vh-220px)]"
        >
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-80 border-r flex flex-col">
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="divide-y">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={cn(
                        "flex items-start gap-3 p-4 cursor-pointer transition-colors",
                        selectedConversation.id === conversation.id
                          ? "bg-primary/5 border-l-2 border-l-primary"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                          {conversation.avatar}
                        </div>
                        {conversation.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-card" />
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
                        <Badge className="gradient-primary text-white text-xs">{conversation.unread}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold">
                      {selectedConversation.avatar}
                    </div>
                    {selectedConversation.online && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success border-2 border-card" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{selectedConversation.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedConversation.online ? 'Online' : 'Offline'} • {selectedConversation.role}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.sender === 'me' ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl px-4 py-2",
                          message.sender === 'me'
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        )}
                      >
                        <p className="text-sm">{message.text}</p>
                        <div className={cn(
                          "flex items-center gap-1 mt-1",
                          message.sender === 'me' ? "justify-end" : "justify-start"
                        )}>
                          <span className={cn(
                            "text-xs",
                            message.sender === 'me' ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>
                            {message.time}
                          </span>
                          {message.sender === 'me' && (
                            <CheckCheck className="w-3 h-3 text-primary-foreground/70" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="gradient-primary text-white"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
