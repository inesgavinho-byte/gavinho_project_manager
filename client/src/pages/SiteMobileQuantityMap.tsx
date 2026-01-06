import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Search, Camera, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { storagePut } from "@/lib/storage";

export default function SiteMobileQuantityMap() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const constructionId = parseInt(params.id || "0");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // Queries
  const { data: items = [], refetch: refetchItems } = trpc.siteManagement.quantityMap.list.useQuery(
    { constructionId },
    { enabled: constructionId > 0 }
  );

  const { data: stats } = trpc.siteManagement.quantityMap.getStats.useQuery(
    { constructionId },
    { enabled: constructionId > 0 }
  );

  // Mutations
  const updateProgressMutation = trpc.siteManagement.quantityMap.updateProgress.useMutation({
    onSuccess: () => {
      toast({
        title: "✅ Quantidade atualizada",
        description: "O progresso foi registado com sucesso",
      });
      refetchItems();
      setSelectedItem(null);
      setQuantity("");
      setNotes("");
      setPhotos([]);
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter items
  const filteredItems = items.filter((item: any) => {
    const matchesSearch =
      item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files);
      setPhotos([...photos, ...newPhotos]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty < 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor numérico válido",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Upload photos if any
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        const uploadPromises = photos.map(async (photo) => {
          const buffer = await photo.arrayBuffer();
          const result = await storagePut(
            `quantity-map/${constructionId}/${Date.now()}-${photo.name}`,
            new Uint8Array(buffer),
            photo.type
          );
          return result.url;
        });
        photoUrls = await Promise.all(uploadPromises);
      }

      // Update quantity with notes and photos
      const notesWithPhotos = notes + (photoUrls.length > 0 ? `\n\nFotos: ${photoUrls.join(", ")}` : "");

      updateProgressMutation.mutate({
        itemId: selectedItem.id,
        quantityExecuted: qty,
        notes: notesWithPhotos || undefined,
      });
    } catch (error) {
      toast({
        title: "Erro ao enviar fotos",
        description: "Não foi possível fazer upload das fotos",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-green-600";
    if (progress >= 50) return "bg-blue-600";
    if (progress > 0) return "bg-yellow-600";
    return "bg-gray-400";
  };

  return (
    <div className="min-h-screen bg-[#EEEAE5] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#C3BAAF] shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation(`/site-management/mobile`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-serif text-[#5F5C59]">
              Mapa de Quantidades
            </h1>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#5F5C59]/40" />
            <Input
              placeholder="Pesquisar item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="px-4 py-3 bg-[#F5F3F0] border-t border-[#C3BAAF]">
            <div className="flex items-center justify-between text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#C9A882]">
                  {stats.overallProgress.toFixed(0)}%
                </div>
                <div className="text-xs text-[#5F5C59]/70">Progresso</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.completedItems}
                </div>
                <div className="text-xs text-[#5F5C59]/70">Concluídos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.inProgressItems}
                </div>
                <div className="text-xs text-[#5F5C59]/70">Em Curso</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {stats.notStartedItems}
                </div>
                <div className="text-xs text-[#5F5C59]/70">Por Iniciar</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Items List */}
      <div className="px-4 py-4 space-y-3">
        {filteredItems.map((item: any) => {
          const planned = parseFloat(item.plannedQuantity);
          const executed = parseFloat(item.currentQuantity);
          const progress = planned > 0 ? (executed / planned) * 100 : 0;

          return (
            <Card
              key={item.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedItem(item);
                setQuantity(executed.toString());
                setNotes("");
                setPhotos([]);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <Badge variant="outline" className="mb-2">
                      {item.category}
                    </Badge>
                    <h3 className="font-medium text-[#5F5C59] mb-1">
                      {item.item}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-[#5F5C59]/60 mb-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#5F5C59]/70">Executado:</span>
                    <span className="font-medium">
                      {executed.toFixed(2)} / {planned.toFixed(2)} {item.unit}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Progress value={Math.min(progress, 100)} className="flex-1" />
                    <span className={`text-sm font-medium ${getProgressColor(progress).replace('bg-', 'text-')}`}>
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#5F5C59]/70">
              Nenhum item encontrado
            </p>
          </div>
        )}
      </div>

      {/* Quick Mark Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedItem?.item}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Quantity Input */}
            <div>
              <label className="text-sm font-medium text-[#5F5C59] mb-2 block">
                Quantidade Executada ({selectedItem?.unit})
              </label>
              <Input
                type="number"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.00"
                className="text-lg"
              />
              <p className="text-xs text-[#5F5C59]/60 mt-1">
                Planejado: {parseFloat(selectedItem?.plannedQuantity || "0").toFixed(2)} {selectedItem?.unit}
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-[#5F5C59] mb-2 block">
                Observações (opcional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observações sobre esta marcação..."
                rows={3}
              />
            </div>

            {/* Photo Capture */}
            <div>
              <label className="text-sm font-medium text-[#5F5C59] mb-2 block">
                Fotos de Comprovação
              </label>
              
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={handlePhotoCapture}
                className="hidden"
                id="photo-input"
              />
              
              <label
                htmlFor="photo-input"
                className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-[#C3BAAF] rounded-lg cursor-pointer hover:border-[#C9A882] transition-colors"
              >
                <Camera className="h-5 w-5 text-[#C9A882]" />
                <span className="text-sm text-[#5F5C59]">
                  Tirar ou Selecionar Fotos
                </span>
              </label>

              {/* Photo Previews */}
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedItem(null)}
              disabled={uploading || updateProgressMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={uploading || updateProgressMutation.isPending}
              className="bg-[#C9A882] hover:bg-[#B8976F]"
            >
              {uploading || updateProgressMutation.isPending ? (
                "A guardar..."
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirmar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
