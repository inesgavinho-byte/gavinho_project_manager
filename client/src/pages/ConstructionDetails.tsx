import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Building2, Calendar, MapPin, DollarSign, TrendingUp, Users, FileText, Image as ImageIcon, Clock, Languages, Search, X, ChevronDown, ChevronRight, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MqtItemHistoryModal } from "@/components/MqtItemHistoryModal";

export default function ConstructionDetails() {
  const [, params] = useRoute("/constructions/:id");
  const constructionId = params?.id ? parseInt(params.id) : 0;
  const [showEnglish, setShowEnglish] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<{ id: number; code: string } | null>(null);

  const { data: construction, isLoading } = trpc.constructions.getById.useQuery(
    { id: constructionId },
    { enabled: constructionId > 0 }
  );

  const { data: statistics } = trpc.constructions.statistics.useQuery(
    { constructionId },
    { enabled: constructionId > 0 }
  );

  const { data: mqtCategories } = trpc.constructions.categories.list.useQuery(
    { constructionId },
    { enabled: constructionId > 0 }
  );

  const { data: mqtItems } = trpc.constructions.items.listByConstruction.useQuery(
    { constructionId },
    { enabled: constructionId > 0 }
  );

  const utils = trpc.useUtils();
  const updateQuantityExecutedMutation = trpc.constructions.items.updateQuantityExecuted.useMutation({
    onSuccess: () => {
      utils.constructions.items.listByConstruction.invalidate({ constructionId });
    },
  });

  // Expandir todas as categorias por padrão quando os dados carregam
  useEffect(() => {
    if (mqtCategories && expandedCategories.size === 0) {
      setExpandedCategories(new Set(mqtCategories.map(cat => cat.id)));
    }
  }, [mqtCategories]);

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Lógica de filtro
  const filteredItems = mqtItems?.filter((item) => {
    // Filtro por categoria
    if (selectedCategory !== "all" && item.categoryId.toString() !== selectedCategory) {
      return false;
    }

    // Filtro por pesquisa (busca em código, tipo, zona, descrição PT/EN)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.code?.toLowerCase().includes(query) ||
        item.typePt?.toLowerCase().includes(query) ||
        item.typeEn?.toLowerCase().includes(query) ||
        item.zonePt?.toLowerCase().includes(query) ||
        item.zoneEn?.toLowerCase().includes(query) ||
        item.descriptionPt?.toLowerCase().includes(query) ||
        item.descriptionEn?.toLowerCase().includes(query)
      );
    }

    return true;
  }) || [];

  // Agrupar itens por categoria
  const groupedItems = mqtCategories?.map(category => {
    const categoryItems = filteredItems.filter(item => item.categoryId === category.id);
    const totalQuantity = categoryItems.reduce((sum, item) => sum + (parseFloat(item.quantity?.toString() || "0")), 0);
    const totalExecuted = categoryItems.reduce((sum, item) => sum + (parseFloat(item.quantityExecuted?.toString() || "0")), 0);
    const averageProgress = totalQuantity > 0 ? (totalExecuted / totalQuantity) * 100 : 0;
    return {
      category,
      items: categoryItems,
      totalQuantity,
      totalExecuted,
      averageProgress,
      itemCount: categoryItems.length
    };
  }).filter(group => group.itemCount > 0) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "on_hold":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      not_started: "Não Iniciado",
      in_progress: "Em Curso",
      on_hold: "Pausado",
      completed: "Concluído",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#EEEAE5" }}>
        <p style={{ color: "#5F5C59" }}>A carregar obra...</p>
      </div>
    );
  }

  if (!construction) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#EEEAE5" }}>
        <div className="text-center">
          <p className="text-lg mb-4" style={{ color: "#5F5C59" }}>
            Obra não encontrada
          </p>
          <Link href="/constructions">
            <Button style={{ backgroundColor: "#C9A882", color: "#5F5C59" }}>
              Voltar às Obras
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen" style={{ backgroundColor: "#EEEAE5" }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: "#C3BAAF" }}>
        <div className="container py-6">
          <Link href="/constructions">
            <Button variant="ghost" className="mb-4 gap-2" style={{ color: "#5F5C59" }}>
              <ArrowLeft className="h-4 w-4" />
              Voltar às Obras
            </Button>
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "white", borderWidth: "2px", borderColor: "#C3BAAF" }}
              >
                <Building2 className="h-8 w-8" style={{ color: "#C9A882" }} />
              </div>
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: "#C9A882" }}>
                  {construction.code}
                </p>
                <h1
                  className="text-4xl font-bold mb-2"
                  style={{ fontFamily: "Cormorant Garamond, serif", color: "#5F5C59" }}
                >
                  {construction.name}
                </h1>
                {construction.client && (
                  <p className="text-lg" style={{ color: "#5F5C59" }}>
                    {construction.client}
                  </p>
                )}
              </div>
            </div>
            <Badge className={getStatusColor(construction.status)}>
              {getStatusLabel(construction.status)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList style={{ backgroundColor: "white", borderColor: "#C3BAAF" }}>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="mqt">MQT</TabsTrigger>
            <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
            <TabsTrigger value="costs">Custos</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6" style={{ backgroundColor: "white", borderColor: "#C3BAAF" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm" style={{ color: "#5F5C59" }}>
                    Progresso
                  </span>
                  <TrendingUp className="h-5 w-5" style={{ color: "#C9A882" }} />
                </div>
                <p className="text-3xl font-bold" style={{ color: "#5F5C59" }}>
                  {construction.progress}%
                </p>
              </Card>

              <Card className="p-6" style={{ backgroundColor: "white", borderColor: "#C3BAAF" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm" style={{ color: "#5F5C59" }}>
                    Itens MQT
                  </span>
                  <FileText className="h-5 w-5" style={{ color: "#C9A882" }} />
                </div>
                <p className="text-3xl font-bold" style={{ color: "#5F5C59" }}>
                  {statistics?.totalItems || 0}
                </p>
              </Card>

              <Card className="p-6" style={{ backgroundColor: "white", borderColor: "#C3BAAF" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm" style={{ color: "#5F5C59" }}>
                    Concluídos
                  </span>
                  <TrendingUp className="h-5 w-5" style={{ color: "#C9A882" }} />
                </div>
                <p className="text-3xl font-bold" style={{ color: "#5F5C59" }}>
                  {statistics?.completedItems || 0}
                </p>
              </Card>

              <Card className="p-6" style={{ backgroundColor: "white", borderColor: "#C3BAAF" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm" style={{ color: "#5F5C59" }}>
                    Orçamento Total
                  </span>
                  <DollarSign className="h-5 w-5" style={{ color: "#C9A882" }} />
                </div>
                <p className="text-2xl font-bold" style={{ color: "#5F5C59" }}>
                  €{statistics?.totalBudget.toLocaleString("pt-PT") || "0"}
                </p>
              </Card>
            </div>

            {/* Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6" style={{ backgroundColor: "white", borderColor: "#C3BAAF" }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: "#5F5C59" }}>
                  Informações Gerais
                </h3>
                <div className="space-y-3">
                  {construction.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 mt-0.5" style={{ color: "#C9A882" }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: "#5F5C59" }}>
                          Localização
                        </p>
                        <p className="text-sm" style={{ color: "#5F5C59" }}>
                          {construction.location}
                        </p>
                      </div>
                    </div>
                  )}
                  {construction.startDate && (
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 mt-0.5" style={{ color: "#C9A882" }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: "#5F5C59" }}>
                          Data de Início
                        </p>
                        <p className="text-sm" style={{ color: "#5F5C59" }}>
                          {new Date(construction.startDate).toLocaleDateString("pt-PT")}
                        </p>
                      </div>
                    </div>
                  )}
                  {construction.endDate && (
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 mt-0.5" style={{ color: "#C9A882" }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: "#5F5C59" }}>
                          Data de Conclusão Prevista
                        </p>
                        <p className="text-sm" style={{ color: "#5F5C59" }}>
                          {new Date(construction.endDate).toLocaleDateString("pt-PT")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6" style={{ backgroundColor: "white", borderColor: "#C3BAAF" }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: "#5F5C59" }}>
                  Orçamento
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm" style={{ color: "#5F5C59" }}>
                        Orçado
                      </span>
                      <span className="text-lg font-semibold" style={{ color: "#5F5C59" }}>
                        €{construction.budget ? parseFloat(construction.budget.toString()).toLocaleString("pt-PT") : "0"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm" style={{ color: "#5F5C59" }}>
                        Gasto
                      </span>
                      <span className="text-lg font-semibold" style={{ color: "#C9A882" }}>
                        €{construction.actualCost ? parseFloat(construction.actualCost.toString()).toLocaleString("pt-PT") : "0"}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Description */}
            {construction.description && (
              <Card className="p-6" style={{ backgroundColor: "white", borderColor: "#C3BAAF" }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: "#5F5C59" }}>
                  Descrição
                </h3>
                <p style={{ color: "#5F5C59" }}>{construction.description}</p>
              </Card>
            )}
          </TabsContent>

          {/* MQT Tab */}
          <TabsContent value="mqt">
            <Card className="p-6" style={{ backgroundColor: "white", borderColor: "#C3BAAF" }}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold" style={{ color: "#5F5C59" }}>
                  Mapa de Quantidades (MQT)
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEnglish(!showEnglish)}
                  style={{
                    borderColor: "#C9A882",
                    color: showEnglish ? "white" : "#5F5C59",
                    backgroundColor: showEnglish ? "#C9A882" : "transparent"
                  }}
                >
                  <Languages className="h-4 w-4 mr-2" />
                  {showEnglish ? "Ocultar EN" : "Mostrar EN"}
                </Button>
              </div>

              {/* Filtros e Pesquisa */}
              <div className="flex gap-4 mb-6">
                {/* Barra de Pesquisa */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: "#C9A882" }} />
                  <Input
                    placeholder="Pesquisar por código, tipo, zona ou descrição..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    style={{
                      borderColor: "#C3BAAF",
                      backgroundColor: "white",
                      color: "#5F5C59"
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      style={{ color: "#C9A882" }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Filtro por Categoria */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[280px]" style={{ borderColor: "#C3BAAF", color: "#5F5C59" }}>
                    <SelectValue placeholder="Todas as Categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    {mqtCategories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.code} - {cat.namePt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Botão Limpar Filtros */}
                {(searchQuery || selectedCategory !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                    style={{ borderColor: "#C9A882", color: "#5F5C59" }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                )}
              </div>

              {/* Contador de Resultados */}
              {mqtItems && mqtItems.length > 0 && (
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm" style={{ color: "#5F5C59" }}>
                    A mostrar <span className="font-semibold">{filteredItems.length}</span> de{" "}
                    <span className="font-semibold">{mqtItems.length}</span> itens
                  </p>
                </div>
              )}

              {groupedItems && groupedItems.length > 0 ? (
                <div className="space-y-4">
                  {groupedItems.map((group) => (
                    <div key={group.category.id} className="border rounded-lg" style={{ borderColor: "#C3BAAF" }}>
                      {/* Header da Categoria */}
                      <button
                        onClick={() => toggleCategory(group.category.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-opacity-50 transition-colors"
                        style={{ backgroundColor: "#EEEAE5" }}
                      >
                        <div className="flex items-center gap-3">
                          {expandedCategories.has(group.category.id) ? (
                            <ChevronDown className="h-5 w-5" style={{ color: "#C9A882" }} />
                          ) : (
                            <ChevronRight className="h-5 w-5" style={{ color: "#C9A882" }} />
                          )}
                          <span className="font-semibold text-base" style={{ color: "#5F5C59" }}>
                            {group.category.code} - {group.category.namePt}
                          </span>
                          {showEnglish && (
                            <span className="text-sm italic" style={{ color: "#8B8581" }}>
                              ({group.category.nameEn})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-6">
                          <span className="text-sm" style={{ color: "#8B8581" }}>
                            <span className="font-semibold">{group.itemCount}</span> {group.itemCount === 1 ? "item" : "itens"}
                          </span>
                          <span className="text-sm" style={{ color: "#C9A882" }}>
                            Planejado: <span className="font-semibold">{group.totalQuantity.toFixed(2)}</span>
                          </span>
                          <span className="text-sm" style={{ color: "#C9A882" }}>
                            Executado: <span className="font-semibold">{group.totalExecuted.toFixed(2)}</span>
                          </span>
                          <span className="text-sm font-semibold" style={{ 
                            color: group.averageProgress < 80 ? "#EF4444" : 
                                   group.averageProgress < 90 || group.averageProgress > 110 ? "#F59E0B" : 
                                   group.averageProgress > 120 ? "#EF4444" : "#10B981"
                          }}>
                            {group.averageProgress.toFixed(0)}%
                          </span>
                        </div>
                      </button>

                      {/* Itens da Categoria (colapsável) */}
                      {expandedCategories.has(group.category.id) && (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr style={{ backgroundColor: "#FAFAFA", borderBottom: "1px solid #E5E5E5" }}>
                                <th className="p-3 text-left text-xs font-semibold" style={{ color: "#8B8581" }}>Item</th>
                                <th className="p-3 text-left text-xs font-semibold" style={{ color: "#8B8581" }}>Tipo</th>
                                <th className="p-3 text-left text-xs font-semibold" style={{ color: "#8B8581" }}>Zona</th>
                                <th className="p-3 text-left text-xs font-semibold" style={{ color: "#8B8581" }}>Descrição (PT)</th>
                                {showEnglish && (
                                  <th className="p-3 text-left text-xs font-semibold" style={{ color: "#8B8581" }}>Description (EN)</th>
                                )}
                                <th className="p-3 text-center text-xs font-semibold" style={{ color: "#8B8581" }}>UN</th>
                                <th className="p-3 text-center text-xs font-semibold" style={{ color: "#8B8581" }}>QT Planejado</th>
                                <th className="p-3 text-center text-xs font-semibold" style={{ color: "#8B8581" }}>QT Executado</th>
                                <th className="p-3 text-left text-xs font-semibold" style={{ color: "#8B8581" }}>Progresso</th>
                                <th className="p-3 text-center text-xs font-semibold" style={{ color: "#8B8581" }}>Ações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.items.map((item, index) => (
                                <tr
                                  key={item.id}
                                  style={{
                                    backgroundColor: index % 2 === 0 ? "white" : "#FAFAFA",
                                    borderBottom: "1px solid #E5E5E5"
                                  }}
                                >
                                  <td className="p-3 text-sm" style={{ color: "#5F5C59" }}>{item.code}</td>
                                  <td className="p-3 text-sm" style={{ color: "#5F5C59" }}>{item.typePt}</td>
                                  <td className="p-3 text-sm" style={{ color: "#5F5C59" }}>{item.zonePt || "-"}</td>
                                  <td className="p-3 text-sm" style={{ color: "#5F5C59" }}>{item.descriptionPt}</td>
                                  {showEnglish && (
                                    <td className="p-3 text-sm" style={{ color: "#5F5C59" }}>{item.descriptionEn || "-"}</td>
                                  )}
                                  <td className="p-3 text-center text-sm" style={{ color: "#5F5C59" }}>{item.unit}</td>
                                  <td className="p-3 text-center text-sm font-semibold" style={{ color: "#5F5C59" }}>{item.quantity}</td>
                                  <td className="p-3 text-center text-sm">
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      defaultValue={item.quantityExecuted || "0.00"}
                                      onBlur={(e) => {
                                        const newValue = e.target.value;
                                        if (newValue !== (item.quantityExecuted || "0.00")) {
                                          updateQuantityExecutedMutation.mutate({
                                            id: item.id,
                                            quantityExecuted: newValue,
                                          });
                                        }
                                      }}
                                      className="w-20 px-2 py-1 text-center border rounded"
                                      style={{ borderColor: "#C3BAAF", color: "#5F5C59" }}
                                    />
                                  </td>
                                  <td className="p-3">
                                    {(() => {
                                      const planned = parseFloat(item.quantity);
                                      const executed = parseFloat(item.quantityExecuted || "0");
                                      const percentage = planned > 0 ? (executed / planned) * 100 : 0;
                                      const displayPercentage = Math.min(percentage, 100);
                                      
                                      // Determine color based on percentage
                                      let barColor = "#10B981"; // green
                                      if (percentage < 80) {
                                        barColor = "#EF4444"; // red
                                      } else if (percentage < 90 || percentage > 110) {
                                        barColor = "#F59E0B"; // yellow
                                      } else if (percentage > 120) {
                                        barColor = "#EF4444"; // red
                                      }
                                      
                                      return (
                                        <div className="flex items-center gap-2">
                                          <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                              className="h-full transition-all duration-300"
                                              style={{
                                                width: `${displayPercentage}%`,
                                                backgroundColor: barColor,
                                              }}
                                            />
                                          </div>
                                          <span className="text-xs font-semibold w-12 text-right" style={{ color: barColor }}>
                                            {percentage.toFixed(0)}%
                                          </span>
                                        </div>
                                      );
                                    })()}
                                  </td>
                                  <td className="p-3 text-center">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedHistoryItem({ id: item.id, code: item.code });
                                        setHistoryModalOpen(true);
                                      }}
                                      className="h-8 w-8 p-0"
                                      style={{ color: "#C9A882" }}
                                    >
                                      <History className="h-4 w-4" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : mqtItems && mqtItems.length > 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm" style={{ color: "#5F5C59" }}>
                    Nenhum item encontrado com os filtros aplicados.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                    className="mt-4"
                    style={{ borderColor: "#C9A882", color: "#5F5C59" }}
                  >
                    Limpar Filtros
                  </Button>
                </div>
              ) : (
                <p style={{ color: "#5F5C59" }}>Nenhum item MQT encontrado</p>
              )}
            </Card>
          </TabsContent>

          {/* Other Tabs (Placeholders) */}
          <TabsContent value="suppliers">
            <Card className="p-6" style={{ backgroundColor: "white", borderColor: "#C3BAAF" }}>
              <p style={{ color: "#5F5C59" }}>Gestão de fornecedores em desenvolvimento...</p>
            </Card>
          </TabsContent>

          <TabsContent value="costs">
            <Card className="p-6" style={{ backgroundColor: "white", borderColor: "#C3BAAF" }}>
              <p style={{ color: "#5F5C59" }}>Controlo de custos em desenvolvimento...</p>
            </Card>
          </TabsContent>

          <TabsContent value="timeline">
            <Card className="p-6" style={{ backgroundColor: "white", borderColor: "#C3BAAF" }}>
              <p style={{ color: "#5F5C59" }}>Timeline de execução em desenvolvimento...</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>

      {/* Modal de Histórico */}
      {selectedHistoryItem && (
        <MqtItemHistoryModal
          itemId={selectedHistoryItem.id}
          itemCode={selectedHistoryItem.code}
          open={historyModalOpen}
          onOpenChange={setHistoryModalOpen}
        />
      )}
    </>
  );
}
