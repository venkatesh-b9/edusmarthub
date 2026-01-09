import { useState, useRef } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  LabelList,
} from 'recharts';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface SchoolData {
  name: string;
  performance: number;
  enrollment: number;
  teachers: number;
  budget: number;
  satisfaction?: number;
}

interface MultiAxisComparisonChartProps {
  data: SchoolData[];
  title?: string;
  subtitle?: string;
  onExport?: (format: 'png' | 'pdf' | 'csv') => void;
  showZoom?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  const { theme } = useTheme();
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg backdrop-blur-sm">
      <p className="font-semibold mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm mb-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">
            {entry.value?.toLocaleString() || 'N/A'}
            {entry.dataKey === 'performance' || entry.dataKey === 'satisfaction' ? '%' : ''}
          </span>
        </div>
      ))}
    </div>
  );
};

export function MultiAxisComparisonChart({
  data,
  title = 'School Benchmarking Comparison',
  subtitle,
  onExport,
  showZoom = true,
}: MultiAxisComparisonChartProps) {
  const { theme } = useTheme();
  const chartRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['performance', 'enrollment', 'teachers']);

  const handleExportPNG = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current);
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${title.replace(/\s+/g, '_')}.png`;
    link.href = url;
    link.click();
    onExport?.('png');
  };

  const handleExportPDF = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${title.replace(/\s+/g, '_')}.pdf`);
    onExport?.('pdf');
  };

  const handleExportCSV = () => {
    const headers = ['School', 'Performance %', 'Enrollment', 'Teachers', 'Budget', 'Satisfaction %'];
    const rows = data.map((d) => [
      d.name,
      d.performance.toString(),
      d.enrollment.toString(),
      d.teachers.toString(),
      d.budget.toString(),
      d.satisfaction?.toString() || '',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}.csv`;
    link.click();
    onExport?.('csv');
  };

  const primaryColor = theme === 'dark' ? 'rgb(59, 130, 246)' : 'rgb(37, 99, 235)';
  const successColor = theme === 'dark' ? 'rgb(34, 197, 94)' : 'rgb(16, 185, 129)';
  const warningColor = theme === 'dark' ? 'rgb(251, 191, 36)' : 'rgb(245, 158, 11)';
  const accentColor = theme === 'dark' ? 'rgb(168, 85, 247)' : 'rgb(139, 92, 246)';

  // Calculate averages for reference lines
  const avgPerformance = data.reduce((sum, d) => sum + d.performance, 0) / data.length;
  const avgEnrollment = data.reduce((sum, d) => sum + d.enrollment, 0) / data.length;
  const maxEnrollment = Math.max(...data.map((d) => d.enrollment));

  // Normalize enrollment for display (scale to percentage range)
  const normalizedData = data.map((d) => ({
    ...d,
    enrollmentNormalized: (d.enrollment / maxEnrollment) * 100,
  }));

  return (
    <Card className="w-full" ref={chartRef}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {showZoom && (
              <>
                <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.min(z + 0.1, 2))}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.max(z - 0.1, 0.5))}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setZoom(1)}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </>
            )}
            <div className="border-l h-6 mx-2" />
            <Button variant="outline" size="sm" onClick={handleExportPNG} className="gap-2">
              <Download className="h-4 w-4" />
              PNG
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2">
              <Download className="h-4 w-4" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
              <Download className="h-4 w-4" />
              CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
          <ResponsiveContainer width="100%" height={500}>
            <ComposedChart
              data={normalizedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                yAxisId="left"
                stroke={primaryColor}
                fontSize={12}
                label={{ value: 'Performance & Satisfaction (%)', angle: -90, position: 'insideLeft' }}
                domain={[0, 100]}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke={successColor}
                fontSize={12}
                label={{ value: 'Enrollment (Normalized)', angle: 90, position: 'insideRight' }}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>}
              />

              {/* Reference lines */}
              <ReferenceLine
                yAxisId="left"
                y={avgPerformance}
                stroke={primaryColor}
                strokeDasharray="3 3"
                label={{ value: `Avg Performance: ${avgPerformance.toFixed(1)}%`, position: 'topRight' }}
              />

              {/* Bar charts */}
              {selectedMetrics.includes('enrollment') && (
                <Bar
                  yAxisId="right"
                  dataKey="enrollmentNormalized"
                  fill={successColor}
                  name="Enrollment (Normalized)"
                  radius={[4, 4, 0, 0]}
                  opacity={0.7}
                >
                  <LabelList
                    dataKey="enrollment"
                    position="top"
                    formatter={(value: number) => value.toLocaleString()}
                    style={{ fill: successColor, fontSize: '10px' }}
                  />
                </Bar>
              )}

              {/* Line charts */}
              {selectedMetrics.includes('performance') && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="performance"
                  stroke={primaryColor}
                  strokeWidth={3}
                  dot={{ fill: primaryColor, r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Performance (%)"
                  animationDuration={1000}
                />
              )}

              {selectedMetrics.includes('satisfaction') && data[0]?.satisfaction !== undefined && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="satisfaction"
                  stroke={accentColor}
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={{ fill: accentColor, r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Satisfaction (%)"
                  animationDuration={1000}
                />
              )}

              {selectedMetrics.includes('teachers') && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="teachers"
                  stroke={warningColor}
                  strokeWidth={2}
                  dot={{ fill: warningColor, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Teachers Count"
                  animationDuration={1000}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Metric selector */}
        <div className="mt-6 flex flex-wrap gap-3 p-4 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium text-muted-foreground">Show Metrics:</span>
          {[
            { key: 'performance', label: 'Performance' },
            { key: 'enrollment', label: 'Enrollment' },
            { key: 'teachers', label: 'Teachers' },
            { key: 'satisfaction', label: 'Satisfaction' },
          ].map((metric) => (
            <label key={metric.key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedMetrics.includes(metric.key)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedMetrics([...selectedMetrics, metric.key]);
                  } else {
                    setSelectedMetrics(selectedMetrics.filter((m) => m !== metric.key));
                  }
                }}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{metric.label}</span>
            </label>
          ))}
        </div>

        {/* Summary statistics */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Avg Performance</p>
            <p className="text-xl font-bold text-primary">{avgPerformance.toFixed(1)}%</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Avg Enrollment</p>
            <p className="text-xl font-bold text-success">{Math.round(avgEnrollment).toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Schools</p>
            <p className="text-xl font-bold">{data.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Top Performer</p>
            <p className="text-xl font-bold text-warning">
              {data.reduce((max, d) => (d.performance > max.performance ? d : max), data[0])?.name || 'N/A'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
