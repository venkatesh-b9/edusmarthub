import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRole } from '@/contexts/RoleContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Bell,
  Search,
  Moon,
  Sun,
  Menu,
  X,
  ChevronDown,
  Settings,
  LogOut,
  User,
  HelpCircle,
  GraduationCap,
  Users,
  BookOpen,
  School,
  BarChart3,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'warning' | 'success';
}

interface SearchResult {
  id: string;
  title: string;
  category: string;
  path: string;
  icon: React.ElementType;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New School Registration',
    message: 'Westside Academy has been registered successfully',
    time: '2 min ago',
    read: false,
    type: 'success',
  },
  {
    id: '2',
    title: 'System Alert',
    message: 'Database backup completed',
    time: '1 hour ago',
    read: false,
    type: 'info',
  },
  {
    id: '3',
    title: 'Attention Required',
    message: '3 schools pending verification',
    time: '3 hours ago',
    read: true,
    type: 'warning',
  },
];

const allSearchItems: SearchResult[] = [
  { id: '1', title: 'Students', category: 'Pages', path: '/school-admin/students', icon: GraduationCap },
  { id: '2', title: 'Teachers', category: 'Pages', path: '/school-admin/teachers', icon: Users },
  { id: '3', title: 'Classes', category: 'Pages', path: '/school-admin/classes', icon: BookOpen },
  { id: '4', title: 'Reports', category: 'Pages', path: '/school-admin/reports', icon: FileText },
  { id: '5', title: 'Finances', category: 'Pages', path: '/school-admin/finances', icon: BarChart3 },
  { id: '6', title: 'Settings', category: 'Pages', path: '/school-admin/settings', icon: Settings },
  { id: '7', title: 'Dashboard', category: 'Pages', path: '/school-admin', icon: School },
  { id: '8', title: 'Super Admin Dashboard', category: 'Pages', path: '/super-admin', icon: School },
  { id: '9', title: 'Schools Management', category: 'Pages', path: '/super-admin/schools', icon: School },
  { id: '10', title: 'Analytics', category: 'Pages', path: '/super-admin/analytics', icon: BarChart3 },
];

export function Header() {
  const { userInfo } = useRole();
  const navigate = useNavigate();
  const location = useLocation();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const filteredSearchResults = searchQuery.length > 0
    ? allSearchItems.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSearchSelect = (path: string) => {
    navigate(path);
    setSearchQuery('');
    setIsSearchFocused(false);
    searchInputRef.current?.blur();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredSearchResults.length > 0) {
      handleSearchSelect(filteredSearchResults[0].path);
    }
    if (e.key === 'Escape') {
      setSearchQuery('');
      setIsSearchFocused(false);
      searchInputRef.current?.blur();
    }
  };

  return (
    <header className="fixed top-0 right-0 left-64 z-30 h-16 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between h-full px-6">
        {/* Search Bar */}
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search anything..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            onKeyDown={handleSearchKeyDown}
            className="pl-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>

          {/* Search Results Dropdown */}
          <AnimatePresence>
            {isSearchFocused && filteredSearchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-lg border border-border z-50 overflow-hidden"
              >
                <div className="py-2 max-h-80 overflow-y-auto">
                  {filteredSearchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSearchSelect(result.path)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left"
                    >
                      <result.icon className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{result.title}</p>
                        <p className="text-xs text-muted-foreground">{result.category}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="rounded-full"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {/* Help */}
          <Button variant="ghost" size="icon" className="rounded-full">
            <HelpCircle className="w-5 h-5" />
          </Button>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full relative"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>

            <AnimatePresence>
              {isNotificationOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsNotificationOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-card rounded-xl shadow-lg border border-border z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                      <h3 className="font-semibold">Notifications</h3>
                      <Button variant="ghost" size="sm" className="text-xs text-primary">
                        Mark all read
                      </Button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {mockNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            "px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer",
                            !notification.read && "bg-primary/5"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full mt-2",
                                notification.type === 'success' && "bg-success",
                                notification.type === 'warning' && "bg-warning",
                                notification.type === 'info' && "bg-info"
                              )}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{notification.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground/70 mt-1">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-2 border-t border-border">
                      <Button variant="ghost" className="w-full text-sm" size="sm">
                        View all notifications
                      </Button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Dropdown */}
          <div className="relative ml-2">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 px-3 py-1.5 rounded-full hover:bg-muted transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                {userInfo.avatar}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">{userInfo.name}</p>
              </div>
              <ChevronDown
                size={14}
                className={cn(
                  "hidden md:block text-muted-foreground transition-transform",
                  isProfileOpen && "rotate-180"
                )}
              />
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-card rounded-xl shadow-lg border border-border z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium">{userInfo.name}</p>
                      <p className="text-xs text-muted-foreground">{userInfo.email}</p>
                    </div>
                    <div className="py-2">
                      <button className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors">
                        <User size={16} />
                        Profile
                      </button>
                      <button className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors">
                        <Settings size={16} />
                        Settings
                      </button>
                      <div className="border-t border-border my-2" />
                      <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors">
                        <LogOut size={16} />
                        Log out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
