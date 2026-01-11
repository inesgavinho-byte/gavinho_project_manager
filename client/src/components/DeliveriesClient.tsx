import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, MessageSquare, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface DeliveriesClientProps {
  projectId: number;
}

const approvalStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  revision_requested: "bg-blue-100 text-blue-800",
};

export function DeliveriesClient({ projectId }: DeliveriesClientProps) {
  const [selectedDelivery, setSelectedDelivery] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showApprovalForm, setShowApprovalForm] = useState(false);

  const deliveriesQuery = trpc.deliveries.list.useQuery({ projectId });
  const approveMutation = trpc.deliveries.clientApproval.approve.useMutation();
  const rejectMutation = trpc.deliveries.clientApproval.reject.useMutation();
  const revisionMutation = trpc.deliveries.clientApproval.requestRevision.useMutation();
  const statusQuery = selectedDelivery
    ? trpc.deliveries.clientApproval.status.useQuery({ deliveryId: selectedDelivery })
    : null;

  const deliveries = deliveriesQuery.data || [];
  const selectedDeliveryData = deliveries.find((d: any) => d.id === selectedDelivery);
  const approvalStatus = statusQuery?.data;

  const handleApprove = async () => {
    if (!selectedDelivery) return;
    try {
      await approveMutation.mutateAsync({
        deliveryId: selectedDelivery,
        feedback,
      });
      toast.success("Entrega aprovada com sucesso!");
      setFeedback("");
      setShowApprovalForm(false);
      deliveriesQuery.refetch();
    } catch (error) {
      toast.error("Erro ao aprovar entrega");
    }
  };

  const handleReject = async () => {
    if (!selectedDelivery || !rejectionReason) return;
    try {
      await rejectMutation.mutateAsync({
        deliveryId: selectedDelivery,
        rejectionReason,
        feedback,
      });
      toast.success("Entrega rejeitada");
      setFeedback("");
      setRejectionReason("");
      setShowApprovalForm(false);
      deliveriesQuery.refetch();
    } catch (error) {
      toast.error("Erro ao rejeitar entrega");
    }
  };

  const handleRequestRevision = async () => {
    if (!selectedDelivery || !feedback) return;
    try {
      await revisionMutation.mutateAsync({
        deliveryId: selectedDelivery,
        feedback,
      });
      toast.success("Revisão solicitada");
      setFeedback("");
      setShowApprovalForm(false);
      deliveriesQuery.refetch();
    } catch (error) {
      toast.error("Erro ao solicitar revisão");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Entregas para Aprovação</CardTitle>
          <CardDescription>Entregas enviadas ao cliente para revisão</CardDescription>
        </CardHeader>
        <CardContent>
          {deliveries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma entrega pendente de aprovação</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deliveries.map((delivery: any) => {
                const isSelected = delivery.id === selectedDelivery;
                return (
                  <div
                    key={delivery.id}
                    className={`p-4 border rounded-lg cursor-pointer transition ${
                      isSelected ? "bg-blue-50 border-blue-300" : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedDelivery(delivery.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{delivery.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">{delivery.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {format(new Date(delivery.dueDate), "dd MMM yyyy", { locale: ptBR })}
                        </p>
                        <Badge variant="outline">{delivery.type}</Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Panel */}
      {selectedDeliveryData && (
        <Card>
          <CardHeader>
            <CardTitle>Revisão: {selectedDeliveryData.name}</CardTitle>
            <CardDescription>
              Entrega de {format(new Date(selectedDeliveryData.dueDate), "dd MMMM yyyy", {
                locale: ptBR,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Status */}
            {approvalStatus && (
              <div className="p-3 bg-gray-50 rounded border">
                <p className="text-sm font-medium text-gray-700">Status Atual:</p>
                <Badge className={approvalStatusColors[approvalStatus.status] || ""}>
                  {approvalStatus.status}
                </Badge>
                {approvalStatus.feedback && (
                  <p className="text-sm text-gray-600 mt-2">{approvalStatus.feedback}</p>
                )}
              </div>
            )}

            {/* File Download */}
            {selectedDeliveryData.fileUrl && (
              <div>
                <a
                  href={selectedDeliveryData.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <MessageSquare className="w-4 h-4" />
                  Descarregar Ficheiro
                </a>
              </div>
            )}

            {/* Approval Form */}
            {!showApprovalForm ? (
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowApprovalForm(true)}
                  variant="outline"
                  className="flex-1"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Aprovar
                </Button>
                <Button
                  onClick={() => setShowApprovalForm(true)}
                  variant="outline"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeitar
                </Button>
              </div>
            ) : (
              <div className="space-y-3 p-4 bg-blue-50 rounded border">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comentários (opcional)
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Adicione comentários ou feedback..."
                    className="w-full px-3 py-2 border rounded text-sm"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo da Rejeição (se aplicável)
                  </label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Descreva o motivo da rejeição..."
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleApprove}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={approveMutation.isPending}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Aprovar
                  </Button>
                  <Button
                    onClick={handleReject}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    disabled={rejectMutation.isPending || !rejectionReason}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeitar
                  </Button>
                  <Button
                    onClick={handleRequestRevision}
                    variant="outline"
                    className="flex-1"
                    disabled={revisionMutation.isPending || !feedback}
                  >
                    Solicitar Revisão
                  </Button>
                  <Button
                    onClick={() => {
                      setShowApprovalForm(false);
                      setFeedback("");
                      setRejectionReason("");
                    }}
                    variant="ghost"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
