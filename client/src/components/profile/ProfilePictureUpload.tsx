import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, AlertCircle } from "lucide-react";

interface ProfilePictureUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPicture?: string | null;
  onSuccess?: () => void;
}

export function ProfilePictureUpload({
  open,
  onOpenChange,
  currentPicture,
  onSuccess,
}: ProfilePictureUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentPicture || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");

  const uploadMutation = trpc.userProfile.uploadProfilePicture.useMutation({
    onSuccess: () => {
      toast({
        title: "Foto atualizada",
        description: "A sua foto de perfil foi guardada com sucesso.",
      });
      setSelectedFile(null);
      setPreview(null);
      setError("");
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Erro ao fazer upload",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione um ficheiro de imagem válido");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("O ficheiro não pode exceder 5MB");
      return;
    }

    setError("");
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      uploadMutation.mutate({
        fileName: selectedFile.name,
        fileData: base64,
        mimeType: selectedFile.type,
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const event = {
        target: { files: [file] },
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(event);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Foto de Perfil</DialogTitle>
          <DialogDescription>
            Carregue uma nova foto para o seu perfil
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview */}
          <div className="flex justify-center">
            <Avatar className="h-32 w-32 border-4 border-sand/20">
              <AvatarImage src={preview || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-sand to-blush text-brown text-2xl">
                U
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-sand/40 rounded-lg p-6 text-center cursor-pointer hover:border-sand/60 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 text-sand mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">
              Arraste a imagem aqui ou clique para selecionar
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG ou GIF (máx. 5MB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* File Info */}
          {selectedFile && (
            <div className="text-sm text-muted-foreground">
              <p>Ficheiro selecionado: {selectedFile.name}</p>
              <p>Tamanho: {(selectedFile.size / 1024).toFixed(2)} KB</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setSelectedFile(null);
                setPreview(currentPicture || null);
                setError("");
              }}
              disabled={uploadMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-brown hover:bg-brown/90"
              disabled={!selectedFile || uploadMutation.isPending}
              onClick={handleUpload}
            >
              {uploadMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Carregar Foto
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
