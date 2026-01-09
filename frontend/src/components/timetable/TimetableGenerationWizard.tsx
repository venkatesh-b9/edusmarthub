import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Loader2, Plus, X, Trash2 } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

interface TimetableGenerationWizardProps {
  sections: any[];
  academicYearId: string;
  onGenerate: (options: any) => void;
  onCancel: () => void;
}

interface ClassSection {
  grade: number;
  sections: string[]; // Array of section letters like ['A', 'B', 'C']
}

export function TimetableGenerationWizard({
  sections: existingSections,
  academicYearId,
  onGenerate,
  onCancel,
}: TimetableGenerationWizardProps) {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<'balanced' | 'teacher_preference' | 'student_focus' | 'room_optimization' | 'ai_powered'>('ai_powered');
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [classSections, setClassSections] = useState<ClassSection[]>([]);
  const [availableSections, setAvailableSections] = useState<any[]>([]);
  const [constraints, setConstraints] = useState({
    maxPeriodsPerDay: 8,
    maxConsecutivePeriods: 3,
    avoidBackToBackSubjects: true,
    maxTeacherPeriodsPerDay: 6,
    maxTeacherPeriodsPerWeek: 25,
  });
  const [optimizationSettings, setOptimizationSettings] = useState({
    balanceWorkload: true,
    minimizeRoomChanges: true,
    maximizeFreePeriods: true,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSections();
    initializeClassSections();
  }, [academicYearId]);

  const loadSections = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // Load sections from API - this would be a real endpoint
      // For now, use existing sections
      setAvailableSections(existingSections);
    } catch (error) {
      console.error('Error loading sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeClassSections = () => {
    // Group existing sections by grade
    const grouped: Record<number, string[]> = {};
    existingSections.forEach((section) => {
      const grade = parseInt(section.grade) || parseInt(section.name.match(/\d+/)?.[0] || '1');
      if (!grouped[grade]) {
        grouped[grade] = [];
      }
      const sectionLetter = section.section || section.name.match(/[A-Z]/)?.[0] || 'A';
      if (!grouped[grade].includes(sectionLetter)) {
        grouped[grade].push(sectionLetter);
      }
    });

    // Initialize class sections for grades 2-10
    const classes: ClassSection[] = [];
    for (let grade = 2; grade <= 10; grade++) {
      classes.push({
        grade,
        sections: grouped[grade] || [],
      });
    }
    setClassSections(classes);
  };

  const addSectionToClass = (grade: number, sectionLetter: string) => {
    setClassSections((prev) =>
      prev.map((cs) =>
        cs.grade === grade
          ? { ...cs, sections: [...cs.sections, sectionLetter].sort() }
          : cs
      )
    );
  };

  const removeSectionFromClass = (grade: number, sectionLetter: string) => {
    setClassSections((prev) =>
      prev.map((cs) =>
        cs.grade === grade
          ? { ...cs, sections: cs.sections.filter((s) => s !== sectionLetter) }
          : cs
      )
    );
  };

  const toggleSectionSelection = (sectionId: string) => {
    if (selectedSections.includes(sectionId)) {
      setSelectedSections(selectedSections.filter((id) => id !== sectionId));
    } else {
      setSelectedSections([...selectedSections, sectionId]);
    }
  };

  const getAllSectionIds = () => {
    // Get all section IDs from available sections and class sections
    const allIds: string[] = [];
    
    // Add existing sections
    availableSections.forEach((s) => {
      if (selectedSections.includes(s.id)) {
        allIds.push(s.id);
      }
    });

    // For class sections, we'll need to create or find section IDs
    // This would typically involve API calls to create/find sections
    return allIds;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // First, create sections for class sections that don't exist
      const sectionIdsToUse = [...selectedSections];
      
      // Create sections for class-based selections
      const token = localStorage.getItem('token');
      for (const classSection of classSections) {
        for (const sectionLetter of classSection.sections) {
          try {
            // Check if section already exists
            const existing = availableSections.find(
              (s) => s.grade === classSection.grade.toString() && s.section === sectionLetter
            );
            
            if (!existing) {
              // Create new section - this would be an API call
              // For now, we'll use a placeholder ID
              const newSectionId = `grade-${classSection.grade}-${sectionLetter}`;
              sectionIdsToUse.push(newSectionId);
            } else {
              if (!sectionIdsToUse.includes(existing.id)) {
                sectionIdsToUse.push(existing.id);
              }
            }
          } catch (error) {
            console.error(`Error creating section Grade ${classSection.grade}-${sectionLetter}:`, error);
          }
        }
      }

      if (sectionIdsToUse.length === 0) {
        alert('Please select at least one section');
        return;
      }

      await onGenerate({
        mode,
        targetSections: sectionIdsToUse,
        constraints,
        optimizationSettings,
        classSections: classSections.filter((cs) => cs.sections.length > 0),
      });
    } catch (error: any) {
      console.error('Error generating timetable:', error);
      alert(error.response?.data?.error || 'Failed to generate timetable');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Step {step} of 3</span>
          <Progress value={(step / 3) * 100} className="w-32" />
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Select Generation Mode</Label>
            <RadioGroup value={mode} onValueChange={(v: any) => setMode(v)} className="mt-4">
              <div className="flex items-center space-x-2 p-4 border rounded-lg">
                <RadioGroupItem value="ai_powered" id="ai" />
                <Label htmlFor="ai" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="font-medium">AI-Powered (Recommended)</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Uses genetic algorithm to find optimal schedule
                  </p>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 border rounded-lg">
                <RadioGroupItem value="balanced" id="balanced" />
                <Label htmlFor="balanced" className="flex-1 cursor-pointer">
                  <span className="font-medium">Balanced Load</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Even distribution of subjects and workload
                  </p>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 border rounded-lg">
                <RadioGroupItem value="teacher_preference" id="teacher" />
                <Label htmlFor="teacher" className="flex-1 cursor-pointer">
                  <span className="font-medium">Teacher Preference</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Optimize for teacher convenience
                  </p>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 border rounded-lg">
                <RadioGroupItem value="student_focus" id="student" />
                <Label htmlFor="student" className="flex-1 cursor-pointer">
                  <span className="font-medium">Student Focus</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Avoid same subject consecutively
                  </p>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 border rounded-lg">
                <RadioGroupItem value="room_optimization" id="room" />
                <Label htmlFor="room" className="flex-1 cursor-pointer">
                  <span className="font-medium">Room Optimization</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Maximize room utilization
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Select Existing Sections</Label>
              <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border rounded-lg p-3">
                {availableSections.length > 0 ? (
                  availableSections.map((section) => (
                    <div key={section.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={section.id}
                        checked={selectedSections.includes(section.id)}
                        onCheckedChange={() => toggleSectionSelection(section.id)}
                      />
                      <Label htmlFor={section.id} className="cursor-pointer flex-1">
                        {section.name}
                      </Label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No existing sections</p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">Manage Sections by Class (2-10)</Label>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto border rounded-lg p-4">
                {classSections.map((classSection) => (
                  <ClassSectionManager
                    key={classSection.grade}
                    classSection={classSection}
                    onAddSection={(sectionLetter) => addSectionToClass(classSection.grade, sectionLetter)}
                    onRemoveSection={(sectionLetter) => removeSectionFromClass(classSection.grade, sectionLetter)}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Selected: {selectedSections.length} existing + {classSections.reduce((sum, cs) => sum + cs.sections.length, 0)} new sections
              </p>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Constraints</Label>
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Max Periods Per Day</Label>
                  <Input
                    type="number"
                    value={constraints.maxPeriodsPerDay}
                    onChange={(e) =>
                      setConstraints({
                        ...constraints,
                        maxPeriodsPerDay: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Max Consecutive Periods</Label>
                  <Input
                    type="number"
                    value={constraints.maxConsecutivePeriods}
                    onChange={(e) =>
                      setConstraints({
                        ...constraints,
                        maxConsecutivePeriods: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Max Teacher Periods Per Day</Label>
                  <Input
                    type="number"
                    value={constraints.maxTeacherPeriodsPerDay}
                    onChange={(e) =>
                      setConstraints({
                        ...constraints,
                        maxTeacherPeriodsPerDay: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Max Teacher Periods Per Week</Label>
                  <Input
                    type="number"
                    value={constraints.maxTeacherPeriodsPerWeek}
                    onChange={(e) =>
                      setConstraints({
                        ...constraints,
                        maxTeacherPeriodsPerWeek: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="avoidBackToBack"
                  checked={constraints.avoidBackToBackSubjects}
                  onCheckedChange={(checked) =>
                    setConstraints({
                      ...constraints,
                      avoidBackToBackSubjects: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="avoidBackToBack" className="cursor-pointer">
                  Avoid back-to-back same subjects
                </Label>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Optimization Settings</Label>
            <div className="mt-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="balanceWorkload"
                  checked={optimizationSettings.balanceWorkload}
                  onCheckedChange={(checked) =>
                    setOptimizationSettings({
                      ...optimizationSettings,
                      balanceWorkload: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="balanceWorkload" className="cursor-pointer">
                  Balance teacher workload
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="minimizeRoomChanges"
                  checked={optimizationSettings.minimizeRoomChanges}
                  onCheckedChange={(checked) =>
                    setOptimizationSettings({
                      ...optimizationSettings,
                      minimizeRoomChanges: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="minimizeRoomChanges" className="cursor-pointer">
                  Minimize room changes for teachers
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="maximizeFreePeriods"
                  checked={optimizationSettings.maximizeFreePeriods}
                  onCheckedChange={(checked) =>
                    setOptimizationSettings({
                      ...optimizationSettings,
                      maximizeFreePeriods: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="maximizeFreePeriods" className="cursor-pointer">
                  Maximize free periods for teachers
                </Label>
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Summary</h4>
            <div className="space-y-1 text-sm">
              <div>Mode: <Badge>{mode.replace('_', ' ')}</Badge></div>
              <div>
                Sections: {selectedSections.length} existing + {classSections.reduce((sum, cs) => sum + cs.sections.length, 0)} new
              </div>
              <div>Max periods/day: {constraints.maxPeriodsPerDay}</div>
              {classSections.filter((cs) => cs.sections.length > 0).length > 0 && (
                <div className="mt-2 pt-2 border-t">
                  <p className="font-medium mb-1">Classes with sections:</p>
                  <div className="flex flex-wrap gap-1">
                    {classSections
                      .filter((cs) => cs.sections.length > 0)
                      .map((cs) => (
                        <Badge key={cs.grade} variant="outline">
                          Grade {cs.grade}: {cs.sections.join(', ')}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isGenerating}>
          Cancel
        </Button>
        <div className="flex gap-2">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={isGenerating}
            >
              Previous
            </Button>
          )}
          {step < 3 ? (
            <Button type="button" onClick={() => setStep(step + 1)} disabled={isGenerating}>
              Next
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={
                isGenerating ||
                (selectedSections.length === 0 &&
                  classSections.reduce((sum, cs) => sum + cs.sections.length, 0) === 0)
              }
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Timetable
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Separate component for managing individual class sections
function ClassSectionManager({
  classSection,
  onAddSection,
  onRemoveSection,
}: {
  classSection: ClassSection;
  onAddSection: (letter: string) => void;
  onRemoveSection: (letter: string) => void;
}) {
  const [newSection, setNewSection] = useState('');

  const handleAdd = () => {
    if (newSection && /^[A-Z]$/.test(newSection)) {
      if (!classSection.sections.includes(newSection)) {
        onAddSection(newSection);
        setNewSection('');
      } else {
        alert('Section already exists');
      }
    }
  };

  return (
    <div className="border-b last:border-b-0 pb-3 last:pb-0">
      <div className="flex items-center justify-between mb-2">
        <Label className="font-medium">Grade {classSection.grade}</Label>
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="A-Z"
            value={newSection}
            onChange={(e) => {
              const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1);
              setNewSection(val);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
            className="w-16 h-8 text-center"
            maxLength={1}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            disabled={!newSection}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {classSection.sections.length > 0 ? (
          classSection.sections.map((sectionLetter) => (
            <Badge
              key={sectionLetter}
              variant="secondary"
              className="flex items-center gap-1 px-2 py-1"
            >
              {sectionLetter}
              <button
                type="button"
                onClick={() => onRemoveSection(sectionLetter)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">No sections - add one above</span>
        )}
      </div>
    </div>
  );
}
