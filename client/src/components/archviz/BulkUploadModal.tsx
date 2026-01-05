import { useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, CheckCircle2, AlertCircle, Image as ImageIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";

interface BulkUploadModalProps {
  open: boolean;
  onClose: () => void;
  constructionId: number;
  onUploadComplete: () => void;
}

interface FileWithPreview {
  file: File;
  preview: string;
  id: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function BulkUploadModal({ open, onClose, constructionId, onUploadComplete }: BulkUploadModalProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [compartmentId, setCompartmentId] = useState<string>("");
  const [version, setVersion] = useState("1");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: compartments = [] } = trpc.archviz.getCompartments.useQuery({ constructionId });
  const uploadMutation = trpc.archviz.uploadRender.useMutation();

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Tipo de arquivo não suportado. Use JPG, PNG ou WEBP.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Arquivo muito grande. Tamanho máximo: 10MB.";
    }
    return null;
  };

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: FileWithPreview[] = [];

    fileArray.forEach((file) => {
      const error = validateFile(file);
      const preview = URL.createObjectURL(file);
      const id = `${file.name}-${Date.now()}-${Math.random()}`;

      validFiles.push({
        file,
        preview,
        id,
        status: error ? "error" : "pending",
        progress: 0,
        error: error || undefined,
      });
    });

    setFiles((prev) => [...prev, ...validFiles]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  }, [handleFiles]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const handleUpload = async () => {
    if (!compartmentId) {
      toast({
        title: "Erro",
        description: "Selecione um compartimento",
        variant: "destructive",
      });
      return;
    }

    const validFiles = files.filter((f) => f.status === "pending");
    if (validFiles.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhum arquivo válido para upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    // Upload files sequentially to avoid overwhelming the server
    for (const fileItem of validFiles) {
      try {
        // Update status to uploading
        setFiles((prev) =>
          prev.map((f) => (f.id === fileItem.id ? { ...f, status: "uploading" as const, progress: 0 } : f))
        );

        // Convert file to base64
        const reader = new FileReader();
        const fileDataPromise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(fileItem.file);
        });

        const fileData = await fileDataPromise;

        // Simulate progress
        const progressInterval = setInterval(() => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id && f.progress < 90 ? { ...f, progress: f.progress + 10 } : f
            )
          );
        }, 200);

        // Upload to server
        await uploadMutation.mutateAsync({
          constructionId,
          compartmentId: parseInt(compartmentId),
          name: fileItem.file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          description: description || `Upload em lote - ${fileItem.file.name}`,
          version: parseInt(version),
          fileData,
          fileName: fileItem.file.name,
          mimeType: fileItem.file.type,
        });

        clearInterval(progressInterval);

        // Update status to success
        setFiles((prev) =>
          prev.map((f) => (f.id === fileItem.id ? { ...f, status: "success" as const, progress: 100 } : f))
        );
      } catch (error) {
        console.error("Upload error:", error);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id
              ? { ...f, status: "error" as const, error: "Erro ao fazer upload" }
              : f
          )
        );
      }
    }

    setIsUploading(false);

    const successCount = files.filter((f) => f.status === "success").length;
    const errorCount = files.filter((f) => f.status === "error").length;

    if (successCount > 0) {
      toast({
        title: "Upload concluído",
        description: `${successCount} arquivo(s) enviado(s) com sucesso${errorCount > 0 ? `, ${errorCount} com erro` : ""}`,
      });
      onUploadComplete();
    }

    if (errorCount === validFiles.length) {
      toast({
        title: "Erro",
        description: "Todos os uploads falharam",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    // Clean up previews
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
    setCompartmentId("");
    setVersion("1");
    setDescription("");
    setIsUploading(false);
    onClose();
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const successCount = files.filter((f) => f.status === "success").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload em Lote de Renders</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
              ${isDragging ? "border-[#C5A572] bg-[#C5A572]/10" : "border-gray-300 hover:border-[#C5A572]"}
            `}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-[#C5A572]" />
            <p className="text-lg font-medium mb-2">
              Arraste e solte os arquivos aqui
            </p>
            <p className="text-sm text-gray-500 mb-4">
              ou clique para selecionar arquivos
            </p>
            <p className="text-xs text-gray-400">
              Formatos suportados: JPG, PNG, WEBP • Tamanho máximo: 10MB por arquivo
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">
                  Arquivos selecionados ({files.length})
                </h3>
                <div className="text-sm text-gray-500">
                  {pendingCount > 0 && <span className="mr-3">Pendentes: {pendingCount}</span>}
                  {successCount > 0 && <span className="mr-3 text-green-600">Sucesso: {successCount}</span>}
                  {errorCount > 0 && <span className="text-red-600">Erro: {errorCount}</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                {files.map((fileItem) => (
                  <div
                    key={fileItem.id}
                    className="relative border rounded-lg overflow-hidden bg-white"
                  >
                    {/* Preview Image */}
                    <div className="aspect-video bg-gray-100 relative">
                      <img
                        src={fileItem.preview}
                        alt={fileItem.file.name}
                        className="w-full h-full object-cover"
                      />
                      {fileItem.status === "uploading" && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="text-white text-center">
                            <div className="text-2xl font-bold">{fileItem.progress}%</div>
                            <div className="text-xs">Enviando...</div>
                          </div>
                        </div>
                      )}
                      {fileItem.status === "success" && (
                        <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-12 h-12 text-green-600" />
                        </div>
                      )}
                      {fileItem.status === "error" && (
                        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                          <AlertCircle className="w-12 h-12 text-red-600" />
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="p-2">
                      <p className="text-xs font-medium truncate" title={fileItem.file.name}>
                        {fileItem.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      {fileItem.error && (
                        <p className="text-xs text-red-600 mt-1">{fileItem.error}</p>
                      )}
                    </div>

                    {/* Remove Button */}
                    {fileItem.status !== "uploading" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(fileItem.id);
                        }}
                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    )}

                    {/* Progress Bar */}
                    {fileItem.status === "uploading" && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                        <div
                          className="h-full bg-[#C5A572] transition-all duration-300"
                          style={{ width: `${fileItem.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Settings */}
          {files.length > 0 && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium">Configurações do Upload</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="compartment">Compartimento *</Label>
                  <Select value={compartmentId} onValueChange={setCompartmentId} disabled={isUploading}>
                    <SelectTrigger id="compartment">
                      <SelectValue placeholder="Selecione..." />
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

                <div>
                  <Label htmlFor="version">Versão</Label>
                  <Input
                    id="version"
                    type="number"
                    min="1"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    disabled={isUploading}
                  />
                </div>

                <div className="md:col-span-1">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição aplicada a todos os renders..."
                    disabled={isUploading}
                    rows={1}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={files.length === 0 || !compartmentId || isUploading || pendingCount === 0}
              className="bg-[#C5A572] hover:bg-[#B39562]"
            >
              {isUploading ? "Enviando..." : `Enviar ${pendingCount} arquivo(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
