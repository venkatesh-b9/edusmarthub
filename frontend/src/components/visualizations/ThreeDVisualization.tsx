import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface DataPoint3D {
  id: string;
  x: number;
  y: number;
  z: number;
  label?: string;
  value?: number;
  color?: string;
  shape?: 'sphere' | 'box' | 'cone' | 'torus';
}

interface ThreeDVisualizationProps {
  data: DataPoint3D[];
  title?: string;
  subtitle?: string;
  onPointClick?: (point: DataPoint3D) => void;
  enableRotation?: boolean;
  enableZoom?: boolean;
}

function DataPointMesh({
  point,
  onClick,
  onHover,
}: {
  point: DataPoint3D;
  onClick?: (point: DataPoint3D) => void;
  onHover?: (point: DataPoint3D | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current && hovered) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.rotation.x += 0.005;
    }
  });

  const size = (point.value || 1) * 0.5 + 0.5;
  const color = point.color || '#3b82f6';

  const handleClick = () => {
    onClick?.(point);
  };

  const handlePointerOver = () => {
    setHovered(true);
    onHover?.(point);
  };

  const handlePointerOut = () => {
    setHovered(false);
    onHover?.(null);
  };

  return (
    <group position={[point.x, point.y, point.z]}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        {point.shape === 'box' && <boxGeometry args={[size, size, size]} />}
        {point.shape === 'cone' && <coneGeometry args={[size, size * 2, 8]} />}
        {point.shape === 'torus' && <torusGeometry args={[size, size * 0.3, 16, 32]} />}
        {(!point.shape || point.shape === 'sphere') && <sphereGeometry args={[size, 32, 32]} />}
        <meshStandardMaterial
          color={color}
          emissive={hovered ? color : '#000000'}
          emissiveIntensity={hovered ? 0.5 : 0}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
      {point.label && hovered && (
        <Text
          position={[0, size + 1, 0]}
          fontSize={0.5}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {point.label}
        </Text>
      )}
    </group>
  );
}

function Scene({
  data,
  onPointClick,
  onPointHover,
}: {
  data: DataPoint3D[];
  onPointClick?: (point: DataPoint3D) => void;
  onPointHover?: (point: DataPoint3D | null) => void;
}) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />
      <gridHelper args={[20, 20, '#888888', '#444444']} />
      <axesHelper args={[10]} />
      {data.map((point) => (
        <DataPointMesh
          key={point.id}
          point={point}
          onClick={onPointClick}
          onHover={onPointHover}
        />
      ))}
    </>
  );
}

export function ThreeDVisualization({
  data,
  title = '3D Data Visualization',
  subtitle,
  onPointClick,
  enableRotation = true,
  enableZoom = true,
}: ThreeDVisualizationProps) {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint3D | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<DataPoint3D | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleExportPNG = async () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current.querySelector('canvas');
    if (!canvas) return;

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${title.replace(/\s+/g, '_')}.png`;
    link.href = url;
    link.click();
  };

  const handleExportPDF = async () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current.querySelector('canvas');
    if (!canvas) return;

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${title.replace(/\s+/g, '_')}.pdf`);
  };

  const handleResetCamera = () => {
    // Camera reset would be handled by OrbitControls
  };

  const handlePointClick = (point: DataPoint3D) => {
    setSelectedPoint(point);
    onPointClick?.(point);
  };

  return (
    <Card className={cn('w-full', isFullscreen && 'fixed inset-0 z-50 rounded-none')}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleResetCamera}
              aria-label="Reset camera"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
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
          ref={canvasRef}
          className={cn(
            'relative rounded-lg border bg-background overflow-hidden',
            isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[600px]'
          )}
          role="img"
          aria-label={`${title}: 3D visualization of data points`}
        >
          <Canvas
            camera={{ position: [10, 10, 10], fov: 60 }}
            style={{ background: theme === 'dark' ? '#0a0a0a' : '#f5f5f5' }}
          >
            <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={60} />
            {enableRotation && <OrbitControls enableZoom={enableZoom} enablePan enableRotate />}
            <Scene data={data} onPointClick={handlePointClick} onPointHover={setHoveredPoint} />
          </Canvas>

          {/* Tooltip */}
          {hoveredPoint && (
            <div className="absolute top-4 left-4 bg-card border rounded-lg p-3 shadow-lg z-10 pointer-events-none">
              <p className="font-semibold text-sm">{hoveredPoint.label || hoveredPoint.id}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Position: ({hoveredPoint.x.toFixed(2)}, {hoveredPoint.y.toFixed(2)}, {hoveredPoint.z.toFixed(2)})
              </p>
              {hoveredPoint.value !== undefined && (
                <p className="text-xs text-muted-foreground">Value: {hoveredPoint.value}</p>
              )}
            </div>
          )}

          {/* Controls Info */}
          <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border rounded-lg p-3 shadow-lg text-xs text-muted-foreground">
            <p>• Left Click + Drag: Rotate</p>
            <p>• Right Click + Drag: Pan</p>
            <p>• Scroll: Zoom</p>
            <p>• Click Point: Select</p>
          </div>
        </div>

        {/* Selected point details */}
        {selectedPoint && (
          <div className="mt-4 p-4 rounded-lg border bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">{selectedPoint.label || selectedPoint.id}</h4>
              <Button variant="ghost" size="icon" onClick={() => setSelectedPoint(null)}>
                ×
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">X</p>
                <p className="font-semibold">{selectedPoint.x.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Y</p>
                <p className="font-semibold">{selectedPoint.y.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Z</p>
                <p className="font-semibold">{selectedPoint.z.toFixed(2)}</p>
              </div>
              {selectedPoint.value !== undefined && (
                <div>
                  <p className="text-muted-foreground">Value</p>
                  <p className="font-semibold">{selectedPoint.value}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="mt-4 grid grid-cols-4 gap-4 text-center">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Total Points</p>
            <p className="text-lg font-semibold">{data.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">X Range</p>
            <p className="text-lg font-semibold">
              {Math.min(...data.map((d) => d.x)).toFixed(1)} - {Math.max(...data.map((d) => d.x)).toFixed(1)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Y Range</p>
            <p className="text-lg font-semibold">
              {Math.min(...data.map((d) => d.y)).toFixed(1)} - {Math.max(...data.map((d) => d.y)).toFixed(1)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Z Range</p>
            <p className="text-lg font-semibold">
              {Math.min(...data.map((d) => d.z)).toFixed(1)} - {Math.max(...data.map((d) => d.z)).toFixed(1)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
