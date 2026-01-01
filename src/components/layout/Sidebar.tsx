import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronDown,
  Building2,
  BarChart3,
  ClipboardList,
  FileText,
  CreditCard,
  Shield,
  Bell,
  UserCircle,
  BookMarked,
  CheckSquare,
  Home,
  TrendingUp,
  Folder,
  Video,
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

const roleLabels: Record<UserRole, { label: string; color: string }> = {
  'super-admin': { label: 'Super Admin', color: 'bg-purple-500' },
  'school-admin': { label: 'School Admin', color: 'bg-primary' },
  'teacher': { label: 'Teacher', color: 'bg-success' },
  'parent': { label: 'Parent', color: 'bg-accent' },
};

export function Sidebar() {
  const location = useLocation();
  const { currentRole, setCurrentRole, userInfo } = useRole();
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  const navItems = roleNavItems[currentRole];
  const roleInfo = roleLabels[currentRole];

  const roles: UserRole[] = ['super-admin', 'school-admin', 'teacher', 'parent'];

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
          <School className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-white">EduCloud</h1>
          <p className="text-xs text-sidebar-foreground/60">Management System</p>
        </div>
      </div>

      {/* Role Switcher */}
      <div className="px-4 py-4">
        <button
          onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className={cn("w-2 h-2 rounded-full", roleInfo.color)} />
            <span className="text-sm font-medium">{roleInfo.label}</span>
          </div>
          <ChevronDown
            size={16}
            className={cn(
              "transition-transform duration-200",
              isRoleMenuOpen && "rotate-180"
            )}
          />
        </button>

        <AnimatePresence>
          {isRoleMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2 space-y-1">
                {roles.filter(r => r !== currentRole).map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      setCurrentRole(role);
                      setIsRoleMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                  >
                    <span className={cn("w-2 h-2 rounded-full", roleLabels[role].color)} />
                    {roleLabels[role].label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
