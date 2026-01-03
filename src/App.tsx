import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RoleProvider } from "@/contexts/RoleContext";
import Index from "./pages/Index";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import Schools from "./pages/super-admin/Schools";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <RoleProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            
            {/* Super Admin Routes */}
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/schools" element={<Schools />} />
            <Route path="/super-admin/analytics" element={<Analytics />} />
            <Route path="/super-admin/system-health" element={<SystemHealth />} />
            <Route path="/super-admin/audit-logs" element={<AuditLogs />} />
            <Route path="/super-admin/settings" element={<Settings />} />
            
            {/* School Admin Routes */}
            <Route path="/school-admin" element={<SchoolAdminDashboard />} />
            <Route path="/school-admin/teachers" element={<SchoolAdminTeachers />} />
            <Route path="/school-admin/students" element={<SchoolAdminStudents />} />
            <Route path="/school-admin/classes" element={<SchoolAdminClasses />} />
            <Route path="/school-admin/finances" element={<SchoolAdminFinances />} />
            <Route path="/school-admin/reports" element={<SchoolAdminReports />} />
            <Route path="/school-admin/settings" element={<SchoolAdminSettings />} />
            
            {/* Teacher Routes */}
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/classes" element={<TeacherClasses />} />
            <Route path="/teacher/attendance" element={<TeacherAttendance />} />
            <Route path="/teacher/assignments" element={<TeacherAssignments />} />
            <Route path="/teacher/grades" element={<TeacherGrades />} />
            <Route path="/teacher/schedule" element={<TeacherSchedule />} />
            <Route path="/teacher/messages" element={<TeacherMessages />} />
            
            {/* Parent Routes */}
            <Route path="/parent" element={<ParentDashboard />} />
            <Route path="/parent/children" element={<ParentChildren />} />
            <Route path="/parent/attendance" element={<ParentAttendance />} />
            <Route path="/parent/grades" element={<ParentGrades />} />
            <Route path="/parent/messages" element={<ParentMessages />} />
            <Route path="/parent/documents" element={<ParentDocuments />} />
            <Route path="/parent/payments" element={<ParentPayments />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </RoleProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
