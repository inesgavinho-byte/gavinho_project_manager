import { useState } from "react";
import { trpc } from "../../lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { Sparkles, Image as ImageIcon } from "lucide-react";

interface AddInspirationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddInspirationDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddInspirationDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [imagePreview, setImagePreview] = useState("");

  const createInspiration = trpc.library.inspiration.create.useMutation({
    onSuccess: () => {
      toast.success("Inspiração adicionada com sucesso!");
      resetForm();
      onSuccess();
    },
    onError: (error) => {
      toast.error("Erro ao adicionar inspiração: " + error.message);
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSourceUrl("");
    setImageBase64("");
    setImagePreview("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecione uma imagem válida");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImageBase64(base64);
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!title || !imageBase64) {
      toast.error("Por favor preencha os campos obrigatórios");
      return;
    }

    createInspiration.mutate({
      title,
      description,
      sourceUrl,
      imageBase64,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-[#5F5C59]">
            Adicionar Inspiração
          </DialogTitle>
          <DialogDescription>
            Adicione uma nova imagem de inspiração à biblioteca
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Sala de Estar Minimalista" />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          <div>
            <Label>URL da Fonte</Label>
            <Input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div>
            <Label>Imagem *</Label>
            <div className="mt-2">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover rounded-md" />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => { setImageBase64(""); setImagePreview(""); }}
                  >
                    Remover
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[#C3BAAF] rounded-md cursor-pointer hover:bg-[#EEEAE5]">
                  <ImageIcon className="w-8 h-8 text-[#C3BAAF] mb-2" />
                  <span className="text-sm text-[#C3BAAF]">Clique para selecionar imagem</span>
                  <span className="text-xs text-[#C3BAAF] mt-1">JPG, PNG ou WEBP (máx. 5MB)</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={createInspiration.isPending} className="bg-[#C9A882] hover:bg-[#B8976F]">
            {createInspiration.isPending ? "A adicionar..." : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
