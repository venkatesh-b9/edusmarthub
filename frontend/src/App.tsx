import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { ThemeProvider } from "next-themes";
import { store } from "@/store/store";
import { RoleProvider } from "@/contexts/RoleContext";
import { socketManager } from "@/lib/socket";
import "@/lib/i18n";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GlobalErrorBoundary } from "@/components/errors/GlobalErrorBoundary";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import Schools from "./pages/super-admin/Schools";
import Students from "./pages/super-admin/Students";
import Teachers from "./pages/super-admin/Teachers";
import Analytics from "./pages/super-admin/Analytics";
import SystemHealth from "./pages/super-admin/SystemHealth";
import AuditLogs from "./pages/super-admin/AuditLogs";
import Settings from "./pages/super-admin/Settings";
import SchoolAdminDashboard from "./pages/SchoolAdminDashboard";
import SchoolAdminTeachers from "./pages/school-admin/Teachers";
import SchoolAdminStudents from "./pages/school-admin/Students";
import SchoolAdminClasses from "./pages/school-admin/Classes";
import SchoolAdminFinances from "./pages/school-admin/Finances";
import SchoolAdminReports from "./pages/school-admin/Reports";
import SchoolAdminSettings from "./pages/school-admin/Settings";
import SchoolAdminTimetable from "./pages/school-admin/Timetable";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherClasses from "./pages/teacher/Classes";
import TeacherAttendance from "./pages/teacher/Attendance";
import TeacherAssignments from "./pages/teacher/Assignments";
import TeacherGrades from "./pages/teacher/Grades";
import TeacherSchedule from "./pages/teacher/Schedule";
import TeacherMessages from "./pages/teacher/Messages";
import ParentDashboard from "./pages/ParentDashboard";
import ParentChildren from "./pages/parent/Children";
import ParentAttendance from "./pages/parent/Attendance";
import ParentGrades from "./pages/parent/Grades";
import ParentMessages from "./pages/parent/Messages";
import ParentDocuments from "./pages/parent/Documents";
import ParentPayments from "./pages/parent/Payments";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const AppContent = () => {
  useEffect(() => {
    // Initialize Socket.io connection
    socketManager.connect();
    
    return () => {
      socketManager.disconnect();
    };
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <RoleProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                
                {/* Super Admin Routes */}
                <Route path="/super-admin" element={
                  <ProtectedRoute allowedRoles={['super-admin']}>
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/super-admin/schools" element={
                  <ProtectedRoute allowedRoles={['super-admin']}>
                    <Schools />
                  </ProtectedRoute>
                } />
                <Route path="/super-admin/students" element={
                  <ProtectedRoute allowedRoles={['super-admin']}>
                    <Students />
                  </ProtectedRoute>
                } />
                <Route path="/super-admin/teachers" element={
                  <ProtectedRoute allowedRoles={['super-admin']}>
                    <Teachers />
                  </ProtectedRoute>
                } />
                <Route path="/super-admin/analytics" element={
                  <ProtectedRoute allowedRoles={['super-admin']}>
                    <Analytics />
                  </ProtectedRoute>
                } />
                <Route path="/super-admin/system-health" element={
                  <ProtectedRoute allowedRoles={['super-admin']}>
                    <SystemHealth />
                  </ProtectedRoute>
                } />
                <Route path="/super-admin/audit-logs" element={
                  <ProtectedRoute allowedRoles={['super-admin']}>
                    <AuditLogs />
                  </ProtectedRoute>
                } />
                <Route path="/super-admin/settings" element={
                  <ProtectedRoute allowedRoles={['super-admin']}>
                    <Settings />
                  </ProtectedRoute>
                } />
                
                {/* School Admin Routes */}
                <Route path="/school-admin" element={
                  <ProtectedRoute allowedRoles={['school-admin']}>
                    <SchoolAdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/school-admin/teachers" element={
                  <ProtectedRoute allowedRoles={['school-admin']}>
                    <SchoolAdminTeachers />
                  </ProtectedRoute>
                } />
                <Route path="/school-admin/students" element={
                  <ProtectedRoute allowedRoles={['school-admin']}>
                    <SchoolAdminStudents />
                  </ProtectedRoute>
                } />
                <Route path="/school-admin/classes" element={
                  <ProtectedRoute allowedRoles={['school-admin']}>
                    <SchoolAdminClasses />
                  </ProtectedRoute>
                } />
                <Route path="/school-admin/finances" element={
                  <ProtectedRoute allowedRoles={['school-admin']}>
                    <SchoolAdminFinances />
                  </ProtectedRoute>
                } />
                <Route path="/school-admin/reports" element={
                  <ProtectedRoute allowedRoles={['school-admin']}>
                    <SchoolAdminReports />
                  </ProtectedRoute>
                } />
                <Route path="/school-admin/settings" element={
                  <ProtectedRoute allowedRoles={['school-admin']}>
                    <SchoolAdminSettings />
                  </ProtectedRoute>
                } />
                <Route path="/school-admin/timetable" element={
                  <ProtectedRoute allowedRoles={['school-admin']}>
                    <SchoolAdminTimetable />
                  </ProtectedRoute>
                } />
                
                {/* Teacher Routes */}
                <Route path="/teacher" element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/teacher/classes" element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <TeacherClasses />
                  </ProtectedRoute>
                } />
                <Route path="/teacher/attendance" element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <TeacherAttendance />
                  </ProtectedRoute>
                } />
                <Route path="/teacher/assignments" element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <TeacherAssignments />
                  </ProtectedRoute>
                } />
                <Route path="/teacher/grades" element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <TeacherGrades />
                  </ProtectedRoute>
                } />
                <Route path="/teacher/schedule" element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <TeacherSchedule />
                  </ProtectedRoute>
                } />
                <Route path="/teacher/messages" element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <TeacherMessages />
                  </ProtectedRoute>
                } />
                
                {/* Parent Routes */}
                <Route path="/parent" element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <ParentDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/parent/children" element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <ParentChildren />
                  </ProtectedRoute>
                } />
                <Route path="/parent/attendance" element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <ParentAttendance />
                  </ProtectedRoute>
                } />
                <Route path="/parent/grades" element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <ParentGrades />
                  </ProtectedRoute>
                } />
                <Route path="/parent/messages" element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <ParentMessages />
                  </ProtectedRoute>
                } />
                <Route path="/parent/documents" element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <ParentDocuments />
                  </ProtectedRoute>
                } />
                <Route path="/parent/payments" element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <ParentPayments />
                  </ProtectedRoute>
                } />
                
                {/* Profile Route - Accessible by all authenticated users */}
                <Route path="/profile" element={
                  <ProtectedRoute allowedRoles={['super-admin', 'school-admin', 'teacher', 'parent']}>
                    <Profile />
                  </ProtectedRoute>
                } />
                
                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </RoleProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

const App = () => (
  <GlobalErrorBoundary>
    <Provider store={store}>
      <AppContent />
    </Provider>
  </GlobalErrorBoundary>
);

export default App;
