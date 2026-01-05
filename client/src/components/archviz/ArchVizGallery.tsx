import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Upload, 
  Image as ImageIcon, 
  Star, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  Clock, 
  Search, 
  X, 
  Filter,
  Heart,
  Calendar,
  History,
  FileDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ArchVizUploadModal } from "./ArchVizUploadModal";
import { ArchVizEditModal } from "./ArchVizEditModal";
import { RenderComparisonModal } from "./RenderComparisonModal";
import { StatusHistoryModal } from "./StatusHistoryModal";

interface ArchVizGalleryProps {
  constructionId: number;
}

type StatusFilter = "all" | "pending" | "approved_dc" | "approved_client";
type PeriodFilter = "all" | "week" | "month" | "3months";

export function ArchVizGallery({ constructionId }: ArchVizGalleryProps) {
  const { toast } = useToast();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRender, setSelectedRender] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renderToDelete, setRenderToDelete] = useState<number | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<number[]>([]);
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [renderForHistory, setRenderForHistory] = useState<{ id: number; name: string } | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [compartmentFilter, setCompartmentFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const { data: renders = [], refetch: refetchRenders } = trpc.archviz.renders.listByConstruction.useQuery({
    constructionId,
  });

  const { data: compartments = [] } = trpc.archviz.compartments.list.useQuery({
    constructionId,
  });

  const { data: stats } = trpc.archviz.stats.useQuery({
    constructionId,
  });

  const deleteRenderMutation = trpc.archviz.renders.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Render apagado",
        description: "O render foi apagado com sucesso.",
      });
      refetchRenders();
    },
    onError: (error) => {
      toast({
        title: "Erro ao apagar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleFavoriteMutation = trpc.archviz.renders.toggleFavorite.useMutation({
    onSuccess: () => {
      refetchRenders();
    },
  });

  // Lógica de filtros
  const filteredRenders = useMemo(() => {
    let filtered = [...renders];

    // Filtro de pesquisa
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (render) =>
          render.name.toLowerCase().includes(query) ||
          render.description?.toLowerCase().includes(query)
      );
    }

    // Filtro de status
    if (statusFilter !== "all") {
      filtered = filtered.filter((render) => render.status === statusFilter);
    }

    // Filtro de compartimento
    if (compartmentFilter !== "all") {
      filtered = filtered.filter(
        (render) => render.compartmentId.toString() === compartmentFilter
      );
    }

    // Filtro de período
    if (periodFilter !== "all") {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (periodFilter) {
        case "week":
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case "month":
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case "3months":
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
      }

      filtered = filtered.filter(
        (render) => new Date(render.createdAt) >= cutoffDate
      );
    }

    // Filtro de favoritos
    if (showFavoritesOnly) {
      filtered = filtered.filter((render) => render.isFavorite);
    }

    return filtered;
  }, [renders, searchQuery, statusFilter, compartmentFilter, periodFilter, showFavoritesOnly]);

  // Agrupar por compartimento
  const rendersByCompartment = useMemo(() => {
    const grouped: Record<number, any[]> = {};
    filteredRenders.forEach((render) => {
      if (!grouped[render.compartmentId]) {
        grouped[render.compartmentId] = [];
      }
      grouped[render.compartmentId].push(render);
    });
    return grouped;
  }, [filteredRenders]);

  const handleEdit = (render: any) => {
    setSelectedRender(render);
    setEditModalOpen(true);
  };

  const handleDelete = (renderId: number) => {
    setRenderToDelete(renderId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (renderToDelete) {
      deleteRenderMutation.mutate({ id: renderToDelete });
      setDeleteDialogOpen(false);
      setRenderToDelete(null);
    }
  };

  const handleToggleFavorite = (renderId: number, currentFavorite: boolean) => {
    toggleFavoriteMutation.mutate({
      id: renderId,
      isFavorite: !currentFavorite,
    });
  };

  const handleComparisonSelect = (renderId: number) => {
    setSelectedForComparison((prev) => {
      if (prev.includes(renderId)) {
        return prev.filter((id) => id !== renderId);
      }
      if (prev.length < 2) {
        return [...prev, renderId];
      }
      return prev;
    });
  };

  const startComparison = () => {
    if (selectedForComparison.length === 2) {
      setComparisonModalOpen(true);
    }
  };

  const exitComparisonMode = () => {
    setComparisonMode(false);
    setSelectedForComparison([]);
  };

  const handleExportPdf = async () => {
    console.log("[PDF Export] Starting export...");
    setIsGeneratingPdf(true);
    try {
      console.log("[PDF Export] Importing PDF service...");
      const { generateArchVizReport } = await import("@/lib/archvizPdfService");
      console.log("[PDF Export] PDF service imported successfully");
      
      console.log("[PDF Export] Fetching report data for constructionId:", constructionId);
      const reportDataResult = await trpc.archviz.getReportData.query({ constructionId });
      console.log("[PDF Export] Report data received:", reportDataResult);
      
      if (!reportDataResult) {
        toast({
          title: "Erro",
          description: "Não foi possível obter os dados do relatório",
          variant: "destructive",
        });
        return;
      }
      
      const reportData = {
        constructionName: reportDataResult.construction.name,
        constructionCode: reportDataResult.construction.code,
        totalRenders: reportDataResult.stats.total,
        pendingCount: reportDataResult.stats.pending,
        approvedDcCount: reportDataResult.stats.approvedDc,
        approvedClientCount: reportDataResult.stats.approvedClient,
        renders: reportDataResult.renders.map((item: any) => ({
          render: {
            id: item.render.id,
            name: item.render.name,
            version: item.render.version,
            status: item.render.status,
            compartmentName: item.render.compartmentName,
            uploadedAt: item.render.uploadedAt,
            imageUrl: item.render.imageUrl,
            isFavorite: item.render.isFavorite,
          },
          history: item.history.map((h: any) => ({
            oldStatus: h.oldStatus,
            newStatus: h.newStatus,
            changedByName: h.changedByName || "Sistema",
            changedAt: h.changedAt,
            notes: h.notes,
          })),
          comments: item.comments.map((c: any) => ({
            content: c.content,
            authorName: c.authorName || "Anónimo",
            createdAt: c.createdAt,
          })),
        })),
      };
      
      console.log("[PDF Export] Calling generateArchVizReport with data:", reportData);
      await generateArchVizReport(reportData);
      console.log("[PDF Export] PDF generated successfully!");
      
      toast({
        title: "Sucesso",
        description: "Relatório PDF gerado com sucesso!",
      });
    } catch (error) {
      console.error("[PDF Export] Error:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar o relatório PDF",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved_client":
        return <Badge className="bg-green-600 text-white">Aprovada DC + Cliente</Badge>;
      case "approved_dc":
        return <Badge className="bg-blue-600 text-white">Aprovada DC</Badge>;
      default:
        return <Badge variant="outline" className="border-amber-500 text-amber-700">Pendente</Badge>;
    }
  };

  const getCompartmentName = (compartmentId: number) => {
    const compartment = compartments.find((c) => c.id === compartmentId);
    return compartment?.name || "Sem compartimento";
  };

  const hasActiveFilters = 
    searchQuery !== "" || 
    statusFilter !== "all" || 
    compartmentFilter !== "all" || 
    periodFilter !== "all" || 
    showFavoritesOnly;

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCompartmentFilter("all");
    setPeriodFilter("all");
    setShowFavoritesOnly(false);
  };

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold" style={{ color: "#5F5C59" }}>
            Visualizações 3D / Renders
          </h2>
          <p className="text-sm mt-1" style={{ color: "#5F5C59" }}>
            {stats?.totalRenders || 0} renders • {stats?.pendingCount || 0} pendentes • {stats?.approvedDcCount || 0} aprovadas DC • {stats?.approvedClientCount || 0} aprovadas cliente
          </p>
        </div>
        <div className="flex gap-2">
          {comparisonMode ? (
            <>
              <Button
                onClick={exitComparisonMode}
                variant="outline"
                style={{ borderColor: "#C3BAAF", color: "#5F5C59" }}
              >
                Cancelar
              </Button>
              <Button
                onClick={startComparison}
                disabled={selectedForComparison.length !== 2}
                style={{ backgroundColor: "#C9A882", color: "white" }}
                className="hover:opacity-90"
              >
                Comparar ({selectedForComparison.length}/2)
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => setComparisonMode(true)}
                variant="outline"
                disabled={renders.length < 2}
                style={{ borderColor: "#C3BAAF", color: "#5F5C59" }}
              >
                Comparar Versões
              </Button>
              <Button
                onClick={handleExportPdf}
                variant="outline"
                disabled={isGeneratingPdf || renders.length === 0}
                style={{ borderColor: "#C3BAAF", color: "#5F5C59" }}
              >
                <FileDown className="h-4 w-4 mr-2" />
                {isGeneratingPdf ? "Gerando..." : "Exportar Relatório PDF"}
              </Button>
              <Button
                onClick={() => setUploadModalOpen(true)}
                style={{ backgroundColor: "#C9A882", color: "white" }}
                className="hover:opacity-90"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Renders
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Barra de Filtros */}
      <Card className="p-4" style={{ backgroundColor: "white", borderColor: "#C3BAAF" }}>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" style={{ color: "#5F5C59" }} />
            <h3 className="font-semibold" style={{ color: "#5F5C59" }}>Filtros</h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="ml-auto text-sm"
                style={{ color: "#C9A882" }}
              >
                <X className="h-3 w-3 mr-1" />
                Limpar Filtros
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Pesquisa */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: "#5F5C59" }} />
              <Input
                placeholder="Pesquisar por nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                style={{ borderColor: "#C3BAAF" }}
              />
            </div>

            {/* Status */}
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger style={{ borderColor: "#C3BAAF" }}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="approved_dc">Aprovada DC</SelectItem>
                <SelectItem value="approved_client">Aprovada DC + Cliente</SelectItem>
              </SelectContent>
            </Select>

            {/* Compartimento */}
            <Select value={compartmentFilter} onValueChange={setCompartmentFilter}>
              <SelectTrigger style={{ borderColor: "#C3BAAF" }}>
                <SelectValue placeholder="Compartimento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os compartimentos</SelectItem>
                {compartments.map((comp) => (
                  <SelectItem key={comp.id} value={comp.id.toString()}>
                    {comp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Período */}
            <Select value={periodFilter} onValueChange={(value) => setPeriodFilter(value as PeriodFilter)}>
              <SelectTrigger style={{ borderColor: "#C3BAAF" }}>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os períodos</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
                <SelectItem value="3months">Últimos 3 meses</SelectItem>
              </SelectContent>
            </Select>

            {/* Favoritos */}
            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className="w-full"
              style={
                showFavoritesOnly
                  ? { backgroundColor: "#C9A882", color: "white" }
                  : { borderColor: "#C3BAAF", color: "#5F5C59" }
              }
            >
              <Heart className={`h-4 w-4 mr-2 ${showFavoritesOnly ? "fill-current" : ""}`} />
              Favoritos
            </Button>
          </div>

          {/* Contador de resultados */}
          <div className="text-sm" style={{ color: "#5F5C59" }}>
            A mostrar <span className="font-semibold">{filteredRenders.length}</span> de{" "}
            <span className="font-semibold">{renders.length}</span> renders
          </div>
        </div>
      </Card>

      {/* Galeria agrupada por compartimento */}
      {Object.keys(rendersByCompartment).length === 0 ? (
        <Card className="p-12 text-center" style={{ backgroundColor: "white", borderColor: "#C3BAAF" }}>
          <ImageIcon className="h-12 w-12 mx-auto mb-4" style={{ color: "#C3BAAF" }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: "#5F5C59" }}>
            {hasActiveFilters ? "Nenhum render encontrado" : "Nenhum render disponível"}
          </h3>
          <p className="text-sm mb-4" style={{ color: "#5F5C59" }}>
            {hasActiveFilters
              ? "Tente ajustar os filtros para ver mais resultados."
              : "Faça upload do primeiro render para começar."}
          </p>
          {hasActiveFilters && (
            <Button onClick={clearFilters} variant="outline" style={{ borderColor: "#C3BAAF", color: "#5F5C59" }}>
              Limpar Filtros
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(rendersByCompartment).map(([compartmentId, compartmentRenders]) => (
            <Card key={compartmentId} className="p-6" style={{ backgroundColor: "white", borderColor: "#C3BAAF" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: "#5F5C59" }}>
                  {getCompartmentName(parseInt(compartmentId))}
                </h3>
                <Badge variant="outline" style={{ borderColor: "#C9A882", color: "#C9A882" }}>
                  {compartmentRenders.length} {compartmentRenders.length === 1 ? "render" : "renders"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {compartmentRenders.map((render) => {
                  const isApproved = render.status === "approved_dc" || render.status === "approved_client";
                  const isSelected = selectedForComparison.includes(render.id);

                  return (
                    <Card
                      key={render.id}
                      className={`overflow-hidden transition-all ${
                        isApproved
                          ? "bg-gradient-to-br from-gray-800 to-gray-900"
                          : "bg-white"
                      } ${
                        comparisonMode
                          ? isSelected
                            ? "ring-4 ring-blue-500"
                            : "cursor-pointer hover:ring-2 hover:ring-blue-300"
                          : ""
                      }`}
                      style={{ borderColor: isApproved ? "#C9A882" : "#C3BAAF" }}
                      onClick={() => comparisonMode && handleComparisonSelect(render.id)}
                    >
                      {/* Imagem */}
                      <div className="relative aspect-video bg-gray-100">
                        <img
                          src={render.fileUrl}
                          alt={render.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Badge de versão */}
                        <div className="absolute top-2 left-2">
                          <Badge
                            className="text-xs"
                            style={{ backgroundColor: "#C9A882", color: "white" }}
                          >
                            v{render.version}
                          </Badge>
                        </div>
                        {/* Ícone de favorito */}
                        {render.isFavorite && (
                          <div className="absolute top-2 right-2">
                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          </div>
                        )}
                        {/* Indicador de seleção para comparação */}
                        {comparisonMode && isSelected && (
                          <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                            <CheckCircle2 className="h-12 w-12 text-blue-500" />
                          </div>
                        )}
                      </div>

                      {/* Conteúdo */}
                      <div className={`p-4 ${isApproved ? "text-white" : ""}`}>
                        <div className="flex items-start justify-between mb-2">
                          <h4 className={`font-semibold ${isApproved ? "text-white" : ""}`} style={!isApproved ? { color: "#5F5C59" } : {}}>
                            {render.name}
                          </h4>
                          {getStatusBadge(render.status)}
                        </div>

                        {render.description && (
                          <p className={`text-sm mb-3 ${isApproved ? "text-gray-300" : ""}`} style={!isApproved ? { color: "#5F5C59" } : {}}>
                            {render.description}
                          </p>
                        )}

                        <div className={`flex items-center text-xs mb-3 ${isApproved ? "text-gray-400" : ""}`} style={!isApproved ? { color: "#5F5C59" } : {}}>
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(render.createdAt).toLocaleDateString("pt-PT")}
                        </div>

                        {!comparisonMode && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleFavorite(render.id, render.isFavorite)}
                              className={isApproved ? "border-gray-600 text-gray-300 hover:bg-gray-700" : ""}
                              style={!isApproved ? { borderColor: "#C3BAAF", color: "#5F5C59" } : {}}
                            >
                              <Heart className={`h-3 w-3 ${render.isFavorite ? "fill-current" : ""}`} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setRenderForHistory({ id: render.id, name: render.name });
                                setHistoryModalOpen(true);
                              }}
                              className={isApproved ? "border-gray-600 text-gray-300 hover:bg-gray-700" : ""}
                              style={!isApproved ? { borderColor: "#C3BAAF", color: "#5F5C59" } : {}}
                              title="Ver Histórico"
                            >
                              <History className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(render)}
                              className={isApproved ? "border-gray-600 text-gray-300 hover:bg-gray-700" : ""}
                              style={!isApproved ? { borderColor: "#C3BAAF", color: "#5F5C59" } : {}}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(render.id)}
                              className={isApproved ? "border-gray-600 text-gray-300 hover:bg-gray-700" : ""}
                              style={!isApproved ? { borderColor: "#C3BAAF", color: "#5F5C59" } : {}}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modais */}
      <ArchVizUploadModal
        constructionId={constructionId}
        compartments={compartments}
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onSuccess={refetchRenders}
      />

      {selectedRender && (
        <ArchVizEditModal
          render={selectedRender}
          compartments={compartments}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onSuccess={refetchRenders}
        />
      )}

      {selectedForComparison.length === 2 && (
        <RenderComparisonModal
          render1Id={selectedForComparison[0]}
          render2Id={selectedForComparison[1]}
          open={comparisonModalOpen}
          onOpenChange={setComparisonModalOpen}
        />
      )}

      {/* Modal de Histórico */}
      {renderForHistory && (
        <StatusHistoryModal
          open={historyModalOpen}
          onOpenChange={setHistoryModalOpen}
          renderId={renderForHistory.id}
          renderName={renderForHistory.name}
        />
      )}

      {/* Dialog de confirmação de deleção */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent style={{ backgroundColor: "white", borderColor: "#C3BAAF" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#5F5C59" }}>Apagar Render?</DialogTitle>
            <DialogDescription style={{ color: "#5F5C59" }}>
              Tem a certeza que deseja apagar este render? Esta ação não pode ser revertida.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              style={{ borderColor: "#C3BAAF", color: "#5F5C59" }}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sim, Apagar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
