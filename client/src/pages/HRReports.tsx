import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Loader2, BarChart3 } from "lucide-react";

export default function HRReports() {
  const { toast } = useToast();
  const [year, setYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedUser, setSelectedUser] = useState("");

  const { data: users } = trpc.hr.team.list.useQuery();
  const { data: absences, isLoading: loadingAbsences } = trpc.hr.absences.list.useQuery();
  const { data: metrics } = trpc.hr.metrics.absences.useQuery({ year });

  const exportAbsencesReport = () => {
    if (!absences || absences.length === 0) {
      toast({
        title: "Sem dados",
        description: "Não existem ausências para exportar.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "Colaborador",
      "Email",
      "Tipo",
      "Data Início",
      "Data Fim",
      "Dias",
      "Status",
      "Motivo",
      "Aprovado Por",
      "Data Aprovação"
    ];

    const rows = absences.map(absence => [
      absence.userName || "N/A",
      absence.userEmail || "N/A",
      absence.type === "vacation" ? "Férias" :
        absence.type === "sick" ? "Doença" :
        absence.type === "personal" ? "Pessoal" : "Outro",
      new Date(absence.startDate).toLocaleDateString('pt-PT'),
      new Date(absence.endDate).toLocaleDateString('pt-PT'),
      absence.days.toString(),
      absence.status === "approved" ? "Aprovado" :
        absence.status === "rejected" ? "Rejeitado" : "Pendente",
      absence.reason || "-",
      absence.approvedBy ? `ID ${absence.approvedBy}` : "-",
      absence.approvedAt ? new Date(absence.approvedAt).toLocaleDateString('pt-PT') : "-"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_ausencias_${year}.csv`;
    link.click();

    toast({
      title: "Exportação concluída",
      description: "O relatório foi descarregado em formato CSV (Excel).",
    });
  };

  const exportUserAbsencesReport = () => {
    if (!selectedUser || !absences) {
      toast({
        title: "Selecione um colaborador",
        description: "Por favor, selecione um colaborador para exportar.",
        variant: "destructive",
      });
      return;
    }

    const userAbsences = absences.filter(a => a.userId === parseInt(selectedUser));
    
    if (userAbsences.length === 0) {
      toast({
        title: "Sem dados",
        description: "Este colaborador não tem ausências registadas.",
        variant: "destructive",
      });
      return;
    }

    const userName = users?.find(u => u.id === parseInt(selectedUser))?.name || "Colaborador";
    
    const headers = [
      "Tipo",
      "Data Início",
      "Data Fim",
      "Dias",
      "Status",
      "Motivo",
      "Data Pedido"
    ];

    const rows = userAbsences.map(absence => [
      absence.type === "vacation" ? "Férias" :
        absence.type === "sick" ? "Doença" :
        absence.type === "personal" ? "Pessoal" : "Outro",
      new Date(absence.startDate).toLocaleDateString('pt-PT'),
      new Date(absence.endDate).toLocaleDateString('pt-PT'),
      absence.days.toString(),
      absence.status === "approved" ? "Aprovado" :
        absence.status === "rejected" ? "Rejeitado" : "Pendente",
      absence.reason || "-",
      new Date(absence.createdAt).toLocaleDateString('pt-PT')
    ]);

    const csvContent = [
      `Relatório de Ausências - ${userName}`,
      `Período: ${year}`,
      "",
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ausencias_${userName.replace(/\s+/g, '_')}_${year}.csv`;
    link.click();

    toast({
      title: "Exportação concluída",
      description: `Relatório de ${userName} descarregado com sucesso.`,
    });
  };

  const exportMetricsReport = () => {
    if (!metrics) {
      toast({
        title: "Sem dados",
        description: "Não existem métricas para exportar.",
        variant: "destructive",
      });
      return;
    }

    const lines = [
      `Relatório de Métricas RH - ${year}`,
      "",
      "=== AUSÊNCIAS POR TIPO ===",
      "Tipo,Quantidade,Total Dias",
      ...metrics.totalByType.map(t => 
        `"${t.type}","${t.count}","${t.totalDays}"`
      ),
      "",
      "=== AUSÊNCIAS POR STATUS ===",
      "Status,Quantidade",
      ...metrics.totalByStatus.map(s => 
        `"${s.status}","${s.count}"`
      ),
      "",
      "=== AUSÊNCIAS POR MÊS ===",
      "Mês,Quantidade,Total Dias",
      ...metrics.byMonth.map(m => 
        `"${m.month}","${m.count}","${m.totalDays}"`
      )
    ];

    const csvContent = lines.join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `metricas_rh_${year}.csv`;
    link.click();

    toast({
      title: "Exportação concluída",
      description: "Relatório de métricas descarregado com sucesso.",
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios RH</h1>
          <p className="text-muted-foreground">
            Exporte estatísticas e análises de recursos humanos
          </p>
        </div>
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>

      <Tabs defaultValue="absences" className="space-y-4">
        <TabsList>
          <TabsTrigger value="absences">Ausências Gerais</TabsTrigger>
          <TabsTrigger value="by-user">Por Colaborador</TabsTrigger>
          <TabsTrigger value="metrics">Métricas e Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="absences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Ausências</CardTitle>
              <CardDescription>
                Exporte todas as ausências registadas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year-absences">Ano</Label>
                  <Input
                    id="year-absences"
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    min="2020"
                    max="2030"
                  />
                </div>

                <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                  <BarChart3 className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">Total de Ausências</p>
                    <p className="text-sm text-muted-foreground">
                      {loadingAbsences ? "A carregar..." : `${absences?.length || 0} registos`}
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={exportAbsencesReport}
                  disabled={loadingAbsences || !absences || absences.length === 0}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Relatório (CSV/Excel)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-user" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatório Por Colaborador</CardTitle>
              <CardDescription>
                Exporte ausências de um colaborador específico
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-select">Colaborador</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger id="user-select">
                    <SelectValue placeholder="Selecione um colaborador" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year-user">Ano</Label>
                <Input
                  id="year-user"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  min="2020"
                  max="2030"
                />
              </div>

              <Button 
                onClick={exportUserAbsencesReport}
                disabled={!selectedUser || loadingAbsences}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar Relatório Individual (CSV/Excel)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métricas e Estatísticas</CardTitle>
              <CardDescription>
                Exporte análises agregadas de ausências
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="year-metrics">Ano</Label>
                <Input
                  id="year-metrics"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  min="2020"
                  max="2030"
                />
              </div>

              {metrics && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold text-primary">
                      {metrics.totalByType.reduce((sum, t) => sum + Number(t.count), 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Ausências</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold text-primary">
                      {metrics.totalByType.reduce((sum, t) => sum + Number(t.totalDays), 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Dias</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold text-primary">
                      {metrics.totalByStatus.find(s => s.status === "approved")?.count || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Aprovadas</p>
                  </div>
                </div>
              )}

              <Button 
                onClick={exportMetricsReport}
                disabled={!metrics}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar Métricas (CSV/Excel)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
