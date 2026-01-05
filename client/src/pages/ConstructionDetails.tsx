import { useState } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Building2, Calendar, MapPin, DollarSign, TrendingUp, Users, FileText, Image as ImageIcon, Clock, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ConstructionDetails() {
  const [, params] = useRoute("/constructions/:id");
  const constructionId = params?.id ? parseInt(params.id) : 0;
  const [showEnglish, setShowEnglish] = useState(false);

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
              <div className="flex justify-between items-center mb-4">
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
              {mqtItems && mqtItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr style={{ backgroundColor: "#EEEAE5", borderBottom: "2px solid #C3BAAF" }}>
                        <th className="p-3 text-left text-sm font-semibold" style={{ color: "#5F5C59" }}>Item</th>
                        <th className="p-3 text-left text-sm font-semibold" style={{ color: "#5F5C59" }}>Tipo</th>
                        <th className="p-3 text-left text-sm font-semibold" style={{ color: "#5F5C59" }}>Zona</th>
                        <th className="p-3 text-left text-sm font-semibold" style={{ color: "#5F5C59" }}>Descrição (PT)</th>
                        {showEnglish && (
                          <th className="p-3 text-left text-sm font-semibold" style={{ color: "#5F5C59" }}>Description (EN)</th>
                        )}
                        <th className="p-3 text-center text-sm font-semibold" style={{ color: "#5F5C59" }}>UN</th>
                        <th className="p-3 text-center text-sm font-semibold" style={{ color: "#5F5C59" }}>QT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mqtItems.map((item, index) => (
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
  );
}
