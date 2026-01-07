import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, History, TrendingUp, CheckCircle2, Circle, AlertCircle, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/_core/hooks/useAuth";

export default function SiteQuantityMap() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const constructionId = parseInt(params.id || "0");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingQuantity, setEditingQuantity] = useState("");

  // Queries
  const { data: items = [], refetch: refetchItems } = trpc.siteManagement.quantityMap.list.useQuery(
    { constructionId },
    { enabled: constructionId > 0 }
  );

  const { data: stats } = trpc.siteManagement.quantityMap.getStats.useQuery(
    { constructionId },
    { enabled: constructionId > 0 }
  );

  const { data: categoryData = [] } = trpc.siteManagement.quantityMap.getByCategory.useQuery(
    { constructionId },
    { enabled: constructionId > 0 }
  );

  const { data: filteredMarcations = [], refetch: refetchFiltered } = trpc.siteManagement.quantityMap.getByStatus.useQuery(
    {
      constructionId,
      status: statusFilter === "all" ? undefined : statusFilter,
    },
    { enabled: constructionId > 0 }
  );

  const { data: pendingMarcations = [], refetch: refetchPending } = trpc.siteManagement.quantityMap.getPending.useQuery(
    { constructionId },
    { enabled: constructionId > 0 }
  );

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedMarcationId, setSelectedMarcationId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Mutations
  const updateProgressMutation = trpc.siteManagement.quantityMap.updateProgress.useMutation({
    onSuccess: () => {
      toast({
        title: "Progresso atualizado",
        description: "A quantidade executada foi atualizada com sucesso",
      });
      refetchItems();
      refetchPending();
      refetchFiltered();
      setEditingItemId(null);
      setEditingQuantity("");
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const approveMutation = trpc.siteManagement.quantityMap.approve.useMutation({
    onSuccess: () => {
      toast({
        title: "Marcação aprovada",
        description: "A marcação foi aprovada com sucesso",
      });
      refetchPending();
      refetchFiltered();
      refetchItems();
    },
    onError: (error) => {
      toast({
        title: "Erro ao aprovar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = trpc.siteManagement.quantityMap.reject.useMutation({
    onSuccess: () => {
      toast({
        title: "Marcação rejeitada",
        description: "A marcação foi rejeitada com sucesso",
      });
      refetchPending();
      refetchFiltered();
      refetchItems();
      setRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedMarcationId(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao rejeitar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter items
  const filteredItems = items.filter((item: any) => {
    const matchesSearch =
      item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !selectedCategory || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(items.map((item: any) => item.category)));

  const handleUpdateProgress = (itemId: number) => {
    const quantity = parseFloat(editingQuantity);
    if (isNaN(quantity) || quantity < 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor numérico válido",
        variant: "destructive",
      });
      return;
    }

    updateProgressMutation.mutate({
      itemId,
      quantityExecuted: quantity,
    });
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "text-green-600";
    if (progress >= 50) return "text-blue-600";
    if (progress > 0) return "text-yellow-600";
    return "text-gray-400";
  };

  const getProgressIcon = (progress: number) => {
    if (progress >= 100) return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (progress > 0) return <Circle className="h-4 w-4 text-yellow-600" />;
    return <Circle className="h-4 w-4 text-gray-400" />;
  };

  return (
    <div className="min-h-screen bg-[#EEEAE5]">
      {/* Header */}
      <div className="border-b border-[#C3BAAF] bg-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation(`/site-management/${constructionId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif text-[#5F5C59] mb-2">
                Mapa de Quantidades
              </h1>
              <p className="text-[#5F5C59]/70">
                Controlo de progresso de execução
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setLocation(`/site-management/${constructionId}/quantity-map-analytics`)}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Análise de Produtividade
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-[#5F5C59]/70">
                  Progresso Geral
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#C9A882]">
                  {stats.overallProgress.toFixed(1)}%
                </div>
                <Progress value={stats.overallProgress} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-[#5F5C59]/70">
                  Itens Concluídos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {stats.completedItems}
                </div>
                <p className="text-sm text-[#5F5C59]/60 mt-1">
                  de {stats.totalItems} itens
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-[#5F5C59]/70">
                  Em Andamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {stats.inProgressItems}
                </div>
                <p className="text-sm text-[#5F5C59]/60 mt-1">itens</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-[#5F5C59]/70">
                  Não Iniciados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-600">
                  {stats.notStartedItems}
                </div>
                <p className="text-sm text-[#5F5C59]/60 mt-1">itens</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtered Marcations History */}
        {filteredMarcations.length > 0 && (
          <Card className={`mb-6 ${
            statusFilter === "pending" ? "border-orange-200 bg-orange-50" :
            statusFilter === "approved" ? "border-green-200 bg-green-50" :
            statusFilter === "rejected" ? "border-red-200 bg-red-50" :
            "border-[#C3BAAF]/30"
          }`}>
            <CardHeader>
              <CardTitle className="text-lg font-medium text-[#5F5C59] flex items-center gap-2">
                <History className="h-5 w-5" />
                {statusFilter === "all" && `Histórico de Marcações (${filteredMarcations.length})`}
                {statusFilter === "pending" && `Marcações Pendentes de Aprovação (${filteredMarcations.length})`}
                {statusFilter === "approved" && `Marcações Aprovadas (${filteredMarcations.length})`}
                {statusFilter === "rejected" && `Marcações Rejeitadas (${filteredMarcations.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredMarcations.map((marcation: any) => (
                  <div
                    key={marcation.id}
                    className="bg-white p-4 rounded-lg border border-orange-200 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                          {marcation.category}
                        </Badge>
                        <span className="font-medium text-[#5F5C59]">{marcation.item}</span>
                        {marcation.status === "approved" && (
                          <Badge className="bg-green-600 text-white">Aprovado</Badge>
                        )}
                        {marcation.status === "rejected" && (
                          <Badge className="bg-red-600 text-white">Rejeitado</Badge>
                        )}
                        {marcation.status === "pending" && (
                          <Badge className="bg-orange-500 text-white">Pendente</Badge>
                        )}
                      </div>
                      <div className="text-sm text-[#5F5C59]/70 space-y-1">
                        <p>
                          <strong>Quantidade:</strong> {marcation.quantity} {marcation.unit}
                        </p>
                        <p>
                          <strong>Marcado por:</strong> {marcation.updatedBy}
                        </p>
                        <p>
                          <strong>Data:</strong> {new Date(marcation.date).toLocaleDateString("pt-PT")}
                        </p>
                        {marcation.approvedAt && (
                          <p>
                            <strong>Aprovado em:</strong> {new Date(marcation.approvedAt).toLocaleDateString("pt-PT")}
                          </p>
                        )}
                        {marcation.rejectionReason && (
                          <p className="text-red-600">
                            <strong>Motivo da rejeição:</strong> {marcation.rejectionReason}
                          </p>
                        )}
                        {marcation.notes && (
                          <p>
                            <strong>Notas:</strong> {marcation.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    {user?.role === 'admin' && marcation.status === 'pending' && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => approveMutation.mutate({ progressId: marcation.id })}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => {
                            setSelectedMarcationId(marcation.id);
                            setRejectDialogOpen(true);
                          }}
                        >
                          Rejeitar
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#5F5C59]/40" />
                <Input
                  placeholder="Pesquisar por item, descrição ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <select
                value={selectedCategory || ""}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="px-4 py-2 border border-[#C3BAAF] rounded-md bg-white text-[#5F5C59]"
              >
                <option value="">Todas as categorias</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "pending" | "approved" | "rejected")}
                className="px-4 py-2 border border-[#C3BAAF] rounded-md bg-white text-[#5F5C59]"
              >
                <option value="all">Todos os status</option>
                <option value="pending">Pendentes</option>
                <option value="approved">Aprovados</option>
                <option value="rejected">Rejeitados</option>
              </select>

              {(searchTerm || selectedCategory || statusFilter !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory(null);
                    setStatusFilter("all");
                  }}
                >
                  Limpar Filtros
                </Button>
              )}
            </div>

            <div className="mt-4 text-sm text-[#5F5C59]/60">
              A mostrar {filteredItems.length} de {items.length} itens
            </div>
          </CardContent>
        </Card>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Category Distribution Chart */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Distribuição por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryPieChart categoryData={categoryData} />
            </CardContent>
          </Card>

          {/* Planned vs Executed Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Previsto vs Executado</CardTitle>
            </CardHeader>
            <CardContent>
              <PlannedVsExecutedChart categoryData={categoryData} />
            </CardContent>
          </Card>
        </div>

        {/* Quantity Map Table */}
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-center">UN</TableHead>
                  <TableHead className="text-right">QT Planejado</TableHead>
                  <TableHead className="text-right">QT Executado</TableHead>
                  <TableHead className="text-center">Progresso</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item: any) => {
                  const planned = parseFloat(item.plannedQuantity);
                  const executed = parseFloat(item.currentQuantity);
                  const progress = planned > 0 ? (executed / planned) * 100 : 0;
                  const isEditing = editingItemId === item.id;

                  return (
                    <TableRow key={item.id}>
                      <TableCell>{getProgressIcon(progress)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{item.item}</TableCell>
                      <TableCell className="text-sm text-[#5F5C59]/70">
                        {item.description || "-"}
                      </TableCell>
                      <TableCell className="text-center">{item.unit}</TableCell>
                      <TableCell className="text-right font-medium">
                        {planned.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={editingQuantity}
                              onChange={(e) => setEditingQuantity(e.target.value)}
                              className="w-24"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => handleUpdateProgress(item.id)}
                              disabled={updateProgressMutation.isPending}
                            >
                              Salvar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingItemId(null);
                                setEditingQuantity("");
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingItemId(item.id);
                              setEditingQuantity(executed.toString());
                            }}
                            className="hover:text-[#C9A882] transition-colors"
                          >
                            {executed.toFixed(2)}
                          </button>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-sm font-medium ${getProgressColor(progress)}`}>
                            {progress.toFixed(1)}%
                          </span>
                          <Progress value={Math.min(progress, 100)} className="w-20" />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <HistoryDialog itemId={item.id} itemName={item.item} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-[#5F5C59]/40 mx-auto mb-4" />
                <p className="text-[#5F5C59]/70">
                  Nenhum item encontrado com os filtros aplicados
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Marcação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-[#5F5C59] mb-2 block">
                Motivo da rejeição
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-[#C3BAAF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9A882] min-h-[100px]"
                placeholder="Descreva o motivo da rejeição..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialogOpen(false);
                  setRejectionReason("");
                  setSelectedMarcationId(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={() => {
                  if (!rejectionReason.trim()) {
                    toast({
                      title: "Motivo obrigatório",
                      description: "Por favor, indique o motivo da rejeição",
                      variant: "destructive",
                    });
                    return;
                  }
                  if (selectedMarcationId) {
                    rejectMutation.mutate({
                      progressId: selectedMarcationId,
                      reason: rejectionReason,
                    });
                  }
                }}
                disabled={rejectMutation.isPending}
              >
                Confirmar Rejeição
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// History Dialog Component
function HistoryDialog({ itemId, itemName }: { itemId: number; itemName: string }) {
  const [open, setOpen] = useState(false);

  const { data: history = [] } = trpc.siteManagement.quantityMap.getProgress.useQuery(
    { itemId },
    { enabled: open }
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <History className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Histórico de Progresso - {itemName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {history.length === 0 ? (
            <p className="text-center text-[#5F5C59]/60 py-8">
              Nenhum histórico de progresso disponível
            </p>
          ) : (
            history.map((entry: any) => (
              <div key={entry.id} className="border-b border-[#C3BAAF] last:border-0 pb-4 last:pb-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-[#5F5C59]">
                        {new Date(entry.date).toLocaleDateString("pt-PT")}
                      </span>
                      <Badge variant="outline">
                        {entry.quantity} un
                      </Badge>
                      {entry.status === "approved" && (
                        <Badge className="bg-green-100 text-green-700 border-green-300">
                          Aprovado
                        </Badge>
                      )}
                      {entry.status === "pending" && (
                        <Badge className="bg-orange-100 text-orange-700 border-orange-300">
                          Pendente
                        </Badge>
                      )}
                      {entry.status === "rejected" && (
                        <Badge className="bg-red-100 text-red-700 border-red-300">
                          Rejeitado
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-[#5F5C59]/70">
                    Atualizado por: {entry.updatedBy || "Sistema"}
                  </p>
                  {entry.notes && (
                    <p className="text-sm text-[#5F5C59]/60 mt-2 italic">
                      {entry.notes}
                    </p>
                  )}
                  {entry.rejectionReason && (
                    <p className="text-sm text-red-600 mt-2 italic">
                      Motivo da rejeição: {entry.rejectionReason}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Category Pie Chart Component
function CategoryPieChart({ categoryData }: { categoryData: any[] }) {
  if (!categoryData || categoryData.length === 0) {
    return (
      <div className="text-center py-8 text-[#5F5C59]/60">
        Sem dados disponíveis
      </div>
    );
  }

  const total = categoryData.reduce((sum, cat) => sum + cat.itemCount, 0);
  const colors = [
    "#C9A882", "#5F5C59", "#8B7355", "#A68968", "#D4B896",
    "#7A6B5D", "#B39A7C", "#9C8770", "#E5D4C1", "#6B5D52"
  ];

  return (
    <div className="space-y-4">
      {/* Simple Progress Bars */}
      {categoryData.map((cat, index) => {
        const percentage = total > 0 ? (cat.itemCount / total) * 100 : 0;
        return (
          <div key={cat.category}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#5F5C59]">
                {cat.category}
              </span>
              <span className="text-sm text-[#5F5C59]/70">
                {cat.itemCount} itens ({percentage.toFixed(0)}%)
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: colors[index % colors.length],
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Planned vs Executed Bar Chart Component
function PlannedVsExecutedChart({ categoryData }: { categoryData: any[] }) {
  if (!categoryData || categoryData.length === 0) {
    return (
      <div className="text-center py-8 text-[#5F5C59]/60">
        Sem dados disponíveis
      </div>
    );
  }

  const maxValue = Math.max(
    ...categoryData.map(cat => Math.max(cat.totalPlanned, cat.totalExecuted))
  );

  return (
    <div className="space-y-6">
      {categoryData.map((cat) => {
        const plannedPercentage = maxValue > 0 ? (cat.totalPlanned / maxValue) * 100 : 0;
        const executedPercentage = maxValue > 0 ? (cat.totalExecuted / maxValue) * 100 : 0;
        const progress = cat.totalPlanned > 0 ? (cat.totalExecuted / cat.totalPlanned) * 100 : 0;

        return (
          <div key={cat.category}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#5F5C59]">
                {cat.category}
              </span>
              <span className="text-sm text-[#5F5C59]/70">
                {progress.toFixed(1)}% executado
              </span>
            </div>
            
            {/* Planned Bar */}
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-[#5F5C59]/60 w-20">Previsto:</span>
                <div className="flex-1 h-6 bg-gray-200 rounded overflow-hidden">
                  <div
                    className="h-full bg-[#C9A882]/40 flex items-center justify-end px-2"
                    style={{ width: `${plannedPercentage}%` }}
                  >
                    <span className="text-xs font-medium text-[#5F5C59]">
                      {cat.totalPlanned.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Executed Bar */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-[#5F5C59]/60 w-20">Executado:</span>
                <div className="flex-1 h-6 bg-gray-200 rounded overflow-hidden">
                  <div
                    className="h-full bg-[#C9A882] flex items-center justify-end px-2"
                    style={{ width: `${executedPercentage}%` }}
                  >
                    <span className="text-xs font-medium text-white">
                      {cat.totalExecuted.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
