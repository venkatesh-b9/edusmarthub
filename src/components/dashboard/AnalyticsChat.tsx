import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Sparkles,
  TrendingUp,
  School,
  Users,
  BarChart3,
  Loader2,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: {
    type: 'metric' | 'chart' | 'list';
    value?: string | number;
    items?: string[];
  };
}

const suggestedQuestions = [
  { icon: TrendingUp, text: 'What are the enrollment trends?' },
  { icon: School, text: 'Show top performing schools' },
  { icon: Users, text: 'How many students enrolled this month?' },
  { icon: BarChart3, text: 'Compare regional performance' },
];

const mockResponses: Record<string, { content: string; data?: Message['data'] }> = {
  'enrollment': {
    content: 'Based on current data, enrollment has increased by 8.5% compared to last month. Total students across all schools: 58,320.',
    data: { type: 'metric', value: '+8.5%' }
  },
  'top': {
    content: 'Here are the top 5 performing schools based on average student performance:',
    data: { type: 'list', items: ['Lincoln Academy (94.2%)', 'Jefferson High (92.8%)', 'Roosevelt Elementary (91.5%)', 'Washington Middle (90.3%)', 'Adams Charter (89.7%)'] }
  },
  'students': {
    content: 'This month, 2,847 new students have been enrolled across all schools. That\'s a 12% increase from the same period last year.',
    data: { type: 'metric', value: '2,847' }
  },
  'regional': {
    content: 'Regional performance comparison shows North region leading at 89.2%, followed by West (87.5%), East (86.1%), and South (84.8%).',
    data: { type: 'list', items: ['North: 89.2%', 'West: 87.5%', 'East: 86.1%', 'South: 84.8%'] }
  },
  'default': {
    content: 'I can help you analyze school data, track enrollment trends, compare performance metrics, and generate insights. Try asking about specific metrics or schools!'
  }
};

export function AnalyticsChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your Analytics Assistant. Ask me anything about school performance, enrollment trends, or student metrics.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getResponse = (query: string) => {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('enrollment') || lowerQuery.includes('trend')) {
      return mockResponses.enrollment;
    }
    if (lowerQuery.includes('top') || lowerQuery.includes('performing') || lowerQuery.includes('best')) {
      return mockResponses.top;
    }
    if (lowerQuery.includes('student') && (lowerQuery.includes('month') || lowerQuery.includes('enrolled'))) {
      return mockResponses.students;
    }
    if (lowerQuery.includes('regional') || lowerQuery.includes('compare') || lowerQuery.includes('region')) {
      return mockResponses.regional;
    }
    return mockResponses.default;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    const response = getResponse(input);
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      data: response.data,
    };

    setIsTyping(false);
    setMessages((prev) => [...prev, assistantMessage]);
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gradient-primary text-white shadow-glow flex items-center justify-center hover:scale-110 transition-transform"
          >
            <MessageSquare className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed z-50 ${
              isExpanded
                ? 'inset-4 md:inset-8'
                : 'bottom-6 right-6 w-[400px] h-[600px]'
            }`}
          >
            <Card className="h-full flex flex-col shadow-2xl border-border/50 overflow-hidden">
              {/* Header */}
              <CardHeader className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Analytics Assistant</CardTitle>
                      <p className="text-xs text-muted-foreground">AI-powered insights</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setIsExpanded(!isExpanded)}
                    >
                      {isExpanded ? (
                        <Minimize2 className="w-4 h-4" />
                      ) : (
                        <Maximize2 className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full p-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${
                          message.role === 'user' ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.role === 'assistant'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-accent/10 text-accent'
                          }`}
                        >
                          {message.role === 'assistant' ? (
                            <Bot className="w-4 h-4" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>
                        <div
                          className={`max-w-[80%] rounded-2xl p-3 ${
                            message.role === 'assistant'
                              ? 'bg-muted'
                              : 'bg-primary text-primary-foreground'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          {message.data && (
                            <div className="mt-2 pt-2 border-t border-border/50">
                              {message.data.type === 'metric' && (
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4 text-success" />
                                  <span className="text-lg font-bold text-success">
                                    {message.data.value}
                                  </span>
                                </div>
                              )}
                              {message.data.type === 'list' && message.data.items && (
                                <ul className="space-y-1 text-sm">
                                  {message.data.items.map((item, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">
                                        {i + 1}
                                      </span>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="bg-muted rounded-2xl p-3">
                          <div className="flex items-center gap-1">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Analyzing...</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Suggested Questions */}
                  {messages.length === 1 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-muted-foreground">Suggested questions:</p>
                      <div className="grid grid-cols-1 gap-2">
                        {suggestedQuestions.map((q, i) => (
                          <button
                            key={i}
                            onClick={() => handleSuggestedQuestion(q.text)}
                            className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted text-left text-sm transition-colors"
                          >
                            <q.icon className="w-4 h-4 text-primary" />
                            {q.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>

              {/* Input */}
              <div className="p-4 border-t border-border">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about analytics..."
                    className="flex-1"
                    disabled={isTyping}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isTyping}
                    className="gradient-primary text-white"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
