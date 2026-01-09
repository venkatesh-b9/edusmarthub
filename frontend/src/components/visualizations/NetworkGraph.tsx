import { useState, useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, ZoomIn, ZoomOut, RotateCcw, Users } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { cn } from '@/lib/utils';

interface Node {
  id: string;
  label: string;
  group?: number;
  value?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface Link {
  source: string | Node;
  target: string | Node;
  value?: number;
  strength?: number;
}

interface NetworkGraphProps {
  nodes: Node[];
  links: Link[];
  title?: string;
  subtitle?: string;
  onNodeClick?: (node: Node) => void;
  onLinkClick?: (link: Link) => void;
  width?: number;
  height?: number;
  showLabels?: boolean;
  linkDistance?: number;
  chargeStrength?: number;
}

export function NetworkGraph({
  nodes,
  links,
  title = 'Social Network Graph',
  subtitle,
  onNodeClick,
  onLinkClick,
  width = 800,
  height = 600,
  showLabels = true,
  linkDistance = 50,
  chargeStrength = -300,
}: NetworkGraphProps) {
  const { theme } = useTheme();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<Node, Link> | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const maxValue = Math.max(...nodes.map((n) => n.value || 1), 1);

  const getNodeColor = (node: Node) => {
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
    return colors[(node.group || 0) % colors.length];
  };

  const getNodeRadius = (node: Node) => {
    const normalized = (node.value || 1) / maxValue;
    return Math.sqrt(normalized) * 15 + 8;
  };

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create force simulation
    const simulation = d3
      .forceSimulation<Node>(nodes)
      .force(
        'link',
        d3.forceLink<Node, Link>(links).id((d) => d.id).distance(linkDistance)
      )
      .force('charge', d3.forceManyBody().strength(chargeStrength))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d) => getNodeRadius(d) + 5));

    simulationRef.current = simulation;

    // Create links
    const link = svg
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)')
      .attr('stroke-width', (d) => Math.sqrt(d.value || 1) * 2)
      .attr('stroke-opacity', 0.6)
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        onLinkClick?.(d);
      });

    // Create nodes
    const node = svg
      .append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', getNodeRadius)
      .attr('fill', getNodeColor)
      .attr('stroke', (d) => (selectedNode?.id === d.id ? 'white' : 'transparent'))
      .attr('stroke-width', 3)
      .attr('cursor', 'pointer')
      .attr('opacity', (d) => (selectedNode && selectedNode.id !== d.id ? 0.5 : 1))
      .call(
        d3
          .drag<SVGCircleElement, Node>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
            setIsDragging(true);
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
            setIsDragging(false);
          })
      )
      .on('mouseenter', (event, d) => {
        setHoveredNode(d);
        d3.select(event.currentTarget).attr('stroke', 'white').attr('stroke-width', 3);
      })
      .on('mouseleave', (event) => {
        setHoveredNode(null);
        d3.select(event.currentTarget).attr('stroke', 'transparent');
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
        onNodeClick?.(d);
      });

    // Create labels
    let labels: d3.Selection<SVGTextElement, Node, SVGGElement, unknown> | null = null;
    if (showLabels) {
      labels = svg
        .append('g')
        .attr('class', 'labels')
        .selectAll('text')
        .data(nodes)
        .enter()
        .append('text')
        .text((d) => d.label)
        .attr('font-size', 12)
        .attr('dx', 15)
        .attr('dy', 4)
        .attr('fill', theme === 'dark' ? 'white' : 'black')
        .attr('pointer-events', 'none')
        .attr('opacity', (d) => (hoveredNode?.id === d.id || selectedNode?.id === d.id ? 1 : 0));
    }

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as Node).x || 0)
        .attr('y1', (d) => (d.source as Node).y || 0)
        .attr('x2', (d) => (d.target as Node).x || 0)
        .attr('y2', (d) => (d.target as Node).y || 0);

      node.attr('cx', (d) => d.x || 0).attr('cy', (d) => d.y || 0);

      if (labels) {
        labels.attr('x', (d) => d.x || 0).attr('y', (d) => d.y || 0);
      }
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, links, width, height, linkDistance, chargeStrength, theme, selectedNode, hoveredNode, showLabels, onNodeClick, onLinkClick]);

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
    <Card className="w-full overflow-hidden" ref={containerRef}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>{title}</CardTitle>
              {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.min(z + 0.1, 2))}>
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
                setSelectedNode(null);
                if (simulationRef.current) {
                  simulationRef.current.restart();
                }
              }}
            >
              <RotateCcw className="h-4 w-4" />
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
        <div
          className="relative overflow-auto rounded-lg border bg-background"
          style={{ maxHeight: '700px', cursor: isDragging ? 'grabbing' : 'default' }}
          role="img"
          aria-label={`${title}: Network graph showing connections`}
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
          {hoveredNode && (
            <div className="absolute bg-card border rounded-lg p-3 shadow-lg z-10 pointer-events-none">
              <p className="font-semibold text-sm">{hoveredNode.label}</p>
              {hoveredNode.value !== undefined && (
                <p className="text-xs text-muted-foreground mt-1">Value: {hoveredNode.value}</p>
              )}
              {hoveredNode.group !== undefined && (
                <p className="text-xs text-muted-foreground">Group: {hoveredNode.group}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Connections: {links.filter((l) => (l.source as Node)?.id === hoveredNode.id || (l.target as Node)?.id === hoveredNode.id).length}
              </p>
            </div>
          )}
        </div>

        {/* Selected node details */}
        {selectedNode && (
          <div className="mt-4 p-4 rounded-lg border bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">{selectedNode.label}</h4>
              <Button variant="ghost" size="icon" onClick={() => setSelectedNode(null)}>
                ×
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">ID</p>
                <p className="font-semibold">{selectedNode.id}</p>
              </div>
              {selectedNode.value !== undefined && (
                <div>
                  <p className="text-muted-foreground">Value</p>
                  <p className="font-semibold">{selectedNode.value}</p>
                </div>
              )}
              {selectedNode.group !== undefined && (
                <div>
                  <p className="text-muted-foreground">Group</p>
                  <p className="font-semibold">{selectedNode.group}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Connections</p>
                <p className="font-semibold">
                  {links.filter((l) => (l.source as Node)?.id === selectedNode.id || (l.target as Node)?.id === selectedNode.id).length}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="mt-4 grid grid-cols-4 gap-4 text-center">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Nodes</p>
            <p className="text-lg font-semibold">{nodes.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Links</p>
            <p className="text-lg font-semibold">{links.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Groups</p>
            <p className="text-lg font-semibold">
              {new Set(nodes.map((n) => n.group).filter((g) => g !== undefined)).size}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Avg Connections</p>
            <p className="text-lg font-semibold">
              {nodes.length > 0
                ? ((links.length * 2) / nodes.length).toFixed(1)
                : '0'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
