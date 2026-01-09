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
import {
  X,
  Package,
  Euro,
  Building2,
  FileText,
  Star,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MaterialComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialIds: number[];
  onRemoveMaterial?: (materialId: number) => void;
}

export function MaterialComparisonDialog({
  open,
  onOpenChange,
  materialIds,
  onRemoveMaterial,
}: MaterialComparisonDialogProps) {
  // Query materials
  const materialsQueries = materialIds.map((id) =>
    trpc.library.materials.getById.useQuery(
      { id },
      { enabled: open && id > 0 }
    )
  );

  const materials = materialsQueries
    .map((q) => q.data)
    .filter((m) => m !== undefined);

  const isLoading = materialsQueries.some((q) => q.isLoading);

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl h-[85vh]">
          <div className="flex items-center justify-center h-full">
            <div className="text-[#8B8670]">A carregar materiais...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (materials.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#5F5C59]">
              Comparar Materiais
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-12 text-[#8B8670]">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Nenhum material selecionado para comparação</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 gap-0 bg-[#F2F0E7]">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-[#E5E2D9] bg-white">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-[#5F5C59]">
              Comparar Materiais ({materials.length})
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-[#8B8670] mt-2">
            Visualize especificações lado a lado para tomar decisões informadas
          </p>
        </DialogHeader>

        {/* Comparison Grid */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-6">
          <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${materials.length}, minmax(300px, 1fr))` }}>
            {materials.map((material) => (
              <div
                key={material.id}
                className="bg-white rounded-lg border border-[#E5E2D9] overflow-hidden"
              >
                {/* Material Header */}
                <div className="p-4 border-b border-[#E5E2D9] bg-[#F2F0E7]">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg text-[#5F5C59] flex-1">
                      {material.name}
                    </h3>
                    {onRemoveMaterial && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveMaterial(material.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className="border-[#C9A882] text-[#C9A882]"
                  >
                    {material.category}
                  </Badge>
                </div>

                {/* Material Image */}
                <div className="relative h-48 bg-[#F2F0E7]">
                  {material.imageUrl ? (
                    <img
                      src={material.imageUrl}
                      alt={material.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-[#8B8670] opacity-50" />
                    </div>
                  )}
                </div>

                {/* Specifications */}
                <div className="p-4 space-y-4">
                  {/* Price */}
                  <div className="border-b border-[#E5E2D9] pb-3">
                    <div className="text-xs text-[#8B8670] mb-1">Preço</div>
                    <div className="flex items-center gap-1 text-lg font-bold text-[#5F5C59]">
                      {material.price ? (
                        <>
                          <Euro className="w-4 h-4" />
                          <span>{material.price}€/{material.unit || "m²"}</span>
                        </>
                      ) : (
                        <span className="text-sm text-[#8B8670]">Não especificado</span>
                      )}
                    </div>
                  </div>

                  {/* Supplier */}
                  <div className="border-b border-[#E5E2D9] pb-3">
                    <div className="text-xs text-[#8B8670] mb-1">Fornecedor</div>
                    <div className="flex items-center gap-1 text-sm text-[#5F5C59]">
                      {material.supplier ? (
                        <>
                          <Building2 className="w-4 h-4" />
                          <span>{material.supplier}</span>
                        </>
                      ) : (
                        <span className="text-[#8B8670]">Não especificado</span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="border-b border-[#E5E2D9] pb-3">
                    <div className="text-xs text-[#8B8670] mb-1">Descrição</div>
                    <p className="text-xs text-[#5F5C59] line-clamp-3">
                      {material.description || "Sem descrição disponível"}
                    </p>
                  </div>

                  {/* Technical Specs */}
                  <div className="border-b border-[#E5E2D9] pb-3">
                    <div className="text-xs text-[#8B8670] mb-1">
                      Especificações Técnicas
                    </div>
                    {material.technicalSpecs ? (
                      <p className="text-xs text-[#5F5C59] whitespace-pre-wrap line-clamp-4">
                        {material.technicalSpecs}
                      </p>
                    ) : (
                      <span className="text-xs text-[#8B8670]">
                        Não especificadas
                      </span>
                    )}
                  </div>

                  {/* Usage Count */}
                  <div className="border-b border-[#E5E2D9] pb-3">
                    <div className="text-xs text-[#8B8670] mb-1">Utilizações</div>
                    <div className="flex items-center gap-1 text-sm text-[#5F5C59]">
                      <TrendingUp className="w-4 h-4" />
                      <span>{material.usageCount || 0} projetos</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {material.tags && material.tags.length > 0 && (
                    <div>
                      <div className="text-xs text-[#8B8670] mb-2">Etiquetas</div>
                      <div className="flex flex-wrap gap-1">
                        {material.tags.map((tag: string, idx: number) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs border-[#C9A882] text-[#C9A882]"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Technical Sheet */}
                  {material.technicalSheetUrl && (
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-[#C9A882] text-[#C9A882] hover:bg-[#C9A882]/10"
                        onClick={() => window.open(material.technicalSheetUrl, "_blank")}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Ficha Técnica
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E5E2D9] bg-white flex items-center justify-between">
          <div className="text-sm text-[#8B8670]">
            {materials.length} {materials.length === 1 ? "material" : "materiais"} em comparação
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#E5E2D9]"
            >
              Fechar
            </Button>
            <Button
              className="bg-[#C9A882] hover:bg-[#B8976F]"
              onClick={async () => {
                try {
                  const result = await trpc.library.generateMaterialsReport.mutate({
                    materialIds,
                    includeImages: true,
                    includeTechnicalSpecs: true,
                  });
                  if (result.success) {
                    alert(result.message || "Relatório gerado com sucesso!");
                  }
                } catch (error) {
                  alert("Erro ao gerar relatório");
                }
              }}
            >
              Exportar Comparação
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
