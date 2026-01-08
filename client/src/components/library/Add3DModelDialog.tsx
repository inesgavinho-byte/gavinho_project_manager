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
import { Box } from "lucide-react";

const MODEL_CATEGORIES = ["Mobiliário", "Iluminação", "Decoração", "Sanitários", "Cozinha", "Outros"];
const FILE_FORMATS = [".skp", ".3ds", ".obj", ".fbx", ".dwg", ".dxf"];

interface Add3DModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function Add3DModelDialog({
  open,
  onOpenChange,
  onSuccess,
}: Add3DModelDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [fileFormat, setFileFormat] = useState(".skp");
  const [modelBase64, setModelBase64] = useState("");
  const [fileName, setFileName] = useState("");

  const createModel = trpc.library.models3D.create.useMutation({
    onSuccess: () => {
      toast.success("Modelo 3D adicionado com sucesso!");
      resetForm();
      onSuccess();
    },
    onError: (error) => {
      toast.error("Erro ao adicionar modelo: " + error.message);
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("");
    setFileFormat(".skp");
    setModelBase64("");
    setFileName("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error("Ficheiro muito grande. Máximo 50MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setModelBase64(base64);
      setFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!name || !category || !modelBase64) {
      toast.error("Por favor preencha todos os campos obrigatórios");
      return;
    }

    createModel.mutate({
      name,
      description,
      category,
      fileFormat,
      modelBase64,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-[#5F5C59]">
            Adicionar Modelo 3D
          </DialogTitle>
          <DialogDescription>
            Adicione um novo modelo 3D à biblioteca
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Categoria *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Formato *</Label>
              <Select value={fileFormat} onValueChange={setFileFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILE_FORMATS.map((fmt) => (
                    <SelectItem key={fmt} value={fmt}>{fmt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Ficheiro 3D *</Label>
            <div className="mt-2">
              {fileName ? (
                <div className="flex items-center justify-between p-3 bg-[#EEEAE5] rounded-md">
                  <div className="flex items-center gap-2">
                    <Box className="w-5 h-5 text-[#C9A882]" />
                    <span className="text-sm">{fileName}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setModelBase64(""); setFileName(""); }}>
                    Remover
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#C3BAAF] rounded-md cursor-pointer hover:bg-[#EEEAE5]">
                  <Box className="w-6 h-6 text-[#C3BAAF] mb-1" />
                  <span className="text-sm text-[#C3BAAF]">Clique para selecionar ficheiro</span>
                  <span className="text-xs text-[#C3BAAF] mt-1">Máx. 50MB</span>
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={createModel.isPending} className="bg-[#C9A882] hover:bg-[#B8976F]">
            {createModel.isPending ? "A adicionar..." : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
