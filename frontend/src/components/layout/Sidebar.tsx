import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRole, UserRole } from '@/contexts/RoleContext';
import {
  LayoutDashboard,
  School,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  MessageSquare,
  Settings,
  Building2,
  BarChart3,
  ClipboardList,
  FileText,
  CreditCard,
  Shield,
  BookMarked,
  CheckSquare,
  Home,
  TrendingUp,
  Folder,
  Clock,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  children?: { label: string; href: string }[];
}

const roleNavItems: Record<UserRole, NavItem[]> = {
  'super-admin': [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/super-admin' },
    { label: 'Schools', icon: <Building2 size={20} />, href: '/super-admin/schools' },
    { label: 'Students', icon: <GraduationCap size={20} />, href: '/super-admin/students' },
    { label: 'Teachers', icon: <Users size={20} />, href: '/super-admin/teachers' },
    { label: 'Analytics', icon: <BarChart3 size={20} />, href: '/super-admin/analytics' },
    { label: 'System Health', icon: <Shield size={20} />, href: '/super-admin/system-health' },
    { label: 'Audit Logs', icon: <ClipboardList size={20} />, href: '/super-admin/audit-logs' },
    { label: 'Settings', icon: <Settings size={20} />, href: '/super-admin/settings' },
  ],
  'school-admin': [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/school-admin' },
    { label: 'Teachers', icon: <Users size={20} />, href: '/school-admin/teachers' },
    { label: 'Students', icon: <GraduationCap size={20} />, href: '/school-admin/students' },
    { label: 'Classes', icon: <BookOpen size={20} />, href: '/school-admin/classes' },
    { label: 'Timetable', icon: <Clock size={20} />, href: '/school-admin/timetable' },
    { label: 'Finances', icon: <CreditCard size={20} />, href: '/school-admin/finances' },
    { label: 'Reports', icon: <FileText size={20} />, href: '/school-admin/reports' },
    { label: 'Settings', icon: <Settings size={20} />, href: '/school-admin/settings' },
  ],
  'teacher': [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/teacher' },
    { label: 'My Classes', icon: <BookOpen size={20} />, href: '/teacher/classes' },
    { label: 'Attendance', icon: <CheckSquare size={20} />, href: '/teacher/attendance' },
    { label: 'Assignments', icon: <BookMarked size={20} />, href: '/teacher/assignments' },
    { label: 'Grades', icon: <TrendingUp size={20} />, href: '/teacher/grades' },
    { label: 'Schedule', icon: <Calendar size={20} />, href: '/teacher/schedule' },
    { label: 'Messages', icon: <MessageSquare size={20} />, href: '/teacher/messages' },
  ],
  'parent': [
    { label: 'Dashboard', icon: <Home size={20} />, href: '/parent' },
    { label: 'My Children', icon: <Users size={20} />, href: '/parent/children' },
    { label: 'Attendance', icon: <Calendar size={20} />, href: '/parent/attendance' },
    { label: 'Grades', icon: <TrendingUp size={20} />, href: '/parent/grades' },
    { label: 'Messages', icon: <MessageSquare size={20} />, href: '/parent/messages' },
    { label: 'Documents', icon: <Folder size={20} />, href: '/parent/documents' },
    { label: 'Payments', icon: <CreditCard size={20} />, href: '/parent/payments' },
  ],
};

export function Sidebar() {
  const location = useLocation();
  const { currentRole, userInfo } = useRole();

  const navItems = roleNavItems[currentRole];

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
          <School className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-white">EduSmartHub</h1>
          <p className="text-xs text-sidebar-foreground/60">Management System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  {item.icon}
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-semibold">
            {userInfo.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userInfo.name}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{userInfo.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
