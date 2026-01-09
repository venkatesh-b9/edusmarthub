import { useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, ZoomIn, ZoomOut, RotateCcw, MapPin } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { cn } from '@/lib/utils';

interface SchoolLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  value: number;
  students?: number;
  teachers?: number;
  performance?: number;
}

interface GeographicMapProps {
  data: SchoolLocation[];
  title?: string;
  subtitle?: string;
  onSchoolClick?: (school: SchoolLocation) => void;
  showZoom?: boolean;
}

export function GeographicMap({
  data,
  title = 'School Distribution Map',
  subtitle,
  onSchoolClick,
  showZoom = true,
}: GeographicMapProps) {
  const { theme } = useTheme();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredSchool, setHoveredSchool] = useState<SchoolLocation | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<SchoolLocation | null>(null);

  const maxValue = Math.max(...data.map((d) => d.value));

  const width = 1000;
  const height = 600;

  // Projection for map (simplified Mercator)
  const projection = d3
    .geoMercator()
    .scale(100)
    .translate([width / 2, height / 2]);

  const getColor = (value: number) => {
    const normalized = value / maxValue;
    if (normalized >= 0.8) return theme === 'dark' ? 'rgb(34, 197, 94)' : 'rgb(16, 185, 129)';
    if (normalized >= 0.6) return theme === 'dark' ? 'rgb(59, 130, 246)' : 'rgb(37, 99, 235)';
    if (normalized >= 0.4) return theme === 'dark' ? 'rgb(251, 191, 36)' : 'rgb(245, 158, 11)';
    return theme === 'dark' ? 'rgb(239, 68, 68)' : 'rgb(220, 38, 38)';
  };

  const getRadius = (value: number) => {
    const normalized = value / maxValue;
    return Math.sqrt(normalized) * 30 + 5;
  };

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Draw simplified grid/map background
    const gridGroup = svg.append('g').attr('class', 'grid');

    for (let i = 0; i < 10; i++) {
      gridGroup
        .append('line')
        .attr('x1', (width / 10) * i)
        .attr('y1', 0)
        .attr('x2', (width / 10) * i)
        .attr('y2', height)
        .attr('stroke', theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')
        .attr('stroke-width', 1);
    }

    for (let i = 0; i < 6; i++) {
      gridGroup
        .append('line')
        .attr('x1', 0)
        .attr('y1', (height / 6) * i)
        .attr('x2', width)
        .attr('y2', (height / 6) * i)
        .attr('stroke', theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')
        .attr('stroke-width', 1);
    }

    // Plot schools
    const schoolsGroup = svg.append('g').attr('class', 'schools');

    data.forEach((school) => {
      const [x, y] = projection([school.lng, school.lat]) || [school.lng * 10 + width / 2, school.lat * -10 + height / 2];
      const radius = getRadius(school.value);
      const color = getColor(school.value);
      const isHovered = hoveredSchool?.id === school.id;
      const isSelected = selectedSchool?.id === school.id;

      const schoolGroup = schoolsGroup
        .append('g')
        .attr('class', 'school-marker')
        .attr('transform', `translate(${x}, ${y})`)
        .attr('cursor', 'pointer')
        .on('mouseenter', () => setHoveredSchool(school))
        .on('mouseleave', () => setHoveredSchool(null))
        .on('click', () => {
          setSelectedSchool(school);
          onSchoolClick?.(school);
        });

      // Outer ring for hover/selected state
      if (isHovered || isSelected) {
        schoolGroup
          .append('circle')
          .attr('r', radius + 5)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', 2)
          .attr('opacity', 0.5);
      }

      // Main circle
      schoolGroup
        .append('circle')
        .attr('r', radius)
        .attr('fill', color)
        .attr('stroke', theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)')
        .attr('stroke-width', isSelected ? 3 : 1)
        .attr('opacity', isHovered ? 1 : 0.8)
        .transition()
        .duration(200)
        .attr('r', isHovered ? radius + 2 : radius);

      // Pin icon
      schoolGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('fill', 'white')
        .attr('font-size', Math.max(10, radius / 2))
        .attr('font-weight', 'bold')
        .text('📚');
    });
  }, [data, hoveredSchool, selectedSchool, theme]);

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
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {title}
            </CardTitle>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {showZoom && (
              <>
                <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.min(z + 0.1, 3))}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.max(z - 0.1, 0.5))}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                    setSelectedSchool(null);
                  }}
                >
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
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={containerRef}
          className="relative overflow-auto rounded-lg border bg-background p-4"
          style={{ maxHeight: '700px' }}
          role="img"
          aria-label={`${title}: Map showing school distribution`}
        >
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'top left',
            }}
          >
            <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
          </div>

          {/* Tooltip */}
          {hoveredSchool && (
            <div
              className="absolute bg-card border rounded-lg p-3 shadow-lg z-10 pointer-events-none"
              style={{
                left: `${projection([hoveredSchool.lng, hoveredSchool.lat])?.[0] || 0 + pan.x}px`,
                top: `${projection([hoveredSchool.lng, hoveredSchool.lat])?.[1] || 0 + pan.y - 80}px`,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <p className="font-semibold text-sm">{hoveredSchool.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Value: {hoveredSchool.value.toFixed(2)}
              </p>
              {hoveredSchool.students && (
                <p className="text-xs text-muted-foreground">Students: {hoveredSchool.students.toLocaleString()}</p>
              )}
              {hoveredSchool.teachers && (
                <p className="text-xs text-muted-foreground">Teachers: {hoveredSchool.teachers}</p>
              )}
              {hoveredSchool.performance !== undefined && (
                <p className="text-xs text-muted-foreground">Performance: {hoveredSchool.performance}%</p>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg border shadow-sm">
            <span className="text-xs text-muted-foreground font-medium">Intensity:</span>
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((v) => {
              const value = maxValue * v;
              return (
                <div key={v} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getColor(value) }}
                  />
                  <span className="text-xs text-muted-foreground">{value.toFixed(0)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected school details */}
        {selectedSchool && (
          <div className="mt-4 p-4 rounded-lg border bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">{selectedSchool.name}</h4>
              <Button variant="ghost" size="icon" onClick={() => setSelectedSchool(null)}>
                ×
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Value</p>
                <p className="font-semibold">{selectedSchool.value.toFixed(2)}</p>
              </div>
              {selectedSchool.students && (
                <div>
                  <p className="text-muted-foreground">Students</p>
                  <p className="font-semibold">{selectedSchool.students.toLocaleString()}</p>
                </div>
              )}
              {selectedSchool.teachers && (
                <div>
                  <p className="text-muted-foreground">Teachers</p>
                  <p className="font-semibold">{selectedSchool.teachers}</p>
                </div>
              )}
              {selectedSchool.performance !== undefined && (
                <div>
                  <p className="text-muted-foreground">Performance</p>
                  <p className="font-semibold">{selectedSchool.performance}%</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Total Schools</p>
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
