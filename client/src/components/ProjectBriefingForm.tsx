import { useState, useEffect } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Save, Loader2, CheckCircle2 } from "lucide-react";

interface ProjectBriefingFormProps {
  projectId: number;
  isEditable?: boolean;
}

export function ProjectBriefingForm({
  projectId,
  isEditable = true,
}: ProjectBriefingFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    briefing: "",
    objectives: "",
    restrictions: "",
  });

  // Queries
  const { data: briefingData, isLoading } = trpc.briefing.get.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  // Mutations
  const updateBriefing = trpc.briefing.update.useMutation({
    onSuccess: () => {
      toast.success("Briefing atualizado com sucesso!");
      setIsEditing(false);
      setIsSaving(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar briefing");
      setIsSaving(false);
    },
  });

  // Carregar dados do briefing
  useEffect(() => {
    if (briefingData) {
      setFormData({
        briefing: briefingData.briefing || "",
        objectives: briefingData.objectives || "",
        restrictions: briefingData.restrictions || "",
      });
    }
  }, [briefingData]);

  const handleInputChange = (
    field: keyof typeof formData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!formData.briefing && !formData.objectives && !formData.restrictions) {
      toast.error("Preencha pelo menos um campo");
      return;
    }

    setIsSaving(true);
    await updateBriefing.mutateAsync({
      projectId,
      ...formData,
    });
  };

  const handleCancel = () => {
    if (briefingData) {
      setFormData({
        briefing: briefingData.briefing || "",
        objectives: briefingData.objectives || "",
        restrictions: briefingData.restrictions || "",
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#8b8670]" />
      </div>
    );
  }

  const hasContent =
    formData.briefing || formData.objectives || formData.restrictions;

  return (
    <div className="space-y-6">
      {/* Header com botões de ação */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#7a7667]">
            Briefing do Projeto
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Capture os requisitos e objetivos do cliente
          </p>
        </div>
        {isEditable && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  size="sm"
                  disabled={isSaving}
                  className="bg-[#8b8670] hover:bg-[#7a7667] text-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                size="sm"
                className="bg-[#8b8670] hover:bg-[#7a7667] text-white"
              >
                Editar
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Conteúdo vazio */}
      {!hasContent && !isEditing && (
        <Card className="p-8 border-2 border-dashed border-gray-300 bg-gray-50">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">
              Nenhum briefing adicionado
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Clique em "Editar" para adicionar os requisitos do cliente
            </p>
          </div>
        </Card>
      )}

      {/* Formulário de edição */}
      {isEditing ? (
        <Card className="p-6 border border-gray-200">
          <Tabs defaultValue="briefing" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="briefing">Briefing</TabsTrigger>
              <TabsTrigger value="objectives">Objetivos</TabsTrigger>
              <TabsTrigger value="restrictions">Restrições</TabsTrigger>
            </TabsList>

            {/* Tab: Briefing */}
            <TabsContent value="briefing" className="space-y-4">
              <div>
                <Label htmlFor="briefing" className="text-[#7a7667] font-semibold">
                  Briefing do Projeto
                </Label>
                <p className="text-sm text-gray-600 mb-3">
                  Descreva o projeto, contexto e visão geral
                </p>
                <Textarea
                  id="briefing"
                  placeholder="Ex: Remodelação completa de apartamento T3 em Lisboa. Cliente deseja modernizar espaço mantendo elementos históricos..."
                  value={formData.briefing}
                  onChange={(e) =>
                    handleInputChange("briefing", e.target.value)
                  }
                  className="min-h-[200px] border-gray-300 focus:border-[#8b8670] focus:ring-[#8b8670]"
                />
                <p className="text-xs text-gray-500 mt-2">
                  {formData.briefing.length} caracteres
                </p>
              </div>
            </TabsContent>

            {/* Tab: Objetivos */}
            <TabsContent value="objectives" className="space-y-4">
              <div>
                <Label htmlFor="objectives" className="text-[#7a7667] font-semibold">
                  Objetivos do Projeto
                </Label>
                <p className="text-sm text-gray-600 mb-3">
                  Defina os objetivos principais e resultados esperados
                </p>
                <Textarea
                  id="objectives"
                  placeholder="Ex: 
• Criar espaço aberto e luminoso
• Melhorar funcionalidade da cozinha
• Integrar soluções de armazenamento
• Manter orçamento dentro de €50.000"
                  value={formData.objectives}
                  onChange={(e) =>
                    handleInputChange("objectives", e.target.value)
                  }
                  className="min-h-[200px] border-gray-300 focus:border-[#8b8670] focus:ring-[#8b8670]"
                />
                <p className="text-xs text-gray-500 mt-2">
                  {formData.objectives.length} caracteres
                </p>
              </div>
            </TabsContent>

            {/* Tab: Restrições */}
            <TabsContent value="restrictions" className="space-y-4">
              <div>
                <Label htmlFor="restrictions" className="text-[#7a7667] font-semibold">
                  Restrições e Considerações
                </Label>
                <p className="text-sm text-gray-600 mb-3">
                  Documente limitações, restrições técnicas ou considerações especiais
                </p>
                <Textarea
                  id="restrictions"
                  placeholder="Ex:
• Obra deve ser concluída até Junho 2026
• Acesso limitado ao edifício (apenas 8h-18h)
• Estrutura do edifício não pode ser alterada
• Cliente viaja frequentemente (comunicação por email preferida)"
                  value={formData.restrictions}
                  onChange={(e) =>
                    handleInputChange("restrictions", e.target.value)
                  }
                  className="min-h-[200px] border-gray-300 focus:border-[#8b8670] focus:ring-[#8b8670]"
                />
                <p className="text-xs text-gray-500 mt-2">
                  {formData.restrictions.length} caracteres
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      ) : (
        /* Visualização */
        hasContent && (
          <div className="space-y-6">
            {formData.briefing && (
              <Card className="p-6 border border-gray-200 bg-white">
                <h4 className="font-semibold text-[#7a7667] mb-3 flex items-center">
                  <CheckCircle2 className="w-5 h-5 mr-2 text-green-600" />
                  Briefing
                </h4>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {formData.briefing}
                </p>
              </Card>
            )}

            {formData.objectives && (
              <Card className="p-6 border border-gray-200 bg-white">
                <h4 className="font-semibold text-[#7a7667] mb-3 flex items-center">
                  <CheckCircle2 className="w-5 h-5 mr-2 text-green-600" />
                  Objetivos
                </h4>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {formData.objectives}
                </p>
              </Card>
            )}

            {formData.restrictions && (
              <Card className="p-6 border border-gray-200 bg-white">
                <h4 className="font-semibold text-[#7a7667] mb-3 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-amber-600" />
                  Restrições e Considerações
                </h4>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {formData.restrictions}
                </p>
              </Card>
            )}
          </div>
        )
      )}

      {/* Dicas de preenchimento */}
      {isEditing && (
        <Card className="p-4 bg-blue-50 border border-blue-200">
          <p className="text-sm text-blue-900 font-medium mb-2">💡 Dicas:</p>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Seja específico e detalhado nos requisitos</li>
            <li>Documente todas as restrições técnicas ou de acesso</li>
            <li>Inclua prazos, orçamentos e expectativas do cliente</li>
            <li>Mencione preferências de comunicação e disponibilidade</li>
          </ul>
        </Card>
      )}
    </div>
  );
}
