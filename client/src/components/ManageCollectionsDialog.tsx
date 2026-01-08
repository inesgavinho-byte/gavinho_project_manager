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
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  FolderPlus,
  Edit,
  Trash2,
  Folder,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface ManageCollectionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COLLECTION_COLORS = [
  { name: "Cinza", value: "#5F5C59" },
  { name: "Bege", value: "#C3BAAF" },
  { name: "Dourado", value: "#C9A882" },
  { name: "Rosa", value: "#E8C4C4" },
  { name: "Azul", value: "#7BA3C0" },
  { name: "Verde", value: "#8FAF8F" },
  { name: "Roxo", value: "#A88FAF" },
  { name: "Laranja", value: "#D4A574" },
];

const COLLECTION_ICONS = [
  "Folder",
  "FolderPlus",
  "Star",
  "Heart",
  "Bookmark",
  "Tag",
  "Layers",
  "Box",
];

export function ManageCollectionsDialog({
  open,
  onOpenChange,
}: ManageCollectionsDialogProps) {
  const [editingCollection, setEditingCollection] = useState<{
    id?: number;
    name: string;
    description: string;
    color: string;
    icon: string;
  } | null>(null);

  const { data: collections = [], refetch } = trpc.library.getUserCollections.useQuery(
    undefined,
    { enabled: open }
  );

  const { data: stats } = trpc.library.getCollectionStats.useQuery(undefined, {
    enabled: open,
  });

  const createMutation = trpc.library.createCollection.useMutation({
    onSuccess: () => {
      toast.success("Coleção criada com sucesso!");
      setEditingCollection(null);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao criar coleção: " + error.message);
    },
  });

  const updateMutation = trpc.library.updateCollection.useMutation({
    onSuccess: () => {
      toast.success("Coleção atualizada!");
      setEditingCollection(null);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const deleteMutation = trpc.library.deleteCollection.useMutation({
    onSuccess: () => {
      toast.success("Coleção eliminada!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao eliminar: " + error.message);
    },
  });

  const handleSave = () => {
    if (!editingCollection) return;

    if (!editingCollection.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (editingCollection.id) {
      updateMutation.mutate({
        collectionId: editingCollection.id,
        name: editingCollection.name,
        description: editingCollection.description,
        color: editingCollection.color,
        icon: editingCollection.icon,
      });
    } else {
      createMutation.mutate({
        name: editingCollection.name,
        description: editingCollection.description,
        color: editingCollection.color,
        icon: editingCollection.icon,
      });
    }
  };

  const handleDelete = (collectionId: number) => {
    if (confirm("Tem a certeza que deseja eliminar esta coleção?")) {
      deleteMutation.mutate({ collectionId });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5" />
            Gerir Coleções
          </DialogTitle>
          <DialogDescription>
            Organize os seus materiais em coleções personalizadas
          </DialogDescription>
        </DialogHeader>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Total de Coleções</div>
              <div className="text-2xl font-bold text-[#C9A882]">{stats.totalCollections}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Materiais em Coleções</div>
              <div className="text-2xl font-bold text-[#C9A882]">
                {stats.totalMaterialsInCollections}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Favoritos</div>
              <div className="text-2xl font-bold text-[#C9A882]">{stats.totalFavorites}</div>
            </Card>
          </div>
        )}

        {/* Create/Edit Form */}
        {editingCollection && (
          <Card className="p-6 border-[#C9A882] bg-[#C9A882]/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingCollection.id ? "Editar Coleção" : "Nova Coleção"}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingCollection(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={editingCollection.name}
                  onChange={(e) =>
                    setEditingCollection({ ...editingCollection, name: e.target.value })
                  }
                  placeholder="Ex: Materiais Premium"
                />
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={editingCollection.description}
                  onChange={(e) =>
                    setEditingCollection({
                      ...editingCollection,
                      description: e.target.value,
                    })
                  }
                  placeholder="Descrição da coleção..."
                  rows={2}
                />
              </div>

              <div>
                <Label>Cor</Label>
                <div className="flex gap-2 flex-wrap mt-2">
                  {COLLECTION_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() =>
                        setEditingCollection({ ...editingCollection, color: color.value })
                      }
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        editingCollection.color === color.value
                          ? "border-[#C9A882] scale-110"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label>Ícone</Label>
                <div className="flex gap-2 flex-wrap mt-2">
                  {COLLECTION_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() =>
                        setEditingCollection({ ...editingCollection, icon })
                      }
                      className={`w-10 h-10 rounded border flex items-center justify-center transition-all ${
                        editingCollection.icon === icon
                          ? "border-[#C9A882] bg-[#C9A882]/10"
                          : "border-[#C3BAAF]"
                      }`}
                    >
                      <Folder className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-[#C9A882] hover:bg-[#B8976F] flex-1"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "A guardar..."
                    : editingCollection.id
                    ? "Atualizar"
                    : "Criar"}
                </Button>
                <Button variant="outline" onClick={() => setEditingCollection(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Collections List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Minhas Coleções</h3>
            {!editingCollection && (
              <Button
                size="sm"
                onClick={() =>
                  setEditingCollection({
                    name: "",
                    description: "",
                    color: COLLECTION_COLORS[0].value,
                    icon: COLLECTION_ICONS[0],
                  })
                }
                className="bg-[#C9A882] hover:bg-[#B8976F]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Coleção
              </Button>
            )}
          </div>

          {collections.length === 0 ? (
            <Card className="p-12 text-center">
              <Folder className="w-16 h-16 mx-auto text-[#C3BAAF] mb-4" />
              <p className="text-[#5F5C59] mb-4">Ainda não tem coleções</p>
              <Button
                onClick={() =>
                  setEditingCollection({
                    name: "",
                    description: "",
                    color: COLLECTION_COLORS[0].value,
                    icon: COLLECTION_ICONS[0],
                  })
                }
                className="bg-[#C9A882] hover:bg-[#B8976F]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Coleção
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {collections.map((collection) => (
                <Card key={collection.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className="w-10 h-10 rounded flex items-center justify-center"
                        style={{ backgroundColor: collection.color || "#C3BAAF" }}
                      >
                        <Folder className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#5F5C59]">{collection.name}</h4>
                        {collection.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {collection.description}
                          </p>
                        )}
                        <Badge variant="secondary" className="mt-2">
                          {collection.materialCount} materiais
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setEditingCollection({
                            id: collection.id,
                            name: collection.name,
                            description: collection.description || "",
                            color: collection.color || COLLECTION_COLORS[0].value,
                            icon: collection.icon || COLLECTION_ICONS[0],
                          })
                        }
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(collection.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
