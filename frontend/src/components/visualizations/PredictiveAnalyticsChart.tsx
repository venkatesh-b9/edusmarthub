import { useState, useRef } from 'react';
import {
  LineChart,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, ZoomIn, ZoomOut, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useAppSelector } from '@/store/hooks';

interface PredictiveDataPoint {
  date: string;
  actual?: number;
  predicted: number;
  confidenceUpper?: number;
  confidenceLower?: number;
  metadata?: Record<string, any>;
}

interface PredictiveAnalyticsChartProps {
  data: PredictiveDataPoint[];
  title?: string;
  subtitle?: string;
  xLabel?: string;
  yLabel?: string;
  actualLabel?: string;
  predictedLabel?: string;
  showConfidence?: boolean;
  showZoom?: boolean;
  onExport?: (format: 'png' | 'pdf' | 'csv') => void;
  realTimeUpdates?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  const { theme } = useTheme();
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      className={cn(
        'rounded-lg border p-3 shadow-lg backdrop-blur-sm',
        theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      )}
    >
      <p className="font-semibold mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm mb-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{entry.value?.toFixed(2) || 'N/A'}</span>
          {entry.payload.confidenceUpper && (
            <span className="text-xs text-muted-foreground">
              (95% CI: {entry.payload.confidenceLower?.toFixed(2)} -{' '}
              {entry.payload.confidenceUpper?.toFixed(2)})
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export function PredictiveAnalyticsChart({
  data,
  title = 'Predictive Analytics',
  subtitle,
  xLabel = 'Date',
  yLabel = 'Value',
  actualLabel = 'Actual',
  predictedLabel = 'Predicted',
  showConfidence = true,
  showZoom = true,
  onExport,
  realTimeUpdates = false,
}: PredictiveAnalyticsChartProps) {
  const { theme } = useTheme();
  const chartRef = useRef<HTMLDivElement>(null);
  const { isConnected } = useAppSelector((state) => state.realtime);
  const [zoomLevel, setZoomLevel] = useState(1);

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
    const headers = [xLabel, 'Actual', 'Predicted', 'Confidence Lower', 'Confidence Upper'];
    const rows = data.map((d) => [
      d.date,
      d.actual?.toString() || '',
      d.predicted.toString(),
      d.confidenceLower?.toString() || '',
      d.confidenceUpper?.toString() || '',
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
  const confidenceColor = theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(37, 99, 235, 0.2)';

  return (
    <Card className="w-full" ref={chartRef}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                {title}
                {realTimeUpdates && isConnected && (
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </CardTitle>
              {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            {showConfidence && (
              <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted text-xs">
                <Info className="h-3 w-3" />
                <span>95% Confidence Interval</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {showZoom && (
              <>
                <Button variant="outline" size="icon" onClick={() => setZoomLevel((z) => Math.min(z + 0.1, 2))}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setZoomLevel((z) => Math.max(z - 0.1, 0.5))}>
                  <ZoomOut className="h-4 w-4" />
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
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={(value) => {
                try {
                  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                } catch {
                  return value;
                }
              }}
              label={{ value: xLabel, position: 'insideBottom', offset: -5, style: { textAnchor: 'middle' } }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              label={{ value: yLabel, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
              formatter={(value) => <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>}
            />

            {/* Confidence interval area */}
            {showConfidence && data[0]?.confidenceUpper && (
              <>
                <Area
                  type="monotone"
                  dataKey="confidenceUpper"
                  stroke="none"
                  fill={confidenceColor}
                  connectNulls
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="confidenceLower"
                  stroke="none"
                  fill={confidenceColor}
                  connectNulls
                  isAnimationActive={false}
                />
              </>
            )}

            {/* Actual line */}
            {data[0]?.actual !== undefined && (
              <Line
                type="monotone"
                dataKey="actual"
                stroke={successColor}
                strokeWidth={3}
                dot={{ fill: successColor, r: 4 }}
                activeDot={{ r: 6 }}
                name={actualLabel}
                animationDuration={realTimeUpdates ? 500 : 1000}
              />
            )}

            {/* Predicted line */}
            <Line
              type="monotone"
              dataKey="predicted"
              stroke={primaryColor}
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={{ fill: primaryColor, r: 4 }}
              activeDot={{ r: 6 }}
              name={predictedLabel}
              animationDuration={realTimeUpdates ? 500 : 1000}
            />

            {/* Reference line for threshold */}
            <ReferenceLine y={70} stroke="rgb(251, 191, 36)" strokeDasharray="3 3" label="Target" />
          </AreaChart>
        </ResponsiveContainer>

        {/* Statistics */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Mean Actual</p>
            <p className="text-lg font-semibold">
              {(
                data.filter((d) => d.actual !== undefined).reduce((sum, d) => sum + (d.actual || 0), 0) /
                data.filter((d) => d.actual !== undefined).length || 0
              ).toFixed(2)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Mean Predicted</p>
            <p className="text-lg font-semibold">
              {(data.reduce((sum, d) => sum + d.predicted, 0) / data.length || 0).toFixed(2)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Accuracy</p>
            <p className="text-lg font-semibold">
              {data[0]?.actual !== undefined
                ? (
                    (1 -
                      Math.abs(
                        (data[0].actual || 0) -
                          data[0].predicted
                      ) /
                        (data[0].actual || 1)) *
                    100
                  ).toFixed(1) + '%'
                : 'N/A'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
