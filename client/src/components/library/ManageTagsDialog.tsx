import { useState } from "react";
import { trpc } from "../../lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Tag } from "lucide-react";

interface ManageTagsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageTagsDialog({
  open,
  onOpenChange,
}: ManageTagsDialogProps) {
  const [newTagName, setNewTagName] = useState("");
  const [newTagCategory, setNewTagCategory] = useState<"material" | "model" | "inspiration" | "general">("general");
  const [newTagColor, setNewTagColor] = useState("#C9A882");

  const { data: tags = [], refetch } = trpc.library.tags.list.useQuery();

  const createTag = trpc.library.tags.create.useMutation({
    onSuccess: () => {
      toast.success("Tag criada com sucesso!");
      setNewTagName("");
      setNewTagCategory("general");
      setNewTagColor("#C9A882");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao criar tag: " + error.message);
    },
  });

  const deleteTag = trpc.library.tags.delete.useMutation({
    onSuccess: () => {
      toast.success("Tag removida com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao remover tag: " + error.message);
    },
  });

  const handleCreateTag = () => {
    if (!newTagName) {
      toast.error("Por favor insira um nome para a tag");
      return;
    }

    createTag.mutate({
      name: newTagName,
      category: newTagCategory,
      color: newTagColor,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-[#5F5C59]">
            Gerir Tags
          </DialogTitle>
          <DialogDescription>
            Crie e organize tags para categorizar os itens da biblioteca
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Criar Nova Tag */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-[#5F5C59]">Criar Nova Tag</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Ex: Sustentável"
                />
              </div>
              
              <div>
                <Label>Categoria</Label>
                <Select value={newTagCategory} onValueChange={(v: any) => setNewTagCategory(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Geral</SelectItem>
                    <SelectItem value="material">Material</SelectItem>
                    <SelectItem value="model">Modelo 3D</SelectItem>
                    <SelectItem value="inspiration">Inspiração</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Cor</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    placeholder="#C9A882"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleCreateTag}
              disabled={createTag.isPending}
              className="w-full bg-[#C9A882] hover:bg-[#B8976F]"
            >
              <Plus className="w-4 h-4 mr-2" />
              {createTag.isPending ? "A criar..." : "Criar Tag"}
            </Button>
          </div>

          {/* Lista de Tags Existentes */}
          <div>
            <h3 className="font-medium text-[#5F5C59] mb-3">Tags Existentes ({tags.length})</h3>
            
            {tags.length === 0 ? (
              <div className="text-center py-8 text-[#C3BAAF]">
                <Tag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Ainda não há tags criadas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-3 bg-[#EEEAE5] rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="font-medium text-[#5F5C59]">{tag.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {tag.category}
                      </Badge>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTag.mutate({ id: tag.id })}
                      disabled={deleteTag.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
