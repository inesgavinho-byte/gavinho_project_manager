import { useState, useRef } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Image as ImageIcon, Trash2, Filter } from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

interface ProjectGalleryProps {
  projectId: number;
  phases: any[];
}

export default function ProjectGallery({ projectId, phases }: ProjectGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [selectedPhase, setSelectedPhase] = useState<string>("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    caption: "",
    phaseId: null as number | null,
    files: [] as File[],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: gallery, refetch: refetchGallery } = trpc.projects.gallery.list.useQuery({ projectId });

  const uploadImages = trpc.projects.gallery.upload.useMutation({
    onSuccess: () => {
      toast.success("Imagens enviadas com sucesso!");
      setIsUploadOpen(false);
      setUploadData({ caption: "", phaseId: null, files: [] });
      refetchGallery();
    },
    onError: (error) => {
      toast.error("Erro ao enviar imagens: " + error.message);
    },
  });

  const deleteImage = trpc.projects.gallery.delete.useMutation({
    onSuccess: () => {
      toast.success("Imagem removida com sucesso!");
      refetchGallery();
    },
    onError: (error) => {
      toast.error("Erro ao remover imagem: " + error.message);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file types (images only)
    const invalidFiles = files.filter((f) => !f.type.startsWith("image/"));
    if (invalidFiles.length > 0) {
      toast.error("Apenas arquivos de imagem são permitidos");
      return;
    }

    // Validate file sizes (max 5MB each)
    const largeFiles = files.filter((f) => f.size > 5 * 1024 * 1024);
    if (largeFiles.length > 0) {
      toast.error("Algumas imagens são muito grandes (máximo 5MB cada)");
      return;
    }

    setUploadData({ ...uploadData, files });
  };

  const handleUpload = async () => {
    if (uploadData.files.length === 0) {
      toast.error("Selecione pelo menos uma imagem");
      return;
    }

    // Convert files to base64
    const promises = uploadData.files.map((file) => {
      return new Promise<{ data: string; type: string; size: number }>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          resolve({
            data: base64.split(",")[1],
            type: file.type,
            size: file.size,
          });
        };
        reader.readAsDataURL(file);
      });
    });

    const filesData = await Promise.all(promises);

    uploadImages.mutate({
      projectId,
      caption: uploadData.caption,
      phaseId: uploadData.phaseId,
      images: filesData,
    });
  };

  const getPhaseLabel = (phaseId: number | null) => {
    if (!phaseId) return "Sem fase";
    const phase = phases?.find((p) => p.id === phaseId);
    return phase?.name || "Fase desconhecida";
  };

  const filteredGallery = gallery?.filter((img) => 
    selectedPhase === "all" || (img.phaseId && img.phaseId.toString() === selectedPhase)
  );

  const lightboxSlides = filteredGallery?.map((img) => ({
    src: img.imageUrl,
    alt: img.caption || "Imagem do projeto",
  })) || [];

  return (
    <>
      <Card className="p-6 border-[#C3BAAF]/20 bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h3 className="font-serif text-2xl text-[#5F5C59]">Galeria do Projeto</h3>
            <Select value={selectedPhase} onValueChange={setSelectedPhase}>
              <SelectTrigger className="w-[180px] border-[#C3BAAF]/20">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Fases</SelectItem>
                {phases?.map((phase) => (
                  <SelectItem key={phase.id} value={phase.id.toString()}>
                    {phase.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#C9A882] hover:bg-[#C9A882]/90 text-white">
                <Upload className="w-4 h-4 mr-2" />
                Enviar Imagens
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl text-[#5F5C59]">Enviar Imagens</DialogTitle>
                <DialogDescription className="text-[#5F5C59]/60">
                  Envie uma ou mais imagens para a galeria (máximo 5MB cada)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="img-caption" className="text-[#5F5C59]">Legenda</Label>
                  <Input
                    id="img-caption"
                    value={uploadData.caption}
                    onChange={(e) => setUploadData({ ...uploadData, caption: e.target.value })}
                    placeholder="Descrição opcional das imagens"
                    className="border-[#C3BAAF]/20 focus:border-[#C9A882]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="img-phase" className="text-[#5F5C59]">Fase do Projeto</Label>
                  <Select 
                    value={uploadData.phaseId?.toString() || "none"} 
                    onValueChange={(value) => setUploadData({ ...uploadData, phaseId: value === "none" ? null : parseInt(value) })}
                  >
                    <SelectTrigger className="border-[#C3BAAF]/20 focus:border-[#C9A882]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem fase específica</SelectItem>
                      {phases?.map((phase) => (
                        <SelectItem key={phase.id} value={phase.id.toString()}>
                          {phase.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="img-files" className="text-[#5F5C59]">Imagens *</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-[#C3BAAF]/20"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadData.files.length > 0 
                      ? `${uploadData.files.length} imagem(ns) selecionada(s)` 
                      : "Selecionar Imagens"}
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsUploadOpen(false)}
                  className="border-[#C3BAAF]/20"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={uploadImages.isPending}
                  className="bg-[#C9A882] hover:bg-[#C9A882]/90 text-white"
                >
                  {uploadImages.isPending ? "A enviar..." : "Enviar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {filteredGallery && filteredGallery.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredGallery.map((img, index) => (
              <div
                key={img.id}
                className="group relative aspect-square rounded-lg overflow-hidden border border-[#C3BAAF]/20 hover:border-[#C9A882]/40 transition-all cursor-pointer"
                onClick={() => {
                  setLightboxIndex(index);
                  setLightboxOpen(true);
                }}
              >
                <img
                  src={img.imageUrl}
                  alt={img.caption || "Imagem do projeto"}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    {img.caption && (
                      <p className="text-white text-sm font-medium mb-1 line-clamp-2">{img.caption}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <Badge className="bg-[#C9A882] text-white border-0 text-xs">
                        {getPhaseLabel(img.phaseId)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                        if (confirm("Tem certeza que deseja remover esta imagem?")) {
                          deleteImage.mutate({ id: img.id });
                          }
                        }}
                        className="text-white hover:text-red-500 hover:bg-white/20 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#EEEAE5] rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-8 h-8 text-[#C9A882]" />
            </div>
            <h4 className="font-serif text-xl text-[#5F5C59] mb-2">Nenhuma imagem</h4>
            <p className="text-[#5F5C59]/60 mb-4">
              {selectedPhase === "all" 
                ? "Comece por enviar imagens para a galeria" 
                : "Nenhuma imagem nesta fase"}
            </p>
            <Button
              onClick={() => setIsUploadOpen(true)}
              className="bg-[#C9A882] hover:bg-[#C9A882]/90 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Enviar Primeiras Imagens
            </Button>
          </div>
        )}
      </Card>

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={lightboxSlides}
      />
    </>
  );
}
