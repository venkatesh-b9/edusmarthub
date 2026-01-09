import { useState, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface HeatmapData {
  x: number | string;
  y: number | string;
  value: number;
  label?: string;
  studentId?: string;
  date?: string;
}

interface InteractiveHeatmapProps {
  data: HeatmapData[];
  xLabels?: string[];
  yLabels?: string[];
  title?: string;
  subtitle?: string;
  colorScale?: 'performance' | 'attendance' | 'temperature' | 'custom';
  onCellClick?: (data: HeatmapData) => void;
  showTooltip?: boolean;
  accessibility?: boolean;
}

export function InteractiveHeatmap({
  data,
  xLabels,
  yLabels,
  title = 'Performance Heatmap',
  subtitle,
  colorScale = 'performance',
  onCellClick,
  showTooltip = true,
  accessibility = true,
}: InteractiveHeatmapProps) {
  const { theme } = useTheme();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredCell, setHoveredCell] = useState<HeatmapData | null>(null);

  const minValue = Math.min(...data.map((d) => d.value));
  const maxValue = Math.max(...data.map((d) => d.value));

  const getColor = useCallback(
    (value: number) => {
      const normalized = (value - minValue) / (maxValue - minValue || 1);
      
      switch (colorScale) {
        case 'performance':
          if (normalized >= 0.8) return theme === 'dark' ? 'rgb(34, 197, 94)' : 'rgb(16, 185, 129)';
          if (normalized >= 0.6) return theme === 'dark' ? 'rgb(59, 130, 246)' : 'rgb(37, 99, 235)';
          if (normalized >= 0.4) return theme === 'dark' ? 'rgb(251, 191, 36)' : 'rgb(245, 158, 11)';
          return theme === 'dark' ? 'rgb(239, 68, 68)' : 'rgb(220, 38, 38)';
        case 'attendance':
          if (normalized >= 0.9) return 'rgb(34, 197, 94)';
          if (normalized >= 0.7) return 'rgb(59, 130, 246)';
          if (normalized >= 0.5) return 'rgb(251, 191, 36)';
          return 'rgb(239, 68, 68)';
        default:
          const hue = normalized * 240;
          return `hsl(${hue}, 70%, 50%)`;
      }
    },
    [minValue, maxValue, colorScale, theme]
  );

  const cellSize = 40;
  const padding = { top: 60, right: 60, bottom: 60, left: 60 };

  const uniqueX = Array.from(new Set(data.map((d) => d.x))).slice(0, 12);
  const uniqueY = Array.from(new Set(data.map((d) => d.y))).slice(0, 12);

  const width = uniqueX.length * cellSize + padding.left + padding.right;
  const height = uniqueY.length * cellSize + padding.top + padding.bottom;

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleExportPNG = async () => {
    if (!containerRef.current) return;
    const canvas = await html2canvas(containerRef.current);
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${title.replace(/\s+/g, '_')}.png`;
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
    pdf.save(`${title.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleZoomIn} aria-label="Zoom in">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom In</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleZoomOut} aria-label="Zoom out">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom Out</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleReset} aria-label="Reset view">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset View</TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-lg border bg-background"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
          role="img"
          aria-label={`${title}: Interactive heatmap showing data distribution`}
        >
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'top left',
              transition: isPanning ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            <svg
              ref={svgRef}
              width={width}
              height={height}
              className="overflow-visible"
              aria-label={accessibility ? `${title} visualization` : undefined}
            >
              {/* X-axis labels */}
              {uniqueX.map((x, i) => (
                <text
                  key={i}
                  x={padding.left + i * cellSize + cellSize / 2}
                  y={padding.top - 10}
                  textAnchor="middle"
                  className="fill-foreground text-xs"
                  fontSize="12"
                >
                  {xLabels?.[i] || String(x)}
                </text>
              ))}

              {/* Y-axis labels */}
              {uniqueY.map((y, i) => (
                <text
                  key={i}
                  x={padding.left - 10}
                  y={padding.top + i * cellSize + cellSize / 2}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-foreground text-xs"
                  fontSize="12"
                >
                  {yLabels?.[i] || String(y)}
                </text>
              ))}

              {/* Heatmap cells */}
              {data.slice(0, 144).map((item, index) => {
                const xIndex = uniqueX.indexOf(item.x);
                const yIndex = uniqueY.indexOf(item.y);
                if (xIndex === -1 || yIndex === -1) return null;

                const x = padding.left + xIndex * cellSize;
                const y = padding.top + yIndex * cellSize;
                const fill = getColor(item.value);

                return (
                  <g key={index}>
                    <rect
                      x={x}
                      y={y}
                      width={cellSize - 2}
                      height={cellSize - 2}
                      fill={fill}
                      stroke={hoveredCell === item ? '#000' : 'transparent'}
                      strokeWidth={2}
                      rx={4}
                      className="transition-all duration-200 cursor-pointer"
                      onMouseEnter={() => setHoveredCell(item)}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => onCellClick?.(item)}
                      aria-label={
                        accessibility
                          ? `Cell ${item.x}, ${item.y}: Value ${item.value.toFixed(2)}`
                          : undefined
                      }
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onCellClick?.(item);
                        }
                      }}
                    />
                    {showTooltip && hoveredCell === item && (
                      <text
                        x={x + cellSize / 2}
                        y={y + cellSize / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-foreground font-semibold text-xs pointer-events-none"
                        fontSize="12"
                      >
                        {item.value.toFixed(1)}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Tooltip overlay */}
              {showTooltip && hoveredCell && (
                <g>
                  <rect
                    x={pan.x + (uniqueX.indexOf(hoveredCell.x) * cellSize + padding.left)}
                    y={pan.y + (uniqueY.indexOf(hoveredCell.y) * cellSize + padding.top) - 40}
                    width={120}
                    height={35}
                    fill="rgba(0, 0, 0, 0.8)"
                    rx={4}
                  />
                  <text
                    x={pan.x + (uniqueX.indexOf(hoveredCell.x) * cellSize + padding.left) + 10}
                    y={pan.y + (uniqueY.indexOf(hoveredCell.y) * cellSize + padding.top) - 20}
                    fill="white"
                    fontSize="12"
                    fontWeight="bold"
                  >
                    {hoveredCell.label || `${hoveredCell.x}, ${hoveredCell.y}`}
                  </text>
                  <text
                    x={pan.x + (uniqueX.indexOf(hoveredCell.x) * cellSize + padding.left) + 10}
                    y={pan.y + (uniqueY.indexOf(hoveredCell.y) * cellSize + padding.top) - 8}
                    fill="white"
                    fontSize="10"
                  >
                    Value: {hoveredCell.value.toFixed(2)}
                  </text>
                </g>
              )}
            </svg>
          </div>

          {/* Color legend */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg border shadow-sm">
            <span className="text-xs text-muted-foreground">Low</span>
            <div className="flex gap-1">
              {[0, 0.25, 0.5, 0.75, 1].map((v) => (
                <div
                  key={v}
                  className="w-8 h-4 rounded"
                  style={{ backgroundColor: getColor(minValue + v * (maxValue - minValue)) }}
                  aria-label={`Color scale value: ${(minValue + v * (maxValue - minValue)).toFixed(1)}`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">High</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
