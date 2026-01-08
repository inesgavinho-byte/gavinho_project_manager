import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Folder, Check, Plus } from "lucide-react";
import { toast } from "sonner";

interface AddToCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialId: number;
  materialName: string;
  onSuccess?: () => void;
}

export function AddToCollectionDialog({
  open,
  onOpenChange,
  materialId,
  materialName,
  onSuccess,
}: AddToCollectionDialogProps) {
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  const { data: collections = [], refetch: refetchCollections } =
    trpc.library.getUserCollections.useQuery(undefined, { enabled: open });

  const { data: materialCollections = [], refetch: refetchMaterialCollections } =
    trpc.library.getCollectionsForMaterial.useQuery(
      { materialId },
      { enabled: open }
    );

  const addMutation = trpc.library.addMaterialToCollection.useMutation({
    onSuccess: () => {
      toast.success("Material adicionado à coleção!");
      setSelectedCollectionId(null);
      setNotes("");
      refetchMaterialCollections();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });

  const removeMutation = trpc.library.removeMaterialFromCollection.useMutation({
    onSuccess: () => {
      toast.success("Material removido da coleção!");
      refetchMaterialCollections();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });

  const handleAdd = () => {
    if (!selectedCollectionId) {
      toast.error("Selecione uma coleção");
      return;
    }

    addMutation.mutate({
      collectionId: selectedCollectionId,
      materialId,
      notes: notes || undefined,
    });
  };

  const handleRemove = (collectionId: number) => {
    removeMutation.mutate({
      collectionId,
      materialId,
    });
  };

  const isInCollection = (collectionId: number) => {
    return materialCollections.some((mc) => mc.id === collectionId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5" />
            Adicionar a Coleção
          </DialogTitle>
          <DialogDescription>
            Adicione <strong>{materialName}</strong> a uma coleção
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Collections */}
          {materialCollections.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Já está nestas coleções:</h3>
              <div className="flex flex-wrap gap-2">
                {materialCollections.map((collection) => (
                  <Badge
                    key={collection.id}
                    className="flex items-center gap-2 px-3 py-2"
                    style={{
                      backgroundColor: collection.color || "#C3BAAF",
                      color: "white",
                    }}
                  >
                    <Folder className="w-3 h-3" />
                    {collection.name}
                    <button
                      onClick={() => handleRemove(collection.id)}
                      className="ml-1 hover:opacity-70"
                      disabled={removeMutation.isPending}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Available Collections */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Selecione uma coleção:</h3>
            {collections.length === 0 ? (
              <Card className="p-8 text-center">
                <Folder className="w-12 h-12 mx-auto text-[#C3BAAF] mb-3" />
                <p className="text-[#5F5C59] mb-4">Ainda não tem coleções</p>
                <p className="text-sm text-muted-foreground">
                  Crie uma coleção primeiro para organizar os seus materiais
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {collections.map((collection) => {
                  const inCollection = isInCollection(collection.id);
                  return (
                    <Card
                      key={collection.id}
                      className={`p-4 cursor-pointer transition-all ${
                        selectedCollectionId === collection.id
                          ? "border-[#C9A882] bg-[#C9A882]/5"
                          : inCollection
                          ? "border-green-500 bg-green-50 opacity-50"
                          : "hover:border-[#C3BAAF]"
                      }`}
                      onClick={() => {
                        if (!inCollection) {
                          setSelectedCollectionId(collection.id);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: collection.color || "#C3BAAF" }}
                        >
                          {inCollection ? (
                            <Check className="w-5 h-5 text-white" />
                          ) : (
                            <Folder className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-[#5F5C59] truncate">
                            {collection.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {collection.materialCount} materiais
                          </p>
                        </div>
                        {selectedCollectionId === collection.id && (
                          <div className="w-5 h-5 rounded-full bg-[#C9A882] flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          {selectedCollectionId && (
            <div>
              <Label>Notas (opcional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione notas sobre porque este material está nesta coleção..."
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {selectedCollectionId && (
            <Button
              onClick={handleAdd}
              disabled={addMutation.isPending}
              className="bg-[#C9A882] hover:bg-[#B8976F]"
            >
              <Plus className="w-4 h-4 mr-2" />
              {addMutation.isPending ? "A adicionar..." : "Adicionar"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
