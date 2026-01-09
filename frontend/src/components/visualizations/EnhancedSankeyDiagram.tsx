import { useState, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { cn } from '@/lib/utils';

interface SankeyLink {
  source: string;
  target: string;
  value: number;
  color?: string;
  label?: string;
}

interface SankeyNode {
  id: string;
  label: string;
  category?: string;
  value?: number;
  color?: string;
}

interface EnhancedSankeyDiagramProps {
  links: SankeyLink[];
  nodes: SankeyNode[];
  title?: string;
  subtitle?: string;
  onNodeClick?: (node: SankeyNode) => void;
  onLinkClick?: (link: SankeyLink) => void;
  showZoom?: boolean;
  width?: number;
  height?: number;
}

export function EnhancedSankeyDiagram({
  links,
  nodes,
  title = 'Student Progression Flow',
  subtitle,
  onNodeClick,
  onLinkClick,
  showZoom = true,
  width = 1200,
  height = 600,
}: EnhancedSankeyDiagramProps) {
  const { theme } = useTheme();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const maxValue = Math.max(...links.map((l) => l.value));

  // Create node map
  const nodeMap = useMemo(() => {
    const map = new Map<string, SankeyNode>();
    nodes.forEach((node) => map.set(node.id, node));
    return map;
  }, [nodes]);

  // Categorize nodes by position (left, middle, right)
  const leftNodes = nodes.filter((n) => n.category === 'start' || !n.category).slice(0, 5);
  const middleNodes = nodes.filter((n) => n.category === 'middle').slice(0, 5);
  const rightNodes = nodes.filter((n) => n.category === 'end').slice(0, 5);

  const nodeHeight = 40;
  const nodeSpacing = 60;
  const columnWidth = 200;

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

  const getNodeColor = (node: SankeyNode) => {
    if (node.color) return node.color;
    const colors = theme === 'dark'
      ? ['rgb(59, 130, 246)', 'rgb(34, 197, 94)', 'rgb(251, 191, 36)', 'rgb(168, 85, 247)', 'rgb(239, 68, 68)']
      : ['rgb(37, 99, 235)', 'rgb(16, 185, 129)', 'rgb(245, 158, 11)', 'rgb(139, 92, 246)', 'rgb(220, 38, 38)'];
    const index = nodes.indexOf(node);
    return colors[index % colors.length];
  };

  const getLinkColor = (link: SankeyLink) => {
    if (link.color) return link.color;
    const sourceNode = nodeMap.get(link.source);
    if (sourceNode) {
      const color = getNodeColor(sourceNode);
      return theme === 'dark' ? `${color}80` : `${color}CC`;
    }
    return theme === 'dark' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(37, 99, 235, 0.6)';
  };

  const getNodeY = (node: SankeyNode, column: 'left' | 'middle' | 'right') => {
    const columnNodes = column === 'left' ? leftNodes : column === 'middle' ? middleNodes : rightNodes;
    const index = columnNodes.indexOf(node);
    return index * nodeSpacing + nodeHeight / 2;
  };

  const getNodeX = (column: 'left' | 'middle' | 'right') => {
    if (column === 'left') return 100;
    if (column === 'middle') return 400;
    return 700;
  };

  const generateCurvedPath = (
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    width: number
  ) => {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const dr = Math.sqrt(dx * dx + dy * dy);
    const sweep = dy > 0 ? 1 : 0;
    return `M ${sourceX} ${sourceY} A ${dr} ${dr} 0 0 ${sweep} ${targetX} ${targetY}`;
  };

  return (
    <Card className="w-full overflow-hidden">
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
                <Button variant="outline" size="icon" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>
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
          aria-label={`${title}: Flow diagram showing progression paths`}
        >
          <svg
            ref={svgRef}
            width={width}
            height={height}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'top left',
            }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,6 L9,3 z" fill="hsl(var(--foreground))" />
              </marker>
            </defs>

            {/* Links */}
            {links.map((link, index) => {
              const sourceNode = nodeMap.get(link.source);
              const targetNode = nodeMap.get(link.target);
              if (!sourceNode || !targetNode) return null;

              const sourceColumn = leftNodes.includes(sourceNode)
                ? 'left'
                : middleNodes.includes(sourceNode)
                ? 'middle'
                : 'right';
              const targetColumn = leftNodes.includes(targetNode)
                ? 'left'
                : middleNodes.includes(targetNode)
                ? 'middle'
                : 'right';

              const sourceX = getNodeX(sourceColumn) + 100;
              const sourceY = getNodeY(sourceNode, sourceColumn);
              const targetX = getNodeX(targetColumn);
              const targetY = getNodeY(targetNode, targetColumn);

              const linkWidth = (link.value / maxValue) * 30;
              const linkId = `link-${index}`;
              const isHovered = hoveredLink === linkId;

              return (
                <g key={linkId}>
                  <path
                    d={generateCurvedPath(sourceX, sourceY, targetX, targetY, linkWidth)}
                    stroke={getLinkColor(link)}
                    strokeWidth={linkWidth}
                    fill="none"
                    opacity={isHovered ? 1 : 0.6}
                    markerEnd="url(#arrowhead)"
                    className="cursor-pointer transition-opacity"
                    onMouseEnter={() => setHoveredLink(linkId)}
                    onMouseLeave={() => setHoveredLink(null)}
                    onClick={() => onLinkClick?.(link)}
                    aria-label={`Flow from ${sourceNode.label} to ${targetNode.label}: ${link.value} students`}
                  />
                  {/* Link label */}
                  {isHovered && (
                    <text
                      x={(sourceX + targetX) / 2}
                      y={(sourceY + targetY) / 2 - 10}
                      textAnchor="middle"
                      fill="hsl(var(--foreground))"
                      fontSize="12"
                      fontWeight="bold"
                      className="pointer-events-none"
                    >
                      {link.value}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {[...leftNodes, ...middleNodes, ...rightNodes].map((node) => {
              const column = leftNodes.includes(node)
                ? 'left'
                : middleNodes.includes(node)
                ? 'middle'
                : 'right';
              const x = getNodeX(column);
              const y = getNodeY(node, column);
              const isHovered = hoveredNode === node.id;
              const nodeColor = getNodeColor(node);
              const nodeValue = node.value || links.filter((l) => l.source === node.id || l.target === node.id).reduce((sum, l) => sum + l.value, 0);

              return (
                <g
                  key={node.id}
                  transform={`translate(${x}, ${y - nodeHeight / 2})`}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => onNodeClick?.(node)}
                  className="cursor-pointer"
                  aria-label={`Node: ${node.label}, Value: ${nodeValue}`}
                >
                  <rect
                    width={120}
                    height={nodeHeight}
                    fill={nodeColor}
                    stroke={isHovered ? 'hsl(var(--foreground))' : 'transparent'}
                    strokeWidth={isHovered ? 3 : 0}
                    rx={8}
                    className="transition-all"
                    opacity={isHovered ? 1 : 0.9}
                  />
                  <text
                    x={60}
                    y={nodeHeight / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="12"
                    fontWeight="semibold"
                    className="pointer-events-none select-none"
                  >
                    {node.label}
                  </text>
                  {nodeValue > 0 && (
                    <text
                      x={60}
                      y={nodeHeight / 2 + 15}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="10"
                      className="pointer-events-none select-none opacity-90"
                    >
                      {nodeValue}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg border shadow-sm">
            <span className="text-xs text-muted-foreground font-medium">Legend:</span>
            {nodes.slice(0, 5).map((node) => (
              <div key={node.id} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: getNodeColor(node) }}
                />
                <span className="text-xs">{node.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Total Nodes</p>
            <p className="text-lg font-semibold">{nodes.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Total Flow</p>
            <p className="text-lg font-semibold">{links.reduce((sum, l) => sum + l.value, 0)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Max Flow</p>
            <p className="text-lg font-semibold">{maxValue}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
