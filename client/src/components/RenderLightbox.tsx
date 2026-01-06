import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Star,
  Calendar,
  FileText,
  Pencil
} from 'lucide-react';
import { RenderAnnotationCanvas, type Annotation } from './RenderAnnotationCanvas';
import { cn } from '@/lib/utils';

interface RenderImage {
  id: number;
  name: string;
  imageUrl: string;
  version: number;
  status: string;
  isFavorite: boolean;
  createdAt: string;
  compartmentName: string;
  constructionCode: string;
}

interface RenderLightboxProps {
  images: RenderImage[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  approved_dc: 'Aprovada DC',
  approved_client: 'Aprovada Cliente',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500',
  approved_dc: 'bg-blue-500',
  approved_client: 'bg-emerald-500',
};

export function RenderLightbox({ images, initialIndex, isOpen, onClose }: RenderLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const currentImage = images[currentIndex];

  // Reset zoom and position when image changes
  useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  // Update index when initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.5, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.5, 0.5));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case '0':
          handleResetZoom();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrevious, handleNext, handleZoomIn, handleZoomOut, handleResetZoom, onClose]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  }, [handleZoomIn, handleZoomOut]);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [zoom, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (!currentImage) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-none"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-semibold text-white truncate">
                  {currentImage.name}
                </h2>
                {currentImage.isFavorite && (
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span>{currentImage.compartmentName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(currentImage.createdAt)}</span>
                </div>
                <Badge className={cn('text-white', STATUS_COLORS[currentImage.status])}>
                  {STATUS_LABELS[currentImage.status]}
                </Badge>
                <Badge variant="outline" className="text-white border-white/30">
                  Versão {currentImage.version}
                </Badge>
                <Badge variant="outline" className="text-white border-white/30">
                  {currentImage.constructionCode}
                </Badge>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20 flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Image Container */}
        <div 
          className="relative w-full h-full flex items-center justify-center overflow-hidden"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
          <div className="relative">
            <img
              src={currentImage.imageUrl}
              alt={currentImage.name}
              className="max-w-full max-h-full object-contain transition-transform duration-200 select-none"
              style={{
                transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              }}
              draggable={false}
            />
            {annotationMode && (
              <div className="absolute inset-0">
                <RenderAnnotationCanvas
                  imageUrl={currentImage.imageUrl}
                  zoom={zoom}
                  panX={position.x}
                  panY={position.y}
                  initialAnnotations={annotations}
                  onSave={(newAnnotations) => {
                    setAnnotations(newAnnotations);
                    // TODO: Save to backend
                    console.log('Annotations saved:', newAnnotations);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 w-12 h-12"
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 w-12 h-12"
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          </>
        )}

        {/* Zoom Controls */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 bg-black/60 rounded-lg p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoom >= 4}
            className="text-white hover:bg-white/20 w-10 h-10"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleResetZoom}
            disabled={zoom === 1}
            className="text-white hover:bg-white/20 w-10 h-10"
            title="Reset Zoom (0)"
          >
            <Maximize2 className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            className="text-white hover:bg-white/20 w-10 h-10"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-5 h-5" />
          </Button>
          <div className="text-white text-xs text-center mt-1">
            {Math.round(zoom * 100)}%
          </div>
          <div className="h-px bg-white/20 my-1" />
          <Button
            variant={annotationMode ? "default" : "ghost"}
            size="icon"
            onClick={() => setAnnotationMode(!annotationMode)}
            className="text-white hover:bg-white/20 w-10 h-10"
            title="Modo de Anotação"
          >
            <Pencil className="w-5 h-5" />
          </Button>
        </div>

        {/* Thumbnail Navigation */}
        {images.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    'relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all',
                    idx === currentIndex
                      ? 'border-white scale-110'
                      : 'border-white/30 hover:border-white/60 opacity-60 hover:opacity-100'
                  )}
                >
                  <img
                    src={img.imageUrl}
                    alt={img.name}
                    className="w-full h-full object-cover"
                  />
                  {img.isFavorite && (
                    <Star className="absolute top-1 right-1 w-3 h-3 text-yellow-400 fill-yellow-400" />
                  )}
                </button>
              ))}
            </div>
            <div className="text-center text-white/80 text-sm mt-2">
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts Hint */}
        <div className="absolute bottom-4 left-4 text-white/60 text-xs bg-black/60 rounded px-3 py-2">
          <div>← → Navegar | + - Zoom | 0 Reset | ESC Fechar</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
