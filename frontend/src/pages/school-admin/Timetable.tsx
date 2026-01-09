import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Clock,
  Users,
  Settings,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Grid3x3,
  User,
  Building2,
  BookOpen,
  Sparkles,
  Copy,
  Trash2,
  Edit,
  Plus,
  Search,
  Filter,
} from 'lucide-react';
import { TimetableGridView } from '@/components/timetable/TimetableGridView';
import { TimetableTeacherView } from '@/components/timetable/TimetableTeacherView';
import { TimetableRoomView } from '@/components/timetable/TimetableRoomView';
import { TimetableGenerationWizard } from '@/components/timetable/TimetableGenerationWizard';
import { TimetableAnalytics } from '@/components/timetable/TimetableAnalytics';
import { cn } from '@/lib/utils';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export default function TimetableManagement() {
  const [activeView, setActiveView] = useState<'grid' | 'teacher' | 'room' | 'analytics'>('grid');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [sections, setSections] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any>(null);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMode, setGenerationMode] = useState<'ai' | 'manual' | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedSection && selectedAcademicYear) {
      loadTimetable();
    }
  }, [selectedSection, selectedAcademicYear]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      // Load sections and academic years
      // This would be actual API calls
      setSections([
        { id: '1', name: 'Grade 10-A', grade: '10', section: 'A' },
        { id: '2', name: 'Grade 10-B', grade: '10', section: 'B' },
        { id: '3', name: 'Grade 9-A', grade: '9', section: 'A' },
      ]);
      setAcademicYears([
        { id: '1', name: '2024-2025', isCurrent: true },
        { id: '2', name: '2023-2024', isCurrent: false },
      ]);
      
      if (academicYears.length > 0) {
        const currentYear = academicYears.find((y: any) => y.isCurrent);
        if (currentYear) {
          setSelectedAcademicYear(currentYear.id);
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTimetable = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/timetable/timetables/section/${selectedSection}?academicYearId=${selectedAcademicYear}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setTimetable(response.data.data);
        loadConflicts(response.data.data.id);
      }
    } catch (error) {
      console.error('Error loading timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConflicts = async (timetableId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/timetable/timetables/${timetableId}/conflicts`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setConflicts(response.data.data);
      }
    } catch (error) {
      console.error('Error loading conflicts:', error);
    }
  };

  const handleGenerate = async (options: any) => {
    try {
      setIsGenerating(true);
      const token = localStorage.getItem('token');
      
      if (!selectedAcademicYear) {
        alert('Please select an academic year first');
        return;
      }

      if (!options.targetSections || options.targetSections.length === 0) {
        alert('Please select at least one section');
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/timetable/generate`,
        {
          mode: options.mode,
          targetSections: options.targetSections,
          academicYearId: selectedAcademicYear,
          constraints: options.constraints,
          optimizationSettings: options.optimizationSettings,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 60000, // 60 second timeout for generation
        }
      );

      if (response.data.success) {
        const result = response.data.data;
        
        // Show success message
        const message = response.data.message || 
          `Timetable generated successfully!\n` +
          `Generated: ${result.timetables?.length || 0} timetables\n` +
          `Conflicts: ${result.conflicts?.length || 0}`;
        
        alert(message);

        // Reload sections and timetables
        await loadInitialData();
        
        // If a section is selected, reload its timetable
        if (selectedSection) {
          await loadTimetable();
        }
        
        setGenerationMode(null);
      }
    } catch (error: any) {
      console.error('Error generating timetable:', error);
      
      let errorMessage = 'Failed to generate timetable. ';
      
      if (error.response) {
        // Server responded with error
        errorMessage += error.response.data?.error || error.response.statusText;
        if (error.response.status === 503) {
          errorMessage += '\n\nNote: AI service is unavailable. Empty timetables were created. You can fill them manually or start the AI service.';
        }
      } else if (error.request) {
        // Request made but no response
        errorMessage += 'Network error - could not reach server. Please check if the backend is running.';
      } else {
        // Something else happened
        errorMessage += error.message || 'Unknown error occurred';
      }
      
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const criticalConflicts = conflicts.filter((c) => c.severity === 'error' || c.severity === 'critical');
  const warnings = conflicts.filter((c) => c.severity === 'warning');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Timetable Management</h1>
            <p className="text-muted-foreground">
              Create, manage, and optimize school timetables
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={generationMode !== null} onOpenChange={(open) => !open && setGenerationMode(null)}>
              <DialogTrigger asChild>
                <Button onClick={() => setGenerationMode('ai')}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Generate
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Timetable Generation</DialogTitle>
                </DialogHeader>
                <TimetableGenerationWizard
                  sections={sections}
                  academicYearId={selectedAcademicYear}
                  onGenerate={handleGenerate}
                  onCancel={() => setGenerationMode(null)}
                />
              </DialogContent>
            </Dialog>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters and Selection */}
        <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
          <div className="flex-1 grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Academic Year</label>
              <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Section</label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={loadTimetable} variant="outline" className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Conflict Alerts */}
        {conflicts.length > 0 && (
          <div className="space-y-2">
            {criticalConflicts.length > 0 && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <span className="font-semibold text-destructive">
                    {criticalConflicts.length} Critical Conflict{criticalConflicts.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}
            {warnings.length > 0 && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="font-semibold text-yellow-600">
                    {warnings.length} Warning{warnings.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="grid">
              <Grid3x3 className="mr-2 h-4 w-4" />
              Class View
            </TabsTrigger>
            <TabsTrigger value="teacher">
              <User className="mr-2 h-4 w-4" />
              Teacher View
            </TabsTrigger>
            <TabsTrigger value="room">
              <Building2 className="mr-2 h-4 w-4" />
              Room View
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BookOpen className="mr-2 h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="mt-6">
            <TimetableGridView
              timetable={timetable}
              sectionId={selectedSection}
              onUpdate={loadTimetable}
              conflicts={conflicts}
            />
          </TabsContent>

          <TabsContent value="teacher" className="mt-6">
            <TimetableTeacherView
              timetable={timetable}
              conflicts={conflicts}
            />
          </TabsContent>

          <TabsContent value="room" className="mt-6">
            <TimetableRoomView
              timetable={timetable}
              conflicts={conflicts}
            />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <TimetableAnalytics
              timetable={timetable}
              conflicts={conflicts}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
