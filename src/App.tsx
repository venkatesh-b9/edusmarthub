import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RoleProvider } from "@/contexts/RoleContext";
import Index from "./pages/Index";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import SchoolAdminDashboard from "./pages/SchoolAdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import ParentDashboard from "./pages/ParentDashboard";
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
            <Route path="/super-admin/*" element={<SuperAdminDashboard />} />
            
            {/* School Admin Routes */}
            <Route path="/school-admin" element={<SchoolAdminDashboard />} />
            <Route path="/school-admin/*" element={<SchoolAdminDashboard />} />
            
            {/* Teacher Routes */}
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/*" element={<TeacherDashboard />} />
            
            {/* Parent Routes */}
            <Route path="/parent" element={<ParentDashboard />} />
            <Route path="/parent/*" element={<ParentDashboard />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </RoleProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
