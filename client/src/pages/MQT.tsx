import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MQTUpload } from '@/components/MQTUpload';
import { MQTDataTable } from '@/components/MQTDataTable';
import { MQTCharts } from '@/components/MQTCharts';
import { MQTAlertsPanel } from '@/components/MQTAlertsPanel';
import { useAuth } from '@/lib/auth';
import { useRoute } from 'wouter';

export function MQTPage() {
  const { user } = useAuth();
  const [, params] = useRoute('/projects/:projectId/mq');
  const projectId = params?.projectId ? parseInt(params.projectId) : 0;

  if (!user || !projectId) {
    return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mapas de Quantidades (MQT)</h1>
        <p className="text-muted-foreground mt-2">
          Importe e analise seus mapas de quantidades com comparação planejado vs executado
        </p>
      </div>

      {/* Upload Section */}
      <MQTUpload projectId={projectId} />

      {/* Tabs for Data, Charts, and Alerts */}
      <Tabs defaultValue="data" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="data">Dados</TabsTrigger>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="space-y-4">
          <MQTDataTable projectId={projectId} />
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <MQTCharts projectId={projectId} />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <MQTAlertsPanel projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
