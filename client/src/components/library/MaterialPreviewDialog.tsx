import { useState } from "react";
import { trpc } from "../../lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  X,
  Star,
  Package,
  FileText,
  TrendingUp,
  MessageSquare,
  Download,
  Edit,
  Trash2,
  Tag,
  Euro,
  Calendar,
  User,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MaterialPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialId: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function MaterialPreviewDialog({
  open,
  onOpenChange,
  materialId,
  onEdit,
  onDelete,
}: MaterialPreviewDialogProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [imageZoomed, setImageZoomed] = useState(false);

  // Queries
  const { data: material, isLoading } = trpc.library.materials.getById.useQuery(
    { id: materialId },
    { enabled: open && materialId > 0 }
  );

  const { data: isFavorite = false, refetch: refetchFavoriteStatus } =
    trpc.library.getFavoriteStatusForMaterials.useQuery(
      { materialIds: [materialId] },
      { enabled: open && materialId > 0 }
    );

  const { data: comments = [] } = trpc.library.getMaterialComments.useQuery(
    { materialId },
    { enabled: open && materialId > 0 }
  );

  // Mutations
  const toggleFavorite = trpc.library.toggleFavorite.useMutation({
    onSuccess: () => {
      refetchFavoriteStatus();
      toast.success(isFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos");
    },
  });

  const handleToggleFavorite = () => {
    toggleFavorite.mutate({
      materialId,
      itemType: "material",
    });
  };

  const handleDownloadTechnicalSheet = () => {
    if (material?.technicalSheetUrl) {
      window.open(material.technicalSheetUrl, "_blank");
    } else {
      toast.error("Ficha técnica não disponível");
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <div className="flex items-center justify-center h-full">
            <div className="text-[#8B8670]">A carregar...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!material) {
    return null;
  }

  const favoriteStatusForMaterial = isFavorite[materialId] || false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] p-0 gap-0 bg-[#F2F0E7]">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-[#E5E2D9] bg-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl font-bold text-[#5F5C59] mb-2">
                {material.name}
              </DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="border-[#C9A882] text-[#C9A882]">
                  {material.category}
                </Badge>
                {material.supplier && (
                  <div className="flex items-center gap-1 text-sm text-[#8B8670]">
                    <Building2 className="w-3 h-3" />
                    <span>{material.supplier}</span>
                  </div>
                )}
                {material.price && (
                  <div className="flex items-center gap-1 text-sm font-semibold text-[#5F5C59]">
                    <Euro className="w-3 h-3" />
                    <span>{material.price}€/{material.unit || "m²"}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleFavorite}
                className={cn(
                  favoriteStatusForMaterial && "text-[#C9A882]"
                )}
              >
                <Star
                  className={cn(
                    "w-4 h-4",
                    favoriteStatusForMaterial && "fill-[#C9A882]"
                  )}
                />
              </Button>
              {onEdit && (
                <Button variant="ghost" size="sm" onClick={onEdit}>
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="sm" onClick={onDelete}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Left Column - Image */}
            <div className="space-y-4">
              <div
                className={cn(
                  "relative bg-white rounded-lg overflow-hidden border border-[#E5E2D9] cursor-pointer transition-all",
                  imageZoomed ? "fixed inset-4 z-50" : "aspect-square"
                )}
                onClick={() => setImageZoomed(!imageZoomed)}
              >
                {material.imageUrl ? (
                  <img
                    src={material.imageUrl}
                    alt={material.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#F2F0E7]">
                    <Package className="w-24 h-24 text-[#8B8670]" />
                  </div>
                )}
                {imageZoomed && (
                  <div className="absolute top-4 right-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageZoomed(false);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 border border-[#E5E2D9] text-center">
                  <TrendingUp className="w-5 h-5 text-[#8B8670] mx-auto mb-1" />
                  <div className="text-lg font-bold text-[#5F5C59]">
                    {material.usageCount || 0}
                  </div>
                  <div className="text-xs text-[#8B8670]">Utilizações</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-[#E5E2D9] text-center">
                  <MessageSquare className="w-5 h-5 text-[#8B8670] mx-auto mb-1" />
                  <div className="text-lg font-bold text-[#5F5C59]">
                    {comments.length}
                  </div>
                  <div className="text-xs text-[#8B8670]">Comentários</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-[#E5E2D9] text-center">
                  <Star className="w-5 h-5 text-[#8B8670] mx-auto mb-1" />
                  <div className="text-lg font-bold text-[#5F5C59]">
                    {favoriteStatusForMaterial ? "Sim" : "Não"}
                  </div>
                  <div className="text-xs text-[#8B8670]">Favorito</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {material.technicalSheetUrl && (
                  <Button
                    variant="outline"
                    className="flex-1 border-[#C9A882] text-[#C9A882] hover:bg-[#C9A882]/10"
                    onClick={handleDownloadTechnicalSheet}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Ficha Técnica
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1 border-[#E5E2D9]"
                  onClick={() => toast.info("Funcionalidade em desenvolvimento")}
                >
                  <Tag className="w-4 h-4 mr-2" />
                  Adicionar a Projeto
                </Button>
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full bg-white border border-[#E5E2D9]">
                  <TabsTrigger
                    value="overview"
                    className="flex-1 data-[state=active]:bg-[#C9A882] data-[state=active]:text-white"
                  >
                    Visão Geral
                  </TabsTrigger>
                  <TabsTrigger
                    value="technical"
                    className="flex-1 data-[state=active]:bg-[#C9A882] data-[state=active]:text-white"
                  >
                    Especificações
                  </TabsTrigger>
                  <TabsTrigger
                    value="comments"
                    className="flex-1 data-[state=active]:bg-[#C9A882] data-[state=active]:text-white"
                  >
                    Comentários ({comments.length})
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="bg-white rounded-lg p-4 border border-[#E5E2D9]">
                    <h3 className="text-sm font-semibold text-[#5F5C59] mb-2">
                      Descrição
                    </h3>
                    <p className="text-sm text-[#8B8670] leading-relaxed">
                      {material.description || "Sem descrição disponível"}
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-[#E5E2D9] space-y-3">
                    <h3 className="text-sm font-semibold text-[#5F5C59] mb-3">
                      Informações Gerais
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-[#8B8670] mb-1">Categoria</div>
                        <div className="font-medium text-[#5F5C59]">
                          {material.category}
                        </div>
                      </div>
                      <div>
                        <div className="text-[#8B8670] mb-1">Fornecedor</div>
                        <div className="font-medium text-[#5F5C59]">
                          {material.supplier || "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[#8B8670] mb-1">Preço</div>
                        <div className="font-medium text-[#5F5C59]">
                          {material.price ? `${material.price}€/${material.unit}` : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[#8B8670] mb-1">Adicionado em</div>
                        <div className="font-medium text-[#5F5C59]">
                          {material.createdAt
                            ? new Date(material.createdAt).toLocaleDateString("pt-PT")
                            : "—"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {material.tags && material.tags.length > 0 && (
                    <div className="bg-white rounded-lg p-4 border border-[#E5E2D9]">
                      <h3 className="text-sm font-semibold text-[#5F5C59] mb-2">
                        Etiquetas
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {material.tags.map((tag: string, idx: number) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="border-[#C9A882] text-[#C9A882]"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Technical Tab */}
                <TabsContent value="technical" className="space-y-4 mt-4">
                  <div className="bg-white rounded-lg p-4 border border-[#E5E2D9]">
                    <h3 className="text-sm font-semibold text-[#5F5C59] mb-3">
                      Especificações Técnicas
                    </h3>
                    <div className="space-y-2 text-sm">
                      {material.technicalSpecs ? (
                        <div className="text-[#8B8670] whitespace-pre-wrap">
                          {material.technicalSpecs}
                        </div>
                      ) : (
                        <div className="text-[#8B8670] italic">
                          Sem especificações técnicas disponíveis
                        </div>
                      )}
                    </div>
                  </div>

                  {material.technicalSheetUrl && (
                    <div className="bg-white rounded-lg p-4 border border-[#E5E2D9]">
                      <h3 className="text-sm font-semibold text-[#5F5C59] mb-3">
                        Documentação
                      </h3>
                      <Button
                        variant="outline"
                        className="w-full border-[#C9A882] text-[#C9A882] hover:bg-[#C9A882]/10"
                        onClick={handleDownloadTechnicalSheet}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Descarregar Ficha Técnica (PDF)
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* Comments Tab */}
                <TabsContent value="comments" className="space-y-4 mt-4">
                  {comments.length === 0 ? (
                    <div className="bg-white rounded-lg p-8 border border-[#E5E2D9] text-center">
                      <MessageSquare className="w-12 h-12 text-[#8B8670] mx-auto mb-3" />
                      <p className="text-sm text-[#8B8670]">
                        Ainda não há comentários
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {comments.map((comment: any) => (
                        <div
                          key={comment.id}
                          className="bg-white rounded-lg p-4 border border-[#E5E2D9]"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#C9A882] flex items-center justify-center text-white font-semibold text-sm">
                              {comment.userName?.charAt(0).toUpperCase() || "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm text-[#5F5C59]">
                                  {comment.userName || "Utilizador"}
                                </span>
                                <span className="text-xs text-[#8B8670]">
                                  {comment.createdAt
                                    ? new Date(comment.createdAt).toLocaleDateString("pt-PT")
                                    : ""}
                                </span>
                              </div>
                              <p className="text-sm text-[#8B8670]">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
