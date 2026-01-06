import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Circle,
  Square,
  Type,
  Pencil,
  Undo,
  Redo,
  Trash2,
  Save,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type AnnotationTool =
  | "none"
  | "arrow"
  | "circle"
  | "rectangle"
  | "text"
  | "pen";

export interface Annotation {
  id: string;
  tool: AnnotationTool;
  color: string;
  lineWidth: number;
  points: { x: number; y: number }[];
  text?: string;
}

interface RenderAnnotationCanvasProps {
  imageUrl: string;
  zoom: number;
  panX: number;
  panY: number;
  initialAnnotations?: Annotation[];
  onSave?: (annotations: Annotation[]) => void;
}

export function RenderAnnotationCanvas({
  imageUrl,
  zoom,
  panX,
  panY,
  initialAnnotations = [],
  onSave,
}: RenderAnnotationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTool, setActiveTool] = useState<AnnotationTool>("none");
  const [color, setColor] = useState("#FF0000");
  const [lineWidth, setLineWidth] = useState(3);
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<Annotation[][]>([initialAnnotations]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Calculate canvas size based on container
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Redraw canvas whenever annotations, zoom, or pan changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan transformations
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);

    // Draw all annotations
    annotations.forEach((annotation) => {
      drawAnnotation(ctx, annotation);
    });

    // Draw current annotation being created
    if (currentAnnotation) {
      drawAnnotation(ctx, currentAnnotation);
    }

    ctx.restore();
  }, [annotations, currentAnnotation, zoom, panX, panY]);

  const drawAnnotation = (ctx: CanvasRenderingContext2D, annotation: Annotation) => {
    if (annotation.points.length === 0) return;

    ctx.strokeStyle = annotation.color;
    ctx.fillStyle = annotation.color;
    ctx.lineWidth = annotation.lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const start = annotation.points[0];
    const end = annotation.points[annotation.points.length - 1];

    switch (annotation.tool) {
      case "arrow":
        if (annotation.points.length >= 2) {
          drawArrow(ctx, start.x, start.y, end.x, end.y);
        }
        break;

      case "circle":
        if (annotation.points.length >= 2) {
          const radius = Math.sqrt(
            Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
          );
          ctx.beginPath();
          ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
        }
        break;

      case "rectangle":
        if (annotation.points.length >= 2) {
          const width = end.x - start.x;
          const height = end.y - start.y;
          ctx.strokeRect(start.x, start.y, width, height);
        }
        break;

      case "pen":
        if (annotation.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
          for (let i = 1; i < annotation.points.length; i++) {
            ctx.lineTo(annotation.points[i].x, annotation.points[i].y);
          }
          ctx.stroke();
        }
        break;

      case "text":
        if (annotation.text && annotation.points.length > 0) {
          ctx.font = `${annotation.lineWidth * 8}px sans-serif`;
          ctx.fillText(annotation.text, start.x, start.y);
        }
        break;
    }
  };

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) => {
    const headLength = 20;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    // Draw line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headLength * Math.cos(angle - Math.PI / 6),
      y2 - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headLength * Math.cos(angle + Math.PI / 6),
      y2 - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - panX) / zoom;
    const y = (e.clientY - rect.top - panY) / zoom;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === "none") return;

    const point = getCanvasCoordinates(e);
    setIsDrawing(true);

    if (activeTool === "text") {
      const text = prompt("Digite o texto:");
      if (text) {
        const newAnnotation: Annotation = {
          id: Date.now().toString(),
          tool: activeTool,
          color,
          lineWidth,
          points: [point],
          text,
        };
        addAnnotation(newAnnotation);
      }
      setActiveTool("none");
      return;
    }

    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      tool: activeTool,
      color,
      lineWidth,
      points: [point],
    };
    setCurrentAnnotation(newAnnotation);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAnnotation) return;

    const point = getCanvasCoordinates(e);

    if (currentAnnotation.tool === "pen") {
      setCurrentAnnotation({
        ...currentAnnotation,
        points: [...currentAnnotation.points, point],
      });
    } else {
      setCurrentAnnotation({
        ...currentAnnotation,
        points: [currentAnnotation.points[0], point],
      });
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentAnnotation) return;

    addAnnotation(currentAnnotation);
    setCurrentAnnotation(null);
    setIsDrawing(false);
  };

  const addAnnotation = (annotation: Annotation) => {
    const newAnnotations = [...annotations, annotation];
    setAnnotations(newAnnotations);

    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAnnotations);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setAnnotations(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setAnnotations(history[historyIndex + 1]);
    }
  };

  const handleClear = () => {
    if (confirm("Limpar todas as anotações?")) {
      const newAnnotations: Annotation[] = [];
      setAnnotations(newAnnotations);

      const newHistory = [...history, newAnnotations];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(annotations);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* Canvas overlay */}
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="absolute inset-0 cursor-crosshair w-full h-full"
        style={{
          pointerEvents: activeTool !== "none" ? "auto" : "none",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Annotation toolbar */}
      <div className="absolute top-4 left-4 bg-black/80 rounded-lg p-2 flex flex-col gap-2">
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={activeTool === "arrow" ? "default" : "ghost"}
            onClick={() => setActiveTool(activeTool === "arrow" ? "none" : "arrow")}
            title="Seta"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeTool === "circle" ? "default" : "ghost"}
            onClick={() => setActiveTool(activeTool === "circle" ? "none" : "circle")}
            title="Círculo"
          >
            <Circle className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeTool === "rectangle" ? "default" : "ghost"}
            onClick={() =>
              setActiveTool(activeTool === "rectangle" ? "none" : "rectangle")
            }
            title="Retângulo"
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeTool === "text" ? "default" : "ghost"}
            onClick={() => setActiveTool(activeTool === "text" ? "none" : "text")}
            title="Texto"
          >
            <Type className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeTool === "pen" ? "default" : "ghost"}
            onClick={() => setActiveTool(activeTool === "pen" ? "none" : "pen")}
            title="Caneta Livre"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-1">
          <Select value={color} onValueChange={setColor}>
            <SelectTrigger className="w-24 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="#FF0000">Vermelho</SelectItem>
              <SelectItem value="#00FF00">Verde</SelectItem>
              <SelectItem value="#0000FF">Azul</SelectItem>
              <SelectItem value="#FFFF00">Amarelo</SelectItem>
              <SelectItem value="#FF00FF">Magenta</SelectItem>
              <SelectItem value="#00FFFF">Ciano</SelectItem>
              <SelectItem value="#FFFFFF">Branco</SelectItem>
              <SelectItem value="#000000">Preto</SelectItem>
            </SelectContent>
          </Select>

          <Select value={lineWidth.toString()} onValueChange={(v) => setLineWidth(Number(v))}>
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Fina</SelectItem>
              <SelectItem value="3">Média</SelectItem>
              <SelectItem value="5">Grossa</SelectItem>
              <SelectItem value="8">Muito Grossa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleUndo}
            disabled={historyIndex === 0}
            title="Desfazer"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRedo}
            disabled={historyIndex === history.length - 1}
            title="Refazer"
          >
            <Redo className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClear}
            disabled={annotations.length === 0}
            title="Limpar Tudo"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {onSave && (
          <Button
            size="sm"
            variant="default"
            onClick={handleSave}
            className="w-full"
            title="Salvar Anotações"
          >
            <Save className="h-4 w-4 mr-1" />
            Salvar
          </Button>
        )}
      </div>
    </div>
  );
}
