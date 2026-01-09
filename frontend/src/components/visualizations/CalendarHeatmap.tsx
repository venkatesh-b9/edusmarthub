import { useState, useRef, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, startOfYear, endOfYear, eachDayOfInterval, getDay, isSameMonth, isToday, startOfMonth, endOfMonth } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { cn } from '@/lib/utils';

interface AttendanceData {
  date: string;
  value: number;
  status?: 'present' | 'absent' | 'late' | 'excused';
  label?: string;
}

interface CalendarHeatmapProps {
  data: AttendanceData[];
  title?: string;
  subtitle?: string;
  year?: number;
  onDayClick?: (data: AttendanceData) => void;
  colorScale?: 'attendance' | 'performance' | 'temperature';
}

export function CalendarHeatmap({
  data,
  title = 'Attendance Calendar Heatmap',
  subtitle,
  year = new Date().getFullYear(),
  onDayClick,
  colorScale = 'attendance',
}: CalendarHeatmapProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentYear, setCurrentYear] = useState(year);
  const [selectedDay, setSelectedDay] = useState<AttendanceData | null>(null);
  const [hoveredDay, setHoveredDay] = useState<AttendanceData | null>(null);

  const yearStart = startOfYear(new Date(currentYear, 0, 1));
  const yearEnd = endOfYear(new Date(currentYear, 11, 31));
  const daysInYear = eachDayOfInterval({ start: yearStart, end: yearEnd });

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  const getColor = (value: number, status?: string) => {
    if (status === 'absent') return theme === 'dark' ? 'rgb(239, 68, 68)' : 'rgb(220, 38, 38)';
    if (status === 'late') return theme === 'dark' ? 'rgb(251, 191, 36)' : 'rgb(245, 158, 11)';
    if (status === 'excused') return theme === 'dark' ? 'rgb(168, 85, 247)' : 'rgb(139, 92, 246)';

    const normalized = value / maxValue;

    if (colorScale === 'attendance') {
      if (normalized >= 0.9) return theme === 'dark' ? 'rgb(34, 197, 94)' : 'rgb(16, 185, 129)';
      if (normalized >= 0.75) return theme === 'dark' ? 'rgb(59, 130, 246)' : 'rgb(37, 99, 235)';
      if (normalized >= 0.5) return theme === 'dark' ? 'rgb(251, 191, 36)' : 'rgb(245, 158, 11)';
      return theme === 'dark' ? 'rgb(239, 68, 68)' : 'rgb(220, 38, 38)';
    }

    // Performance/temperature scale
    const hue = normalized * 240;
    return `hsl(${hue}, 70%, 50%)`;
  };

  const dataMap = useMemo(() => {
    const map = new Map<string, AttendanceData>();
    data.forEach((d) => {
      const dateKey = format(new Date(d.date), 'yyyy-MM-dd');
      map.set(dateKey, d);
    });
    return map;
  }, [data]);

  const handleExportPNG = async () => {
    if (!containerRef.current) return;
    const canvas = await html2canvas(containerRef.current);
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${title.replace(/\s+/g, '_')}_${currentYear}.png`;
    link.href = url;
    link.click();
  };

  const handleExportPDF = async () => {
    if (!containerRef.current) return;
    const canvas = await html2canvas(containerRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${title.replace(/\s+/g, '_')}_${currentYear}.pdf`);
  };

  const cellSize = 12;
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const weekStartDays: number[] = [];
  daysInYear.forEach((day) => {
    const dayOfWeek = getDay(day);
    if (dayOfWeek === 0 && weekStartDays.length === 0) {
      weekStartDays.push(day.getTime());
    } else if (weekStartDays.length > 0) {
      const lastWeekStart = new Date(weekStartDays[weekStartDays.length - 1]);
      if (day.getTime() - lastWeekStart.getTime() >= 7 * 24 * 60 * 60 * 1000) {
        weekStartDays.push(day.getTime());
      }
    }
  });

  // Group days by month
  const monthGroups: Array<{ month: number; days: Date[] }> = [];
  for (let month = 0; month < 12; month++) {
    const monthStart = startOfMonth(new Date(currentYear, month, 1));
    const monthEnd = endOfMonth(new Date(currentYear, month, 1));
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    monthGroups.push({ month, days: daysInMonth });
  }

  return (
    <Card className="w-full overflow-hidden" ref={containerRef}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>{title}</CardTitle>
              {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentYear((y) => y - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[80px] text-center">{currentYear}</span>
            <Button variant="outline" size="icon" onClick={() => setCurrentYear((y) => y + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="border-l h-6 mx-2" />
            <Button variant="outline" size="sm" onClick={handleExportPNG} className="gap-2">
              <Download className="h-4 w-4" />
              PNG
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2">
              <Download className="h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Weekday labels */}
            <div className="flex mb-2">
              <div className="w-20" /> {/* Space for month labels */}
              <div className="flex gap-1">
                {dayLabels.map((day, i) => (
                  <div
                    key={i}
                    className="w-3 text-center text-xs text-muted-foreground font-medium"
                    style={{ display: i % 2 === 0 ? 'block' : 'none' }}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>

            {/* Calendar grid */}
            {monthGroups.map(({ month, days }) => (
              <div key={month} className="flex mb-1 items-center">
                {/* Month label */}
                <div className="w-20 text-xs font-medium text-muted-foreground pr-2 text-right">
                  {monthLabels[month]}
                </div>

                {/* Calendar cells */}
                <div className="flex gap-1 flex-1">
                  {days.map((day) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const dayData = dataMap.get(dateKey);
                    const dayOfWeek = getDay(day);
                    const today = isToday(day);
                    const isSelected = selectedDay?.date === dateKey;
                    const isHovered = hoveredDay?.date === dateKey;

                    return (
                      <div
                        key={dateKey}
                        className={cn(
                          'rounded transition-all cursor-pointer relative group',
                          today && 'ring-2 ring-primary',
                          isSelected && 'ring-2 ring-accent',
                          isHovered && 'scale-125 z-10'
                        )}
                        style={{
                          width: cellSize,
                          height: cellSize,
                          backgroundColor: dayData
                            ? getColor(dayData.value, dayData.status)
                            : theme === 'dark'
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(0, 0, 0, 0.05)',
                          border: dayOfWeek === 0 || dayOfWeek === 6 ? `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` : 'none',
                        }}
                        onMouseEnter={() => dayData && setHoveredDay(dayData)}
                        onMouseLeave={() => setHoveredDay(null)}
                        onClick={() => {
                          if (dayData) {
                            setSelectedDay(dayData);
                            onDayClick?.(dayData);
                          }
                        }}
                        aria-label={`${format(day, 'MMMM d, yyyy')}: ${dayData?.value || 'No data'}`}
                        title={dayData?.label || format(day, 'MMM d, yyyy')}
                      >
                        {/* Tooltip on hover */}
                        {isHovered && dayData && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-card border rounded-lg p-2 shadow-lg z-20 whitespace-nowrap">
                            <p className="text-xs font-medium">{format(day, 'MMM d, yyyy')}</p>
                            <p className="text-xs text-muted-foreground">Value: {dayData.value.toFixed(2)}</p>
                            {dayData.status && (
                              <p className="text-xs text-muted-foreground">Status: {dayData.status}</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-6">
          <span className="text-xs text-muted-foreground font-medium">Less</span>
          <div className="flex gap-1">
            {[0, 0.25, 0.5, 0.75, 1.0].map((v) => {
              const value = maxValue * v;
              return (
                <div
                  key={v}
                  className="rounded"
                  style={{
                    width: cellSize * 2,
                    height: cellSize * 2,
                    backgroundColor: getColor(value),
                  }}
                  title={`${value.toFixed(1)}`}
                />
              );
            })}
          </div>
          <span className="text-xs text-muted-foreground font-medium">More</span>
        </div>

        {/* Selected day details */}
        {selectedDay && (
          <div className="mt-4 p-4 rounded-lg border bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">{format(new Date(selectedDay.date), 'MMMM d, yyyy')}</h4>
              <Button variant="ghost" size="icon" onClick={() => setSelectedDay(null)}>
                ×
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Value</p>
                <p className="font-semibold">{selectedDay.value.toFixed(2)}</p>
              </div>
              {selectedDay.status && (
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-semibold capitalize">{selectedDay.status}</p>
                </div>
              )}
              {selectedDay.label && (
                <div>
                  <p className="text-muted-foreground">Label</p>
                  <p className="font-semibold">{selectedDay.label}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="mt-4 grid grid-cols-4 gap-4 text-center">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Total Days</p>
            <p className="text-lg font-semibold">{daysInYear.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Data Points</p>
            <p className="text-lg font-semibold">{data.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Avg Value</p>
            <p className="text-lg font-semibold">
              {(data.reduce((sum, d) => sum + d.value, 0) / data.length || 0).toFixed(2)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Max Value</p>
            <p className="text-lg font-semibold">{maxValue.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
