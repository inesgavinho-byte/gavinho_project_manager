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
import { ArrowLeft, Search, History, TrendingUp, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SiteQuantityMap() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const constructionId = parseInt(params.id || "0");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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

  // Mutations
  const updateProgressMutation = trpc.siteManagement.quantityMap.updateProgress.useMutation({
    onSuccess: () => {
      toast({
        title: "Progresso atualizado",
        description: "A quantidade executada foi atualizada com sucesso",
      });
      refetchItems();
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

              {(searchTerm || selectedCategory) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory(null);
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
              <div
                key={entry.id}
                className="flex items-start gap-4 p-4 border border-[#C3BAAF] rounded-lg"
              >
                <TrendingUp className="h-5 w-5 text-[#C9A882] mt-1" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-[#5F5C59]">
                      {parseFloat(entry.quantity).toFixed(2)} unidades
                    </span>
                    <span className="text-sm text-[#5F5C59]/60">
                      {new Date(entry.date).toLocaleDateString("pt-PT")}
                    </span>
                  </div>
                  <p className="text-sm text-[#5F5C59]/70">
                    Atualizado por: {entry.updatedBy || "Sistema"}
                  </p>
                  {entry.notes && (
                    <p className="text-sm text-[#5F5C59]/60 mt-2 italic">
                      {entry.notes}
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
