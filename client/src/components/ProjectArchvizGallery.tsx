import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { 
  Image, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download,
  Filter,
  Grid3x3,
  List,
  Star,
  StarOff,
  Upload,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ProjectArchvizGalleryProps {
  projectId: number;
}

export function ProjectArchvizGallery({ projectId }: ProjectArchvizGalleryProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [constructionFilter, setConstructionFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedRender, setSelectedRender] = useState<any | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    constructionId: 0,
    compartmentId: 0,
    name: "",
    description: "",
    file: null as File | null,
  });
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch renders
  const { data: renders, isLoading, refetch } = trpc.projects.archviz.list.useQuery({
    projectId,
  });

  // Fetch stats
  const { data: stats } = trpc.projects.archviz.getStats.useQuery({
    projectId,
  });

  // Fetch comments when a render is selected
  const { data: comments } = trpc.projects.archviz.getComments.useQuery(
    { renderId: selectedRender?.id || 0 },
    { enabled: !!selectedRender }
  );

  // Mutations
  const addCommentMutation = trpc.projects.archviz.addComment.useMutation({
    onSuccess: () => {
      toast.success("Comentário adicionado!");
      setNewComment("");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao adicionar comentário: " + error.message);
    },
  });

  const updateStatusMutation = trpc.projects.archviz.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      refetch();
      setSelectedRender(null);
      setLightboxOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  // Fetch constructions for upload
  const { data: constructions } = trpc.projects.constructions.list.useQuery({
    projectId,
  });

  // Fetch compartments when construction is selected
  const { data: compartments } = trpc.projects.constructions.getCompartments.useQuery(
    { constructionId: uploadData.constructionId },
    { enabled: uploadData.constructionId > 0 }
  );

  // Upload mutation (S3)
  const uploadMutation = trpc.projects.archviz.uploadToS3.useMutation({
    onSuccess: () => {
      toast.success("Render carregado com sucesso!");
      refetch();
      setUploadDialogOpen(false);
      setUploadData({ constructionId: 0, compartmentId: 0, name: "", description: "", file: null });
      setUploadPreview(null);
      setIsUploading(false);
    },
    onError: (error) => {
      toast.error("Erro ao carregar render: " + error.message);
      setIsUploading(false);
    },
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecione uma imagem (JPG, PNG, WebP)");
      return;
    }

    // Validate file size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 20MB.");
      return;
    }

    setUploadData({ ...uploadData, file });

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle upload submit
  const handleUploadSubmit = async () => {
    if (!uploadData.file || !uploadData.name || uploadData.constructionId === 0 || uploadData.compartmentId === 0) {
      toast.error("Por favor preencha todos os campos obrigatórios (obra, compartimento, nome e imagem)");
      return;
    }

    setIsUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        // Call upload mutation with S3 integration
        uploadMutation.mutate({
          constructionId: uploadData.constructionId,
          compartmentId: uploadData.compartmentId,
          name: uploadData.name,
          description: uploadData.description || undefined,
          imageBase64: base64,
          mimeType: uploadData.file!.type,
          fileSize: uploadData.file!.size,
        });
      };
      reader.readAsDataURL(uploadData.file);
    } catch (error) {
      toast.error("Erro ao processar imagem");
      setIsUploading(false);
    }
  };

  // Filter renders
  const filteredRenders = renders?.filter(render => {
    if (statusFilter !== "all" && render.status !== statusFilter) return false;
    if (constructionFilter !== "all" && render.constructionCode !== constructionFilter) return false;
    return true;
  }) || [];

  // Get unique construction codes for filter
  const constructionCodes = Array.from(new Set(renders?.map(r => r.constructionCode) || []));

  // Status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case "approved_dc":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><CheckCircle className="w-3 h-3 mr-1" />Aprovado DC</Badge>;
      case "approved_client":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Aprovado Cliente</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  // Handle status change
  const handleStatusChange = (status: "pending" | "approved_dc" | "approved_client") => {
    if (!selectedRender) return;
    updateStatusMutation.mutate({
      renderId: selectedRender.id,
      status,
    });
  };

  // Handle add comment
  const handleAddComment = () => {
    if (!selectedRender || !newComment.trim()) return;
    addCommentMutation.mutate({
      renderId: selectedRender.id,
      content: newComment,
    });
  };

  // Open lightbox
  const openLightbox = (render: any) => {
    setSelectedRender(render);
    setLightboxOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C9A882]"></div>
      </div>
    );
  }

  if (!renders || renders.length === 0) {
    return (
      <div className="text-center py-12">
        <Image className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Sem renders disponíveis</h3>
        <p className="text-sm text-gray-500">
          Este projeto ainda não tem renders 3D associados às suas obras.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setUploadDialogOpen(true)}
          className="bg-[#C9A882] hover:bg-[#C9A882]/90"
          disabled={!constructions || constructions.length === 0}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Render
        </Button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total de Renders</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pendentes</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.approvedDc}</div>
            <div className="text-sm text-gray-600">Aprovados DC</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.approvedClient}</div>
            <div className="text-sm text-gray-600">Aprovados Cliente</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-[#C9A882]">{stats.favorites}</div>
            <div className="text-sm text-gray-600">Favoritos</div>
          </Card>
        </div>
      )}

      {/* Filters and View Mode */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="approved_dc">Aprovado DC</SelectItem>
              <SelectItem value="approved_client">Aprovado Cliente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Select value={constructionFilter} onValueChange={setConstructionFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por obra" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Obras</SelectItem>
            {constructionCodes.map(code => (
              <SelectItem key={code} value={code}>{code}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className={viewMode === "grid" ? "bg-[#C9A882] hover:bg-[#C9A882]/90" : ""}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className={viewMode === "list" ? "bg-[#C9A882] hover:bg-[#C9A882]/90" : ""}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Renders Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRenders.map(render => (
            <Card 
              key={render.id} 
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => openLightbox(render)}
            >
              <div className="aspect-video bg-gray-100 relative">
                {render.thumbnailUrl || render.fileUrl ? (
                  <img 
                    src={render.thumbnailUrl || render.fileUrl} 
                    alt={render.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Image className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                {render.isFavorite && (
                  <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <h4 className="font-medium text-sm text-gray-900 truncate mb-1">{render.name}</h4>
                <p className="text-xs text-gray-500 mb-2">{render.constructionCode} - v{render.version}</p>
                <div className="flex items-center justify-between">
                  {getStatusBadge(render.status)}
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MessageSquare className="w-3 h-3" />
                    {render.commentCount}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRenders.map(render => (
            <Card 
              key={render.id} 
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => openLightbox(render)}
            >
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-gray-100 rounded flex-shrink-0">
                  {render.thumbnailUrl || render.fileUrl ? (
                    <img 
                      src={render.thumbnailUrl || render.fileUrl} 
                      alt={render.name}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Image className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 truncate">{render.name}</h4>
                    {render.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{render.description || "Sem descrição"}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{render.constructionCode}</span>
                    <span>v{render.version}</span>
                    <span>{render.uploaderName}</span>
                    <span>{new Date(render.createdAt).toLocaleDateString("pt-PT")}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(render.status)}
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MessageSquare className="w-3 h-3" />
                    {render.commentCount} comentários
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {selectedRender && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedRender.name}</span>
                  {getStatusBadge(selectedRender.status)}
                </DialogTitle>
              </DialogHeader>

              {/* Image */}
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                <img 
                  src={selectedRender.fileUrl} 
                  alt={selectedRender.name}
                  className="w-full h-auto"
                />
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Obra</div>
                  <div className="font-medium">{selectedRender.constructionCode}</div>
                </div>
                <div>
                  <div className="text-gray-500">Versão</div>
                  <div className="font-medium">v{selectedRender.version}</div>
                </div>
                <div>
                  <div className="text-gray-500">Enviado por</div>
                  <div className="font-medium">{selectedRender.uploaderName}</div>
                </div>
                <div>
                  <div className="text-gray-500">Data</div>
                  <div className="font-medium">{new Date(selectedRender.createdAt).toLocaleDateString("pt-PT")}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange("pending")}
                  disabled={updateStatusMutation.isPending}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Marcar Pendente
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange("approved_dc")}
                  disabled={updateStatusMutation.isPending}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprovar DC
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange("approved_client")}
                  disabled={updateStatusMutation.isPending}
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprovar Cliente
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(selectedRender.fileUrl, "_blank")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCommentDialogOpen(true)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Comentários ({comments?.length || 0})
                </Button>
              </div>

              {/* Comments Section */}
              {commentDialogOpen && (
                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-medium">Comentários</h4>
                  
                  {/* Existing Comments */}
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {comments && comments.length > 0 ? (
                      comments.map(comment => (
                        <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{comment.userName}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleDateString("pt-PT")}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{comment.content}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">Sem comentários ainda</p>
                    )}
                  </div>

                  {/* Add Comment */}
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Adicionar comentário..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || addCommentMutation.isPending}
                      className="bg-[#C9A882] hover:bg-[#C9A882]/90"
                    >
                      {addCommentMutation.isPending ? "Enviando..." : "Adicionar Comentário"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Render 3D</DialogTitle>
            <DialogDescription>
              Carregue um novo render para este projeto
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Construction Selection */}
            <div>
              <Label htmlFor="construction">Obra *</Label>
              <Select
                value={uploadData.constructionId.toString()}
                onValueChange={(value) => {
                  setUploadData({ ...uploadData, constructionId: parseInt(value), compartmentId: 0 });
                }}
              >
                <SelectTrigger id="construction">
                  <SelectValue placeholder="Selecione a obra" />
                </SelectTrigger>
                <SelectContent>
                  {constructions?.map(construction => (
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
                <Label htmlFor="compartment">Compartimento *</Label>
                <Select
                  value={uploadData.compartmentId.toString()}
                  onValueChange={(value) => setUploadData({ ...uploadData, compartmentId: parseInt(value) })}
                >
                  <SelectTrigger id="compartment">
                    <SelectValue placeholder="Selecione o compartimento" />
                  </SelectTrigger>
                  <SelectContent>
                    {compartments?.map(compartment => (
                      <SelectItem key={compartment.id} value={compartment.id.toString()}>
                        {compartment.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {compartments && compartments.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Esta obra ainda não tem compartimentos cadastrados.
                  </p>
                )}
              </div>
            )}

            {/* Name */}
            <div>
              <Label htmlFor="name">Nome do Render *</Label>
              <Input
                id="name"
                value={uploadData.name}
                onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                placeholder="Ex: Vista Exterior Principal"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={uploadData.description}
                onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                placeholder="Descrição opcional do render..."
                rows={3}
              />
            </div>

            {/* File Upload */}
            <div>
              <Label htmlFor="file">Imagem *</Label>
              <Input
                id="file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">
                Formatos aceites: JPG, PNG, WebP. Máximo 20MB.
              </p>
            </div>

            {/* Preview */}
            {uploadPreview && (
              <div>
                <Label>Preview</Label>
                <div className="mt-2 border rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={uploadPreview}
                    alt="Preview"
                    className="w-full h-auto max-h-96 object-contain"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false);
                setUploadData({ constructionId: 0, compartmentId: 0, name: "", description: "", file: null });
                setUploadPreview(null);
              }}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUploadSubmit}
              disabled={isUploading || !uploadData.file || !uploadData.name || uploadData.constructionId === 0}
              className="bg-[#C9A882] hover:bg-[#C9A882]/90"
            >
              {isUploading ? "A carregar..." : "Carregar Render"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
