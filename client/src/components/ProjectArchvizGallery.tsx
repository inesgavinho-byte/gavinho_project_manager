import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { 
  ChevronDown,
  ChevronRight,
  Star,
  Edit2,
  Trash2,
  Upload,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { RenderLightbox } from "@/components/RenderLightbox";

interface ProjectArchvizGalleryProps {
  projectId: number;
}

export function ProjectArchvizGallery({ projectId }: ProjectArchvizGalleryProps) {
  const [expandedCompartments, setExpandedCompartments] = useState<Set<number>>(new Set());
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    constructionId: 0,
    compartmentId: 0,
    name: "",
    description: "",
    file: null as File | null,
  });
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<any[]>([]);
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0);

  // Fetch renders aggregated by project
  const { data: renders, isLoading, refetch } = trpc.projects.archviz.list.useQuery({
    projectId,
  });

  // Fetch constructions for upload dropdown
  const { data: constructions } = trpc.projects.constructions.list.useQuery({
    projectId,
  });

  // Fetch compartments when construction is selected
  const { data: compartments, refetch: refetchCompartments } = trpc.projects.constructions.getCompartments.useQuery(
    { constructionId: uploadData.constructionId },
    { enabled: uploadData.constructionId > 0 }
  );

  // Mutations
  const uploadMutation = trpc.projects.archviz.uploadToS3.useMutation({
    onSuccess: () => {
      toast.success("Render carregado com sucesso!");
      setUploadDialogOpen(false);
      setUploadData({
        constructionId: 0,
        compartmentId: 0,
        name: "",
        description: "",
        file: null,
      });
      setUploadPreview(null);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao carregar render: " + error.message);
    },
  });

  const toggleFavoriteMutation = trpc.projects.archviz.toggleFavorite.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const deleteRenderMutation = trpc.projects.archviz.deleteRender.useMutation({
    onSuccess: () => {
      toast.success("Render apagado!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao apagar: " + error.message);
    },
  });

  // Group renders by compartment
  const groupedRenders = renders?.reduce((acc: any, render: any) => {
    const compartmentId = render.compartmentId || 0;
    const compartmentName = render.compartmentName || "Sem Compartimento";
    
    if (!acc[compartmentId]) {
      acc[compartmentId] = {
        id: compartmentId,
        name: compartmentName,
        constructionCode: render.constructionCode,
        renders: [],
      };
    }

    acc[compartmentId].renders.push(render);
    return acc;
  }, {});

  const compartmentList = groupedRenders ? Object.values(groupedRenders) : [];

  // Calculate stats
  const totalImages = renders?.length || 0;
  const totalCompartments = compartmentList.length;
  const totalViews = compartmentList.reduce((sum: number, comp: any) => {
    // Count unique render names
    const uniqueNames = new Set(comp.renders.map((r: any) => r.name));
    return sum + uniqueNames.size;
  }, 0);

  const toggleCompartment = (compartmentId: number) => {
    setExpandedCompartments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(compartmentId)) {
        newSet.delete(compartmentId);
      } else {
        newSet.add(compartmentId);
      }
      return newSet;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Validate file size (20MB max)
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 20MB");
      return;
    }

    setUploadData(prev => ({ ...prev, file }));

    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async () => {
    if (!uploadData.file || !uploadData.constructionId || !uploadData.compartmentId || !uploadData.name) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Convert file to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      uploadMutation.mutate({
        constructionId: uploadData.constructionId,
        compartmentId: uploadData.compartmentId,
        name: uploadData.name,
        description: uploadData.description,
        imageBase64: base64,
      });
    };
    reader.readAsDataURL(uploadData.file);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">A carregar renders...</p>
        </div>
      </div>
    );
  }

  if (!renders || renders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Sem renders disponíveis</h3>
          <p className="text-muted-foreground mb-6">
            Este projeto ainda não tem renders 3D associados às suas obras.
          </p>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Carregar Render
          </Button>
        </div>

        {/* Upload Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Carregar Novo Render</DialogTitle>
              <DialogDescription>
                Adicione um novo render 3D ao projeto
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Construction Selection */}
              <div>
                <Label>Obra *</Label>
                <Select
                  value={uploadData.constructionId.toString()}
                  onValueChange={(value) => {
                    setUploadData(prev => ({ ...prev, constructionId: parseInt(value), compartmentId: 0 }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a obra" />
                  </SelectTrigger>
                  <SelectContent>
                    {constructions?.map((construction: any) => (
                      <SelectItem key={construction.id} value={construction.id.toString()}>
                        {construction.code} - {construction.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Compartment Selection */}
              {uploadData.constructionId > 0 && (
                <div>
                  <Label>Compartimento *</Label>
                  <Select
                    value={uploadData.compartmentId.toString()}
                    onValueChange={(value) => {
                      setUploadData(prev => ({ ...prev, compartmentId: parseInt(value) }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o compartimento" />
                    </SelectTrigger>
                    <SelectContent>
                      {compartments && compartments.length > 0 ? (
                        compartments.map((comp: any) => (
                          <SelectItem key={comp.id} value={comp.id.toString()}>
                            {comp.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                          Nenhum compartimento cadastrado
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Name */}
              <div>
                <Label>Nome do Render *</Label>
                <Input
                  value={uploadData.name}
                  onChange={(e) => setUploadData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Vista Geral, Bar, Deck externo..."
                />
              </div>

              {/* Description */}
              <div>
                <Label>Descrição (opcional)</Label>
                <Textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Adicione detalhes sobre este render..."
                  rows={3}
                />
              </div>

              {/* File Upload */}
              <div>
                <Label>Imagem *</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formatos aceites: JPG, PNG, WebP. Máximo 20MB.
                </p>
              </div>

              {/* Preview */}
              {uploadPreview && (
                <div>
                  <Label>Pré-visualização</Label>
                  <div className="mt-2 border rounded-lg overflow-hidden">
                    <img
                      src={uploadPreview}
                      alt="Preview"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleUploadSubmit}
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? "A carregar..." : "Carregar Render"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-semibold">Visualizações 3D / Renders</h2>
          <p className="text-sm text-muted-foreground">
            {totalImages} {totalImages === 1 ? "imagem" : "imagens"} em {totalViews} {totalViews === 1 ? "vista" : "vistas"} • {totalCompartments} {totalCompartments === 1 ? "compartimento" : "compartimentos"}
          </p>
        </div>

        <Button onClick={() => setUploadDialogOpen(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Adicionar Render
        </Button>
      </div>

      {/* Compartments Accordion */}
      <div className="space-y-3">
        {compartmentList.map((compartment: any) => {
          const isExpanded = expandedCompartments.has(compartment.id);
          const imageCount = compartment.renders.length;
          
          // Group by render name for version counting
          const renderGroups = compartment.renders.reduce((acc: any, render: any) => {
            const name = render.name || "Sem Nome";
            if (!acc[name]) acc[name] = [];
            acc[name].push(render);
            return acc;
          }, {});
          
          const viewCount = Object.keys(renderGroups).length;

          return (
            <Card key={compartment.id} className="overflow-hidden">
              {/* Compartment Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors bg-[#EEEAE5]"
                onClick={() => toggleCompartment(compartment.id)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-[#5F5C59]" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-[#5F5C59]" />
                  )}
                  <div>
                    <h3 className="font-semibold text-[#5F5C59]">{compartment.name}</h3>
                    <p className="text-sm text-[#5F5C59]/70">
                      {imageCount} {imageCount === 1 ? "imagem" : "imagens"} em {viewCount} {viewCount === 1 ? "vista" : "vistas"} • {compartment.constructionCode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Renders Grid */}
              {isExpanded && (
                <div className="p-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(renderGroups).map(([renderName, versions]: [string, any]) => {
                      const latestVersion = versions[versions.length - 1];
                      const versionCount = versions.length;

                      return (
                        <div key={renderName} className="group relative">
                          {/* Thumbnail */}
                          <div className="relative aspect-video rounded-lg overflow-hidden border border-[#C3BAAF] cursor-pointer"
                            onClick={() => {
                              // Open lightbox with all versions of this render
                              const allVersions = versions.map((v: any) => ({
                                id: v.id,
                                name: v.name,
                                imageUrl: v.fileUrl,
                                version: v.version,
                                status: v.status,
                                isFavorite: v.isFavorite,
                                createdAt: v.createdAt,
                                compartmentName: compartment.name,
                                constructionCode: compartment.constructionCode,
                              }));
                              setLightboxImages(allVersions);
                              setLightboxInitialIndex(allVersions.length - 1); // Start with latest version
                              setLightboxOpen(true);
                            }}
                          >
                            <img
                              src={latestVersion.fileUrl}
                              alt={latestVersion.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            
                            {/* Version Badge */}
                            {versionCount > 1 && (
                              <div className="absolute top-2 right-2 bg-[#C9A882] text-white px-2 py-1 rounded text-xs font-medium">
                                {versionCount} {versionCount === 1 ? "versão" : "versões"}
                              </div>
                            )}

                            {/* Favorite Badge */}
                            {latestVersion.isFavorite && (
                              <div className="absolute top-2 left-2">
                                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                              </div>
                            )}

                            {/* Action Buttons Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex items-center justify-between">
                                <span className="text-white text-sm font-medium truncate">
                                  {renderName}
                                </span>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-7 w-7 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFavoriteMutation.mutate({ renderId: latestVersion.id });
                                    }}
                                  >
                                    <Star className={`w-4 h-4 ${latestVersion.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-7 w-7 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // TODO: Implement edit
                                      toast.info("Funcionalidade de edição em desenvolvimento");
                                    }}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-7 w-7 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm("Tem certeza que deseja apagar este render?")) {
                                        deleteRenderMutation.mutate({ renderId: latestVersion.id });
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Render Info */}
                          <div className="mt-2">
                            <p className="text-sm font-medium text-[#5F5C59] truncate">{renderName}</p>
                            <p className="text-xs text-[#5F5C59]/70">
                              Versão {latestVersion.version} • {new Date(latestVersion.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Carregar Novo Render</DialogTitle>
            <DialogDescription>
              Adicione um novo render 3D ao projeto
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Construction Selection */}
            <div>
              <Label>Obra *</Label>
              <Select
                value={uploadData.constructionId.toString()}
                onValueChange={(value) => {
                  setUploadData(prev => ({ ...prev, constructionId: parseInt(value), compartmentId: 0 }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a obra" />
                </SelectTrigger>
                <SelectContent>
                  {constructions?.map((construction: any) => (
                    <SelectItem key={construction.id} value={construction.id.toString()}>
                      {construction.code} - {construction.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Compartment Selection */}
            {uploadData.constructionId > 0 && (
              <div>
                <Label>Compartimento *</Label>
                <Select
                  value={uploadData.compartmentId.toString()}
                  onValueChange={(value) => {
                    setUploadData(prev => ({ ...prev, compartmentId: parseInt(value) }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o compartimento" />
                  </SelectTrigger>
                  <SelectContent>
                    {compartments && compartments.length > 0 ? (
                      compartments.map((comp: any) => (
                        <SelectItem key={comp.id} value={comp.id.toString()}>
                          {comp.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                        Nenhum compartimento cadastrado
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Name */}
            <div>
              <Label>Nome do Render *</Label>
              <Input
                value={uploadData.name}
                onChange={(e) => setUploadData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Vista Geral, Bar, Deck externo..."
              />
            </div>

            {/* Description */}
            <div>
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={uploadData.description}
                onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Adicione detalhes sobre este render..."
                rows={3}
              />
            </div>

            {/* File Upload */}
            <div>
              <Label>Imagem *</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Formatos aceites: JPG, PNG, WebP. Máximo 20MB.
              </p>
            </div>

            {/* Preview */}
            {uploadPreview && (
              <div>
                <Label>Pré-visualização</Label>
                <div className="mt-2 border rounded-lg overflow-hidden">
                  <img
                    src={uploadPreview}
                    alt="Preview"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUploadSubmit}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? "A carregar..." : "Carregar Render"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* Render Lightbox */}
      <RenderLightbox
        images={lightboxImages}
        initialIndex={lightboxInitialIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
