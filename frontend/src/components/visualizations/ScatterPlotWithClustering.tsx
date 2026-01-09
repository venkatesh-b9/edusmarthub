import { useState, useRef, useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  ReferenceLine,
} from 'recharts';
import * as d3 from 'd3';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, ZoomIn, ZoomOut } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { cn } from '@/lib/utils';

interface ScatterDataPoint {
  x: number;
  y: number;
  name?: string;
  category?: string;
  value?: number;
  cluster?: number;
}

interface ScatterPlotWithClusteringProps {
  data: ScatterDataPoint[];
  title?: string;
  subtitle?: string;
  xLabel?: string;
  yLabel?: string;
  numClusters?: number;
  showClustering?: boolean;
  onPointClick?: (point: ScatterDataPoint) => void;
}

// K-means clustering algorithm
function kmeans(data: ScatterDataPoint[], k: number): number[] {
  const clusters: number[] = new Array(data.length).fill(0);
  const centroids: Array<{ x: number; y: number }> = [];

  // Initialize centroids randomly
  const xValues = data.map((d) => d.x);
  const yValues = data.map((d) => d.y);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);

  for (let i = 0; i < k; i++) {
    centroids.push({
      x: xMin + Math.random() * (xMax - xMin),
      y: yMin + Math.random() * (yMax - yMin),
    });
  }

  // K-means iteration
  let changed = true;
  let iterations = 0;
  const maxIterations = 100;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    // Assign points to nearest centroid
    for (let i = 0; i < data.length; i++) {
      const point = data[i];
      let minDist = Infinity;
      let nearestCluster = 0;

      for (let j = 0; j < k; j++) {
        const dist =
          Math.pow(point.x - centroids[j].x, 2) + Math.pow(point.y - centroids[j].y, 2);
        if (dist < minDist) {
          minDist = dist;
          nearestCluster = j;
        }
      }

      if (clusters[i] !== nearestCluster) {
        clusters[i] = nearestCluster;
        changed = true;
      }
    }

    // Update centroids
    for (let j = 0; j < k; j++) {
      const clusterPoints = data.filter((_, i) => clusters[i] === j);
      if (clusterPoints.length > 0) {
        centroids[j] = {
          x: clusterPoints.reduce((sum, p) => sum + p.x, 0) / clusterPoints.length,
          y: clusterPoints.reduce((sum, p) => sum + p.y, 0) / clusterPoints.length,
        };
      }
    }
  }

  return clusters;
}

const CustomTooltip = ({ active, payload }: any) => {
  const { theme } = useTheme();
  if (!active || !payload || !payload.length) return null;

  const point = payload[0].payload;
  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg backdrop-blur-sm">
      {point.name && <p className="font-semibold text-sm mb-1">{point.name}</p>}
      <p className="text-xs text-muted-foreground">X: {point.x.toFixed(2)}</p>
      <p className="text-xs text-muted-foreground">Y: {point.y.toFixed(2)}</p>
      {point.category && <p className="text-xs text-muted-foreground">Category: {point.category}</p>}
      {point.cluster !== undefined && (
        <p className="text-xs text-muted-foreground">Cluster: {point.cluster + 1}</p>
      )}
      {point.value !== undefined && (
        <p className="text-xs text-muted-foreground">Value: {point.value.toFixed(2)}</p>
      )}
    </div>
  );
};

export function ScatterPlotWithClustering({
  data,
  title = 'Scatter Plot with Clustering',
  subtitle,
  xLabel = 'X Axis',
  yLabel = 'Y Axis',
  numClusters = 3,
  showClustering = true,
  onPointClick,
}: ScatterPlotWithClusteringProps) {
  const { theme } = useTheme();
  const chartRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [hoveredPoint, setHoveredPoint] = useState<ScatterDataPoint | null>(null);

  // Perform clustering if enabled
  const clusteredData = useMemo(() => {
    if (!showClustering || data.length === 0) return data;
    const clusters = kmeans(data, numClusters);
    return data.map((point, index) => ({
      ...point,
      cluster: clusters[index],
    }));
  }, [data, numClusters, showClustering]);

  // Get unique clusters
  const uniqueClusters = useMemo(() => {
    if (!showClustering) return [0];
    const clusters = new Set(clusteredData.map((d) => d.cluster || 0));
    return Array.from(clusters).sort((a, b) => a - b);
  }, [clusteredData, showClustering]);

  // Color palette for clusters
  const getClusterColor = (cluster: number) => {
    const colors = theme === 'dark'
      ? [
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
          'rgb(251, 191, 36)',
          'rgb(168, 85, 247)',
          'rgb(239, 68, 68)',
          'rgb(236, 72, 153)',
        ]
      : [
          'rgb(37, 99, 235)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(139, 92, 246)',
          'rgb(220, 38, 38)',
          'rgb(219, 39, 119)',
        ];
    return colors[cluster % colors.length];
  };

  const handleExportPNG = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current);
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${title.replace(/\s+/g, '_')}.png`;
    link.href = url;
    link.click();
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
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'X', 'Y', 'Category', 'Cluster', 'Value'];
    const rows = clusteredData.map((d) => [
      d.name || '',
      d.x.toString(),
      d.y.toString(),
      d.category || '',
      d.cluster?.toString() || '',
      d.value?.toString() || '',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}.csv`;
    link.click();
  };

  // Calculate statistics
  const meanX = clusteredData.reduce((sum, d) => sum + d.x, 0) / clusteredData.length;
  const meanY = clusteredData.reduce((sum, d) => sum + d.y, 0) / clusteredData.length;

  // Group by cluster for statistics
  const clusterStats = uniqueClusters.map((cluster) => {
    const points = clusteredData.filter((d) => (d.cluster || 0) === cluster);
    return {
      cluster,
      count: points.length,
      meanX: points.reduce((sum, p) => sum + p.x, 0) / points.length,
      meanY: points.reduce((sum, p) => sum + p.y, 0) / points.length,
      color: getClusterColor(cluster),
    };
  });

  return (
    <Card className="w-full" ref={chartRef}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.min(z + 0.1, 2))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.max(z - 0.1, 0.5))}>
              <ZoomOut className="h-4 w-4" />
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
            <ScatterChart data={clusteredData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                type="number"
                dataKey="x"
                name={xLabel}
                label={{ value: xLabel, position: 'insideBottom', offset: -5 }}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                type="number"
                dataKey="y"
                name={yLabel}
                label={{ value: yLabel, angle: -90, position: 'insideLeft' }}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              {/* Reference lines for means */}
              <ReferenceLine x={meanX} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label="Mean X" />
              <ReferenceLine y={meanY} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label="Mean Y" />

              {/* Scatter plots by cluster */}
              {showClustering
                ? uniqueClusters.map((cluster) => (
                    <Scatter
                      key={cluster}
                      name={`Cluster ${cluster + 1}`}
                      data={clusteredData.filter((d) => (d.cluster || 0) === cluster)}
                      fill={getClusterColor(cluster)}
                      onClick={(data: any) => onPointClick?.(data)}
                    >
                      {clusteredData
                        .filter((d) => (d.cluster || 0) === cluster)
                        .map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={getClusterColor(cluster)}
                            opacity={hoveredPoint === entry ? 1 : 0.7}
                            onMouseEnter={() => setHoveredPoint(entry)}
                            onMouseLeave={() => setHoveredPoint(null)}
                          />
                        ))}
                    </Scatter>
                  ))
                : (
                    <Scatter name="Data" data={clusteredData} fill="hsl(217 91% 60%)">
                      {clusteredData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill="hsl(217 91% 60%)"
                          opacity={hoveredPoint === entry ? 1 : 0.7}
                          onMouseEnter={() => setHoveredPoint(entry)}
                          onMouseLeave={() => setHoveredPoint(null)}
                          onClick={() => onPointClick?.(entry)}
                        />
                      ))}
                    </Scatter>
                  )}
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Cluster statistics */}
        {showClustering && clusterStats.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {clusterStats.map((stat) => (
              <div key={stat.cluster} className="p-4 rounded-lg border" style={{ borderColor: stat.color }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: stat.color }} />
                  <h4 className="font-semibold">Cluster {stat.cluster + 1}</h4>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">Points: <span className="font-medium">{stat.count}</span></p>
                  <p className="text-muted-foreground">Mean X: <span className="font-medium">{stat.meanX.toFixed(2)}</span></p>
                  <p className="text-muted-foreground">Mean Y: <span className="font-medium">{stat.meanY.toFixed(2)}</span></p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Overall statistics */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Total Points</p>
            <p className="text-lg font-semibold">{data.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Clusters</p>
            <p className="text-lg font-semibold">{uniqueClusters.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Mean Point</p>
            <p className="text-lg font-semibold">
              ({meanX.toFixed(1)}, {meanY.toFixed(1)})
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
