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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner";
import { Upload, Image as ImageIcon, FileText } from "lucide-react";

const MATERIAL_CATEGORIES = [
  "Art Deco",
  "Branco",
  "Clássico",
  "Contemporâneo",
  "Dourado",
  "Económico",
  "Escandinavo",
  "Indoor",
  "Industrial",
  "Luxo",
  "Madeira",
  "Mediterrâneo",
  "Minimalista",
  "Neutro",
  "Outdoor",
  "Premium",
  "Preto",
  "Rústico",
  "Sustentável",
];

interface AddMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddMaterialDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddMaterialDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [supplier, setSupplier] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("m²");
  const [imageBase64, setImageBase64] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [fileBase64, setFileBase64] = useState("");
  const [fileName, setFileName] = useState("");

  const createMaterial = trpc.library.materials.create.useMutation({
    onSuccess: () => {
      toast.success("Material adicionado com sucesso!");
      resetForm();
      onSuccess();
    },
    onError: (error) => {
      toast.error("Erro ao adicionar material: " + error.message);
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("");
    setSupplier("");
    setPrice("");
    setUnit("m²");
    setImageBase64("");
    setImagePreview("");
    setFileBase64("");
    setFileName("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecione uma imagem válida");
      return;
    }

    // Validar tamanho (max 5MB)
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo (apenas PDF)
    if (file.type !== "application/pdf") {
      toast.error("Por favor selecione um ficheiro PDF");
      return;
    }

    // Validar tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ficheiro muito grande. Máximo 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFileBase64(base64);
      setFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!name || !category) {
      toast.error("Por favor preencha os campos obrigatórios");
      return;
    }

    createMaterial.mutate({
      name,
      description,
      category,
      supplier,
      price,
      unit,
      imageBase64: imageBase64 || undefined,
      fileBase64: fileBase64 || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-[#5F5C59]">
            Adicionar Material
          </DialogTitle>
          <DialogDescription>
            Adicione um novo material à biblioteca
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nome */}
          <div>
            <Label htmlFor="name">
              Nome <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Mármore Carrara"
            />
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição detalhada do material..."
              rows={3}
            />
          </div>

          {/* Categoria */}
          <div>
            <Label htmlFor="category">
              Categoria <span className="text-red-500">*</span>
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {MATERIAL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fornecedor e Preço */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplier">Fornecedor</Label>
              <Input
                id="supplier"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Nome do fornecedor"
              />
            </div>
            <div>
              <Label htmlFor="price">Preço (€)</Label>
              <div className="flex gap-2">
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                />
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m²">m²</SelectItem>
                    <SelectItem value="m">m</SelectItem>
                    <SelectItem value="un">un</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="l">l</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Upload de Imagem */}
          <div>
            <Label>Imagem</Label>
            <div className="mt-2">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-md"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImageBase64("");
                      setImagePreview("");
                    }}
                  >
                    Remover
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#C3BAAF] rounded-md cursor-pointer hover:bg-[#EEEAE5] transition-colors">
                  <ImageIcon className="w-8 h-8 text-[#C3BAAF] mb-2" />
                  <span className="text-sm text-[#C3BAAF]">
                    Clique para selecionar imagem
                  </span>
                  <span className="text-xs text-[#C3BAAF] mt-1">
                    JPG, PNG ou WEBP (máx. 5MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Upload de Ficha Técnica */}
          <div>
            <Label>Ficha Técnica (PDF)</Label>
            <div className="mt-2">
              {fileName ? (
                <div className="flex items-center justify-between p-3 bg-[#EEEAE5] rounded-md">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#C9A882]" />
                    <span className="text-sm text-[#5F5C59]">{fileName}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFileBase64("");
                      setFileName("");
                    }}
                  >
                    Remover
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#C3BAAF] rounded-md cursor-pointer hover:bg-[#EEEAE5] transition-colors">
                  <FileText className="w-6 h-6 text-[#C3BAAF] mb-1" />
                  <span className="text-sm text-[#C3BAAF]">
                    Clique para selecionar PDF
                  </span>
                  <span className="text-xs text-[#C3BAAF] mt-1">Máx. 10MB</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMaterial.isPending}
            className="bg-[#C9A882] hover:bg-[#B8976F]"
          >
            {createMaterial.isPending ? "A adicionar..." : "Adicionar Material"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
