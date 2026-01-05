import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ZoomIn, ZoomOut } from "lucide-react";

interface RenderComparisonModalProps {
  render1Id: number;
  render2Id: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RenderComparisonModal({
  render1Id,
  render2Id,
  open,
  onOpenChange,
}: RenderComparisonModalProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [zoom, setZoom] = useState(1);

  const { data: render1 } = trpc.archviz.renders.getById.useQuery(
    { id: render1Id },
    { enabled: open && render1Id > 0 }
  );

  const { data: render2 } = trpc.archviz.renders.getById.useQuery(
    { id: render2Id },
    { enabled: open && render2Id > 0 }
  );

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved_client":
        return <Badge className="bg-green-600 text-white">Aprovada DC + Cliente</Badge>;
      case "approved_dc":
        return <Badge className="bg-blue-600 text-white">Aprovada DC</Badge>;
      default:
        return <Badge variant="outline" className="border-amber-500 text-amber-700">Pendente</Badge>;
    }
  };

  if (!render1 || !render2) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0" style={{ backgroundColor: "#1a1a1a" }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "#333" }}>
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">v{render1.version}</span>
                <span className="font-semibold text-white">{render1.name}</span>
                {getStatusBadge(render1.status)}
              </div>
            </div>
            <span className="text-gray-500">vs</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">v{render2.version}</span>
                <span className="font-semibold text-white">{render2.name}</span>
                {getStatusBadge(render2.status)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Controles de zoom */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.max(1, zoom - 0.5))}
              disabled={zoom <= 1}
              className="text-white hover:bg-gray-800"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-white">{Math.round(zoom * 100)}%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.min(3, zoom + 0.5))}
              disabled={zoom >= 3}
              className="text-white hover:bg-gray-800"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-white hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Área de comparação */}
        <div
          className="relative overflow-hidden"
          style={{ height: "calc(95vh - 180px)" }}
          onMouseMove={handleSliderMove}
        >
          {/* Imagem 2 (fundo) */}
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <img
              src={render2.fileUrl}
              alt={render2.name}
              style={{
                transform: `scale(${zoom})`,
                transition: "transform 0.2s",
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          </div>

          {/* Imagem 1 (com clip) */}
          <div
            className="absolute inset-0 flex items-center justify-center bg-black"
            style={{
              clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
            }}
          >
            <img
              src={render1.fileUrl}
              alt={render1.name}
              style={{
                transform: `scale(${zoom})`,
                transition: "transform 0.2s",
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          </div>

          {/* Slider */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-gray-800 rounded-full" />
            </div>
          </div>

          {/* Labels */}
          <div className="absolute top-4 left-4 bg-black bg-opacity-75 px-3 py-2 rounded">
            <div className="text-xs text-gray-400">Versão {render1.version}</div>
            <div className="text-sm text-white font-semibold">{render1.name}</div>
          </div>
          <div className="absolute top-4 right-4 bg-black bg-opacity-75 px-3 py-2 rounded">
            <div className="text-xs text-gray-400">Versão {render2.version}</div>
            <div className="text-sm text-white font-semibold">{render2.name}</div>
          </div>
        </div>

        {/* Footer com detalhes */}
        <div className="grid grid-cols-2 gap-4 p-4 border-t" style={{ borderColor: "#333" }}>
          <div>
            <div className="text-xs text-gray-400 mb-1">Versão {render1.version}</div>
            <div className="text-sm text-white mb-2">{render1.name}</div>
            {render1.description && (
              <div className="text-xs text-gray-400">{render1.description}</div>
            )}
            <div className="text-xs text-gray-500 mt-2">
              {new Date(render1.createdAt).toLocaleString("pt-PT")}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Versão {render2.version}</div>
            <div className="text-sm text-white mb-2">{render2.name}</div>
            {render2.description && (
              <div className="text-xs text-gray-400">{render2.description}</div>
            )}
            <div className="text-xs text-gray-500 mt-2">
              {new Date(render2.createdAt).toLocaleString("pt-PT")}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
