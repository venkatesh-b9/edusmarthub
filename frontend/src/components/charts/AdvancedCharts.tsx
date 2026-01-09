import { useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import * as d3 from 'd3';
import { ChartCard } from '@/components/dashboard/Charts';
import { cn } from '@/lib/utils';

// Heatmap Chart Component
interface HeatmapProps {
  data: Array<{ x: number; y: number; value: number; label?: string }>;
  xLabels?: string[];
  yLabels?: string[];
  title?: string;
  subtitle?: string;
}

export function HeatmapChart({ data, xLabels, yLabels, title = 'Heatmap', subtitle }: HeatmapProps) {
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));

  const getColor = (value: number) => {
    const normalized = (value - minValue) / (maxValue - minValue);
    if (normalized < 0.25) return 'bg-blue-500/20';
    if (normalized < 0.5) return 'bg-blue-500/40';
    if (normalized < 0.75) return 'bg-blue-500/60';
    return 'bg-blue-500/80';
  };

  return (
    <ChartCard title={title} subtitle={subtitle}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          {xLabels && (
            <div className="grid grid-cols-7 gap-2">
              {xLabels.map((label, i) => (
                <div key={i} className="text-xs text-center text-muted-foreground">{label}</div>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {data.map((item, index) => (
            <div
              key={index}
              className={cn(
                'aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-colors',
                getColor(item.value)
              )}
              title={item.label || `Value: ${item.value}`}
            >
              {item.value}
            </div>
          ))}
        </div>
        {yLabels && (
          <div className="flex gap-4 text-xs text-muted-foreground">
            {yLabels.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>
        )}
      </div>
    </ChartCard>
  );
}

// Scatter Plot Component
interface ScatterData {
  x: number;
  y: number;
  name?: string;
}

interface ScatterPlotProps {
  data: ScatterData[];
  title?: string;
  subtitle?: string;
  xLabel?: string;
  yLabel?: string;
}

export function ScatterPlot({ data, title = 'Scatter Plot', subtitle, xLabel, yLabel }: ScatterPlotProps) {
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            dataKey="x"
            name={xLabel || 'X'}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yLabel || 'Y'}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Scatter name="Data" dataKey="y" fill="hsl(217 91% 60%)">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill="hsl(217 91% 60%)" />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Gauge Chart Component
interface GaugeChartProps {
  value: number;
  max: number;
  title?: string;
  subtitle?: string;
  colors?: {
    low: string;
    medium: string;
    high: string;
  };
}

export function GaugeChart({
  value,
  max,
  title = 'Gauge Chart',
  subtitle,
  colors = {
    low: 'hsl(0 84% 60%)',
    medium: 'hsl(38 92% 50%)',
    high: 'hsl(142 71% 45%)',
  },
}: GaugeChartProps) {
  const percentage = (value / max) * 100;
  const getColor = () => {
    if (percentage < 33) return colors.low;
    if (percentage < 66) return colors.medium;
    return colors.high;
  };

  const circumference = 2 * Math.PI * 80;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <ChartCard title={title} subtitle={subtitle}>
      <div className="flex flex-col items-center justify-center py-8">
        <div className="relative w-48 h-48">
          <svg className="transform -rotate-90 w-48 h-48">
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke="hsl(var(--border))"
              strokeWidth="16"
              fill="none"
            />
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke={getColor()}
              strokeWidth="16"
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold" style={{ color: getColor() }}>
              {value}
            </span>
            <span className="text-sm text-muted-foreground">/ {max}</span>
            <span className="text-xs text-muted-foreground mt-1">{percentage.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </ChartCard>
  );
}

// Sankey Diagram Component (Simplified visualization)
interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

interface SankeyChartProps {
  links: SankeyLink[];
  title?: string;
  subtitle?: string;
}

export function SankeyChart({ links, title = 'Sankey Diagram', subtitle }: SankeyChartProps) {
  const nodes = useMemo(() => {
    const nodeSet = new Set<string>();
    links.forEach((link) => {
      nodeSet.add(link.source);
      nodeSet.add(link.target);
    });
    return Array.from(nodeSet);
  }, [links]);

  const maxValue = Math.max(...links.map((l) => l.value));

  return (
    <ChartCard title={title} subtitle={subtitle}>
      <div className="space-y-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 space-y-2">
            {nodes.slice(0, Math.ceil(nodes.length / 2)).map((node, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm">{node}</span>
              </div>
            ))}
          </div>
          <div className="flex-1 space-y-2">
            {nodes.slice(Math.ceil(nodes.length / 2)).map((node, i) => (
              <div key={i} className="flex items-center gap-2 justify-end">
                <span className="text-sm">{node}</span>
                <div className="w-3 h-3 rounded-full bg-primary" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {links.map((link, i) => {
            const width = (link.value / maxValue) * 100;
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20 truncate">{link.source}</span>
                <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${width}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-20 truncate text-right">{link.target}</span>
                <span className="text-xs font-medium w-12 text-right">{link.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </ChartCard>
  );
}

// Predictive Analytics Chart
interface PredictiveData {
  date: string;
  actual?: number;
  predicted: number;
  confidence?: { lower: number; upper: number };
}

interface PredictiveChartProps {
  data: PredictiveData[];
  title?: string;
  subtitle?: string;
}

export function PredictiveChart({ data, title = 'Predictive Analytics', subtitle }: PredictiveChartProps) {
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <div className="space-y-4">
        <div className="relative h-64">
          <svg viewBox="0 0 800 200" className="w-full h-full">
            {/* Confidence band */}
            {data.length > 0 && data[0].confidence && (
              <polygon
                points={data
                  .map(
                    (d, i) =>
                      `${(i / (data.length - 1)) * 800},${200 - (d.confidence!.upper / 100) * 160}`
                  )
                  .concat(
                    data
                      .slice()
                      .reverse()
                      .map(
                        (d, i) =>
                          `${((data.length - 1 - i) / (data.length - 1)) * 800},${200 - (d.confidence!.lower / 100) * 160}`
                      )
                  )
                  .join(' ')}
                fill="hsl(217 91% 60% / 0.2)"
                stroke="none"
              />
            )}
            {/* Predicted line */}
            <polyline
              points={data
                .map(
                  (d, i) => `${(i / (data.length - 1)) * 800},${200 - (d.predicted / 100) * 160}`
                )
                .join(' ')}
              fill="none"
              stroke="hsl(217 91% 60%)"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            {/* Actual line */}
            {data[0].actual !== undefined && (
              <polyline
                points={data
                  .map((d, i) => {
                    if (d.actual !== undefined) {
                      return `${(i / (data.length - 1)) * 800},${200 - (d.actual / 100) * 160}`;
                    }
                    return null;
                  })
                  .filter(Boolean)
                  .join(' ')}
                fill="none"
                stroke="hsl(142 71% 45%)"
                strokeWidth="2"
              />
            )}
          </svg>
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground">
            {data.map((d, i) => (
              <span key={i} className={i % Math.ceil(data.length / 4) === 0 ? '' : 'opacity-0'}>
                {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center gap-6 text-sm">
          {data[0].actual !== undefined && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span>Actual</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-dashed border-primary" />
            <span>Predicted</span>
          </div>
          {data[0].confidence && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary/20" />
              <span>Confidence Band</span>
            </div>
          )}
        </div>
      </div>
    </ChartCard>
  );
}
