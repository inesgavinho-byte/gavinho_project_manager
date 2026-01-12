import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Star, Plus, Filter, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EvaluationFormData {
  supplierId: number;
  rating: number;
  quality: number;
  timeliness: number;
  communication: number;
  comments?: string;
}

export function SupplierEvaluations() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [formData, setFormData] = useState<EvaluationFormData>({
    supplierId: 0,
    rating: 5,
    quality: 5,
    timeliness: 5,
    communication: 5,
  });

  const { data: suppliers = [] } = trpc.suppliers.list.useQuery();
  const { data: evaluations = [], refetch: refetchEvaluations } = trpc.suppliers.getEvaluations.useQuery({
    period: selectedPeriod,
  });

  const createEvaluationMutation = trpc.suppliers.createEvaluation.useMutation({
    onSuccess: () => {
      refetchEvaluations();
      setIsOpen(false);
      setFormData({
        supplierId: 0,
        rating: 5,
        quality: 5,
        timeliness: 5,
        communication: 5,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.supplierId === 0) {
      alert("Por favor, selecione um fornecedor");
      return;
    }
    createEvaluationMutation.mutate(formData);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 3.5) return "text-yellow-600";
    return "text-red-600";
  };

  const getRatingBadge = (rating: number) => {
    if (rating >= 4.5) return "bg-green-100 text-green-800";
    if (rating >= 3.5) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getSupplierName = (supplierId: number) => {
    return suppliers.find((s: any) => s.id === supplierId)?.name || "Desconhecido";
  };

  const supplierStats = suppliers.map((supplier: any) => {
    const supplierEvals = evaluations.filter((e: any) => e.supplierId === supplier.id);
    if (supplierEvals.length === 0) return null;

    const avgRating = (
      supplierEvals.reduce((sum: number, e: any) => sum + e.rating, 0) / supplierEvals.length
    ).toFixed(1);
    const avgQuality = (
      supplierEvals.reduce((sum: number, e: any) => sum + (e.quality || 0), 0) / supplierEvals.length
    ).toFixed(1);
    const avgTimeliness = (
      supplierEvals.reduce((sum: number, e: any) => sum + (e.timeliness || 0), 0) / supplierEvals.length
    ).toFixed(1);
    const avgCommunication = (
      supplierEvals.reduce((sum: number, e: any) => sum + (e.communication || 0), 0) / supplierEvals.length
    ).toFixed(1);

    return {
      ...supplier,
      avgRating: parseFloat(avgRating),
      avgQuality: parseFloat(avgQuality),
      avgTimeliness: parseFloat(avgTimeliness),
      avgCommunication: parseFloat(avgCommunication),
      evaluationCount: supplierEvals.length,
      lastEvaluation: supplierEvals[supplierEvals.length - 1]?.evaluatedAt,
    };
  }).filter(Boolean);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#5F5C59]">Avaliações de Fornecedores</h1>
          <p className="text-gray-600 mt-1">Gerencie e acompanhe o desempenho dos seus fornecedores</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#C9A882] hover:bg-[#B8956B] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Nova Avaliação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Avaliação de Fornecedor</DialogTitle>
              <DialogDescription>
                Avalie o desempenho do fornecedor em diferentes critérios
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="supplier">Fornecedor</Label>
                <Select
                  value={formData.supplierId.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, supplierId: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier: any) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rating">Rating Geral (1-5)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    step="0.5"
                    value={formData.rating}
                    onChange={(e) =>
                      setFormData({ ...formData, rating: parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="quality">Qualidade (1-5)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    step="0.5"
                    value={formData.quality}
                    onChange={(e) =>
                      setFormData({ ...formData, quality: parseFloat(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timeliness">Pontualidade (1-5)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    step="0.5"
                    value={formData.timeliness}
                    onChange={(e) =>
                      setFormData({ ...formData, timeliness: parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="communication">Comunicação (1-5)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    step="0.5"
                    value={formData.communication}
                    onChange={(e) =>
                      setFormData({ ...formData, communication: parseFloat(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="comments">Notas (opcional)</Label>
                <Textarea
                  placeholder="Adicione observações sobre a avaliação..."
                  value={formData.comments || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, comments: e.target.value })
                  }
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#C9A882] hover:bg-[#B8956B] text-white"
                disabled={createEvaluationMutation.isPending}
              >
                {createEvaluationMutation.isPending ? "Salvando..." : "Salvar Avaliação"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <Filter className="w-5 h-5 text-gray-600" />
        <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
            <SelectItem value="all">Todos os períodos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Fornecedores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#5F5C59]">{suppliers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avaliações Realizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#5F5C59]">{evaluations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Rating Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#C9A882]">
              {evaluations.length > 0
                ? (evaluations.reduce((sum: number, e: any) => sum + e.rating, 0) / evaluations.length).toFixed(1)
                : "N/A"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Fornecedores Avaliados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#5F5C59]">{supplierStats.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {supplierStats.map((supplier: any) => (
          <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{supplier.name}</CardTitle>
                <Badge className={getRatingBadge(supplier.avgRating)}>
                  {supplier.avgRating.toFixed(1)} ⭐
                </Badge>
              </div>
              <CardDescription>
                {supplier.evaluationCount} avaliação{supplier.evaluationCount !== 1 ? "ões" : ""} realizadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-gray-600">Qualidade</div>
                  <div className={`text-lg font-semibold ${getRatingColor(supplier.avgQuality)}`}>
                    {supplier.avgQuality.toFixed(1)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-600">Pontualidade</div>
                  <div className={`text-lg font-semibold ${getRatingColor(supplier.avgTimeliness)}`}>
                    {supplier.avgTimeliness.toFixed(1)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-gray-600">Comunicação</div>
                  <div className={`text-lg font-semibold ${getRatingColor(supplier.avgCommunication)}`}>
                    {supplier.avgCommunication.toFixed(1)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-600">Última Avaliação</div>
                  <div className="text-sm text-gray-700">
                    {supplier.lastEvaluation
                      ? format(new Date(supplier.lastEvaluation), "dd MMM yyyy", { locale: ptBR })
                      : "N/A"}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-[#C9A882] border-[#C9A882] hover:bg-[#F2F0E7]"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Ver Histórico
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Avaliações Recentes</CardTitle>
          <CardDescription>Últimas avaliações realizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {evaluations.slice(-10).reverse().map((evaluation: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-[#5F5C59]">
                    {getSupplierName(evaluation.supplierId)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {format(new Date(evaluation.evaluatedAt), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-600">Rating</div>
                    <div className={`text-lg font-semibold ${getRatingColor(evaluation.rating)}`}>
                      {evaluation.rating.toFixed(1)}
                    </div>
                  </div>
                  <Star className={`w-5 h-5 ${getRatingColor(evaluation.rating)}`} fill="currentColor" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
