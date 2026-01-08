import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  ArrowLeft,
  GripVertical,
  Download,
  Trash2,
  Folder,
} from "lucide-react";
import { toast } from "sonner";

interface CollectionDetailViewProps {
  collectionId: number;
  onBack: () => void;
}

export function CollectionDetailView({
  collectionId,
  onBack,
}: CollectionDetailViewProps) {
  const [localMaterials, setLocalMaterials] = useState<any[]>([]);

  const { data: collection, refetch } = trpc.library.getCollection.useQuery(
    { collectionId },
    {
      onSuccess: (data) => {
        if (data) {
          setLocalMaterials(data.materials);
        }
      },
    }
  );

  const reorderMutation = trpc.library.reorderMaterialsInCollection.useMutation({
    onSuccess: () => {
      toast.success("Ordem atualizada!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao reordenar: " + error.message);
      // Revert to original order
      if (collection) {
        setLocalMaterials(collection.materials);
      }
    },
  });

  const removeMutation = trpc.library.removeMaterialFromCollection.useMutation({
    onSuccess: () => {
      toast.success("Material removido da coleção!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !collection) return;

    const items = Array.from(localMaterials);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update local state immediately for smooth UX
    setLocalMaterials(items);

    // Prepare material orders with new indices
    const materialOrders = items.map((item, index) => ({
      materialId: item.material.id,
      displayOrder: index,
    }));

    // Save to backend
    reorderMutation.mutate({
      collectionId,
      materialOrders,
    });
  };

  const handleRemove = (materialId: number) => {
    if (confirm("Remover este material da coleção?")) {
      removeMutation.mutate({
        collectionId,
        materialId,
      });
    }
  };

  if (!collection) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9A882] mx-auto mb-4"></div>
          <p className="text-[#5F5C59]">A carregar coleção...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded flex items-center justify-center"
              style={{ backgroundColor: collection.color || "#C3BAAF" }}
            >
              <Folder className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-[#5F5C59]">
                {collection.name}
              </h2>
              {collection.description && (
                <p className="text-[#C3BAAF]">{collection.description}</p>
              )}
            </div>
          </div>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {localMaterials.length} materiais
        </Badge>
      </div>

      {/* Instructions */}
      {localMaterials.length > 0 && (
        <Card className="bg-[#C9A882]/5 border-[#C9A882]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-[#5F5C59]">
              <GripVertical className="w-4 h-4 text-[#C9A882]" />
              <span>
                <strong>Dica:</strong> Arraste os materiais para reorganizar a ordem
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Materials List with Drag & Drop */}
      {localMaterials.length === 0 ? (
        <Card className="p-12 text-center">
          <Folder className="w-16 h-16 mx-auto text-[#C3BAAF] mb-4" />
          <p className="text-[#5F5C59] mb-2">Esta coleção está vazia</p>
          <p className="text-sm text-muted-foreground">
            Adicione materiais à coleção a partir da Biblioteca
          </p>
        </Card>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="materials">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`space-y-4 ${
                  snapshot.isDraggingOver ? "bg-[#C9A882]/5 rounded-lg p-2" : ""
                }`}
              >
                {localMaterials.map((item, index) => (
                  <Draggable
                    key={item.material.id}
                    draggableId={item.material.id.toString()}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`transition-all ${
                          snapshot.isDragging
                            ? "shadow-2xl rotate-2 scale-105"
                            : "hover:shadow-md"
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Drag Handle */}
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab active:cursor-grabbing"
                            >
                              <GripVertical className="w-6 h-6 text-[#C3BAAF] hover:text-[#C9A882]" />
                            </div>

                            {/* Material Image */}
                            {item.material.imageUrl && (
                              <img
                                src={item.material.imageUrl}
                                alt={item.material.name}
                                className="w-20 h-20 object-cover rounded"
                              />
                            )}

                            {/* Material Info */}
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-serif font-semibold text-[#5F5C59]">
                                    {item.material.name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {item.material.description}
                                  </p>
                                  {item.notes && (
                                    <p className="text-sm text-[#C9A882] mt-1 italic">
                                      📝 {item.notes}
                                    </p>
                                  )}
                                </div>
                                <Badge className="bg-[#C9A882]">
                                  {item.material.category}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-2 mt-2">
                                {item.material.supplier && (
                                  <span className="text-xs text-[#C3BAAF]">
                                    {item.material.supplier}
                                  </span>
                                )}
                                {item.material.price && (
                                  <span className="text-xs font-medium text-[#5F5C59]">
                                    {item.material.price} € / {item.material.unit || "un"}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                              {item.material.fileUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                >
                                  <a
                                    href={item.material.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemove(item.material.id)}
                                disabled={removeMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}
