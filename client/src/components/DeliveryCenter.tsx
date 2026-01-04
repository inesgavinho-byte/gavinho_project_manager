import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Upload, Plus, FileText, Eye } from "lucide-react";
import { toast } from "sonner";

interface DeliveryCenterProps {
  projectId: number;
  phases: any[];
}

export function DeliveryCenter({ projectId, phases }: DeliveryCenterProps) {
  const [isAddDeliveryOpen, setIsAddDeliveryOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPhase, setFilterPhase] = useState<string>("all");

  // Queries
  const { data: deliveries, refetch: refetchDeliveries } = trpc.deliveries.list.useQuery({ projectId });
  const { data: stats } = trpc.deliveries.stats.useQuery({ projectId });
  const { data: upcoming } = trpc.deliveries.upcoming.useQuery({ projectId, days: 30 });

  // Mutations
  const createDelivery = trpc.deliveries.create.useMutation({
    onSuccess: () => {
      toast.success("Entrega criada com sucesso!");
      refetchDeliveries();
      setIsAddDeliveryOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro ao criar entrega: ${error.message}`);
    },
  });

  const updateDelivery = trpc.deliveries.update.useMutation({
    onSuccess: () => {
      toast.success("Entrega atualizada!");
      refetchDeliveries();
    },
  });

  const deleteDelivery = trpc.deliveries.delete.useMutation({
    onSuccess: () => {
      toast.success("Entrega removida!");
      refetchDeliveries();
    },
  });

  const createApproval = trpc.deliveries.approvals.create.useMutation({
    onSuccess: () => {
      toast.success("Aprovação registada!");
      refetchDeliveries();
      setSelectedDelivery(null);
    },
  });

  // Handle form submission
  const handleCreateDelivery = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createDelivery.mutate({
      projectId,
      phaseId: formData.get("phaseId") ? Number(formData.get("phaseId")) : undefined,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      type: formData.get("type") as any,
      dueDate: new Date(formData.get("dueDate") as string),
      priority: formData.get("priority") as any,
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
      in_review: { label: "Em Revisão", className: "bg-blue-100 text-blue-800 border-blue-300" },
      delivered: { label: "Entregue", className: "bg-purple-100 text-purple-800 border-purple-300" },
      approved: { label: "Aprovado", className: "bg-green-100 text-green-800 border-green-300" },
      rejected: { label: "Rejeitado", className: "bg-red-100 text-red-800 border-red-300" },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={`${config.className} border`}>{config.label}</Badge>;
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: "Baixa", className: "bg-gray-100 text-gray-800" },
      medium: { label: "Média", className: "bg-blue-100 text-blue-800" },
      high: { label: "Alta", className: "bg-orange-100 text-orange-800" },
      urgent: { label: "Urgente", className: "bg-red-100 text-red-800" },
    };
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // Filter deliveries
  const filteredDeliveries = deliveries?.filter((d) => {
    if (filterStatus !== "all" && d.status !== filterStatus) return false;
    if (filterPhase !== "all" && d.phaseId !== Number(filterPhase)) return false;
    return true;
  });

  // Check if delivery is overdue
  const isOverdue = (dueDate: Date, status: string) => {
    return status === "pending" && new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-[#C3BAAF]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#5F5C59]/60">Total</p>
              <p className="text-2xl font-serif text-[#5F5C59]">{stats?.total || 0}</p>
            </div>
            <FileText className="w-8 h-8 text-[#C9A882]" />
          </div>
        </Card>

        <Card className="p-4 border-[#C3BAAF]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#5F5C59]/60">Pendentes</p>
              <p className="text-2xl font-serif text-[#5F5C59]">{stats?.pending || 0}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-4 border-[#C3BAAF]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#5F5C59]/60">Aprovadas</p>
              <p className="text-2xl font-serif text-[#5F5C59]">{stats?.approved || 0}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4 border-[#C3BAAF]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#5F5C59]/60">Atrasadas</p>
              <p className="text-2xl font-serif text-[#5F5C59]">{stats?.overdue || 0}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Timeline - Upcoming Deliveries */}
      {upcoming && upcoming.length > 0 && (
        <Card className="p-6 border-[#C3BAAF]/20">
          <h3 className="font-serif text-xl text-[#5F5C59] mb-4">Próximas Entregas (30 dias)</h3>
          <div className="space-y-3">
            {upcoming.map((delivery) => (
              <div
                key={delivery.id}
                className="flex items-center gap-4 p-3 rounded-lg border border-[#C3BAAF]/20 hover:border-[#C9A882]/40 transition-colors"
              >
                <div className="flex-shrink-0">
                  <Calendar className="w-5 h-5 text-[#C9A882]" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#5F5C59]">{delivery.name}</p>
                  <p className="text-sm text-[#5F5C59]/60">
                    Prazo: {new Date(delivery.dueDate).toLocaleDateString("pt-PT")}
                  </p>
                </div>
                {getPriorityBadge(delivery.priority)}
                {getStatusBadge(delivery.status)}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Deliveries List */}
      <Card className="p-6 border-[#C3BAAF]/20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-2xl text-[#5F5C59]">Todas as Entregas</h3>
          <Dialog open={isAddDeliveryOpen} onOpenChange={setIsAddDeliveryOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#C9A882] hover:bg-[#C9A882]/90 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nova Entrega
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl text-[#5F5C59]">Nova Entrega</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateDelivery} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input id="name" name="name" required className="border-[#C3BAAF]/20" />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" name="description" className="border-[#C3BAAF]/20" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Tipo *</Label>
                    <Select name="type" required>
                      <SelectTrigger className="border-[#C3BAAF]/20">
                        <SelectValue placeholder="Selecionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="document">Documento</SelectItem>
                        <SelectItem value="drawing">Desenho</SelectItem>
                        <SelectItem value="render">Render 3D</SelectItem>
                        <SelectItem value="model">Modelo</SelectItem>
                        <SelectItem value="report">Relatório</SelectItem>
                        <SelectItem value="specification">Especificação</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority">Prioridade *</Label>
                    <Select name="priority" required defaultValue="medium">
                      <SelectTrigger className="border-[#C3BAAF]/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phaseId">Fase</Label>
                    <Select name="phaseId">
                      <SelectTrigger className="border-[#C3BAAF]/20">
                        <SelectValue placeholder="Selecionar fase" />
                      </SelectTrigger>
                      <SelectContent>
                        {phases.map((phase) => (
                          <SelectItem key={phase.id} value={String(phase.id)}>
                            {phase.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dueDate">Data de Entrega *</Label>
                    <Input
                      id="dueDate"
                      name="dueDate"
                      type="date"
                      required
                      className="border-[#C3BAAF]/20"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDeliveryOpen(false)}
                    className="border-[#C3BAAF]/20"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-[#C9A882] hover:bg-[#C9A882]/90 text-white">
                    Criar Entrega
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48 border-[#C3BAAF]/20">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="in_review">Em Revisão</SelectItem>
              <SelectItem value="delivered">Entregue</SelectItem>
              <SelectItem value="approved">Aprovado</SelectItem>
              <SelectItem value="rejected">Rejeitado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPhase} onValueChange={setFilterPhase}>
            <SelectTrigger className="w-48 border-[#C3BAAF]/20">
              <SelectValue placeholder="Filtrar por fase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Fases</SelectItem>
              {phases.map((phase) => (
                <SelectItem key={phase.id} value={String(phase.id)}>
                  {phase.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Deliveries Table */}
        {filteredDeliveries && filteredDeliveries.length > 0 ? (
          <div className="space-y-3">
            {filteredDeliveries.map((delivery) => (
              <div
                key={delivery.id}
                className={`p-4 rounded-lg border transition-colors ${
                  isOverdue(delivery.dueDate, delivery.status)
                    ? "border-red-300 bg-red-50/50"
                    : "border-[#C3BAAF]/20 hover:border-[#C9A882]/40"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-[#5F5C59]">{delivery.name}</h4>
                      {getStatusBadge(delivery.status)}
                      {getPriorityBadge(delivery.priority)}
                      {isOverdue(delivery.dueDate, delivery.status) && (
                        <Badge className="bg-red-100 text-red-800 border-red-300 border">
                          Atrasada
                        </Badge>
                      )}
                    </div>
                    {delivery.description && (
                      <p className="text-sm text-[#5F5C59]/60 mb-2">{delivery.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-[#5F5C59]/60">
                      <span>Prazo: {new Date(delivery.dueDate).toLocaleDateString("pt-PT")}</span>
                      <span>Tipo: {delivery.type}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {delivery.status === "delivered" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-300 text-green-700 hover:bg-green-50"
                          onClick={() => {
                            createApproval.mutate({
                              deliveryId: delivery.id,
                              status: "approved",
                            });
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => {
                            createApproval.mutate({
                              deliveryId: delivery.id,
                              status: "rejected",
                              comments: "Necessita revisão",
                            });
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rejeitar
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#C3BAAF]/20"
                      onClick={() => setSelectedDelivery(delivery)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-[#5F5C59]/60">
            Nenhuma entrega encontrada
          </div>
        )}
      </Card>
    </div>
  );
}
