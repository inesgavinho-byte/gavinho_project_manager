import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface Render {
  id: number;
  name: string;
  description?: string | null;
  version: number;
  fileUrl: string;
  status: "pending" | "approved_dc" | "approved_client";
  createdAt: Date;
}

interface RenderComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  renderA: Render;
  renderB: Render;
}

export function RenderComparisonModal({ open, onOpenChange, renderA, renderB }: RenderComparisonModalProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "approved_dc":
        return "Aprovada DC";
      case "approved_client":
        return "Aprovada DC + Cliente";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800";
      case "approved_dc":
        return "bg-blue-500 text-white";
      case "approved_client":
        return "bg-green-600 text-white";
      default:
        return "bg-gray-100";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
        <div className="flex flex-col h-[95vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-bold">Comparação de Versões</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setZoom(Math.max(1, zoom - 0.25))}
                disabled={zoom <= 1}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                disabled={zoom >= 3}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setZoom(1)}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Comparison Container */}
          <div className="flex-1 overflow-auto bg-gray-100">
            <div
              ref={containerRef}
              className="relative w-full h-full cursor-ew-resize select-none"
              onMouseMove={handleMouseMove}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onTouchMove={handleTouchMove}
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
                transition: isDragging ? "none" : "transform 0.2s",
              }}
            >
              {/* Image B (Background - Right) */}
              <div className="absolute inset-0">
                <img
                  src={renderB.fileUrl}
                  alt={renderB.name}
                  className="w-full h-full object-contain"
                  draggable={false}
                />
              </div>

              {/* Image A (Foreground - Left) with Clip */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{
                  clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
                }}
              >
                <img
                  src={renderA.fileUrl}
                  alt={renderA.name}
                  className="w-full h-full object-contain"
                  draggable={false}
                />
              </div>

              {/* Slider Line */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
                style={{
                  left: `${sliderPosition}%`,
                  transform: "translateX(-50%)",
                }}
              >
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <div className="w-4 h-4 border-l-2 border-r-2 border-gray-600" />
                </div>
              </div>

              {/* Labels */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                <div className="text-xs text-gray-500 mb-1">Versão {renderA.version}</div>
                <div className="font-medium">{renderA.name}</div>
                <Badge className={`mt-2 ${getStatusColor(renderA.status)}`}>
                  {getStatusLabel(renderA.status)}
                </Badge>
              </div>

              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                <div className="text-xs text-gray-500 mb-1">Versão {renderB.version}</div>
                <div className="font-medium">{renderB.name}</div>
                <Badge className={`mt-2 ${getStatusColor(renderB.status)}`}>
                  {getStatusLabel(renderB.status)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Footer - Details */}
          <div className="grid grid-cols-2 gap-4 p-4 border-t bg-white">
            <div>
              <h3 className="font-medium mb-2">Versão {renderA.version}</h3>
              <div className="text-sm space-y-1">
                <p className="text-gray-600">
                  <span className="font-medium">Data:</span>{" "}
                  {new Date(renderA.createdAt).toLocaleDateString("pt-PT")}
                </p>
                {renderA.description && (
                  <p className="text-gray-600">
                    <span className="font-medium">Descrição:</span> {renderA.description}
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Versão {renderB.version}</h3>
              <div className="text-sm space-y-1">
                <p className="text-gray-600">
                  <span className="font-medium">Data:</span>{" "}
                  {new Date(renderB.createdAt).toLocaleDateString("pt-PT")}
                </p>
                {renderB.description && (
                  <p className="text-gray-600">
                    <span className="font-medium">Descrição:</span> {renderB.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
