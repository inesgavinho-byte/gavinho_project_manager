import { useState, useRef, DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ArchVizUploadProps {
  constructionId: number;
  compartments: Array<{ id: number; name: string }>;
  onUploadComplete: () => void;
}

interface FileWithPreview {
  file: File;
  preview: string;
  name: string;
  compartmentId?: number;
}

export function ArchVizUpload({ constructionId, compartments, onUploadComplete }: ArchVizUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.archviz.renders.upload.useMutation();

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith("image/")
    );

    addFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const filesWithPreview = newFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
      compartmentId: compartments[0]?.id, // Default to first compartment
    }));

    setFiles(prev => [...prev, ...filesWithPreview]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const updateFileName = (index: number, name: string) => {
    setFiles(prev => {
      const newFiles = [...prev];
      newFiles[index].name = name;
      return newFiles;
    });
  };

  const updateFileCompartment = (index: number, compartmentId: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      newFiles[index].compartmentId = compartmentId;
      return newFiles;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);

    try {
      for (const fileData of files) {
        if (!fileData.compartmentId) continue;

        // Convert file to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(",")[1];
            resolve(base64);
          };
          reader.readAsDataURL(fileData.file);
        });

        const base64Data = await base64Promise;

        await uploadMutation.mutateAsync({
          constructionId,
          compartmentId: fileData.compartmentId,
          name: fileData.name,
          fileData: base64Data,
          mimeType: fileData.file.type,
          fileSize: fileData.file.size,
        });
      }

      // Clear files and notify parent
      files.forEach(f => URL.revokeObjectURL(f.preview));
      setFiles([]);
      onUploadComplete();
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-[#C9A882] bg-[#EEEAE5]"
            : "border-gray-300 hover:border-[#C9A882]"
        }`}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium mb-2">
          Arraste imagens aqui ou clique para selecionar
        </p>
        <p className="text-sm text-gray-500">
          Suporta múltiplas imagens (JPG, PNG, GIF)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium">Imagens a carregar ({files.length})</h3>
          
          {files.map((fileData, index) => (
            <Card key={index} className="p-4">
              <div className="flex gap-4">
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded overflow-hidden">
                  <img
                    src={fileData.preview}
                    alt={fileData.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 space-y-3">
                  <div>
                    <Label>Nome do Render</Label>
                    <Input
                      value={fileData.name}
                      onChange={(e) => updateFileName(index, e.target.value)}
                      placeholder="Nome da visualização"
                    />
                  </div>

                  <div>
                    <Label>Compartimento</Label>
                    <Select
                      value={fileData.compartmentId?.toString()}
                      onValueChange={(value) => updateFileCompartment(index, parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {compartments.map(comp => (
                          <SelectItem key={comp.id} value={comp.id.toString()}>
                            {comp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                  className="flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}

          {/* Upload Button */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                files.forEach(f => URL.revokeObjectURL(f.preview));
                setFiles([]);
              }}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading}
              style={{ backgroundColor: "#C9A882", color: "white" }}
            >
              {uploading ? "A carregar..." : `Carregar ${files.length} ${files.length === 1 ? "imagem" : "imagens"}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
