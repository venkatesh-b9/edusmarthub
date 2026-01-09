import { useState, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Download, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { cn } from '@/lib/utils';

interface GaugeThreshold {
  label: string;
  value: number;
  color: string;
}

interface EnhancedGaugeChartProps {
  value: number;
  max: number;
  min?: number;
  title?: string;
  subtitle?: string;
  unit?: string;
  thresholds?: GaugeThreshold[];
  showLabels?: boolean;
  showNeedle?: boolean;
  onExport?: (format: 'png' | 'pdf') => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'attendance' | 'performance' | 'custom';
}

export function EnhancedGaugeChart({
  value,
  max,
  min = 0,
  title = 'Gauge Chart',
  subtitle,
  unit = '%',
  thresholds,
  showLabels = true,
  showNeedle = true,
  onExport,
  size = 'md',
  variant = 'custom',
}: EnhancedGaugeChartProps) {
  const { theme } = useTheme();
  const gaugeRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const percentage = ((value - min) / (max - min)) * 100;
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  const getDefaultThresholds = (): GaugeThreshold[] => {
    if (variant === 'attendance') {
      return [
        { label: 'Excellent', value: 90, color: theme === 'dark' ? 'rgb(34, 197, 94)' : 'rgb(16, 185, 129)' },
        { label: 'Good', value: 75, color: theme === 'dark' ? 'rgb(59, 130, 246)' : 'rgb(37, 99, 235)' },
        { label: 'Fair', value: 60, color: theme === 'dark' ? 'rgb(251, 191, 36)' : 'rgb(245, 158, 11)' },
        { label: 'Poor', value: 0, color: theme === 'dark' ? 'rgb(239, 68, 68)' : 'rgb(220, 38, 38)' },
      ];
    }
    if (variant === 'performance') {
      return [
        { label: 'Excellent', value: 85, color: theme === 'dark' ? 'rgb(34, 197, 94)' : 'rgb(16, 185, 129)' },
        { label: 'Good', value: 70, color: theme === 'dark' ? 'rgb(59, 130, 246)' : 'rgb(37, 99, 235)' },
        { label: 'Average', value: 50, color: theme === 'dark' ? 'rgb(251, 191, 36)' : 'rgb(245, 158, 11)' },
        { label: 'Below Average', value: 0, color: theme === 'dark' ? 'rgb(239, 68, 68)' : 'rgb(220, 38, 38)' },
      ];
    }
    return thresholds || [
      { label: 'High', value: 75, color: theme === 'dark' ? 'rgb(34, 197, 94)' : 'rgb(16, 185, 129)' },
      { label: 'Medium', value: 50, color: theme === 'dark' ? 'rgb(251, 191, 36)' : 'rgb(245, 158, 11)' },
      { label: 'Low', value: 0, color: theme === 'dark' ? 'rgb(239, 68, 68)' : 'rgb(220, 38, 38)' },
    ];
  };

  const gaugeThresholds = getDefaultThresholds();
  const currentThreshold = gaugeThresholds
    .slice()
    .reverse()
    .find((t) => percentage >= t.value);

  const getGaugeColor = () => {
    return currentThreshold?.color || gaugeThresholds[0].color;
  };

  const sizeMap = {
    sm: { container: 'w-48 h-48', text: 'text-3xl', subtitle: 'text-xs' },
    md: { container: 'w-64 h-64', text: 'text-4xl', subtitle: 'text-sm' },
    lg: { container: 'w-80 h-80', text: 'text-5xl', subtitle: 'text-base' },
  };

  const circumference = 2 * Math.PI * 80;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;

  const handleExportPNG = async () => {
    if (!gaugeRef.current) return;
    const canvas = await html2canvas(gaugeRef.current);
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${title.replace(/\s+/g, '_')}.png`;
    link.href = url;
    link.click();
    onExport?.('png');
  };

  const handleExportPDF = async () => {
    if (!gaugeRef.current) return;
    const canvas = await html2canvas(gaugeRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', (pdfWidth - pdfHeight) / 2, 0, pdfHeight, pdfHeight);
    pdf.save(`${title.replace(/\s+/g, '_')}.pdf`);
    onExport?.('pdf');
  };

  const getStatusIcon = () => {
    if (percentage >= 90) return <CheckCircle2 className="h-5 w-5 text-success" />;
    if (percentage >= 70) return <TrendingUp className="h-5 w-5 text-primary" />;
    if (percentage >= 50) return <AlertTriangle className="h-5 w-5 text-warning" />;
    return <TrendingDown className="h-5 w-5 text-destructive" />;
  };

  const getStatusBadge = () => {
    const status = currentThreshold?.label || 'Unknown';
    const color = getGaugeColor();
    return (
      <Badge
        className="gap-2"
        style={{
          backgroundColor: color,
          color: 'white',
        }}
      >
        {getStatusIcon()}
        {status}
      </Badge>
    );
  };

  return (
    <Card className="w-full" ref={gaugeRef}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
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
        <div className="flex flex-col items-center justify-center py-8">
          {/* Main Gauge */}
          <div className={cn('relative', sizeMap[size].container)}>
            <svg
              className="transform -rotate-90 w-full h-full"
              viewBox="0 0 200 200"
              style={{ filter: theme === 'dark' ? 'none' : 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}
            >
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r="80"
                stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                strokeWidth="16"
                fill="none"
              />

              {/* Threshold segments */}
              {gaugeThresholds.slice().reverse().map((threshold, index, array) => {
                const prevThreshold = array[index + 1];
                const startAngle = prevThreshold ? ((prevThreshold.value - min) / (max - min)) * 180 - 90 : -90;
                const endAngle = ((threshold.value - min) / (max - min)) * 180 - 90;
                const largeArc = endAngle - startAngle > 180 ? 1 : 0;

                if (endAngle <= startAngle) return null;

                const x1 = 100 + 80 * Math.cos((startAngle * Math.PI) / 180);
                const y1 = 100 + 80 * Math.sin((startAngle * Math.PI) / 180);
                const x2 = 100 + 80 * Math.cos((endAngle * Math.PI) / 180);
                const y2 = 100 + 80 * Math.sin((endAngle * Math.PI) / 180);

                return (
                  <path
                    key={threshold.label}
                    d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={threshold.color}
                    opacity={0.3}
                  />
                );
              })}

              {/* Value arc */}
              <circle
                cx="100"
                cy="100"
                r="80"
                stroke={getGaugeColor()}
                strokeWidth="16"
                fill="none"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                style={{
                  filter: `drop-shadow(0 0 8px ${getGaugeColor()})`,
                }}
              />

              {/* Needle */}
              {showNeedle && (
                <g
                  transform={`rotate(${(clampedPercentage / 100) * 180 - 90} 100 100)`}
                  className="transition-transform duration-1000 ease-out"
                >
                  <line
                    x1="100"
                    y1="100"
                    x2="100"
                    y2="30"
                    stroke={getGaugeColor()}
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="8"
                    fill={getGaugeColor()}
                    stroke="white"
                    strokeWidth="2"
                  />
                </g>
              )}
            </svg>

            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn('font-bold', sizeMap[size].text)} style={{ color: getGaugeColor() }}>
                {value.toFixed(1)}
              </span>
              <span className={cn('text-muted-foreground', sizeMap[size].subtitle)}>
                {unit} / {max}
              </span>
              <span className={cn('text-muted-foreground mt-1', sizeMap[size].subtitle)}>
                {clampedPercentage.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-md mt-6 space-y-2">
            <Progress value={clampedPercentage} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{min}</span>
              <span>Current: {value.toFixed(1)}</span>
              <span>{max}</span>
            </div>
          </div>

          {/* Threshold labels */}
          {showLabels && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
              {gaugeThresholds.slice().reverse().map((threshold) => (
                <div
                  key={threshold.label}
                  className={cn(
                    'p-3 rounded-lg border text-center transition-all',
                    currentThreshold?.label === threshold.label
                      ? 'border-2 bg-muted shadow-md scale-105'
                      : 'border-border bg-muted/30'
                  )}
                >
                  <div
                    className="w-4 h-4 rounded-full mx-auto mb-2"
                    style={{ backgroundColor: threshold.color }}
                  />
                  <p className="text-xs font-medium">{threshold.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {threshold.value >= min ? `≥${threshold.value}${unit}` : `<${threshold.value}${unit}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Current</p>
            <p className="text-lg font-semibold" style={{ color: getGaugeColor() }}>
              {value.toFixed(1)}{unit}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Percentage</p>
            <p className="text-lg font-semibold">{clampedPercentage.toFixed(1)}%</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="text-lg font-semibold">{currentThreshold?.label || 'Unknown'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
