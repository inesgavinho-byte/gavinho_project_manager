import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Target, Edit, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SiteProductivityGoals() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const constructionId = parseInt(params.id || "0");

  const [editingWorker, setEditingWorker] = useState<any>(null);
  const [dailyGoal, setDailyGoal] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState("");

  // Queries
  const { data: goals = [], refetch: refetchGoals } = trpc.siteManagement.productivity.getGoals.useQuery(
    { constructionId },
    { enabled: constructionId > 0 }
  );

  const { data: workers = [] } = trpc.siteManagement.workers.list.useQuery(
    { constructionId },
    { enabled: constructionId > 0 }
  );

  // Mutations
  const setGoalMutation = trpc.siteManagement.productivity.setGoal.useMutation({
    onSuccess: () => {
      toast({
        title: "Meta definida",
        description: "Meta de produtividade atualizada com sucesso",
      });
      refetchGoals();
      setEditingWorker(null);
      setDailyGoal("");
      setWeeklyGoal("");
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditGoal = (worker: any) => {
    const existingGoal = goals.find((g: any) => g.workerId === worker.userId);
    setEditingWorker(worker);
    setDailyGoal(existingGoal?.dailyGoal || "");
    setWeeklyGoal(existingGoal?.weeklyGoal || "");
  };

  const handleSaveGoal = () => {
    if (!editingWorker || !dailyGoal) {
      toast({
        title: "Erro",
        description: "Meta diária é obrigatória",
        variant: "destructive",
      });
      return;
    }

    setGoalMutation.mutate({
      constructionId,
      workerId: editingWorker.userId,
      dailyGoal: parseFloat(dailyGoal),
      weeklyGoal: weeklyGoal ? parseFloat(weeklyGoal) : undefined,
      unit: "unidades",
    });
  };

  const getWorkerGoal = (workerId: number) => {
    return goals.find((g: any) => g.workerId === workerId);
  };

  if (constructionId === 0) {
    return (
      <div className="min-h-screen bg-[#FAF8F6] flex items-center justify-center">
        <p className="text-[#5F5C59]">Obra não encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F6]">
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

          <div className="flex items-center gap-3">
            <Target className="h-8 w-8 text-[#C9A882]" />
            <div>
              <h1 className="text-3xl font-serif text-[#5F5C59] mb-2">
                Metas de Produtividade
              </h1>
              <p className="text-[#5F5C59]/70">
                Configure metas diárias e semanais para cada trabalhador
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Info Card */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              <strong>Como funciona:</strong> Defina metas diárias de produtividade para cada trabalhador.
              O sistema irá monitorar automaticamente o desempenho e gerar alertas quando:
            </p>
            <ul className="list-disc list-inside text-sm text-blue-900 mt-2 space-y-1">
              <li>Trabalhador <strong>superar a meta em 20%+</strong> (alerta positivo)</li>
              <li>Trabalhador <strong>ficar abaixo de 80% da meta</strong> (alerta de atenção)</li>
            </ul>
          </CardContent>
        </Card>

        {/* Workers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium text-[#5F5C59]">
              Trabalhadores e Metas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trabalhador</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead className="text-right">Meta Diária</TableHead>
                  <TableHead className="text-right">Meta Semanal</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workers.map((worker: any) => {
                  const goal = getWorkerGoal(worker.userId);
                  return (
                    <TableRow key={worker.id}>
                      <TableCell className="font-medium">{worker.name}</TableCell>
                      <TableCell className="capitalize">{worker.role}</TableCell>
                      <TableCell className="text-right">
                        {goal?.dailyGoal ? `${goal.dailyGoal} un.` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {goal?.weeklyGoal ? `${goal.weeklyGoal} un.` : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {goal?.active ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Sem meta
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditGoal(worker)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          {goal ? "Editar" : "Definir"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Edit Goal Dialog */}
      <Dialog open={!!editingWorker} onOpenChange={() => setEditingWorker(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Definir Meta - {editingWorker?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-[#5F5C59] mb-2 block">
                Meta Diária (unidades) *
              </label>
              <Input
                type="number"
                step="0.01"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(e.target.value)}
                placeholder="Ex: 50.00"
              />
              <p className="text-xs text-[#5F5C59]/60 mt-1">
                Quantidade esperada por dia de trabalho
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-[#5F5C59] mb-2 block">
                Meta Semanal (unidades)
              </label>
              <Input
                type="number"
                step="0.01"
                value={weeklyGoal}
                onChange={(e) => setWeeklyGoal(e.target.value)}
                placeholder="Ex: 250.00"
              />
              <p className="text-xs text-[#5F5C59]/60 mt-1">
                Opcional: meta acumulada para a semana
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-900">
                <strong>Importante:</strong> As metas devem ser realistas e baseadas no histórico
                de produtividade. Metas muito altas podem desmotivar a equipa.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingWorker(null)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveGoal}
              disabled={setGoalMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {setGoalMutation.isPending ? "A guardar..." : "Guardar Meta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
