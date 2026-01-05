import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ArchVizUploadModalProps {
  constructionId: number;
  compartments: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ArchVizUploadModal({
  constructionId,
  compartments,
  open,
  onOpenChange,
  onSuccess,
}: ArchVizUploadModalProps) {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [compartmentId, setCompartmentId] = useState<string>("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);

  const uploadMutation = trpc.archviz.renders.upload.useMutation({
    onSuccess: () => {
      toast({
        title: "Upload concluído",
        description: "O render foi enviado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    if (!compartmentId || files.length === 0 || !name) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      for (const file of files) {
        const reader = new FileReader();
        const fileData = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        const base64Data = fileData.split(",")[1];

        await uploadMutation.mutateAsync({
          compartmentId: parseInt(compartmentId),
          constructionId,
          name: files.length > 1 ? `${name} - ${file.name}` : name,
          description,
          fileData: base64Data,
          mimeType: file.type,
          fileSize: file.size,
        });
      }

      onSuccess();
      onOpenChange(false);
      setFiles([]);
      setCompartmentId("");
      setName("");
      setDescription("");
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" style={{ backgroundColor: "white", borderColor: "#C3BAAF" }}>
        <DialogHeader>
          <DialogTitle style={{ color: "#5F5C59" }}>Upload de Renders</DialogTitle>
          <DialogDescription style={{ color: "#5F5C59" }}>
            Envie visualizações 3D e renders do projeto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Compartimento */}
          <div>
            <Label style={{ color: "#5F5C59" }}>Compartimento *</Label>
            <Select value={compartmentId} onValueChange={setCompartmentId}>
              <SelectTrigger style={{ borderColor: "#C3BAAF" }}>
                <SelectValue placeholder="Selecione o compartimento" />
              </SelectTrigger>
              <SelectContent>
                {compartments.map((comp) => (
                  <SelectItem key={comp.id} value={comp.id.toString()}>
                    {comp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nome */}
          <div>
            <Label style={{ color: "#5F5C59" }}>Nome *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Vista Sala de Estar"
              style={{ borderColor: "#C3BAAF" }}
            />
          </div>

          {/* Descrição */}
          <div>
            <Label style={{ color: "#5F5C59" }}>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição opcional do render..."
              rows={3}
              style={{ borderColor: "#C3BAAF" }}
            />
          </div>

          {/* Upload de arquivos */}
          <div>
            <Label style={{ color: "#5F5C59" }}>Arquivos *</Label>
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              style={{ borderColor: "#C3BAAF" }}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <Upload className="h-8 w-8 mx-auto mb-2" style={{ color: "#C9A882" }} />
              <p className="text-sm" style={{ color: "#5F5C59" }}>
                Clique para selecionar imagens ou arraste aqui
              </p>
              <p className="text-xs mt-1" style={{ color: "#5F5C59" }}>
                PNG, JPG até 5MB cada
              </p>
            </div>
            <input
              id="file-input"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Lista de arquivos selecionados */}
          {files.length > 0 && (
            <div className="space-y-2">
              <Label style={{ color: "#5F5C59" }}>Arquivos selecionados:</Label>
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded"
                  style={{ backgroundColor: "#EEEAE5" }}
                >
                  <span className="text-sm" style={{ color: "#5F5C59" }}>
                    {file.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFiles(files.filter((_, i) => i !== index))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
              style={{ borderColor: "#C3BAAF", color: "#5F5C59" }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={uploading}
              style={{ backgroundColor: "#C9A882", color: "white" }}
              className="hover:opacity-90"
            >
              {uploading ? "A enviar..." : "Enviar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
