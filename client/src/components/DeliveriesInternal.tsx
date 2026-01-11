import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle, FileText, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DeliveriesInternalProps {
  projectId: number;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_review: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  delivered: "bg-purple-100 text-purple-800",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4" />,
  in_review: <FileText className="w-4 h-4" />,
  approved: <CheckCircle2 className="w-4 h-4" />,
  rejected: <AlertCircle className="w-4 h-4" />,
  delivered: <CheckCircle2 className="w-4 h-4" />,
};

export function DeliveriesInternal({ projectId }: DeliveriesInternalProps) {
  const [selectedDelivery, setSelectedDelivery] = useState<number | null>(null);
  
  const deliveriesQuery = trpc.deliveries.list.useQuery({ projectId });
  const metricsQuery = trpc.deliveries.metrics.calculate.useQuery({ projectId });
  const versionsQuery = selectedDelivery
    ? trpc.deliveries.versions.list.useQuery({ deliveryId: selectedDelivery })
    : null;

  const deliveries = deliveriesQuery.data || [];
  const metrics = metricsQuery.data;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Entregas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total}</div>
              <p className="text-xs text-gray-500 mt-1">Todas as entregas do projeto</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Taxa de Conformidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics.complianceRate}%</div>
              <p className="text-xs text-gray-500 mt-1">{metrics.onTime} no prazo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Taxa de Aceitação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{metrics.acceptanceRate}%</div>
              <p className="text-xs text-gray-500 mt-1">{metrics.approved} aprovadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Atrasadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{metrics.late}</div>
              <p className="text-xs text-gray-500 mt-1">Requerem atenção</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Deliveries List */}
      <Card>
        <CardHeader>
          <CardTitle>Entregas Internas</CardTitle>
          <CardDescription>Gestão de entregas da equipa GAVINHO</CardDescription>
        </CardHeader>
        <CardContent>
          {deliveries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma entrega registada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deliveries.map((delivery: any) => (
                <div
                  key={delivery.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => setSelectedDelivery(delivery.id)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-shrink-0">
                      {statusIcons[delivery.status]}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{delivery.name}</h4>
                      <p className="text-sm text-gray-500">{delivery.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {format(new Date(delivery.dueDate), "dd MMM yyyy", { locale: ptBR })}
                      </p>
                      <Badge className={statusColors[delivery.status]}>
                        {delivery.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{delivery.type}</Badge>
                      {delivery.fileUrl && <Download className="w-4 h-4 text-blue-600 mt-1" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Versions Panel */}
      {selectedDelivery && versionsQuery?.data && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Versões</CardTitle>
            <CardDescription>Todas as versões desta entrega</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {versionsQuery.data.map((version: any) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded border"
                >
                  <div>
                    <p className="font-medium">v{version.version}</p>
                    {version.versionNotes && (
                      <p className="text-sm text-gray-600">{version.versionNotes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {format(new Date(version.uploadedAt), "dd MMM HH:mm", { locale: ptBR })}
                    </p>
                    {version.fileUrl && (
                      <a
                        href={version.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Download
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
