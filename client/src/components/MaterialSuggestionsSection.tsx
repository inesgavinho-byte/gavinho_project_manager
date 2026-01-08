import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  Check,
  X,
  TrendingUp,
  DollarSign,
  History,
  Loader2,
  Plus,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface MaterialSuggestionsSectionProps {
  projectId: number;
}

export function MaterialSuggestionsSection({ projectId }: MaterialSuggestionsSectionProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "accepted" | "rejected">("pending");

  // Queries
  const { data: suggestions, refetch: refetchSuggestions } = trpc.library.getProjectSuggestions.useQuery({
    projectId,
    status: activeTab,
  });

  const { data: stats, refetch: refetchStats } = trpc.library.getSuggestionStats.useQuery({
    projectId,
  });

  // Mutations
  const generateMutation = trpc.library.generateSuggestions.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} sugestões geradas com sucesso!`);
      refetchSuggestions();
      refetchStats();
    },
    onError: () => {
      toast.error("Erro ao gerar sugestões");
    },
  });

  const respondMutation = trpc.library.respondToSuggestion.useMutation({
    onSuccess: () => {
      refetchSuggestions();
      refetchStats();
    },
    onError: () => {
      toast.error("Erro ao processar resposta");
    },
  });

  const addToProjectMutation = trpc.library.projectMaterials.add.useMutation({
    onSuccess: () => {
      toast.success("Material adicionado ao projeto!");
    },
    onError: () => {
      toast.error("Erro ao adicionar material");
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate({ projectId });
  };

  const handleAccept = async (suggestionId: number, materialId: number, materialName: string) => {
    // First respond to suggestion
    await respondMutation.mutateAsync({ suggestionId, status: "accepted" });
    
    // Then add material to project
    await addToProjectMutation.mutateAsync({
      projectId,
      materialId,
      quantity: "1",
      notes: `Adicionado via sugestão automática`,
    });

    toast.success(`${materialName} adicionado ao projeto!`);
  };

  const handleReject = (suggestionId: number) => {
    respondMutation.mutate({ suggestionId, status: "rejected" });
    toast.info("Sugestão rejeitada");
  };

  const getMatchFactorIcons = (matchFactorsStr?: string) => {
    if (!matchFactorsStr) return null;
    
    try {
      const factors = JSON.parse(matchFactorsStr);
      return (
        <div className="flex gap-2 mt-2">
          {factors.history && (
            <Badge variant="outline" className="text-xs">
              <History className="w-3 h-3 mr-1" />
              Histórico
            </Badge>
          )}
          {factors.budget && (
            <Badge variant="outline" className="text-xs">
              <DollarSign className="w-3 h-3 mr-1" />
              Orçamento
            </Badge>
          )}
          {factors.priority && (
            <Badge variant="outline" className="text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              Prioridade
            </Badge>
          )}
        </div>
      );
    } catch {
      return null;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600 bg-green-50";
    if (confidence >= 60) return "text-blue-600 bg-blue-50";
    if (confidence >= 40) return "text-yellow-600 bg-yellow-50";
    return "text-orange-600 bg-orange-50";
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-serif font-semibold text-[#5F5C59]">
            Sugestões Inteligentes de Materiais
          </h3>
          <p className="text-sm text-[#5F5C59]/70 mt-1">
            Baseadas em projetos similares e histórico de utilização
          </p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generateMutation.isPending}
          className="bg-[#C9A882] hover:bg-[#C9A882]/90 text-white"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              A gerar...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Sugestões
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 border-[#C3BAAF]/30">
            <div className="text-sm text-[#5F5C59]/70">Total</div>
            <div className="text-2xl font-semibold text-[#5F5C59]">{stats.total}</div>
          </Card>
          <Card className="p-4 border-[#C3BAAF]/30">
            <div className="text-sm text-[#5F5C59]/70">Pendentes</div>
            <div className="text-2xl font-semibold text-orange-600">{stats.pending}</div>
          </Card>
          <Card className="p-4 border-[#C3BAAF]/30">
            <div className="text-sm text-[#5F5C59]/70">Aceites</div>
            <div className="text-2xl font-semibold text-green-600">{stats.accepted}</div>
          </Card>
          <Card className="p-4 border-[#C3BAAF]/30">
            <div className="text-sm text-[#5F5C59]/70">Confiança Média</div>
            <div className="text-2xl font-semibold text-[#C9A882]">
              {stats.avgConfidence.toFixed(0)}%
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="bg-[#EEEAE5]">
          <TabsTrigger value="pending" className="data-[state=active]:bg-white">
            Pendentes {stats && stats.pending > 0 && `(${stats.pending})`}
          </TabsTrigger>
          <TabsTrigger value="accepted" className="data-[state=active]:bg-white">
            Aceites {stats && stats.accepted > 0 && `(${stats.accepted})`}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-white">
            Rejeitadas {stats && stats.rejected > 0 && `(${stats.rejected})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {!suggestions || suggestions.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-2 border-[#C3BAAF]/30">
              <AlertCircle className="w-12 h-12 mx-auto text-[#C3BAAF] mb-4" />
              <h3 className="text-lg font-semibold text-[#5F5C59] mb-2">
                {activeTab === "pending"
                  ? "Nenhuma sugestão pendente"
                  : activeTab === "accepted"
                  ? "Nenhuma sugestão aceite"
                  : "Nenhuma sugestão rejeitada"}
              </h3>
              <p className="text-sm text-[#5F5C59]/70 mb-4">
                {activeTab === "pending"
                  ? "Clique em 'Gerar Sugestões' para obter recomendações inteligentes"
                  : "As sugestões aparecerão aqui quando processadas"}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestions.map((suggestion) => (
                <Card
                  key={suggestion.id}
                  className="p-6 border-[#C3BAAF]/30 hover:shadow-lg transition-shadow"
                >
                  {/* Material Image */}
                  {suggestion.materialImageUrl && (
                    <div className="w-full h-40 mb-4 rounded-lg overflow-hidden bg-[#EEEAE5]">
                      <img
                        src={suggestion.materialImageUrl}
                        alt={suggestion.materialName || "Material"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Material Info */}
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold text-[#5F5C59] mb-1">
                      {suggestion.materialName}
                    </h4>
                    <Badge className={`${getConfidenceColor(Number(suggestion.confidence))} mb-2`}>
                      {Number(suggestion.confidence).toFixed(0)}% confiança
                    </Badge>
                    <p className="text-sm text-[#5F5C59]/70 mb-2">
                      {suggestion.materialDescription}
                    </p>
                    {suggestion.materialPrice && (
                      <p className="text-sm font-semibold text-[#C9A882]">
                        {Number(suggestion.materialPrice).toFixed(2)} € / {suggestion.materialUnit}
                      </p>
                    )}
                  </div>

                  {/* Reason */}
                  <div className="mb-4 p-3 bg-[#EEEAE5] rounded-lg">
                    <p className="text-xs text-[#5F5C59]/80 leading-relaxed">
                      {suggestion.reason}
                    </p>
                  </div>

                  {/* Match Factors */}
                  {getMatchFactorIcons(suggestion.matchFactors || undefined)}

                  {/* Actions */}
                  {activeTab === "pending" && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() =>
                          handleAccept(
                            suggestion.id,
                            suggestion.suggestedMaterialId,
                            suggestion.materialName || "Material"
                          )
                        }
                        disabled={respondMutation.isPending || addToProjectMutation.isPending}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Aceitar
                      </Button>
                      <Button
                        onClick={() => handleReject(suggestion.id)}
                        disabled={respondMutation.isPending}
                        variant="outline"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                        size="sm"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  )}

                  {activeTab === "accepted" && (
                    <Badge className="w-full justify-center mt-4 bg-green-100 text-green-700">
                      <Check className="w-3 h-3 mr-1" />
                      Aceite e adicionado ao projeto
                    </Badge>
                  )}

                  {activeTab === "rejected" && (
                    <Badge className="w-full justify-center mt-4 bg-red-100 text-red-700">
                      <X className="w-3 h-3 mr-1" />
                      Rejeitada
                    </Badge>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
